"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import PaperCard from "./paper-card"
import { Loader2 } from "lucide-react"
import type { Paper } from "@/types/paper"
import React from "react"

interface PaperListProps {
  papers: Paper[]
  loading: boolean
  loadMore: () => void
  toggleSaved: (paper: Paper) => void
  toggleLiked: (paper: Paper) => void
  savedIds: string[]
  likedIds: string[]
  hasMore: boolean
  emptyMessage?: string
  onSelectPaper?: (paper: Paper) => void
  singleView?: boolean
}

export default function PaperList({
  papers,
  loading,
  loadMore,
  toggleSaved,
  toggleLiked,
  savedIds,
  likedIds,
  hasMore,
  emptyMessage = "No papers found matching your criteria.",
  onSelectPaper,
  singleView = false,
}: PaperListProps) {
  const observerTarget = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const previousPapersLength = useRef(papers.length)
  const lastLoadTime = useRef<number>(0)
  const loadingBatchId = useRef<string>("")
  
  // Check if the device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  // Optimize mobile scrolling
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;
    
    // Preload nearby papers to make scrolling smoother
    const preloadNearbyPapers = () => {
      const cards = containerRef.current?.querySelectorAll('.paper-card-container');
      if (!cards) return;
      
      const visibleCardIndex = Array.from(cards).findIndex(card => {
        const rect = card.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      });
      
      if (visibleCardIndex !== -1) {
        // Preload next and previous card
        const preloadIndexes = [visibleCardIndex - 1, visibleCardIndex + 1];
        preloadIndexes.forEach(index => {
          if (index >= 0 && index < cards.length) {
            const card = cards[index] as HTMLElement;
            card.style.visibility = 'visible';
          }
        });
      }
    };
    
    const container = containerRef.current;
    container.addEventListener('scroll', preloadNearbyPapers);
    
    return () => {
      container.removeEventListener('scroll', preloadNearbyPapers);
    };
  }, [isMobile, papers.length]);

  // Generate a unique batch ID based on current papers
  const generateBatchId = useCallback(() => {
    if (papers.length === 0) return "";
    // Use the first and last paper IDs to create a unique batch identifier
    return `${papers[0].id}-${papers[papers.length - 1].id}-${papers.length}`;
  }, [papers]);

  // Handle loading more papers safely with debounce and batch tracking
  const handleLoadMore = useCallback(() => {
    const now = Date.now();
    const currentBatchId = generateBatchId();
    
    // Prevent loading if:
    // 1. Already loading
    // 2. No more papers to load
    // 3. Less than 1 second since last load
    // 4. Same batch is being loaded (prevents duplicate loads)
    if (
      isLoadingMore || 
      loading || 
      !hasMore || 
      (now - lastLoadTime.current < 1000) ||
      (currentBatchId === loadingBatchId.current && currentBatchId !== "")
    ) {
      return;
    }
    
    // Update tracking variables
    setIsLoadingMore(true);
    lastLoadTime.current = now;
    loadingBatchId.current = currentBatchId;
    
    // Load more papers
    loadMore();
  }, [isLoadingMore, loading, hasMore, loadMore, generateBatchId]);

  // Reset loading state when papers change
  useEffect(() => {
    if (papers.length > previousPapersLength.current) {
      setIsLoadingMore(false);
      previousPapersLength.current = papers.length;
    } else if (papers.length === previousPapersLength.current && isLoadingMore) {
      // If papers length didn't change after loading attempt, we've reached the end
      setIsLoadingMore(false);
    }
  }, [papers.length, isLoadingMore]);

  // Intersection observer for infinite loading
  useEffect(() => {
    if (!hasMore || singleView) return;

    let observer: IntersectionObserver;
    
    const setupObserver = () => {
      observer = new IntersectionObserver(
        (entries) => {
          // Always trigger load more when the observer target is in view
          if (entries[0].isIntersecting && !loading && !isLoadingMore) {
            console.log("Observer target in view, loading more papers");
            handleLoadMore();
          }
        },
        { 
          threshold: 0.01, // Trigger with just 1% visibility
          rootMargin: '500px 0px' // Load 500px before the element comes into view
        }
      );

      if (observerTarget.current) {
        observer.observe(observerTarget.current);
      }
    };

    // Set up the observer immediately
    setupObserver();
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [handleLoadMore, hasMore, loading, isLoadingMore, singleView]);

  // Additional scroll-based loading as a backup
  useEffect(() => {
    if (singleView || !hasMore) return;
    
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container || loading || isLoadingMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If user has scrolled more than 60% through the content, load more
      if (scrollTop > (scrollHeight - clientHeight) * 0.6) {
        console.log("Scroll threshold reached, loading more papers");
        handleLoadMore();
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasMore, loading, isLoadingMore, singleView, handleLoadMore]);
  
  // Periodic timer to ensure content is loaded
  useEffect(() => {
    if (singleView || !hasMore) return;
    
    // Every 5 seconds, check if we need more content
    const interval = setInterval(() => {
      if (!loading && !isLoadingMore && hasMore) {
        console.log("Periodic check: ensuring content is loaded");
        handleLoadMore();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [hasMore, loading, isLoadingMore, singleView, handleLoadMore]);

  if (papers.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={isMobile ? "h-[100vh] overflow-y-auto snap-y snap-mandatory scroll-smooth mt-8" : "space-y-6 mt-8"}
      style={{ touchAction: 'pan-y' }}
    >
      {papers.map((paper, index) => (
        <div
          key={`paper-${paper.id}`}
          onClick={onSelectPaper ? () => onSelectPaper(paper) : undefined}
          className={`paper-card-container ${onSelectPaper ? "cursor-pointer" : ""} ${isMobile ? "h-[100vh] snap-start snap-always flex items-center justify-center" : ""}`}
        >
          <PaperCard
            paper={paper}
            isSaved={savedIds.includes(paper.id)}
            isLiked={likedIds.includes(paper.id)}
            index={index}
            onToggleSaved={(e?: React.MouseEvent) => {
              if (e) e.stopPropagation()
              toggleSaved(paper)
            }}
            onToggleLiked={(e?: React.MouseEvent) => {
              if (e) e.stopPropagation()
              toggleLiked(paper)
            }}
          />
        </div>
      ))}

      {!singleView && (
        <div ref={observerTarget} className={`h-10 flex justify-center items-center ${isMobile ? "snap-start snap-always h-20" : ""}`}>
          {(loading || isLoadingMore) && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading more papers...</span>
            </div>
          )}
          {!loading && !isLoadingMore && !hasMore && papers.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 py-4">
              No more papers to load
            </div>
          )}
        </div>
      )}
    </div>
  )
}
