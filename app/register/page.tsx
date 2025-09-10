"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface University {
  id: number
  name: string
  domain: string | null
}

export default function RegisterPage() {
  const router = useRouter()
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 大学リストを取得
    fetch("/api/universities")
      .then(res => res.json())
      .then(data => setUniversities(data))
      .catch(err => console.error("Failed to fetch universities:", err))
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUniversity || !name || !email || !password || !confirmPassword) {
      setError("すべての項目を入力してください")
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          universityId: selectedUniversity,
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "登録に失敗しました")
      } else {
        // 登録成功 - ログインページへリダイレクト
  router.push("/club-login?registered=true")
      }
    } catch (error) {
      setError("登録に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
  router.push("/club-login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Button onClick={handleBack} variant="ghost" className="self-start p-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">アカウント作成</h1>
          <p className="text-muted-foreground">新規アカウントを作成します</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">大学</Label>
              <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                <SelectTrigger id="university">
                  <SelectValue placeholder="大学を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id.toString()}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田太郎"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワードを再入力"
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "登録中..." : "アカウントを作成"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}