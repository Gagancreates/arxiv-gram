"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategoryMap } from "@/lib/categories"
import { X } from "lucide-react"

// Popular CS subcategories for quick selection
const POPULAR_SUBCATEGORIES = [
  { id: 'cs.AI', name: 'Artificial Intelligence' },
  { id: 'cs.LG', name: 'Machine Learning' },
  { id: 'cs.CV', name: 'Computer Vision' },
  { id: 'cs.CL', name: 'Computation & Language (NLP)' },
  { id: 'cs.RO', name: 'Robotics' },
  { id: 'cs.CR', name: 'Cryptography & Security' },
  { id: 'cs.HC', name: 'Human-Computer Interaction' },
  { id: 'cs.SE', name: 'Software Engineering' },
  { id: 'cs.DS', name: 'Data Structures & Algorithms' },
  { id: 'cs.NE', name: 'Neural Computing' }
]

// Map of user-friendly tags to arXiv CS subcategories (simplified version)
export const TAG_TO_CATEGORY_MAP: Record<string, string> = {
  'ai': 'cs.AI',
  'ml': 'cs.LG',
  'cv': 'cs.CV',
  'nlp': 'cs.CL',
  'robotics': 'cs.RO',
  'security': 'cs.CR',
  'hci': 'cs.HC',
}

interface CategoryPreferencesProps {
  selectedPreferences: string[];
  onPreferencesChange: (preferences: string[]) => void;
}

export default function CategoryPreferences({ 
  selectedPreferences, 
  onPreferencesChange 
}: CategoryPreferencesProps) {
  const togglePreference = (categoryId: string) => {
    if (selectedPreferences.includes(categoryId)) {
      onPreferencesChange(selectedPreferences.filter(id => id !== categoryId));
    } else {
      onPreferencesChange([...selectedPreferences, categoryId]);
    }
  }

  const clearPreferences = () => {
    onPreferencesChange([]);
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Choose your research interests</CardTitle>
        <CardDescription>
          Select the CS research areas you're interested in to see the most relevant recent papers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {POPULAR_SUBCATEGORIES.map(category => (
            <Badge 
              key={category.id}
              variant={selectedPreferences.includes(category.id) ? "default" : "outline"}
              className={`cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 ${
                selectedPreferences.includes(category.id) 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : ""
              }`}
              onClick={() => togglePreference(category.id)}
            >
              {category.name}
              {selectedPreferences.includes(category.id) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
        
        {selectedPreferences.length > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedPreferences.length} area{selectedPreferences.length > 1 ? 's' : ''} selected
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearPreferences}
              className="text-xs h-7"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 