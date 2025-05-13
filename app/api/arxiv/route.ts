import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import type { Paper } from '@/types/paper';

export const dynamic = 'force-dynamic'; // Disable caching for this route

// Define interfaces for arXiv API response structure
interface ArxivLink {
  href?: string;
  title?: string;
}

interface ArxivCategory {
  term?: string;
}

interface ArxivAuthor {
  name?: string;
}

interface ArxivEntry {
  id?: string;
  title?: string;
  summary?: string;
  published?: string;
  updated?: string;
  author?: ArxivAuthor | ArxivAuthor[];
  category?: ArxivCategory | ArxivCategory[];
  link?: ArxivLink | ArxivLink[];
}

interface ArxivResponse {
  feed?: {
    entry?: ArxivEntry | ArxivEntry[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'cat:cs.* OR cat:math.*';
  const start = parseInt(searchParams.get('start') || '0');
  const maxResults = parseInt(searchParams.get('maxResults') || '10');

  try {
    // Properly encode the URL components
    const encodedQuery = encodeURIComponent(query);
    // Direct access to arXiv API without any sorting parameters to get papers from all dates
    const url = `https://export.arxiv.org/api/query?search_query=${encodedQuery}&start=${start}&max_results=${maxResults}`;
    
    console.log('Fetching from arXiv with URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
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

    let result: ArxivResponse;
    try {
      result = parser.parse(xmlData);
      console.log('ArXiv response parsed successfully:', result.feed ? 'Feed found' : 'No feed found');
      if (result.feed) {
        console.log('Entries found:', result.feed.entry ? (Array.isArray(result.feed.entry) ? result.feed.entry.length : '1') : 'None');
      }
    } catch (parseError) {
      console.error('XML parsing error:', parseError);
      throw new Error(`Failed to parse XML: ${(parseError as Error).message}`);
    }

    // Handle case when no results are found - return empty array instead of mock data
    if (!result.feed || !result.feed.entry) {
      console.log('No papers found in arXiv response');
      return NextResponse.json({ papers: [] });
    }

    // Ensure entry is always an array
    const entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];

    // Map the entries to our Paper type
    const papers: Paper[] = entries.map((entry: ArxivEntry) => {
      try {
        // Extract the PDF URL
        const links = Array.isArray(entry.link) ? entry.link : [entry.link];
        const pdfLink = links
          .filter((link): link is ArxivLink => link !== undefined)
          .find((link) => link?.title === "pdf");

        // Extract categories
        const categories = Array.isArray(entry.category)
          ? entry.category
              .filter((cat): cat is ArxivCategory => cat !== undefined)
              .map((cat) => cat.term)
              .filter((term): term is string => term !== undefined)
          : (entry.category?.term ? [entry.category.term] : []);

        // Safely extract and clean text fields
        const title = typeof entry.title === 'string' 
          ? entry.title.replace(/\s+/g, " ").trim()
          : 'Untitled Paper';
          
        const abstract = typeof entry.summary === 'string'
          ? entry.summary.replace(/\s+/g, " ").trim()
          : 'No abstract available';
          
        const authors = Array.isArray(entry.author) 
          ? entry.author
              .filter((author): author is ArxivAuthor => author !== undefined)
              .map((author) => author.name)
              .filter((name): name is string => name !== undefined)
          : (entry.author?.name ? [entry.author.name] : ['Unknown Author']);

        // Extract the published and updated dates
        const published = entry.published || null;
        const updated = entry.updated || published || null;

        return {
          id: entry.id || `unknown-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title,
          authors,
          abstract,
          published: published,
          updated: updated,
          categories,
          pdfUrl: pdfLink?.href || (entry.id ? entry.id.replace("abs", "pdf") : ''),
        };
      } catch (entryError) {
        console.error('Error processing entry:', entryError, entry);
        return null;
      }
    }).filter(Boolean) as Paper[]; // Remove any null entries

    // Log the dates of the papers
    console.log('Paper dates:', papers.map(p => ({ id: p.id, published: p.published })));

    // Return successful response
    return NextResponse.json({ papers });
  } catch (error) {
    console.error('Error fetching from arXiv:', error);
    
    // Return empty array instead of mock data to prevent date issues
    return NextResponse.json({ 
      papers: [],
      error: 'Failed to fetch papers from arXiv', 
      message: (error as Error).message,
    });
  }
} 