"use client"

import { useEffect, useState, Suspense } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { ImageOff } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams } from "next/navigation"

function ClubInfoContent() {
  const searchParams = useSearchParams()
  const clubId = searchParams.get("id")

  const [universities, setUniversities] = useState<{ id: number, name: string }[]>([])
  const [selectedUniversityId, setSelectedUniversityId] = useState("")
  const [clubName, setClubName] = useState("")
  const [memberCount, setMemberCount] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [club, setClub] = useState<any>(null)

  // 大学リスト取得
  useEffect(() => {
    fetch("/api/universities")
      .then(res => res.json())
      .then(data => {
        if (data.universities) {
          setUniversities(data.universities)
        } else if (Array.isArray(data)) {
          setUniversities(data)
        } else {
          setUniversities([])
        }
      })
      .catch(() => setUniversities([]))
  }, [])

  // clubIdでサークル情報取得
  useEffect(() => {
    if (!clubId) return
    fetch(`/api/clubs?id=${clubId}`)
      .then(res => res.json())
      .then(data => {
        const clubData = Array.isArray(data) ? data[0] : data
        if (clubData && clubData.id) {
          setClub(clubData)
          setClubName(clubData.name || "")
          setMemberCount(clubData.memberCount ? String(clubData.memberCount) : "")
          setDescription(clubData.description || "")
          setSelectedUniversityId(clubData.universityId ? String(clubData.universityId) : "")
          setImages(Array.isArray(clubData.images) ? clubData.images : [])
          // 画像がなければUnsplash
          if (!clubData.images || clubData.images.length === 0) {
            const uniName = universities.find(u => u.id.toString() === (clubData.universityId ? String(clubData.universityId) : ""))?.name || "circle"
            const query = encodeURIComponent(`${clubData.name} ${uniName}`)
            setImageUrl(`https://source.unsplash.com/800x600/?${query}`)
          }
        }
      })
      .catch(() => setError("サークル情報の取得に失敗しました"))
  }, [clubId, universities])

  // OpenAIで画像を生成する関数
  const generateClubImage = async () => {
    if (!club || !club.id || isGeneratingImage) return

    setIsGeneratingImage(true)
    setError("")

    try {
      const response = await fetch('/api/generate-club-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubId: club.id,
          clubName: club.name,
          description: club.description,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '画像生成に失敗しました')
      }

      if (result.success && result.imageUrl) {
        // 生成された画像をimagesに追加
        setImages(prev => [...prev, result.imageUrl])
        setError("")
      } else if (result.images) {
        // 既に画像が存在する場合
        setImages(result.images)
      }

    } catch (err) {
      console.error('画像生成エラー:', err)
      setError(`画像生成に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // 画像がない場合の自動生成（ページ読み込み時に一度だけ実行）
  useEffect(() => {
    if (club && club.id && (!images || images.length === 0) && !isGeneratingImage) {
      // 少し遅延を入れてから自動生成を開始
      const timer = setTimeout(() => {
        generateClubImage()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [club, images])


  // 画像のonErrorでfallback
  const fallbackImage = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-foreground mb-2">{clubName || "サークル情報"}</h1>
          <p className="text-lg text-muted-foreground">新入生向けサークル紹介ページ</p>
        </div>
        <Card className="p-0 overflow-hidden shadow-xl">
          <div className="flex flex-col">
            {/* 情報エリア（大学名は非表示） */}
            <div className="w-full p-8 flex flex-col justify-center space-y-6">
              <div>
                <span className="text-sm font-semibold text-muted-foreground">人数</span>
                <div className="text-lg text-foreground mb-2">{memberCount ? `${memberCount}人` : "-"}</div>
              </div>
              <div>
                <span className="text-sm font-semibold text-muted-foreground">サークル紹介</span>
                <div className="text-base text-foreground whitespace-pre-line bg-muted/40 rounded-md p-3">
                  {description || "紹介文はまだありません。"}
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            {/* 画像エリア（カルーセル）を下に配置 */}
            <div className="w-full bg-muted py-4 relative">
              {images.length > 0 ? (
                <Carousel className="w-full max-w-xl mx-auto" opts={{ loop: true }}>
                  <CarouselContent>
                    {images.map((img, idx) => (
                      <CarouselItem key={idx} className="block w-full">
                        <div className="w-full aspect-[4/3] flex items-center justify-center">
                          <img
                            src={img}
                            alt={`club-img-${idx}`}
                            className="object-contain w-full h-full rounded"
                            style={{ maxHeight: "400px" }}
                            onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage }}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : isGeneratingImage ? (
                <div className="w-full aspect-[4/3] flex flex-col items-center justify-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <span className="text-lg mb-2">AI画像を生成中...</span>
                  <span className="text-sm text-center">サークル情報から画像を作成しています</span>
                </div>
              ) : (
                <div className="w-full aspect-[4/3] flex flex-col items-center justify-center text-muted-foreground">
                  <ImageOff className="w-16 h-16 mb-2" />
                  <span className="text-lg mb-2">No Image</span>
                  <button
                    onClick={generateClubImage}
                    className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    disabled={!club || isGeneratingImage}
                  >
                    AI画像を生成する
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function ClubInfoViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    }>
      <ClubInfoContent />
    </Suspense>
  )
}
