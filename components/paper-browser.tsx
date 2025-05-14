"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Search, ChevronLeft, X, Loader2, ChevronUp } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import PaperList from "./paper-list"
import FilterBar from "./filter-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePapers } from "@/hooks/use-papers"
import type { Paper } from "@/types/paper"
import { cn } from "@/lib/utils"

export default function PaperBrowser() {
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("browse")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showReturnToTop, setShowReturnToTop] = useState(false)

  const { papers, savedPapers, likedPapers, loading, loadMore, toggleSaved, toggleLiked, hasMore } = usePapers(
    debouncedQuery,
    selectedCategories
  )

  // Debounce search input with shorter delay
  useEffect(() => {
    if (searchQuery === debouncedQuery) return;
    
    setIsSearching(true);
    
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setIsSearchActive(searchQuery.length > 0)
      setIsSearching(false);
    }, 300) // Reduced debounce delay from 500ms to 300ms for faster response

    return () => clearTimeout(timer)
  }, [searchQuery, debouncedQuery])

  // Clear search function
  const handleClearSearch = () => {
    setSearchQuery("")
    setDebouncedQuery("")
    setIsSearchActive(false)
    setIsSearching(false)
    
    // Focus the search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }

  // Handle submit to immediately perform search without waiting for debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
    setIsSearchActive(searchQuery.length > 0);
    setIsSearching(false);
  };

  // For mobile view - show single paper detail
  const renderMobilePaperDetail = () => {
    if (!selectedPaper) return null

    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPaper(null)} className="mb-2">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back to list</span>
          </Button>
        </div>

        <div className="p-4">
          <PaperList
            papers={[selectedPaper]}
            loading={false}
            loadMore={() => {}}
            toggleSaved={toggleSaved}
            toggleLiked={toggleLiked}
            savedIds={savedPapers.map((p) => p.id)}
            likedIds={likedPapers.map((p) => p.id)}
            hasMore={false}
            singleView={true}
          />
        </div>
      </div>
    )
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowReturnToTop(window.scrollY > 300)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      {isMobile && selectedPaper && renderMobilePaperDetail()}

      <header className={cn("mb-8", isMobile && selectedPaper ? "hidden" : "")}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            arXiv<span className="text-blue-600">gram</span>
          </h1>
          <div className="flex items-center gap-2">
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button> */}
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-6 w-full">
          <form onSubmit={handleSearchSubmit} className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            )}
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search papers by title or abstract..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full pr-10"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </form>
          <FilterBar selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />
        </div>

        {/* Show search results */}
        {isSearchActive && (
          <div className="mb-6" ref={searchResultsRef}>
            <h2 className="text-lg font-semibold mb-3">
              {loading ? "Searching..." : (papers.length > 0 ? `Search results for "${searchQuery}"` : `No results found for "${searchQuery}"`)}
            </h2>
            {loading && papers.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Searching papers...</span>
              </div>
            ) : (
              <PaperList
                papers={papers}
                loading={loading}
                loadMore={loadMore}
                toggleSaved={toggleSaved}
                toggleLiked={toggleLiked}
                savedIds={savedPapers.map((p) => p.id)}
                likedIds={likedPapers.map((p) => p.id)}
                hasMore={hasMore}
                onSelectPaper={isMobile ? setSelectedPaper : undefined}
              />
            )}
          </div>
        )}

        {/* Show tabs and regular content only when not searching */}
        {!isSearchActive && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="saved">Read Later ({savedPapers.length})</TabsTrigger>
              <TabsTrigger value="liked">Liked ({likedPapers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-10">
              <PaperList
                papers={papers}
                loading={loading}
                loadMore={loadMore}
                toggleSaved={toggleSaved}
                toggleLiked={toggleLiked}
                savedIds={savedPapers.map((p) => p.id)}
                likedIds={likedPapers.map((p) => p.id)}
                hasMore={hasMore}
                onSelectPaper={isMobile ? setSelectedPaper : undefined}
              />
            </TabsContent>

            <TabsContent value="saved" className="mt-10">
              <PaperList
                papers={savedPapers}
                loading={false}
                loadMore={() => {}}
                toggleSaved={toggleSaved}
                toggleLiked={toggleLiked}
                savedIds={savedPapers.map((p) => p.id)}
                likedIds={likedPapers.map((p) => p.id)}
                hasMore={false}
                emptyMessage="No papers saved for later reading."
                onSelectPaper={isMobile ? setSelectedPaper : undefined}
              />
            </TabsContent>

            <TabsContent value="liked" className="mt-10">
              <PaperList
                papers={likedPapers}
                loading={false}
                loadMore={() => {}}
                toggleSaved={toggleSaved}
                toggleLiked={toggleLiked}
                savedIds={savedPapers.map((p) => p.id)}
                likedIds={likedPapers.map((p) => p.id)}
                hasMore={false}
                emptyMessage="No liked papers yet."
                onSelectPaper={isMobile ? setSelectedPaper : undefined}
              />
            </TabsContent>
          </Tabs>
        )}
      </header>
      {showReturnToTop && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 left-4 rounded-full bg-white dark:bg-gray-900 shadow-lg z-50"
        >
          <ChevronUp className="h-5 w-5" />
          <span className="sr-only">Return to top</span>
        </Button>
      )}
    </div>
  )
}
