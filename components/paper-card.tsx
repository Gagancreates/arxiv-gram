"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, Bookmark, ExternalLink, Calendar, Users, Share2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Paper } from "@/types/paper"
import { cn } from "@/lib/utils"
import { getCategoryName } from "@/lib/categories"
import React from "react"

interface PaperCardProps {
  paper: Paper
  isSaved: boolean
  isLiked: boolean
  onToggleSaved: (e?: React.MouseEvent) => void
  onToggleLiked: (e?: React.MouseEvent) => void
  index?: number
}

export default function PaperCard({ paper, isSaved, isLiked, onToggleSaved, onToggleLiked, index = 0 }: PaperCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isActive, setIsActive] = useState(false)

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

  // Set up intersection observer for card visibility
  useEffect(() => {
    if (!isMobile) return;
    
    // For mobile TikTok-style view, use a more sensitive threshold
    const observer = new IntersectionObserver(
      (entries) => {
        // Card is considered "active" when it's more than 80% visible
        if (entries[0].isIntersecting && entries[0].intersectionRatio > 0.8) {
          setIsActive(true);
        } else {
          setIsActive(false);
        }
      },
      { threshold: [0.8] }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    }
  }, [isMobile]);

  const formatAuthors = (authors: string[]) => {
    if (authors.length <= 3) {
      return authors.join(", ")
    }
    return `${authors.slice(0, 3).join(", ")} et al.`
  }

  const truncateAbstract = (abstract: string) => {
    const words = abstract.split(" ")
    if (words.length > 40 && !expanded) {
      return words.slice(0, 40).join(" ") + "..."
    }
    return abstract
  }

  // Format date without date-fns
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
    return date.toLocaleDateString("en-US", options)
  }

  // Group categories by primary field
  const groupedCategories = paper.categories.reduce(
    (acc, category) => {
      const primaryField = category.split(".")[0]
      if (!acc[primaryField]) {
        acc[primaryField] = []
      }
      acc[primaryField].push(category)
      return acc
    },
    {} as Record<string, string[]>,
  )

  // Generate a subtle accent color based on the primary category
  const getPrimaryCategoryColor = () => {
    if (paper.categories.length === 0) return {
      bg: 'from-gray-50/90 to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/10',
      border: 'border-gray-200/60 dark:border-gray-700/40',
      text: 'text-gray-700 dark:text-gray-300'
    };
    
    // Map primary categories to professional color schemes
    const colorMap: Record<string, {bg: string, border: string, text: string}> = {
      'cs': {
        bg: 'from-indigo-50/90 to-indigo-50/30 dark:from-indigo-950/30 dark:to-indigo-900/10',
        border: 'border-indigo-200/60 dark:border-indigo-800/40',
        text: 'text-indigo-700 dark:text-indigo-300'
      },
      'math': {
        bg: 'from-emerald-50/90 to-emerald-50/30 dark:from-emerald-950/30 dark:to-emerald-900/10',
        border: 'border-emerald-200/60 dark:border-emerald-800/40',
        text: 'text-emerald-700 dark:text-emerald-300'
      },
      'physics': {
        bg: 'from-sky-50/90 to-sky-50/30 dark:from-sky-950/30 dark:to-sky-900/10',
        border: 'border-sky-200/60 dark:border-sky-800/40',
        text: 'text-sky-700 dark:text-sky-300'
      },
      'q-bio': {
        bg: 'from-amber-50/90 to-amber-50/30 dark:from-amber-950/30 dark:to-amber-900/10',
        border: 'border-amber-200/60 dark:border-amber-800/40',
        text: 'text-amber-700 dark:text-amber-300'
      },
      'stat': {
        bg: 'from-violet-50/90 to-violet-50/30 dark:from-violet-950/30 dark:to-violet-900/10',
        border: 'border-violet-200/60 dark:border-violet-800/40',
        text: 'text-violet-700 dark:text-violet-300'
      },
      'q-fin': {
        bg: 'from-green-50/90 to-green-50/30 dark:from-green-950/30 dark:to-green-900/10',
        border: 'border-green-200/60 dark:border-green-800/40',
        text: 'text-green-700 dark:text-green-300'
      },
      'eess': {
        bg: 'from-fuchsia-50/90 to-fuchsia-50/30 dark:from-fuchsia-950/30 dark:to-fuchsia-900/10',
        border: 'border-fuchsia-200/60 dark:border-fuchsia-800/40',
        text: 'text-fuchsia-700 dark:text-fuchsia-300'
      },
      'astro-ph': {
        bg: 'from-cyan-50/90 to-cyan-50/30 dark:from-cyan-950/30 dark:to-cyan-900/10',
        border: 'border-cyan-200/60 dark:border-cyan-800/40',
        text: 'text-cyan-700 dark:text-cyan-300'
      },
      'cond-mat': {
        bg: 'from-blue-50/90 to-blue-50/30 dark:from-blue-950/30 dark:to-blue-900/10',
        border: 'border-blue-200/60 dark:border-blue-800/40',
        text: 'text-blue-700 dark:text-blue-300'
      }
    };

    // Get primary category
    const primaryField = paper.categories[0].split('.')[0];
    
    // Return the color or default if not found
    return colorMap[primaryField] || {
      bg: 'from-gray-50/90 to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/10',
      border: 'border-gray-200/60 dark:border-gray-700/40',
      text: 'text-gray-700 dark:text-gray-300'
    };
  };
  
  const categoryColor = getPrimaryCategoryColor();

  // Handle read more click
  const handleReadMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "w-full", 
        isMobile ? "py-0 px-4" : "py-4 sm:py-2"
      )}
    >
      <Card className={cn(
        "overflow-hidden border rounded-xl w-full relative",
        isMobile ? "max-w-[500px] mx-auto h-auto max-h-[90vh] overflow-y-auto" : "",
        categoryColor.border
      )}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-xl opacity-80",
          categoryColor.bg
        )} />
        
        <CardContent className={cn(
          "relative z-10", 
          isMobile ? "p-4 sm:p-5" : "p-6 sm:p-8"
        )}>
          <div className="space-y-5">
            <div>
              <h2 className={cn(
                "text-xl sm:text-2xl font-semibold leading-tight tracking-tight",
                categoryColor.text
              )}>
                {paper.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                  <Users className="h-3.5 w-3.5" />
                  <p className="truncate max-w-[200px] sm:max-w-none">{formatAuthors(paper.authors)}</p>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                  <Calendar className="h-3.5 w-3.5" />
                  <p>{formatDate(paper.published)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(groupedCategories).map(([primaryField, categories]) => (
                <div key={primaryField} className="flex flex-col gap-1.5 mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((category) => {
                      // Add unique styling for category badges based on their field
                      const fieldColors: Record<string, string> = {
                        'cs': 'bg-indigo-50/80 text-indigo-700 border-indigo-200/70 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50',
                        'math': 'bg-emerald-50/80 text-emerald-700 border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50',
                        'physics': 'bg-sky-50/80 text-sky-700 border-sky-200/70 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/50',
                        'q-bio': 'bg-amber-50/80 text-amber-700 border-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50',
                        'stat': 'bg-violet-50/80 text-violet-700 border-violet-200/70 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/50',
                        'q-fin': 'bg-green-50/80 text-green-700 border-green-200/70 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
                        'eess': 'bg-fuchsia-50/80 text-fuchsia-700 border-fuchsia-200/70 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-700/50',
                        'astro-ph': 'bg-cyan-50/80 text-cyan-700 border-cyan-200/70 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/50',
                        'cond-mat': 'bg-blue-50/80 text-blue-700 border-blue-200/70 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50'
                      };
                      
                      const categoryField = category.split('.')[0];
                      const badgeStyle = fieldColors[categoryField] || 'bg-gray-50/80 text-gray-700 border-gray-200/70 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/50';
                      
                      return (
                        <TooltipProvider key={category}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs py-0.5 px-2.5 hover:bg-opacity-100",
                                  badgeStyle
                                )}
                              >
                                {getCategoryName(category)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{category}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 p-5 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-gray-100/80 dark:border-gray-700/80 shadow-sm">
              <p className="leading-relaxed">{truncateAbstract(paper.abstract)}</p>
              
              {paper.abstract.split(" ").length > 40 && (
                <button
                  onClick={handleReadMoreClick}
                  className={cn(
                    "flex items-center gap-1.5 text-sm mt-3 font-medium",
                    categoryColor.text
                  )}
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>Show less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Read more</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className={cn(
          "relative z-10 bg-white/80 dark:bg-gray-800/80 flex flex-wrap justify-between gap-2 border-t border-gray-100/80 dark:border-gray-700/80",
          isMobile ? "px-4 py-3" : "px-6 sm:px-8 py-4"
        )}>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleLiked}
              className={cn(
                "gap-1.5 text-sm rounded-full transition-all",
                isLiked
                  ? "text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked ? "fill-current" : "fill-none")} />
              <span className="hidden sm:inline">{isLiked ? "Liked" : "Like"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSaved}
              className={cn(
                "gap-1.5 text-sm rounded-full transition-all",
                isSaved
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              <Bookmark className={cn("h-4 w-4", isSaved ? "fill-current" : "fill-none")} />
              <span className="hidden sm:inline">{isSaved ? "Saved" : "Read Later"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: paper.title,
                      text: `Check out this paper: ${paper.title}`,
                      url: paper.pdfUrl,
                    })
                    .catch(console.error)
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 text-sm rounded-full",
              categoryColor.border,
              categoryColor.text,
              "bg-white/50 dark:bg-gray-900/50 hover:bg-opacity-100 dark:hover:bg-opacity-80"
            )}
            asChild
          >
            <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View Paper</span>
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
