
import type { Message, MessageDetails } from '../types';

const API_BASE_URL = 'https://api.mail.gw';

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

// Internal fetch wrapper for API calls
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 400 && endpoint === '/accounts') {
        // Mail.gw returns 400 if the address is already used.
        throw new Error('Address is already taken. Please try another.');
    }
    const errorBody = await response.text();
    console.error(`API request failed with status ${response.status}:`, errorBody);
    throw new Error(`Request failed: ${response.statusText} (${response.status})`);
  }

  if (responseType === 'blob') {
    return response.blob() as Promise<T>;
  }
  
  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType || !(contentType.includes('application/json') || contentType.includes('application/ld+json'))) {
      return null as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T; // Handle empty body even if headers say JSON
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(`Failed to parse JSON response from ${endpoint}:`, error);
    throw new Error('Received invalid data from the server.');
  }
}

/** Fetches and caches available domains */
export async function getDomains(): Promise<string[]> {
    if (cachedDomains && cachedDomains.length > 0) {
      return cachedDomains;
    }
    const domainsResponse = await apiRequest<{ 'hydra:member'?: { domain: string }[] }>('/domains');
    const domains = domainsResponse?.['hydra:member']?.map(d => d.domain);
    
    if (!domains || domains.length === 0) {
      throw new Error('Could not fetch available domains.');
    }
    cachedDomains = domains;
    return cachedDomains;
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