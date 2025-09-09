"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleNewStudentClick = () => {
    router.push("/kana-selection")
  }

  const handleClubClick = () => {
    router.push("/club-login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Title Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground text-balance">サークルリサーチ</h1>
          <p className="text-muted-foreground text-lg">あなたにぴったりのサークル・部活動を見つけよう</p>
        </div>

        {/* Action Buttons */}
        <Card className="p-6 space-y-4">
          <div className="space-y-3">
            <Button onClick={handleNewStudentClick} className="w-full h-12 text-lg font-semibold" size="lg">
              新入生
            </Button>

            <Button
              onClick={handleClubClick}
              variant="secondary"
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              サークル・部活動
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-4">あなたの立場を選択してください</p>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">大学生活をもっと充実させよう</p>
        </div>
      </div>
    </div>
  )
}
