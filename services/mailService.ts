
import type { Message, MessageDetails } from '../types';

// Switched to api.mail.tm for better stability as mail.gw was returning 500s
const API_BASE_URL = 'https://api.mail.tm';
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1500;

// Module-level state
let authToken: string | null = null;
let cachedDomains: string[] | null = null;

// State for pre-fetching to improve performance
let prefetchedMailbox: { address: string; token: string } | null = null;
let isPrefetching = false;
let lastPrefetchFailedTimestamp: number | null = null;
const PREFETCH_RETRY_DELAY = 30000; // 30 seconds

// Helper to generate a random string for passwords
const randomString = (length: number = 10) => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Internal fetch wrapper for API calls with Retry Logic
async function apiRequest<T>(endpoint: string, options: RequestInit & { responseType?: 'blob' } = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const { responseType, ...fetchOptions } = options;
  
  const isHydraEndpoint = !['/token', '/accounts'].includes(endpoint) && !endpoint.includes('/attachments/');
  if (isHydraEndpoint) {
    headers.append('Accept', 'application/ld+json');
  } else if (!endpoint.includes('/attachments/')) {
    headers.append('Accept', 'application/json');
  }
  
  if (!endpoint.includes('/attachments/')) {
    headers.append('Content-Type', 'application/json');
  }

  if (authToken && !['/token', '/accounts'].includes(endpoint)) {
    headers.append('Authorization', `Bearer ${authToken}`);
  }

  let lastError: any;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        // Handle specific non-retriable client errors immediately
        if (response.status === 400 && endpoint === '/accounts') {
            throw new Error('Address is already taken. Please try another.');
        }

        // If it's a 4xx error (client error), usually we don't retry unless it's rate limiting (429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
             const errorBody = await response.text();
             console.error(`API request failed with status ${response.status}:`, errorBody);
             throw new Error(`Request failed: ${response.statusText} (${response.status})`);
        }
        
        // For 5xx errors or 429, throw to trigger retry logic
        const errorBody = await response.text();
        throw new Error(`Server Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      // --- Success Handling ---
      if (responseType === 'blob') {
        return response.blob() as Promise<T>;
      }
      
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType || !(contentType.includes('application/json') || contentType.includes('application/ld+json'))) {
          return null as T;
      }

      const text = await response.text();
      if (!text) {
        return null as T; 
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        console.error(`Failed to parse JSON response from ${endpoint}:`, error);
        throw new Error('Received invalid data from the server.');
      }

    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry: Network errors (TypeError) or Server Errors (message contains status code or 'Server Error' or specific JSON error structure)
      const isNetworkErr = error instanceof TypeError || error.name === 'TypeError';
      const errorMessage = error.message || '';
      const isServerErr = (
          errorMessage.includes('Server Error') || 
          errorMessage.includes('500') || 
          errorMessage.includes('502') || 
          errorMessage.includes('503') || 
          errorMessage.includes('504') ||
          errorMessage.includes('429') ||
          errorMessage.includes('Internal Server Error')
      );

      if ((isServerErr || isNetworkErr) && attempt < MAX_RETRIES - 1) {
         // Exponential backoff with jitter: 1500, 3000, 6000...
         const backoff = INITIAL_RETRY_DELAY * Math.pow(2, attempt); 
         console.warn(`Attempt ${attempt + 1} failed for ${endpoint}. Retrying in ${backoff}ms...`, errorMessage);
         await sleep(backoff);
         continue;
      }
      
      // If not retryable or max retries reached, rethrow
      throw error;
    }
  }
  
  throw lastError || new Error('Unknown error in apiRequest');
}

/** Fetches and caches available domains */
export async function getDomains(): Promise<string[]> {
    if (cachedDomains && cachedDomains.length > 0) {
      return cachedDomains;
    }
    
    try {
      const domainsResponse = await apiRequest<{ 'hydra:member'?: { domain: string }[] }>('/domains');
      const domains = domainsResponse?.['hydra:member']?.map(d => d.domain);
      
      if (!domains || domains.length === 0) {
        throw new Error('No domains returned from API.');
      }
      cachedDomains = domains;
      return cachedDomains;
    } catch (e) {
      console.error("Failed to fetch domains:", e);
      throw new Error('Service temporarily unavailable. Could not fetch domains.');
    }
}

/** The core logic to create a new mailbox. Can be random or specific. */
async function createNewMailbox(address?: string): Promise<{ address: string; token: string }> {
    let finalAddress: string;

    if (address) {
        finalAddress = address;
    } else {
        const domains = await getDomains();
        const domain = domains[Math.floor(Math.random() * domains.length)];
        finalAddress = `${randomString(8)}@${domain}`;
    }
    
    const password = randomString(12);

    // 2. Create account
    await apiRequest('/accounts', {
      method: 'POST',
      body: JSON.stringify({ address: finalAddress, password }),
    });

    // 3. Get token
    const tokenResponse = await apiRequest<{ token: string }>('/token', {
      method: 'POST',
      body: JSON.stringify({ address: finalAddress, password }),
    });
    
    const token = tokenResponse?.token;
    if (!token) {
        throw new Error('Failed to retrieve authentication token.');
    }
    
    return { address: finalAddress, token };
}

/** Pre-fetches the next mailbox in the background. */
async function prefetchMailbox() {
    if (prefetchedMailbox || isPrefetching) {
        return; // A mailbox is already ready or being fetched.
    }
    // If a prefetch failed recently, wait before retrying.
    if (lastPrefetchFailedTimestamp && (Date.now() - lastPrefetchFailedTimestamp < PREFETCH_RETRY_DELAY)) {
        return;
    }

    isPrefetching = true;
    try {
        prefetchedMailbox = await createNewMailbox();
        lastPrefetchFailedTimestamp = null; // Reset on success
    } catch (e) {
        console.error("Background mailbox prefetch failed:", e);
        prefetchedMailbox = null; // Reset to allow retrying.
        lastPrefetchFailedTimestamp = Date.now(); // Record failure time
    } finally {
        isPrefetching = false;
    }
}

/** Generate a random temporary mailbox, using a pre-fetched one if available. */
export async function generateRandomMailbox(): Promise<string> {
    let mailbox: { address: string; token: string };

    if (prefetchedMailbox) {
        // FAST PATH: Use the pre-fetched mailbox instantly.
        mailbox = prefetchedMailbox;
        prefetchedMailbox = null;
    } else {
        // SLOW PATH: No pre-fetched mailbox available, create one now.
        mailbox = await createNewMailbox();
    }
    
    // Set the new mailbox as active.
    authToken = mailbox.token;
    
    // Trigger the pre-fetch for the *next* mailbox in the background.
    prefetchMailbox();
    
    return mailbox.address;
}

/** Generate a custom temporary mailbox. */
export async function generateCustomMailbox(address: string): Promise<string> {
    const mailbox = await createNewMailbox(address);
    authToken = mailbox.token;
    prefetchMailbox();
    return mailbox.address;
}


/** Fetch message headers for the current account */
export async function fetchMessages(): Promise<Message[]> {
  if (!authToken) throw new Error('Not authenticated.');
  
  const response = await apiRequest<{ 'hydra:member': any[] }>('/messages');
  
  // Map API response to our internal Message type
  return (response?.['hydra:member'] || []).map(msg => ({
    id: msg.id,
    from: msg.from?.address || 'Unknown Sender',
    subject: msg.subject || '(no subject)',
    date: msg.createdAt,
  }));
}

/** Fetch a single message by id */
export async function fetchMessage(id: string): Promise<MessageDetails> {
  if (!authToken) throw new Error('Not authenticated.');
  
  const msg = await apiRequest<any>(`/messages/${id}`);

  if (!msg) {
    throw new Error(`Message with ID ${id} not found or could not be loaded.`);
  }
  
  // Map API response to our internal MessageDetails type
  return {
    id: msg.id,
    from: msg.from?.address || 'Unknown Sender',
    subject: msg.subject || '(no subject)',
    date: msg.createdAt,
    attachments: (msg.attachments || []).map((att: any) => ({
      id: att.id,
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
    })),
    body: msg.text || msg.html?.[0] || '',
    textBody: msg.text || '',
    htmlBody: msg.html?.[0] || '',
  };
}


/** Fetches an attachment as a blob */
export async function getAttachmentBlob(messageId: string, attachmentId: string): Promise<Blob> {
    if (!authToken) throw new Error('Not authenticated.');
    const blob = await apiRequest<Blob>(`/messages/${messageId}/attachments/${attachmentId}`, {
        responseType: 'blob',
    });
    return blob;
}
