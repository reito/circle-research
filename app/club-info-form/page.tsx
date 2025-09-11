"use client"

import { useState } from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft } from "lucide-react"
import { signOut } from "next-auth/react"

export default function ClubInfoFormPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userId = session?.user?.id

  const [universities, setUniversities] = useState<{ id: number, name: string }[]>([])
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("")
  const [clubName, setClubName] = useState("")
  const [memberCount, setMemberCount] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [clubId, setClubId] = useState<string>("") // 編集時はclubId保持
  const [isEditing, setIsEditing] = useState(true)

  // 大学リストはAPIから取得
  // useEffectで初回取得

  useEffect(() => {
    fetch("/api/universities")
      .then(res => res.json())
      .then(data => {
        // APIレスポンスの形式に合わせて調整
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

  // session.user.idでClub情報取得
  useEffect(() => {
    if (!userId) return
    fetch(`/api/clubs?ownerId=${userId}`)
      .then(res => res.json())
      .then(data => {
        const club = Array.isArray(data) ? data[0] : data
        if (club && club.id) {
          setClubId(club.id)
          setClubName(club.name || "")
          setMemberCount(club.memberCount ? String(club.memberCount) : "")
          setDescription(club.description || "")
          setSelectedUniversityId(club.universityId ? String(club.universityId) : "")
        }
      })
      .catch(() => {})
  }, [userId])

  const handleSave = () => {
    setError("")
    setSuccess("")
    if (!selectedUniversityId || !clubName || !memberCount || !description) {
      setError("すべての項目を入力してください")
      return
    }
    if (isNaN(Number(memberCount)) || Number(memberCount) <= 0) {
      setError("人数は正の数値で入力してください")
      return
    }
    // 編集モード（clubIdあり）ならPUT、なければPOST
    const onSuccess = () => {
      setSuccess("登録完了！")
      setIsEditing(false)
      setTimeout(() => setSuccess(""), 3000)
    }
    if (clubId) {
      // 更新（PUT）
      fetch(`/api/clubs/${clubId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubName,
          memberCount: Number(memberCount),
          description,
          universityId: selectedUniversityId,
          ownerId: userId,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (!data || data.error) {
            setError(data.error || "更新に失敗しました")
            return
          }
          onSuccess()
        })
    } else {
      // 新規（POST）
      fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubName,
          memberCount: Number(memberCount),
          description,
          universityId: selectedUniversityId,
          ownerId: userId,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (!data || data.error) {
            setError(data.error || "登録に失敗しました")
            return
          }
          onSuccess()
        })
    }
  }

  const handleBack = () => {
    router.push("/club-register")
  }

  const handleSignOut = async () => {
    await signOut({redirect: false})
    router.push("/club-login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Back Button */}
        <Button onClick={handleSignOut} variant="ghost" className="self-start p-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        {/* Title Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">サークル情報登録</h1>
          <p className="text-muted-foreground">あなたのサークル・部活動の情報を入力してください</p>
          </div>

          {/* Registration Form */}
          <Card className="p-6 space-y-6 relative">
          {/* Card内右上に編集ボタン */}
           {!isEditing && (
             <div className="absolute top-4 right-4">
               <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                 編集
               </Button>
             </div>
           )}
           <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">大学名</Label>
              <Select value={selectedUniversityId} onValueChange={setSelectedUniversityId} disabled={!isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="大学を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
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
                onChange={(e) => setClubName(e.target.value)}
                placeholder="サークル・部活動の名前を入力してください"
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
              />
            </div>

              {isEditing && (
                <Button onClick={handleSave} className="w-full" size="lg">
                  保存
                </Button>
              )}
            {/* Card右上に編集ボタン */}
            {!isEditing && (
              <div className="absolute top-4 right-4">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  編集
                </Button>
              </div>
            )}
            {/* Info */}
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground text-center">
                保存後、サークル情報の管理画面に移ります。後から編集することも可能です。
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-success text-center">{success}</p>}


          </div>


        </Card>
      </div>
    </div>
  )
}
