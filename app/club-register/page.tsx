"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function ClubRegisterPage() {
  const router = useRouter()
  const [newId, setNewId] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const handleRegister = () => {
    // 汎用登録ページへリダイレクト
    // router.push("/register")
    // return

    if (newPassword.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return
    }

    // 実際のアプリではここでアカウント情報をデータベースに保存
    router.push(`/club-info-form?id=${encodeURIComponent(newId)}`)
  }

  const handleBack = () => {
    router.push("/club-login")
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
          <h1 className="text-3xl font-bold text-foreground">新規アカウント作成</h1>
          <p className="text-muted-foreground">サークル・部活動の情報を管理するアカウントを作成</p>
        </div>

        {/* Registration Form */}
        <Card className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newId">新規ID</Label>
              <Input
                id="newId"
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="3文字以上のIDを入力してください"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">新規パスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6文字以上のパスワードを入力してください"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワードを再度入力してください"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleRegister} className="w-full" size="lg">
              登録
            </Button>
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground text-center">登録後、サークル情報の入力画面に移ります</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
