"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function UniversitySelectionPage() {
  const router = useRouter()
  const params = useParams()
  const selectedKana = decodeURIComponent(params.kana as string)

  const universityReadings: { [key: string]: string } = {
    青山学院大学: "あおやまがくいんだいがく",
    愛知大学: "あいちだいがく",
    秋田大学: "あきただいがく",
    旭川大学: "あさひかわだいがく",
    関西大学: "かんさいだいがく",
    関西学院大学: "かんせいがくいんだいがく",
    京都大学: "きょうとだいがく",
    九州大学: "きゅうしゅうだいがく",
    慶應義塾大学: "けいおうぎじゅくだいがく",
    埼玉大学: "さいたまだいがく",
    札幌大学: "さっぽろだいがく",
    静岡大学: "しずおかだいがく",
    上智大学: "じょうちだいがく",
    東京大学: "とうきょうだいがく",
    東北大学: "とうほくだいがく",
    東海大学: "とうかいだいがく",
    筑波大学: "つくばだいがく",
    名古屋大学: "なごやだいがく",
    新潟大学: "にいがただいがく",
    日本大学: "にほんだいがく",
    北海道大学: "ほっかいどうだいがく",
    法政大学: "ほうせいだいがく",
    広島大学: "ひろしまだいがく",
    明治大学: "めいじだいがく",
    宮城大学: "みやぎだいがく",
    山形大学: "やまがただいがく",
    横浜国立大学: "よこはまこくりつだいがく",
    立教大学: "りっきょうだいがく",
    立命館大学: "りつめいかんだいがく",
    龍谷大学: "りゅうこくだいがく",
    早稲田大学: "わせだだいがく",
  }

  const allUniversities = [
    "青山学院大学",
    "愛知大学",
    "秋田大学",
    "旭川大学",
    "関西大学",
    "関西学院大学",
    "京都大学",
    "九州大学",
    "慶應義塾大学",
    "埼玉大学",
    "札幌大学",
    "静岡大学",
    "上智大学",
    "東京大学",
    "東北大学",
    "東海大学",
    "筑波大学",
    "名古屋大学",
    "新潟大学",
    "日本大学",
    "北海道大学",
    "法政大学",
    "広島大学",
    "明治大学",
    "宮城大学",
    "山形大学",
    "横浜国立大学",
    "立教大学",
    "立命館大学",
    "龍谷大学",
    "早稲田大学",
  ]

  const filteredUniversities = allUniversities.filter((university) => {
    // 実在大学の場合はふりがなで比較
    const reading = universityReadings[university]
    if (reading) {
      return reading.startsWith(selectedKana)
    }

    // ふりがなが登録されていない場合は漢字で比較（フォールバック）
    return university.startsWith(selectedKana)
  })

  const handleUniversityClick = (university: string) => {
    router.push(`/chat?university=${encodeURIComponent(university)}&kana=${encodeURIComponent(selectedKana)}`)
  }

  const handleBackClick = () => {
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
            <h1 className="text-2xl font-bold text-foreground">「{selectedKana}」で始まる大学</h1>
            <p className="text-muted-foreground">{filteredUniversities.length}校の大学が見つかりました</p>
          </div>
        </div>

        {/* University List */}
        <div className="space-y-3">
          {filteredUniversities.length > 0 ? (
            filteredUniversities.map((university, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <Button
                  onClick={() => handleUniversityClick(university)}
                  variant="ghost"
                  className="w-full p-4 h-auto justify-start text-left"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{university}</h3>
                    <p className="text-sm text-muted-foreground mt-1">サークル・部活動情報を見る</p>
                  </div>
                </Button>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">「{selectedKana}」で始まる大学が見つかりませんでした</p>
              <Button onClick={handleBackClick} variant="outline" className="mt-4 bg-transparent">
                文字選択に戻る
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
