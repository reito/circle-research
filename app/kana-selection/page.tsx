"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function KanaSelectionPage() {
  const router = useRouter()

  // 50音の配列
  const kanaRows = [
    ["あ", "い", "う", "え", "お"],
    ["か", "き", "く", "け", "こ"],
    ["さ", "し", "す", "せ", "そ"],
    ["た", "ち", "つ", "て", "と"],
    ["な", "に", "ぬ", "ね", "の"],
    ["は", "ひ", "ふ", "へ", "ほ"],
    ["ま", "み", "む", "め", "も"],
    ["や", "", "ゆ", "", "よ"],
    ["ら", "り", "る", "れ", "ろ"],
    ["わ", "", "", "", "ん"],
  ]

  const handleKanaClick = (kana: string) => {
    if (kana) {
      router.push(`/university-selection/${kana}`)
    }
  }

  const handleBackClick = () => {
    router.push("/")
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
            <h1 className="text-2xl font-bold text-foreground">大学を選択</h1>
            <p className="text-muted-foreground">大学名の頭文字を選んでください</p>
          </div>
        </div>

        {/* Kana Grid */}
        <Card className="p-6">
          <div className="space-y-3">
            {kanaRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center space-x-2">
                {row.map((kana, colIndex) => (
                  <div key={colIndex} className="w-12 h-12">
                    {kana && (
                      <Button
                        onClick={() => handleKanaClick(kana)}
                        variant="outline"
                        className="w-full h-full text-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {kana}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">大学名の最初の文字を選択してください</p>
        </div>
      </div>
    </div>
  )
}
