"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function ClubLoginPage() {
  const router = useRouter()
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = () => {
    // 汎用ログインページへリダイレクト
    router.push("/login?callbackUrl=/club-dashboard")
  }

  const handleCreateAccount = () => {
    router.push("/club-register")
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button onClick={handleBack} variant="ghost" className="self-start p-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        {/* Title Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">サークル・部活動</h1>
          <p className="text-muted-foreground">ログインしてサークル情報を管理</p>
        </div>

        {/* Login Form */}
        <Card className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="IDを入力してください"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力してください"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleLogin} className="w-full" size="lg">
              ログイン
            </Button>

            <Button onClick={handleCreateAccount} variant="outline" className="w-full bg-transparent" size="lg">
              新規アカウント作成
            </Button>
          </div>

          {/* Test Account Info */}
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground text-center">
              テスト用アカウント: ID「test」パスワード「password」
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
