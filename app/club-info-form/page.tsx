"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function ClubInfoFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("id")

  const [universityName, setUniversityName] = useState("")
  const [clubName, setClubName] = useState("")
  const [memberCount, setMemberCount] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  // 大学リスト（実際のアプリではAPIから取得）
  const universities = [
    "東京大学",
    "京都大学",
    "早稲田大学",
    "慶應義塾大学",
    "大阪大学",
    "名古屋大学",
    "九州大学",
    "北海道大学",
    "東北大学",
    "筑波大学",
  ]

  const handleSave = () => {
    if (!universityName || !clubName || !memberCount || !description) {
      setError("すべての項目を入力してください")
      return
    }

    if (isNaN(Number(memberCount)) || Number(memberCount) <= 0) {
      setError("人数は正の数値で入力してください")
      return
    }

    // 実際のアプリではここでサークル情報をデータベースに保存
    const clubInfo = {
      userId,
      universityName,
      clubName,
      memberCount: Number(memberCount),
      description,
      createdAt: new Date().toISOString(),
    }

    // ローカルストレージに保存（テスト用）
    localStorage.setItem(`club_info_${userId}`, JSON.stringify(clubInfo))

    // サークル管理ダッシュボードに遷移
    router.push(`/club-dashboard?id=${encodeURIComponent(userId || "")}`)
  }

  const handleBack = () => {
    router.push("/club-register")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Back Button */}
        <Button onClick={handleBack} variant="ghost" className="self-start p-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        {/* Title Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">サークル情報登録</h1>
          <p className="text-muted-foreground">あなたのサークル・部活動の情報を入力してください</p>
        </div>

        {/* Registration Form */}
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">大学名</Label>
              <Select value={universityName} onValueChange={setUniversityName}>
                <SelectTrigger>
                  <SelectValue placeholder="大学を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((university) => (
                    <SelectItem key={university} value={university}>
                      {university}
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
                onChange={(e) => setClubName(e.target.value)}
                placeholder="サークル・部活動の名前を入力してください"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberCount">人数</Label>
              <Input
                id="memberCount"
                type="number"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value)}
                placeholder="現在のメンバー数を入力してください"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">サークル紹介文</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="サークルの活動内容、雰囲気、募集要項などを詳しく記入してください"
                rows={6}
                className="resize-none"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleSave} className="w-full" size="lg">
              保存
            </Button>
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground text-center">
              保存後、サークル情報の管理画面に移ります。後から編集することも可能です。
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
