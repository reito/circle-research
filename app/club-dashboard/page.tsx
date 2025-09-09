"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Edit, Save, X } from "lucide-react"

interface ClubInfo {
  userId: string
  universityName: string
  clubName: string
  memberCount: number
  description: string
  createdAt: string
}

export default function ClubDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("id") || "test"

  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    universityName: "",
    clubName: "",
    memberCount: "",
    description: "",
  })

  // 大学リスト
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

  useEffect(() => {
    const initializeTestData = () => {
      const testClubInfo: ClubInfo = {
        userId: "test",
        universityName: "東京大学",
        clubName: "テニスサークル",
        memberCount: 25,
        description:
          "東京大学のテニスサークルです。初心者から経験者まで大歓迎！週3回の練習で楽しくテニスを学べます。合宿やイベントも充実しており、学年を超えた交流が盛んです。",
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem("club_info_test", JSON.stringify(testClubInfo))
    }

    // テスト用データが存在しない場合は作成
    if (!localStorage.getItem("club_info_test")) {
      initializeTestData()
    }

    // ローカルストレージからサークル情報を読み込み
    const savedInfo = localStorage.getItem(`club_info_${userId}`)
    if (savedInfo) {
      const info = JSON.parse(savedInfo)
      setClubInfo(info)
      setEditForm({
        universityName: info.universityName,
        clubName: info.clubName,
        memberCount: info.memberCount.toString(),
        description: info.description,
      })
    }
  }, [userId])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!editForm.universityName || !editForm.clubName || !editForm.memberCount || !editForm.description) {
      alert("すべての項目を入力してください")
      return
    }

    if (isNaN(Number(editForm.memberCount)) || Number(editForm.memberCount) <= 0) {
      alert("人数は正の数値で入力してください")
      return
    }

    const updatedInfo: ClubInfo = {
      ...clubInfo!,
      universityName: editForm.universityName,
      clubName: editForm.clubName,
      memberCount: Number(editForm.memberCount),
      description: editForm.description,
    }

    localStorage.setItem(`club_info_${userId}`, JSON.stringify(updatedInfo))
    setClubInfo(updatedInfo)
    setIsEditing(false)
  }

  const handleCancel = () => {
    if (clubInfo) {
      setEditForm({
        universityName: clubInfo.universityName,
        clubName: clubInfo.clubName,
        memberCount: clubInfo.memberCount.toString(),
        description: clubInfo.description,
      })
    }
    setIsEditing(false)
  }

  const handleLogout = () => {
    router.push("/club-login")
  }

  const handleBack = () => {
    router.push("/")
  }

  if (!clubInfo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">サークル情報が見つかりません</p>
          <Button onClick={() => router.push("/club-info-form")} className="mt-4">
            サークル情報を登録
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="p-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ホームに戻る
          </Button>
          <Button onClick={handleLogout} variant="outline">
            ログアウト
          </Button>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">サークル管理ダッシュボード</h1>
          <p className="text-muted-foreground">ユーザーID: {userId}</p>
        </div>

        {/* Club Info Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">サークル情報</h2>
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  キャンセル
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!isEditing ? (
              // 表示モード
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">大学名</Label>
                    <p className="text-lg">{clubInfo.universityName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">サークル名</Label>
                    <p className="text-lg">{clubInfo.clubName}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">人数</Label>
                  <p className="text-lg">{clubInfo.memberCount}人</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">サークル紹介</Label>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{clubInfo.description}</p>
                </div>
              </>
            ) : (
              // 編集モード
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-university">大学名</Label>
                    <Select
                      value={editForm.universityName}
                      onValueChange={(value) => setEditForm({ ...editForm, universityName: value })}
                    >
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
                    <Label htmlFor="edit-clubName">サークル名</Label>
                    <Input
                      id="edit-clubName"
                      value={editForm.clubName}
                      onChange={(e) => setEditForm({ ...editForm, clubName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-memberCount">人数</Label>
                  <Input
                    id="edit-memberCount"
                    type="number"
                    value={editForm.memberCount}
                    onChange={(e) => setEditForm({ ...editForm, memberCount: e.target.value })}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">サークル紹介</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              登録日時: {new Date(clubInfo.createdAt).toLocaleString("ja-JP")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
