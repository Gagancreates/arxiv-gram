"use client"

import { useState, useEffect, useCallback } from "react"
import type { Paper } from "@/types/paper"
import { fetchPapers } from "@/lib/arxiv"

export function usePapers(searchQuery: string, categories: string[]) {
  const [papers, setPapers] = useState<Paper[]>([])
  const [savedPapers, setSavedPapers] = useState<Paper[]>([])
  const [likedPapers, setLikedPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)

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
  }, [searchQuery, categories])

  // Initial load and subsequent loads
  useEffect(() => {
    loadPapers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startIndex, searchQuery, categories])

  const loadPapers = async () => {
    if (loading) return

    setLoading(true)
    try {
      const newPapers = await fetchPapers({
        searchQuery,
        categories,
        start: startIndex,
        maxResults: 10,
      })

      if (newPapers.length === 0) {
        setHasMore(false)
      } else {
        setPapers((prev) => {
          // Filter out duplicates
          const existingIds = new Set(prev.map((p) => p.id))
          const uniqueNewPapers = newPapers.filter((p) => !existingIds.has(p.id))
          return [...prev, ...uniqueNewPapers]
        })
      }
    } catch (error) {
      console.error("Error fetching papers:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setStartIndex((prev) => prev + 10)
    }
  }, [loading, hasMore])

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
