"use client"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, X, Filter } from "lucide-react"
import { getCategoryMap } from "@/lib/categories"

interface FilterBarProps {
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
}

const CATEGORIES = Object.entries(getCategoryMap()).map(([id, name]) => ({ id, name }))

export default function FilterBar({ selectedCategories, setSelectedCategories }: FilterBarProps) {
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  const clearFilters = () => {
    setSelectedCategories([])
  }

  const getCategoryName = (categoryId: string) => {
    return CATEGORIES.find((cat) => cat.id === categoryId)?.name || categoryId
  }

  // Group categories by primary field for better organization
  const groupedCategories = CATEGORIES.reduce(
    (acc, category) => {
      const primaryField = category.id.split(".")[0]
      if (!acc[primaryField]) {
        acc[primaryField] = []
      }
      acc[primaryField].push(category)
      return acc
    },
    {} as Record<string, typeof CATEGORIES>,
  )

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-1.5 w-full sm:w-auto">
            <Filter className="h-4 w-4" />
            Filter by Category
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>CS Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-y-auto">
            {Object.entries(groupedCategories).map(([primaryField, categories]) => (
              <div key={primaryField} className="mb-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {primaryField}
                </div>
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="ml-1 text-xs text-gray-500">({category.id})</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-wrap gap-2 w-full">
        {selectedCategories.map((categoryId) => (
          <Badge key={categoryId} variant="secondary" className="gap-1 px-2 py-1">
            {getCategoryName(categoryId)}
            <button onClick={() => toggleCategory(categoryId)} className="ml-1">
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {getCategoryName(categoryId)} filter</span>
            </button>
          </Badge>
        ))}

        {selectedCategories.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
            Clear all
          </Button>
        )}
      </div>
    </div>
  )
}
