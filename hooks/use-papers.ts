"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Paper } from "@/types/paper"
import { fetchPapers } from "@/lib/arxiv"

export function usePapers(searchQuery: string, categories: string[]) {
  const [papers, setPapers] = useState<Paper[]>([])
  const [savedPapers, setSavedPapers] = useState<Paper[]>([])
  const [likedPapers, setLikedPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const BATCH_SIZE = 50 // Much larger batch size
  const consecutiveEmptyResults = useRef(0)
  const loadingRef = useRef(false) // To prevent race conditions
  const totalFetched = useRef(0)
  const fetchedIndexesSet = useRef(new Set<number>())

  // Load saved and liked papers from localStorage
  useEffect(() => {
    const savedFromStorage = localStorage.getItem("savedPapers")
    const likedFromStorage = localStorage.getItem("likedPapers")

    if (savedFromStorage) {
      setSavedPapers(JSON.parse(savedFromStorage))
    }

    if (likedFromStorage) {
      setLikedPapers(JSON.parse(likedFromStorage))
    }
  }, [])

  // Save to localStorage whenever saved or liked papers change
  useEffect(() => {
    localStorage.setItem("savedPapers", JSON.stringify(savedPapers))
  }, [savedPapers])

  useEffect(() => {
    localStorage.setItem("likedPapers", JSON.stringify(likedPapers))
  }, [likedPapers])

  // Reset papers when search query or categories change
  useEffect(() => {
    setPapers([])
    setStartIndex(0)
    setHasMore(true)
    consecutiveEmptyResults.current = 0
    totalFetched.current = 0
    fetchedIndexesSet.current = new Set()
  }, [searchQuery, categories])

  // Initial load 
  useEffect(() => {
    if (startIndex === 0) {
      loadPapers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categories])
  
  // Load when startIndex changes
  useEffect(() => {
    // Skip the initial load as it's handled above
    if (startIndex > 0) {
      loadPapers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startIndex])

  const loadPapers = async () => {
    // Use loadingRef to prevent concurrent fetches
    if (loadingRef.current || !hasMore) return
    
    // Check if we've already fetched this index
    if (fetchedIndexesSet.current.has(startIndex)) {
      console.log(`Already fetched papers starting at index ${startIndex}, skipping`)
      setStartIndex(prev => prev + BATCH_SIZE)
      return
    }
    
    loadingRef.current = true
    setLoading(true)
    
    try {
      console.log(`Fetching papers starting at index ${startIndex} with batch size ${BATCH_SIZE}`)
      fetchedIndexesSet.current.add(startIndex)
      
      const newPapers = await fetchPapers({
        searchQuery,
        categories,
        start: startIndex,
        maxResults: BATCH_SIZE,
      })

      if (newPapers.length === 0) {
        consecutiveEmptyResults.current += 1
        console.log(`No papers received, consecutive empty results: ${consecutiveEmptyResults.current}`)
        
        // If we get 3 empty results in a row, consider it the end
        if (consecutiveEmptyResults.current >= 3) {
          console.log("Multiple empty results, setting hasMore to false")
          setHasMore(false)
        } else {
          // Skip ahead to try and find more papers
          console.log("Skipping ahead to find more papers")
          setStartIndex(prev => prev + BATCH_SIZE)
        }
      } else {
        console.log(`Loaded ${newPapers.length} new papers`)
        totalFetched.current += newPapers.length
        consecutiveEmptyResults.current = 0 // Reset counter on success
        
        setPapers((prev) => {
          // Filter out duplicates
          const existingIds = new Set(prev.map((p) => p.id))
          const uniqueNewPapers = newPapers.filter((p) => !existingIds.has(p.id))
          
          console.log(`Adding ${uniqueNewPapers.length} unique papers out of ${newPapers.length} fetched`)
          
          // If we got no unique papers even though we fetched some, try the next batch
          if (uniqueNewPapers.length === 0 && newPapers.length > 0) {
            console.log("All papers were duplicates, advancing to next batch")
            // Use setTimeout to avoid state updates during render
            setTimeout(() => setStartIndex(prev => prev + BATCH_SIZE), 10)
          }
          
          return [...prev, ...uniqueNewPapers]
        })
      }
    } catch (error) {
      console.error("Error fetching papers:", error)
      
      // Don't give up, try again with the next batch
      setTimeout(() => {
        setStartIndex(prev => prev + BATCH_SIZE)
      }, 1000)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  // Aggressive loader that will try to ensure we always have content
  useEffect(() => {
    // If we have fewer than 100 papers and we're not loading, load more
    if (papers.length < 100 && !loading && hasMore && startIndex > 0) {
      console.log("Preemptively loading more papers to ensure continuous content")
      setTimeout(() => loadMore(), 500)
    }
  }, [papers.length, loading, hasMore, startIndex])

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      console.log("Loading more papers...")
      setStartIndex((prev) => prev + BATCH_SIZE)
    } else if (!hasMore) {
      // If we've reached the end but still need more, reset hasMore and try again from a new index
      if (papers.length < 50) {
        console.log("Resetting hasMore to true and trying from a new index")
        setHasMore(true)
        // Jump ahead 500 papers to try to find new content
        setStartIndex(totalFetched.current + 500)
      } else {
        console.log("No more papers to load (hasMore is false)")
      }
    } else if (loadingRef.current) {
      console.log("Already loading papers")
    }
  }, [hasMore, papers.length])

  const toggleSaved = useCallback((paper: Paper) => {
    setSavedPapers((prev) => {
      const exists = prev.some((p) => p.id === paper.id)
      if (exists) {
        return prev.filter((p) => p.id !== paper.id)
      } else {
        return [...prev, paper]
      }
    })
  }, [])

  const toggleLiked = useCallback((paper: Paper) => {
    setLikedPapers((prev) => {
      const exists = prev.some((p) => p.id === paper.id)
      if (exists) {
        return prev.filter((p) => p.id !== paper.id)
      } else {
        return [...prev, paper]
      }
    })
  }, [])

  return {
    papers,
    savedPapers,
    likedPapers,
    loading,
    loadMore,
    toggleSaved,
    toggleLiked,
    hasMore,
  }
}

