import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import type { Paper } from '@/types/paper';

export const dynamic = 'force-dynamic'; // Disable caching for this route

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'cat:cs.*';
  const start = parseInt(searchParams.get('start') || '0');
  const maxResults = parseInt(searchParams.get('maxResults') || '10');

  try {
    // Properly encode the URL components
    const encodedQuery = encodeURIComponent(query);
    const url = `https://export.arxiv.org/api/query?search_query=${encodedQuery}&start=${start}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    
    console.log('Fetching from arXiv with URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'Mozilla/5.0 ArxivPaperViewer/1.0',
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      console.error(`ArXiv API error: ${response.status} ${response.statusText}`);
      throw new Error(`ArXiv API returned: ${response.status}`);
    }

    const xmlData = await response.text();
    
    if (!xmlData || xmlData.trim() === '') {
      console.error('Empty response from arXiv API');
      throw new Error('Empty response from arXiv API');
    }

    // Parse XML to JSON
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      isArray: (name) => ["entry", "author", "category"].includes(name),
    });

    let result;
    try {
      result = parser.parse(xmlData);
    } catch (parseError) {
      console.error('XML parsing error:', parseError);
      throw new Error(`Failed to parse XML: ${(parseError as Error).message}`);
    }

    // Handle case when no results are found
    if (!result.feed || !result.feed.entry) {
      return NextResponse.json({ papers: [] });
    }

    // Ensure entry is always an array
    const entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];

    // Map the entries to our Paper type
    const papers: Paper[] = entries.map((entry: any) => {
      try {
        // Extract the PDF URL
        const links = Array.isArray(entry.link) ? entry.link : [entry.link];
        const pdfLink = links.find((link: any) => link?.title === "pdf");

        // Extract categories
        const categories = Array.isArray(entry.category)
          ? entry.category.map((cat: any) => cat?.term).filter(Boolean)
          : (entry.category?.term ? [entry.category.term] : []);

        // Safely extract and clean text fields
        const title = typeof entry.title === 'string' 
          ? entry.title.replace(/\s+/g, " ").trim()
          : 'Untitled Paper';
          
        const abstract = typeof entry.summary === 'string'
          ? entry.summary.replace(/\s+/g, " ").trim()
          : 'No abstract available';
          
        const authors = Array.isArray(entry.author) 
          ? entry.author.map((author: any) => author?.name).filter(Boolean)
          : (entry.author?.name ? [entry.author.name] : ['Unknown Author']);

        return {
          id: entry.id || `unknown-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title,
          authors,
          abstract,
          published: entry.published || new Date().toISOString(),
          updated: entry.updated || new Date().toISOString(),
          categories,
          pdfUrl: pdfLink?.href || (entry.id ? entry.id.replace("abs", "pdf") : ''),
        };
      } catch (entryError) {
        console.error('Error processing entry:', entryError, entry);
        // Return a placeholder for failed entries
        return {
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: 'Error Processing Paper',
          authors: ['Error'],
          abstract: 'This paper could not be processed correctly.',
          published: new Date().toISOString(),
          updated: new Date().toISOString(),
          categories: [],
          pdfUrl: '',
        };
      }
    });

    // Return successful response
    return NextResponse.json({ papers });
  } catch (error) {
    console.error('Error fetching from arXiv:', error);
    
    // Return mock data instead of an error to ensure the app still works
    const mockPapers = getMockPapers();
    
    return NextResponse.json({ 
      papers: mockPapers,
      error: 'Failed to fetch papers from arXiv', 
      message: (error as Error).message,
      usedFallback: true
    });
  }
}

// Fallback mock data
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