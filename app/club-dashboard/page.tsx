"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Save, X, Plus } from "lucide-react"

interface Club {
  id: number
  name: string
  memberCount: number
  description: string | null
  university: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

export default function ClubDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    memberCount: "",
    description: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/club-dashboard")
    } else if (status === "authenticated") {
      fetchClubs()
    }
  }, [status, router])

  const fetchClubs = async () => {
    try {
      const response = await fetch("/api/clubs")
      if (response.ok) {
        const data = await response.json()
        setClubs(data)
        if (data.length > 0) {
          setSelectedClub(data[0])
          setEditForm({
            name: data[0].name,
            memberCount: data[0].memberCount.toString(),
            description: data[0].description || "",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch clubs:", error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError("")
  }

  const handleSave = async () => {
    if (!editForm.name || !editForm.memberCount || !editForm.description) {
      setError("すべての項目を入力してください")
      return
    }

    if (isNaN(Number(editForm.memberCount)) || Number(editForm.memberCount) <= 0) {
      setError("人数は正の数値で入力してください")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/clubs/${selectedClub!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          memberCount: parseInt(editForm.memberCount),
          description: editForm.description,
        }),
      })

      if (response.ok) {
        const updatedClub = await response.json()
        setClubs(clubs.map(c => c.id === updatedClub.id ? updatedClub : c))
        setSelectedClub(updatedClub)
        setIsEditing(false)
      } else {
        const data = await response.json()
        setError(data.error || "更新に失敗しました")
      }
    } catch (error) {
      setError("更新に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (selectedClub) {
      setEditForm({
        name: selectedClub.name,
        memberCount: selectedClub.memberCount.toString(),
        description: selectedClub.description || "",
      })
    }
    setIsEditing(false)
    setError("")
  }

  const handleCreate = async () => {
    if (!session?.user?.universityId) {
      setError("大学情報が取得できません")
      return
    }

    setIsCreating(true)
    setError("")
    
    // 新規作成フォームを初期化
    setEditForm({
      name: "",
      memberCount: "1",
      description: "",
    })
  }

  const handleCreateSave = async () => {
    if (!editForm.name || !editForm.description) {
      setError("サークル名と紹介文は必須です")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          memberCount: parseInt(editForm.memberCount) || 1,
          description: editForm.description,
          universityId: session!.user.universityId,
        }),
      })

      if (response.ok) {
        const newClub = await response.json()
        setClubs([...clubs, newClub])
        setSelectedClub(newClub)
        setIsCreating(false)
      } else {
        const data = await response.json()
        setError(data.error || "作成に失敗しました")
      }
    } catch (error) {
      setError("作成に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const handleBack = () => {
    router.push("/")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" className="p-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ホームに戻る
          </Button>
          <Button onClick={handleSignOut} variant="outline">
            ログアウト
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">サークル管理ダッシュボード</h1>
          <p className="text-muted-foreground">{session.user.name} ({session.user.universityName})</p>
        </div>

        {clubs.length === 0 && !isCreating ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">まだサークルを登録していません</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              サークルを作成
            </Button>
          </Card>
        ) : (
          <>
            {clubs.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {clubs.map((club) => (
                  <Button
                    key={club.id}
                    variant={selectedClub?.id === club.id ? "default" : "outline"}
                    onClick={() => {
                      setSelectedClub(club)
                      setEditForm({
                        name: club.name,
                        memberCount: club.memberCount.toString(),
                        description: club.description || "",
                      })
                      setIsEditing(false)
                    }}
                  >
                    {club.name}
                  </Button>
                ))}
                {!isCreating && (
                  <Button onClick={handleCreate} variant="ghost">
                    <Plus className="h-4 w-4 mr-2" />
                    新規作成
                  </Button>
                )}
              </div>
            )}

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  {isCreating ? "新規サークル作成" : "サークル情報"}
                </h2>
                {!isEditing && !isCreating && selectedClub && (
                  <Button onClick={handleEdit} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                )}
                {(isEditing || isCreating) && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={isCreating ? handleCreateSave : handleSave} 
                      size="sm"
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "保存中..." : "保存"}
                    </Button>
                    <Button 
                      onClick={() => {
                        if (isCreating) {
                          setIsCreating(false)
                          if (selectedClub) {
                            setEditForm({
                              name: selectedClub.name,
                              memberCount: selectedClub.memberCount.toString(),
                              description: selectedClub.description || "",
                            })
                          }
                        } else {
                          handleCancel()
                        }
                        setError("")
                      }} 
                      variant="outline" 
                      size="sm"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      キャンセル
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {!isEditing && !isCreating && selectedClub ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">大学名</Label>
                        <p className="text-lg">{selectedClub.university.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">サークル名</Label>
                        <p className="text-lg">{selectedClub.name}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">人数</Label>
                      <p className="text-lg">{selectedClub.memberCount}人</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">サークル紹介</Label>
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{selectedClub.description}</p>
                    </div>
                  </>
                ) : (isEditing || isCreating) && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">大学名</Label>
                        <p className="text-lg">{session.user.universityName}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-clubName">サークル名</Label>
                        <Input
                          id="edit-clubName"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              {selectedClub && !isCreating && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    登録日時: {new Date(selectedClub.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}