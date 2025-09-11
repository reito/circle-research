"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  const handleBackClick = () => {
    router.back()
  }

  const handleHomeClick = () => {
    router.push("/")
  }

  const handleKanaSelectionClick = () => {
    router.push("/kana-selection")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBackClick} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ナビゲーション</h1>
            <p className="text-muted-foreground">以下のいずれかを選択してください。</p>
          </div>
        </div>

        {/* Actions */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={handleKanaSelectionClick} 
                className="w-full justify-start"
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                大学選択に戻る
              </Button>
              
              <Button 
                onClick={handleHomeClick} 
                className="w-full justify-start"
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                ホームに戻る
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
