import axios from 'axios';
import { SERPER_API_KEY } from '../config/settings';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchOnline(query: string): Promise<SearchResult[]> {
  if (!SERPER_API_KEY) {
    console.warn('[SearchService] No SERPER_API_KEY found. Searching is disabled.');
    return [];
  }

  try {
    const response = await axios.post('https://google.serper.dev/search', {
      q: query,
      gl: 'ar', // Argentina
      hl: 'es', // Español
    }, {
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    return response.data.organic.map((res: any) => ({
      title: res.title,
      link: res.link,
      snippet: res.snippet,
    }));
  } catch (error) {
    console.error('[SearchService] Error performing search:', error);
    return [];
  }
}
