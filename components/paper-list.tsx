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
          if (!entries[0].isIntersecting) return;
          
          // Check if we're actually at the bottom of the container
          const container = containerRef.current;
          if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 200;
            
            // Only load more if we're near the bottom
            if (scrolledToBottom && hasMore && !loading && !isLoadingMore) {
              handleLoadMore();
            }
          } else {
            // Fallback if container ref isn't available
            if (hasMore && !loading && !isLoadingMore) {
              handleLoadMore();
            }
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );

      if (observerTarget.current) {
        observer.observe(observerTarget.current);
      }
    };

    // Add a delay to prevent immediate loading
    const timeout = setTimeout(setupObserver, 300);
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
      clearTimeout(timeout);
    };
  }, [handleLoadMore, hasMore, loading, isLoadingMore, singleView]);

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
          key={paper.id}
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
