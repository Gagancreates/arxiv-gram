import type { Paper } from "@/types/paper"

interface FetchPapersOptions {
  searchQuery?: string
  categories?: string[]
  start?: number
  maxResults?: number
}

export async function fetchPapers({
  searchQuery = "",
  categories = [],
  start = 0,
  maxResults = 50,
}: FetchPapersOptions): Promise<Paper[]> {
  // Build the query string
  let query = ""

  if (categories.length > 0) {
    // If specific categories are selected
    query += categories.map((cat) => `cat:${cat}`).join(" OR ")
  } else {
    // Default to CS and Math papers with proper formatting
    query += "(cat:cs.* OR cat:math.*)"
  }

  // Add title search if provided
  if (searchQuery) {
    query += ` AND ti:"${encodeURIComponent(searchQuery)}"`
  }

  const maxRetries = 5;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      // Add timestamp to prevent caching issues and signal it's a new request each time
      const timestamp = Date.now();
      // Create URL to our proxy API endpoint with _=${timestamp} to prevent caching
      const apiUrl = `/api/arxiv?query=${encodeURIComponent(query)}&start=${start}&maxResults=${maxResults}&_=${timestamp}`;
      
      console.log(`Attempt ${retries + 1}/${maxRetries}: Fetching papers with query:`, query, 'start:', start, 'maxResults:', maxResults);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (increased)
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      // If our API returns an error but also fallback data
      if (data.error && data.usedFallback && data.papers) {
        console.warn('Using fallback data from API:', data.message);
        
        // If we got fallback data but it's empty and we've retried less than max,
        // try again with a different start index
        if (data.papers.length === 0 && retries < maxRetries - 1) {
          console.log('Got empty fallback data, retrying with different start index');
          retries++;
          // Try a random offset to find papers
          start = start + Math.floor(Math.random() * 100);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        return data.papers;
      }
      
      // If our API returns an error with no fallback
      if (data.error) {
        throw new Error(data.message || 'Unknown error from API');
      }
      
      const papers = data.papers || [];
      
      // If we got papers, return them
      if (papers.length > 0) {
        return papers;
      }
      
      // If we got no papers and we've retried less than max, try again with a different start index
      if (papers.length === 0 && retries < maxRetries - 1) {
        console.log('No papers found, retrying with different start index');
        retries++;
        // Try a random offset to find papers
        start = start + 50 + Math.floor(Math.random() * 50);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // If we've retried max times and still got no papers, return empty array
      return papers;
    } catch (error) {
      retries++;
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Error fetching papers (attempt ${retries}/${maxRetries}):`, error);
      
      // If we've reached max retries or it's an abort error, use mock data
      if (retries >= maxRetries || (error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Request failed after retries or timed out, using mock data');
        return getMockPapers(start);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = 1000 * Math.pow(2, retries - 1);
      console.log(`Waiting ${delay}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`Failed to fetch papers after ${maxRetries} attempts. Last error:`, lastError);
  // Always return some papers, even if we had to use mock data
  return getMockPapers(start);
}

// Fallback mock data in case API fails
function getMockPapers(startIndex = 0): Paper[] {
  // Generate different mock papers based on the startIndex to simulate infinite scrolling
  return Array.from({ length: 10 }, (_, i) => {
    const index = startIndex + i;
    return {
      id: `mock-${Date.now()}-${index}`,
      title: `Sample Paper ${index}: ${['Deep Learning', 'Machine Learning', 'Computer Vision', 'Natural Language Processing', 'Reinforcement Learning'][index % 5]} Research`,
      authors: ["Author " + (index * 2 + 1), "Author " + (index * 2 + 2)],
      abstract: `This is a mock paper abstract for paper number ${index}. Created when real data could not be fetched from arXiv API.`,
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      categories: ["cs.CV", "cs.LG", "cs.AI"].slice(0, (index % 3) + 1),
      pdfUrl: `https://arxiv.org/pdf/mock.${index}.pdf`,
    };
  });
}
