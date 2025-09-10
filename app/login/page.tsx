"use client"

import { Suspense, useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface University {
  id: number
  name: string
  domain: string | null
}

function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 大学リストを取得
    fetch("/api/universities")
      .then(res => res.json())
      .then(data => setUniversities(data))
      .catch(err => console.error("Failed to fetch universities:", err))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUniversity || !email || !password) {
      setError("すべての項目を入力してください")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        universityId: selectedUniversity,
        redirect: false,
      })

      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません")
      } else {
        router.push(callbackUrl)
      }
    } catch (error) {
      setError("ログインに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAccount = () => {
    router.push("/register")
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Button onClick={handleBack} variant="ghost" className="self-start p-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">ログイン</h1>
          <p className="text-muted-foreground">アカウント情報を入力してください</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="パスワードを入力"
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>

            <Button
              type="button"
              onClick={handleCreateAccount}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              新規アカウント作成
            </Button>
          </form>

          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground text-center">
              テスト用アカウント: 東京大学 / test@example.com / testpassword
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}