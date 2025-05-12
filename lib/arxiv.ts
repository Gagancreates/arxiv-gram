import { XMLParser } from "fast-xml-parser"
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
  maxResults = 10,
}: FetchPapersOptions): Promise<Paper[]> {
  // Build the query string
  let query = ""

  if (categories.length > 0) {
    // If specific categories are selected
    query += categories.map((cat) => `cat:${cat}`).join("+OR+")
  } else {
    // Default to all CS papers
    query += "cat:cs.*"
  }

  // Add title search if provided
  if (searchQuery) {
    query += `+AND+ti:"${encodeURIComponent(searchQuery)}"`
  }

  try {
    // Add timestamp to prevent caching issues
    const timestamp = Date.now();
    // Create URL to our proxy API endpoint
    const apiUrl = `/api/arxiv?query=${encodeURIComponent(query)}&start=${start}&maxResults=${maxResults}&_=${timestamp}`;
    
    console.log('Fetching papers with query:', query);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
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
      return data.papers;
    }
    
    // If our API returns an error with no fallback
    if (data.error) {
      throw new Error(data.message || 'Unknown error from API');
    }
    
    // Return the papers from our API
    return data.papers || [];
  } catch (error) {
    // Handle abort error differently
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Request timed out');
      return getMockPapers();
    }
    
    console.error('Error fetching papers:', error);
    // Return mock data rather than throwing an error
    return getMockPapers();
  }
}

// Fallback mock data in case API fails
function getMockPapers(): Paper[] {
  return [
    {
      id: "mock-1",
      title: "Sample Paper: Deep Learning Applications in Computer Vision",
      authors: ["John Smith", "Jane Doe", "Robert Johnson"],
      abstract: "This paper explores recent advances in deep learning and their applications to computer vision problems. We review state-of-the-art models and propose new architectures that improve performance on benchmark datasets.",
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      categories: ["cs.CV", "cs.LG", "cs.AI"],
      pdfUrl: "https://arxiv.org/pdf/mock.1234.5678",
    },
    {
      id: "mock-2",
      title: "Transformer Models for Natural Language Processing",
      authors: ["Alice Brown", "David Wilson"],
      abstract: "We present a comprehensive overview of transformer-based models in natural language processing. Our analysis includes performance comparisons across multiple tasks and insights into future research directions.",
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      categories: ["cs.CL", "cs.LG"],
      pdfUrl: "https://arxiv.org/pdf/mock.2345.6789",
    },
    {
      id: "mock-3",
      title: "Reinforcement Learning in Multi-Agent Systems",
      authors: ["Michael Chen", "Sarah Miller", "James Taylor", "Emily Davis"],
      abstract: "This work addresses the challenges of applying reinforcement learning in multi-agent systems. We propose a novel framework that improves coordination between agents and demonstrate its effectiveness in complex environments.",
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      categories: ["cs.MA", "cs.AI", "cs.LG"],
      pdfUrl: "https://arxiv.org/pdf/mock.3456.7890",
    }
  ];
}
