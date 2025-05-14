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
  const lastVisibleCardIndex = useRef<number>(-1)
  const loadingCooldown = useRef<boolean>(false)
  
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

  // Optimize mobile scrolling and track visible card
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;
    
    // Preload nearby papers and track visible card
    const trackVisibleCard = () => {
      const cards = containerRef.current?.querySelectorAll('.paper-card-container');
      if (!cards) return;
      
      const visibleCardIndex = Array.from(cards).findIndex(card => {
        const rect = card.getBoundingClientRect();
        // Consider a card visible if its center is in the viewport
        const cardCenter = rect.top + rect.height / 2;
        return cardCenter >= 0 && cardCenter <= window.innerHeight;
      });
      
      if (visibleCardIndex !== -1) {
        // If we're viewing a new card, we can remove the cooldown
        if (lastVisibleCardIndex.current !== visibleCardIndex) {
          loadingCooldown.current = false;
        }
        
        lastVisibleCardIndex.current = visibleCardIndex;
        
        // Preload next and previous card
        const preloadIndexes = [visibleCardIndex - 1, visibleCardIndex + 1];
        preloadIndexes.forEach(index => {
          if (index >= 0 && index < cards.length) {
            const card = cards[index] as HTMLElement;
            card.style.visibility = 'visible';
          }
        });
        
        // Check if user has scrolled away from the loading area
        if (visibleCardIndex < cards.length - 2) {
          // User has moved away from the loading area, reset cooldown
          loadingCooldown.current = false;
        }
      }
    };
    
    const container = containerRef.current;
    container.addEventListener('scroll', trackVisibleCard, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', trackVisibleCard);
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
    // 3. Less than 3 seconds since last load
    // 4. Same batch is being loaded (prevents duplicate loads)
    // 5. Currently in cooldown period after loading
    if (
      isLoadingMore || 
      loading || 
      !hasMore || 
      (now - lastLoadTime.current < 3000) ||
      (currentBatchId === loadingBatchId.current && currentBatchId !== "") ||
      loadingCooldown.current
    ) {
      return;
    }
    
    // Update tracking variables
    setIsLoadingMore(true);
    lastLoadTime.current = now;
    loadingBatchId.current = currentBatchId;
    loadingCooldown.current = true; // Set cooldown when loading starts
    
    // Load more papers
    loadMore();
  }, [isLoadingMore, loading, hasMore, loadMore, generateBatchId]);

  // Reset loading state when papers change
  useEffect(() => {
    if (papers.length > previousPapersLength.current) {
      // Get how many new papers were added
      // const newPapersCount = papers.length - previousPapersLength.current;
      
      setIsLoadingMore(false);
      previousPapersLength.current = papers.length;
      
      // After a load, clear cooldown after a short delay
      setTimeout(() => {
        loadingCooldown.current = false;
      }, 5000);
    } else if (papers.length === previousPapersLength.current && isLoadingMore) {
      // If papers length didn't change after loading attempt, we've reached the end
      setIsLoadingMore(false);
      loadingCooldown.current = false; // Reset cooldown
    }
  }, [papers.length, isLoadingMore]);

  // Intersection observer for infinite loading
  useEffect(() => {
    if (!hasMore || singleView) return;

    let observer: IntersectionObserver;
    
    const setupObserver = () => {
      observer = new IntersectionObserver(
        (entries) => {
          // Only trigger load more when:
          // 1. Observer target is in view
          // 2. Not already loading
          // 3. Not in cooldown period
          if (entries[0].isIntersecting && !loading && !isLoadingMore && !loadingCooldown.current) {
            // Check if user is actually at the loading element (not just scrolling quickly past it)
            if (entries[0].intersectionRatio > 0.8) {
              handleLoadMore();
            }
          }
        },
        { 
          threshold: [0.5, 0.8, 1.0], // Track multiple thresholds
          rootMargin: '50px 0px' // Less aggressive margin
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

  // Support more papers loading when user is at the bottom and stays there
  useEffect(() => {
    if (singleView || !hasMore || !isMobile) return;
    
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container || loading || isLoadingMore || loadingCooldown.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If user is at the very end and stays there for a moment
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        // User is at the very bottom, set a short timer to verify they're still there
        setTimeout(() => {
          if (containerRef.current) {
            const { scrollTop: currentScrollTop, scrollHeight: currentScrollHeight, clientHeight: currentClientHeight } = containerRef.current;
            if (currentScrollTop + currentClientHeight >= currentScrollHeight - 20) {
              // User is still at the bottom after delay, load more
              handleLoadMore();
            }
          }
        }, 500);
      }
    };
    
    const container = containerRef.current;
    if (container) {
      // Using properly debounced scroll event
      let scrollTimer: NodeJS.Timeout;
      const debouncedScroll = () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(handleScroll, 300);
      };
      
      container.addEventListener('scroll', debouncedScroll, { passive: true });
      
      return () => {
        clearTimeout(scrollTimer);
        container.removeEventListener('scroll', debouncedScroll);
      };
    }
  }, [hasMore, loading, isLoadingMore, singleView, handleLoadMore, isMobile]);
  
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
          data-index={index}
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
        <div 
          ref={observerTarget} 
          className="h-20 flex justify-center items-center"
        >
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
