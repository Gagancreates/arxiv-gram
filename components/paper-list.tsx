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

  // Handle loading more papers safely
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && !loading && hasMore) {
      setIsLoadingMore(true);
      loadMore();
    }
  }, [isLoadingMore, loading, hasMore, loadMore]);

  // Reset loading state when papers change
  useEffect(() => {
    if (papers.length > previousPapersLength.current) {
      setIsLoadingMore(false);
      previousPapersLength.current = papers.length;
    }
  }, [papers.length]);

  // Intersection observer for infinite loading
  useEffect(() => {
    if (!hasMore || singleView || loading) return;

    let observer: IntersectionObserver;
    let timeout: NodeJS.Timeout;

    const setupObserver = () => {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore) {
            handleLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );

      if (observerTarget.current) {
        observer.observe(observerTarget.current);
      }
    };

    // Small delay to prevent immediate re-triggering
    timeout = setTimeout(setupObserver, 100);

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
        </div>
      )}
    </div>
  )
}
