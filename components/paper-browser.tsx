"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Search, Menu, X, ChevronLeft } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import PaperList from "./paper-list"
import FilterBar from "./filter-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePapers } from "@/hooks/use-papers"
import type { Paper } from "@/types/paper"

export default function PaperBrowser() {
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("browse")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  const { papers, savedPapers, likedPapers, loading, loadMore, toggleSaved, toggleLiked, hasMore } = usePapers(
    debouncedQuery,
    selectedCategories,
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const renderFilters = () => (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search papers by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <FilterBar selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />
    </div>
  )

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

  // Get the current papers based on active tab
  const getCurrentPapers = () => {
    switch (activeTab) {
      case "saved":
        return savedPapers
      case "liked":
        return likedPapers
      default:
        return papers
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {isMobile && selectedPaper && renderMobilePaperDetail()}

      <header className={cn("mb-8", isMobile && selectedPaper ? "hidden" : "")}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            arXiv<span className="text-blue-600">CS</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {isMobile && (
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85%] sm:w-[350px]">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold">Filters</h2>
                      <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                      </Button>
                    </div>
                    {renderFilters()}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {!isMobile && <div className="flex flex-col md:flex-row gap-4 mb-6">{renderFilters()}</div>}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="saved">Read Later ({savedPapers.length})</TabsTrigger>
            <TabsTrigger value="liked">Liked ({likedPapers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
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

          <TabsContent value="saved" className="mt-6">
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

          <TabsContent value="liked" className="mt-6">
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
      </header>
    </div>
  )
}

import { cn } from "@/lib/utils"
