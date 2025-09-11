"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams } from "next/navigation"

export default function ClubInfoViewPage() {
  const searchParams = useSearchParams()
  const clubId = searchParams.get("id")

  const [universities, setUniversities] = useState<{ id: number, name: string }[]>([])
  const [selectedUniversityId, setSelectedUniversityId] = useState("")
  const [clubName, setClubName] = useState("")
  const [memberCount, setMemberCount] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [imageUrl, setImageUrl] = useState<string>("")

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
        const club = Array.isArray(data) ? data[0] : data
        if (club && club.id) {
          setClubName(club.name || "")
          setMemberCount(club.memberCount ? String(club.memberCount) : "")
          setDescription(club.description || "")
          setSelectedUniversityId(club.universityId ? String(club.universityId) : "")
          // 画像URLを一度だけセット
          const uniName = universities.find(u => u.id.toString() === (club.universityId ? String(club.universityId) : ""))?.name || "circle"
          const query = encodeURIComponent(`${club.name} ${uniName}`)
          setImageUrl(`https://source.unsplash.com/800x600/?${query}`)
        }
      })
      .catch(() => setError("サークル情報の取得に失敗しました"))
  }, [clubId, universities])


  // 画像のonErrorでfallback
  const fallbackImage = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
  const [imgSrc, setImgSrc] = useState<string>("")
  useEffect(() => {
    setImgSrc(imageUrl || fallbackImage)
  }, [imageUrl])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-foreground mb-2">{clubName || "サークル情報"}</h1>
          <p className="text-lg text-muted-foreground">新入生向けサークル紹介ページ</p>
        </div>
        <Card className="p-0 overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row">
            {/* 画像エリア */}
            <div className="md:w-1/2 w-full h-64 md:h-auto bg-muted flex items-center justify-center">
              <img
                src={imgSrc}
                alt={clubName || "サークルイメージ"}
                className="object-cover w-full h-full"
                style={{ minHeight: "16rem" }}
                onError={() => setImgSrc(fallbackImage)}
              />
            </div>
            {/* 情報エリア */}
            <div className="md:w-1/2 w-full p-8 flex flex-col justify-center space-y-6">
              <div>
                <span className="text-sm font-semibold text-muted-foreground">大学名</span>
                <div className="text-lg font-bold text-foreground mb-2">
                  {universities.find(u => u.id.toString() === selectedUniversityId)?.name || "-"}
                </div>
              </div>
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
          </div>
        </Card>
      </div>
    </div>
  )
}
