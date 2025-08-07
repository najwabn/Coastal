"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Sparkles } from 'lucide-react'
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

const starterMessages = [
  "Where's the incident report form?",
  "Can I use my phone when kids are asleep?",
  "What's the rule for trampoline use?",
  "What do I do if a parent doesn't come home?",
]

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleStarterClick = (starterMessage: string) => {
    setHasStartedChat(true)
    handleMessage(starterMessage)
  }

  const handleMessage = async (messageText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: messageText,
          threadId: threadId // Send existing threadId or null for first message
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store the threadId from the response (will be set on first message)
        if (data.threadId && !threadId) {
          setThreadId(data.threadId)
          console.log("Thread ID set:", data.threadId)
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
        }

        // Simulate typing delay
        setTimeout(() => {
          setIsTyping(false)
          setMessages((prev) => [...prev, assistantMessage])
        }, 1000)
      } else {
        throw new Error(data.error || "Failed to get response")
      }
    } catch (error) {
      console.error("Error:", error)
      setIsTyping(false)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (!hasStartedChat) {
      setHasStartedChat(true)
    }

    handleMessage(input)
  }

  const TypingIndicator = () => (
    <div className="flex items-start space-x-3 max-w-2xl">
      <div className="w-9 h-9 rounded-full bg-[#C1207C] flex items-center justify-center shadow-lg flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-[#4AB4BB] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-[#FAAD1A] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-[#C1207C] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  )

  // Landing Page View
  if (!hasStartedChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-5xl mx-auto w-full">
          {/* Centered Logo and Description */}
          <div className="text-center mb-16 animate-in fade-in duration-1000">
            <div className="mb-8 relative">
              <Image
                src="/coastal-logo-transparent.png"
                alt="Coastal Babysitters"
                width={350}
                height={105}
                className="h-24 w-auto mx-auto drop-shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <p className="text-xl text-[#666666] font-medium tracking-wide">kids love us, parents trust us</p>
              <div className="flex items-center justify-center space-x-2 text-[#666666]/60">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Ask me anything about babysitting</span>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Starter Messages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16 w-full max-w-3xl animate-in slide-in-from-bottom-4 duration-1000 delay-300">
            {starterMessages.map((message, index) => (
              <button
                key={index}
                onClick={() => handleStarterClick(message)}
                className="group p-5 text-left bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#4AB4BB]/50 rounded-xl transition-all duration-300 text-[#666666] hover:shadow-lg hover:shadow-[#4AB4BB]/10 hover:-translate-y-0.5"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#4AB4BB] rounded-full mt-2 group-hover:scale-125 transition-transform duration-300"></div>
                  <p className="text-sm leading-relaxed font-medium">{message}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input */}
        <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about our babysitting services..."
                  disabled={isLoading}
                  className="w-full border-2 border-gray-200 focus:border-[#4AB4BB] hover:border-gray-300 rounded-2xl py-4 px-6 text-[#666666] placeholder:text-[#666666]/50 bg-white shadow-sm transition-all duration-200 focus:shadow-md"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#C1207C] hover:bg-[#C1207C]/90 text-white rounded-2xl px-8 py-4 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Chat Interface View
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Logo */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center space-x-4">
          <div className="relative">
            <Image
              src="/coastal-logo-transparent.png"
              alt="Coastal Babysitters"
              width={180}
              height={54}
              className="h-9 w-auto"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-[#666666]/70 font-medium">Ask me anything about our babysitting services</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-500`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`flex items-start space-x-4 max-w-2xl ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                    message.role === "user" ? "bg-[#FAAD1A]" : "bg-[#C1207C]"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`px-5 py-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                    message.role === "user"
                      ? "bg-[#4AB4BB] text-white rounded-br-md"
                      : "bg-white text-[#666666] border border-gray-100 rounded-bl-md"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg font-bold text-[#C1207C] mb-3 leading-tight">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-bold text-[#684EA9] mb-2 leading-tight">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-bold text-[#4AB4BB] mb-2 leading-tight">{children}</h3>
                          ),
                          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-[#C1207C]">{children}</strong>,
                          em: ({ children }) => <em className="italic text-[#684EA9]">{children}</em>,
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-3 space-y-1 pl-2">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-3 space-y-1 pl-2">{children}</ol>
                          ),
                          li: ({ children }) => <li className="text-[#666666] leading-relaxed">{children}</li>,
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4AB4BB] hover:text-[#C1207C] underline underline-offset-2 transition-colors font-medium"
                            >
                              {children}
                            </a>
                          ),
                          code: ({ children }) => (
                            <code className="bg-gray-100 text-[#684EA9] px-2 py-1 rounded-md text-xs font-mono border">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-gray-100 p-4 rounded-xl overflow-x-auto mb-3 border">{children}</pre>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-[#4AB4BB] pl-4 italic text-[#666666]/80 mb-3 bg-gray-50 py-2 rounded-r-lg">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <p
                    className={`text-xs mt-3 ${message.role === "user" ? "text-white/70" : "text-[#666666]/50"} font-medium`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="animate-in slide-in-from-bottom-2 duration-500">
              <TypingIndicator />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-6 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about our babysitting services..."
                disabled={isLoading}
                className="w-full border-2 border-gray-200 focus:border-[#4AB4BB] hover:border-gray-300 rounded-2xl py-4 px-6 text-[#666666] placeholder:text-[#666666]/50 bg-white shadow-sm transition-all duration-200 focus:shadow-md"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#C1207C] hover:bg-[#C1207C]/90 text-white rounded-2xl px-8 py-4 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
