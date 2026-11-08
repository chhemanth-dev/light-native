/**
 * Web Search Integration - Fetches real-time data from the internet
 * Uses DuckDuckGo Instant Answer API (free, no API key needed)
 */

export interface SearchResult {
  answer?: string;
  abstract?: string;
  abstractSource?: string;
  relatedTopics?: Array<{ text: string }>;
  success: boolean;
}

/**
 * Search the web for information using DuckDuckGo API
 * Free, no API key required, respects privacy
 */
export async function searchWeb(query: string): Promise<SearchResult> {
  try {
    console.log('[WebSearch] Searching for:', query);
    
    // DuckDuckGo Instant Answer API
    const encodedQuery = encodeURIComponent(query);
    const url = 'https://api.duckduckgo.com/?q=' + encodedQuery + '&format=json&no_html=1&skip_disambig=1';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[WebSearch] HTTP error:', response.status);
      return { success: false };
    }

    const data = await response.json();
    console.log('[WebSearch] Response received:', JSON.stringify(data).substring(0, 200));

    // Extract useful information
    const result: SearchResult = {
      answer: data.Answer || data.AbstractText || undefined,
      abstract: data.AbstractText || undefined,
      abstractSource: data.AbstractSource || undefined,
      relatedTopics: data.RelatedTopics?.slice(0, 3).map((t: any) => ({
        text: t.Text || t.FirstURL
      })) || [],
      success: !!(data.Answer || data.AbstractText || data.RelatedTopics?.length > 0)
    };

    return result;
  } catch (error) {
    console.error('[WebSearch] Search failed:', error);
    return { success: false };
  }
}

/**
 * Fetch and scrape a Wikipedia page for detailed information
 */
export async function fetchWikipedia(topic: string): Promise<string | null> {
  try {
    console.log('[Wikipedia] Fetching:', topic);
    
    const encodedTopic = encodeURIComponent(topic);
    const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodedTopic;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Wikipedia] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[Wikipedia] Article found:', data.title);

    // Return the extract (summary)
    return data.extract || null;
  } catch (error) {
    console.error('[Wikipedia] Fetch failed:', error);
    return null;
  }
}

/**
 * Get current weather data (using wttr.in free API)
 */
export async function getWeather(location: string = 'auto'): Promise<string | null> {
  try {
    console.log('[Weather] Fetching for:', location);
    
    // wttr.in provides weather in plain text format
    const url = 'https://wttr.in/' + encodeURIComponent(location) + '?format=3';
    
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('[Weather] HTTP error:', response.status);
      return null;
    }

    const text = await response.text();
    console.log('[Weather] Response:', text);
    return text.trim();
  } catch (error) {
    console.error('[Weather] Fetch failed:', error);
    return null;
  }
}

/**
 * Smart search - tries multiple sources to get the best answer
 */
export async function smartSearch(query: string): Promise<string> {
  console.log('[SmartSearch] Query:', query);
  
  // Try DuckDuckGo first
  const ddgResult = await searchWeb(query);
  if (ddgResult.success && ddgResult.answer) {
    return ddgResult.answer;
  }
  
  if (ddgResult.success && ddgResult.abstract) {
    return ddgResult.abstract + (ddgResult.abstractSource ? ' (Source: ' + ddgResult.abstractSource + ')' : '');
  }

  // If DuckDuckGo doesn't have an instant answer, try Wikipedia
  // Extract key topic from query
  const topic = query
    .toLowerCase()
    .replace(/^(what is|who is|who was|when did|where is|tell me about|explain)/i, '')
    .trim();
  
  if (topic) {
    const wikiResult = await fetchWikipedia(topic);
    if (wikiResult) {
      return wikiResult;
    }
  }

  // No results found
  return 'I apologize, sir. I could not find reliable information on that topic. Please try rephrasing your question.';
}
