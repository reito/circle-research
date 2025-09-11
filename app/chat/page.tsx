"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Send } from "lucide-react"

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const universityName = searchParams.get("university") || "大学"
  const universityId = searchParams.get("universityId") || ""
  const kana = searchParams.get("kana") || "あ"

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `${universityName}のサークル・部活動について何でも聞いてください！どんなサークルに興味がありますか？`,
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    }

    const messageText = inputText // 値を保存
    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setIsLoading(true)

    try {
      // AI APIを呼び出し
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText, // 保存した値を使用
          universityName: universityName,
          universityId: universityId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.response) {
        const botResponse: Message = {
          id: messages.length + 2,
          text: data.response,
          isUser: false,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botResponse])
      } else {
        // エラーの場合はフォールバックメッセージ
        const botResponse: Message = {
          id: messages.length + 2,
          text: "申し訳ありません、一時的にお答えできません。しばらく待ってから再度お試しください。",
          isUser: false,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botResponse])
      }
    } catch (error) {
      console.error("Chat error:", error)
      const botResponse: Message = {
        id: messages.length + 2,
        text: "ネットワークエラーが発生しました。インターネット接続を確認してください。",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleBack = () => {
    router.push("/kana-selection")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{universityName}</h1>
            <p className="text-sm text-muted-foreground">サークル・部活動相談</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-xs sm:max-w-md p-3 ${
                  message.isUser ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${message.isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {isHydrated
                    ? message.timestamp.toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-xs sm:max-w-md p-3 bg-card text-card-foreground">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-100" />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-200" />
                  </div>
                  <span className="text-sm text-muted-foreground">考え中...</span>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="max-w-2xl mx-auto flex space-x-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputText.trim() || isLoading} size="icon">
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
