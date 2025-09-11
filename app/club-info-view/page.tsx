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
        }
      })
      .catch(() => setError("サークル情報の取得に失敗しました"))
  }, [clubId])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">サークル情報</h1>
          <p className="text-muted-foreground">新入生向けサークル情報の閲覧ページです</p>
        </div>
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">大学名</Label>
              <Select value={selectedUniversityId} disabled>
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="大学を選択してください" className="text-foreground" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()} className="text-foreground">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubName">サークル名</Label>
              <Input
                id="clubName"
                type="text"
                value={clubName}
                readOnly
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberCount">人数</Label>
              <Input
                id="memberCount"
                type="number"
                value={memberCount}
                readOnly
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">サークル紹介文</Label>
              <Textarea
                id="description"
                value={description}
                rows={6}
                className="resize-none text-foreground"
                readOnly
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
