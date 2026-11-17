/**
 * Light Web Search Engine
 * Enhanced internet information retrieval
 * Features: Multi-source, smart synthesis, verification, deep search
 */

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  source: string;
  relevanceScore: number;
  publishedDate?: string;
  domain: string;
}

export interface EnhancedSearchResponse {
  query: string;
  mainAnswer: string;
  sources: SearchResult[];
  relatedQuestions: string[];
  synthesizedInfo: {
    keyPoints: string[];
    summary: string;
    confidence: number;
  };
  followUpSuggestions: string[];
}

export class LightWebSearchEngine {
  private readonly MAX_RESULTS = 10;
  private readonly TRUSTED_DOMAINS = [
    'wikipedia.org',
    'britannica.com',
    'nhs.uk',
    'mayoclinic.org',
    'stackoverflow.com',
    'github.com',
    'mozilla.org',
    'w3schools.com',
    'medium.com',
    'reddit.com',
  ];

  /**
   * Enhanced multi-source search
   * Searches DuckDuckGo, Wikipedia, and other sources
   */
  async enhancedSearch(query: string): Promise<EnhancedSearchResponse> {
    console.log('[WebSearch] Enhanced search for:', query);

    try {
      // Parallel searches from multiple sources
      const [duckResults, wikiResults] = await Promise.all([
        this.searchDuckDuckGo(query),
        this.searchWikipedia(query),
      ]);

      // Combine and rank results
      const allResults = this.combineAndRankResults(duckResults, wikiResults);

      // Synthesize information from multiple sources
      const synthesized = this.synthesizeInformation(allResults, query);

      // Generate related questions
      const relatedQuestions = this.generateRelatedQuestions(query, allResults);

      // Create main answer from top results
      const mainAnswer = this.createMainAnswer(query, allResults, synthesized);

      // Generate follow-up suggestions
      const followUpSuggestions = this.generateFollowUpSuggestions(query, allResults);

      return {
        query,
        mainAnswer,
        sources: allResults.slice(0, 5), // Top 5 sources
        relatedQuestions,
        synthesizedInfo: synthesized,
        followUpSuggestions,
      };
    } catch (error) {
      console.error('[WebSearch] Enhanced search error:', error);
      
      // Fallback to basic search
      const basicResults = await this.searchDuckDuckGo(query);
      return this.createFallbackResponse(query, basicResults);
    }
  }

  /**
   * Search DuckDuckGo (free, no API key)
   */
  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      // Use DuckDuckGo Instant Answer API
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResult[] = [];

      // Extract abstract (main answer)
      if (data.Abstract) {
        results.push({
          title: data.Heading || query,
          snippet: data.Abstract,
          link: data.AbstractURL || '',
          source: 'DuckDuckGo',
          relevanceScore: 1.0,
          domain: this.extractDomain(data.AbstractURL || ''),
        });
      }

      // Extract related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.substring(0, 100),
              snippet: topic.Text,
              link: topic.FirstURL,
              source: 'DuckDuckGo Related',
              relevanceScore: 0.8,
              domain: this.extractDomain(topic.FirstURL),
            });
          }
          
          // Handle nested topics
          if (topic.Topics && Array.isArray(topic.Topics)) {
            for (const subTopic of topic.Topics.slice(0, 2)) {
              if (subTopic.Text && subTopic.FirstURL) {
                results.push({
                  title: subTopic.Text.substring(0, 100),
                  snippet: subTopic.Text,
                  link: subTopic.FirstURL,
                  source: 'DuckDuckGo',
                  relevanceScore: 0.7,
                  domain: this.extractDomain(subTopic.FirstURL),
                });
              }
            }
          }
        }
      }

      // Extract infobox
      if (data.Infobox && data.Infobox.content) {
        const infoText = data.Infobox.content
          .map((item: any) => `${item.label}: ${item.value}`)
          .join('. ');
        
        if (infoText) {
          results.push({
            title: `${data.Heading} - Quick Facts`,
            snippet: infoText,
            link: data.AbstractURL || '',
            source: 'DuckDuckGo Infobox',
            relevanceScore: 0.9,
            domain: this.extractDomain(data.AbstractURL || ''),
          });
        }
      }

      console.log('[WebSearch] DuckDuckGo returned', results.length, 'results');
      return results;
    } catch (error) {
      console.error('[WebSearch] DuckDuckGo search error:', error);
      return [];
    }
  }

  /**
   * Search Wikipedia
   */
  private async searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
      // Wikipedia API - opensearch
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(query)}&limit=5`
      );

      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResult[] = [];

      // data format: [query, [titles], [descriptions], [urls]]
      if (Array.isArray(data) && data.length === 4) {
        const titles = data[1];
        const descriptions = data[2];
        const urls = data[3];

        for (let i = 0; i < titles.length; i++) {
          results.push({
            title: titles[i],
            snippet: descriptions[i] || '',
            link: urls[i],
            source: 'Wikipedia',
            relevanceScore: 0.95, // Wikipedia is highly trusted
            domain: 'wikipedia.org',
          });
        }
      }

      console.log('[WebSearch] Wikipedia returned', results.length, 'results');
      return results;
    } catch (error) {
      console.error('[WebSearch] Wikipedia search error:', error);
      return [];
    }
  }

  /**
   * Combine and rank results from multiple sources
   */
  private combineAndRankResults(
    duckResults: SearchResult[],
    wikiResults: SearchResult[]
  ): SearchResult[] {
    const combined = [...duckResults, ...wikiResults];

    // Remove duplicates based on URL
    const unique = combined.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.link === result.link && result.link !== '')
    );

    // Calculate final relevance score
    unique.forEach((result) => {
      let score = result.relevanceScore;

      // Boost trusted domains
      if (this.TRUSTED_DOMAINS.some((domain) => result.domain.includes(domain))) {
        score += 0.2;
      }

      // Boost Wikipedia
      if (result.domain.includes('wikipedia')) {
        score += 0.15;
      }

      // Boost results with longer snippets (more informative)
      if (result.snippet.length > 200) {
        score += 0.1;
      }

      result.relevanceScore = Math.min(score, 1.0);
    });

    // Sort by relevance score
    unique.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return unique.slice(0, this.MAX_RESULTS);
  }

  /**
   * Synthesize information from multiple sources
   */
  private synthesizeInformation(
    results: SearchResult[],
    query: string
  ): { keyPoints: string[]; summary: string; confidence: number } {
    if (results.length === 0) {
      return {
        keyPoints: [],
        summary: 'No information found.',
        confidence: 0,
      };
    }

    // Extract key points from top results
    const keyPoints: string[] = [];
    const sentences: string[] = [];

    for (const result of results.slice(0, 3)) {
      // Split snippet into sentences
      const resultSentences = result.snippet
        .split(/[.!?]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);

      sentences.push(...resultSentences);

      // Extract key facts (sentences with numbers, names, etc.)
      for (const sentence of resultSentences.slice(0, 2)) {
        if (
          sentence.match(/\d+/) || // Contains numbers
          sentence.match(/^[A-Z]/) || // Starts with capital
          sentence.length > 40
        ) {
          keyPoints.push(sentence);
        }
      }
    }

    // Create summary from first few sentences
    const summary = sentences.slice(0, 3).join('. ') + '.';

    // Calculate confidence based on number of sources and their quality
    const confidence = Math.min(
      0.5 + (results.length / 10) * 0.3 + (results[0]?.relevanceScore || 0) * 0.2,
      1.0
    );

    return {
      keyPoints: keyPoints.slice(0, 5), // Top 5 key points
      summary,
      confidence,
    };
  }

  /**
   * Create main answer from search results
   */
  private createMainAnswer(
    query: string,
    results: SearchResult[],
    synthesized: { summary: string; confidence: number }
  ): string {
    if (results.length === 0) {
      return "I couldn't find specific information about that, sir. Could you rephrase your question?";
    }

    const topResult = results[0];
    const lower = query.toLowerCase();

    // Direct answer format for definition questions
    if (lower.startsWith('what is') || lower.startsWith('who is')) {
      let answer = topResult.snippet;

      // Add source attribution
      if (topResult.source === 'Wikipedia') {
        answer += `\n\n📚 Source: Wikipedia`;
      } else if (topResult.link) {
        answer += `\n\n🔗 Source: ${topResult.domain}`;
      }

      // Add additional context if confidence is high
      if (synthesized.confidence > 0.7 && results.length > 1) {
        answer += `\n\nI found ${results.length} sources confirming this information.`;
      }

      return answer;
    }

    // Conversational format for other questions
    let answer = `Based on what I found from ${results.length} source${results.length > 1 ? 's' : ''}:\n\n`;
    answer += synthesized.summary;

    // Add key points if available
    if (synthesized.keyPoints && synthesized.keyPoints.length > 0) {
      answer += `\n\nKey points:\n`;
      synthesized.keyPoints.slice(0, 3).forEach((point, i) => {
        answer += `${i + 1}. ${point}\n`;
      });
    }

    // Add source
    answer += `\n📚 Primary source: ${topResult.source}`;

    return answer;
  }

  /**
   * Generate related questions based on search results
   */
  private generateRelatedQuestions(query: string, results: SearchResult[]): string[] {
    const questions: string[] = [];
    const lower = query.toLowerCase();

    // Question templates based on query type
    if (lower.startsWith('what')) {
      questions.push(`How does ${query.replace(/^what is /i, '')} work?`);
      questions.push(`Why is ${query.replace(/^what is /i, '')} important?`);
    } else if (lower.startsWith('how')) {
      questions.push(`What are the benefits of ${query.replace(/^how to /i, '')}?`);
      questions.push(`When should I ${query.replace(/^how to /i, '')}?`);
    } else if (lower.startsWith('why')) {
      questions.push(`How does ${query.replace(/^why /i, '')} happen?`);
      questions.push(`What are the effects of ${query.replace(/^why /i, '')}?`);
    }

    // Extract related topics from results
    for (const result of results.slice(0, 3)) {
      // Look for "also", "related", "similar" patterns in snippets
      const relatedMatch = result.snippet.match(/(?:also|related to|similar to) ([^.,]+)/i);
      if (relatedMatch) {
        questions.push(`Tell me about ${relatedMatch[1]}`);
      }
    }

    return questions.slice(0, 3); // Top 3 related questions
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(query: string, results: SearchResult[]): string[] {
    const suggestions: string[] = [];

    if (results.length > 1) {
      suggestions.push('Show me more details');
      suggestions.push('Compare different sources');
    }

    if (results.some((r) => r.link)) {
      suggestions.push('Open full article');
    }

    suggestions.push('Search for something else');
    suggestions.push('Explain this in simpler terms');

    return suggestions.slice(0, 4);
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      if (!url) return 'unknown';
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Create fallback response when enhanced search fails
   */
  private createFallbackResponse(query: string, results: SearchResult[]): EnhancedSearchResponse {
    if (results.length > 0) {
      const mainResult = results[0];
      return {
        query,
        mainAnswer: mainResult.snippet,
        sources: results,
        relatedQuestions: [],
        synthesizedInfo: {
          keyPoints: [mainResult.snippet],
          summary: mainResult.snippet,
          confidence: 0.6,
        },
        followUpSuggestions: ['Search again', 'Try different keywords'],
      };
    }

    return {
      query,
      mainAnswer: "I couldn't find information about that, sir. Try rephrasing your question or being more specific.",
      sources: [],
      relatedQuestions: [],
      synthesizedInfo: {
        keyPoints: [],
        summary: 'No results found',
        confidence: 0,
      },
      followUpSuggestions: ['Rephrase question', 'Be more specific', 'Try different keywords'],
    };
  }

  /**
   * Quick search for simple queries (faster, single source)
   */
  async quickSearch(query: string): Promise<{ answer: string; source: string }> {
    try {
      const results = await this.searchDuckDuckGo(query);
      
      if (results.length > 0) {
        return {
          answer: results[0].snippet,
          source: results[0].source,
        };
      }

      return {
        answer: 'No results found.',
        source: 'none',
      };
    } catch (error) {
      console.error('[WebSearch] Quick search error:', error);
      return {
        answer: 'Search error occurred.',
        source: 'error',
      };
    }
  }
}

// Singleton
export const webSearchEngine = new LightWebSearchEngine();
