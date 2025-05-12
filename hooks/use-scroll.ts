"use client"

import { useState, useEffect } from "react"

interface ScrollInfo {
  scrollY: number
  scrollDirection: "up" | "down" | null
  isScrolled: boolean
}

export function useScroll(threshold = 10): ScrollInfo {
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>({
    scrollY: 0,
    scrollDirection: null,
    isScrolled: false
  })

  useEffect(() => {
    let lastScrollY = window.scrollY

    const updateScrollInfo = () => {
      const scrollY = window.scrollY
      const direction = scrollY > lastScrollY ? "down" : "up"
      const isScrolled = scrollY > threshold
      
      setScrollInfo({
        scrollY,
        scrollDirection: direction,
        isScrolled
      })
      
      lastScrollY = scrollY > 0 ? scrollY : 0
    }

    window.addEventListener("scroll", updateScrollInfo, { passive: true })
    
    return () => {
      window.removeEventListener("scroll", updateScrollInfo)
    }
  }, [threshold])

  return scrollInfo
} 