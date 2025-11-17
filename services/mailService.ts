
import type { Message, MessageDetails } from '../types';

const API_BASE_URL = 'https://api.mail.gw';

// Module-level state
let authToken: string | null = null;
let cachedDomains: string[] | null = null;

// State for pre-fetching to improve performance
let prefetchedMailbox: { address: string; token: string } | null = null;
let isPrefetching = false;

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
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  const isHydraEndpoint = !['/token', '/accounts'].includes(endpoint);
  if (isHydraEndpoint) {
    headers.append('Accept', 'application/ld+json');
  } else {
    headers.append('Accept', 'application/json');
  }
  
  headers.append('Content-Type', 'application/json');

  if (authToken && !['/token', '/accounts'].includes(endpoint)) {
    headers.append('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API request failed with status ${response.status}:`, errorBody);
    throw new Error(`Request failed: ${response.statusText} (${response.status})`);
  }
  
  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType || !(contentType.includes('application/json') || contentType.includes('application/ld+json'))) {
      return null as T;
  }

  return response.json();
}

/** The core logic to create a new mailbox. */
async function createNewMailbox(): Promise<{ address: string; token: string }> {
    // 1. Get available domains (cached)
    if (!cachedDomains || cachedDomains.length === 0) {
      const domainsResponse = await apiRequest<{ 'hydra:member'?: { domain: string }[] }>('/domains');
      const domains = domainsResponse?.['hydra:member']?.map(d => d.domain);
      
      if (!domains || domains.length === 0) {
        throw new Error('Could not fetch available domains.');
      }
      cachedDomains = domains;
    }
    
    const domain = cachedDomains[Math.floor(Math.random() * cachedDomains.length)];
    const address = `${randomString(12)}@${domain}`;
    const password = randomString(12);

    // 2. Create account
    await apiRequest('/accounts', {
      method: 'POST',
      body: JSON.stringify({ address, password }),
    });

    // 3. Get token
    const tokenResponse = await apiRequest<{ token: string }>('/token', {
      method: 'POST',
      body: JSON.stringify({ address, password }),
    });
    
    const token = tokenResponse.token;
    if (!token) {
        throw new Error('Failed to retrieve authentication token.');
    }
    
    return { address, token };
}

/** Pre-fetches the next mailbox in the background. */
async function prefetchMailbox() {
    if (prefetchedMailbox || isPrefetching) {
        return; // A mailbox is already ready or being fetched.
    }
    isPrefetching = true;
    try {
        prefetchedMailbox = await createNewMailbox();
    } catch (e) {
        console.error("Background mailbox prefetch failed:", e);
        prefetchedMailbox = null; // Reset to allow retrying.
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

/** Fetch message headers for the current account */
export async function fetchMessages(): Promise<Message[]> {
  if (!authToken) throw new Error('Not authenticated.');
  
  const response = await apiRequest<{ 'hydra:member': any[] }>('/messages');
  
  // Map API response to our internal Message type
  return (response['hydra:member'] || []).map(msg => ({
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
  
  // Map API response to our internal MessageDetails type
  return {
    id: msg.id,
    from: msg.from?.address || 'Unknown Sender',
    subject: msg.subject || '(no subject)',
    date: msg.createdAt,
    attachments: (msg.attachments || []).map((att: any) => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
    })),
    body: msg.text || msg.html?.[0] || '',
    textBody: msg.text || '',
    htmlBody: msg.html?.[0] || '',
  };
}
