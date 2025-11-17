import type { LinkPreview } from '../types';

const API_URL = 'https://jsonlink.io/api/extractor';
const cache = new Map<string, LinkPreview | null>();

export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  if (cache.has(url)) {
    return cache.get(url) || null;
  }

  try {
    const response = await fetch(`${API_URL}?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch preview: ${response.statusText}`);
    }
    const data = await response.json();

    if (!data.title && !data.description) {
      // Cache failure to prevent retries
      cache.set(url, null);
      return null;
    }

    const preview: LinkPreview = {
      url: data.url || url,
      title: data.title,
      description: data.description,
      image: data.images?.[0], // Take the first image
      sitename: data.sitename || new URL(url).hostname,
    };

    cache.set(url, preview);
    return preview;
  } catch (error) {
    console.error(`Error fetching link preview for ${url}:`, error);
    // Cache failure to prevent retries
    cache.set(url, null);
    return null;
  }
}
