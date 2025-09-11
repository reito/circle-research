"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, GraduationCap } from "lucide-react"

interface University {
  id: number
  name: string
  reading: string | null
  domain: string | null
  activeClubCount: number
}

export default function UniversitySelectionPage() {
  const router = useRouter()
  const params = useParams()
  const selectedKana = decodeURIComponent(params.kana as string)
  const [universities, setUniversities] = useState<University[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // APIから大学データを取得
    const fetchUniversities = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/universities?kana=${encodeURIComponent(selectedKana)}`)
        const data = await response.json()
        
        if (response.ok) {
          setUniversities(data.universities || [])
        } else {
          console.error("Failed to fetch universities")
          setUniversities([])
        }
      } catch (error) {
        console.error("Error fetching universities:", error)
        setUniversities([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUniversities()
  }, [selectedKana])

  const handleBackClick = () => {
    router.push("/search")
  }

  const handleUniversityClick = (university: University) => {
    router.push(`/chat?university=${encodeURIComponent(university.name)}&universityId=${university.id}&kana=${encodeURIComponent(selectedKana)}`)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBackClick} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">「{selectedKana}」で始まる大学</h1>
            <p className="text-muted-foreground">
              {isLoading ? "読み込み中..." : `${universities.length}校の大学が見つかりました`}
            </p>
          </div>
        </div>

        {/* University List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-muted-foreground">大学データを読み込んでいます...</p>
            </div>
          ) : universities.length > 0 ? (
            universities.map((university) => (
              <Card key={university.id} className="hover:shadow-md transition-shadow">
                <Button
                  onClick={() => handleUniversityClick(university)}
                  variant="ghost"
                  className="w-full p-4 h-auto justify-start text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h3 className="font-semibold text-lg">{university.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {university.activeClubCount > 0 
                          ? `${university.activeClubCount}個のアクティブなサークル・部活動`
                          : "サークル・部活動情報を見る"}
                      </p>
                    </div>
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Button>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">該当する大学が見つかりませんでした。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}