"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings } from "lucide-react"
import ChatMessage from "@/components/chat-message"
import CodeEditor from "@/components/code-editor"
import SettingsModal from "@/components/settings-modal"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function Home() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [settings, setSettings] = useState({
    darkMode: false,
    emojiMode: {
      enabled: false,
      intensity: 1,
    },
    useContext: true, // New setting to toggle context/history
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize dark mode from system preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setSettings((prev) => ({ ...prev, darkMode: true }))
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const adjustHeight = () => {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }

    textarea.addEventListener("input", adjustHeight)
    return () => textarea.removeEventListener("input", adjustHeight)
  }, [])

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    // Prepare messages array with context if enabled
    let contextualMessages: Message[] = []

    // Add previous messages as context if enabled
    if (settings.useContext) {
      contextualMessages = [...messages]
    }

    // Add the current message
    contextualMessages.push({ role: "user", content: userMessage })

    // Prepare system prompt for emoji mode
    let systemPrompt = ""
    if (settings.emojiMode.enabled) {
      systemPrompt =
        settings.emojiMode.intensity === 1
          ? "Occasionally use emojis in your responses. Make sure to use actual emoji unicode characters, not text representations like :smile:."
          : settings.emojiMode.intensity === 2
            ? "Use emojis frequently in your responses. Make sure to use actual emoji unicode characters, not text representations like :smile:."
            : "Use LOTS of emojis throughout your responses! Make sure to use actual emoji unicode characters, not text representations like :smile:. 🚀✨"
    }

    try {
      const response = await fetch("https://ai.hackclub.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          messages: contextualMessages,
          ...(systemPrompt && { system_prompt: systemPrompt }),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.choices[0].message.content

      // Ensure proper encoding of the message content
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }])
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error processing your request." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Hack Club AI</h1>
          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs px-2 py-1 rounded-full">
            llama-4-scout-17b
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleClearChat} className="hidden sm:flex">
            Clear Chat
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))
              document.documentElement.classList.toggle("dark")
            }}
            className="rounded-full"
          >
            {settings.darkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="m4.93 4.93 1.41 1.41"></path>
                <path d="m17.66 17.66 1.41 1.41"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="m6.34 17.66-1.41 1.41"></path>
                <path d="m19.07 4.93-1.41 1.41"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
              </svg>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="code">Code Buddy</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-gray-500 dark:text-gray-400"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Welcome to Hack Club AI</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Start a conversation with the llama-4-scout model. No API key needed!
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto w-full space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Hack Club AI..."
                  className="pr-24 resize-none min-h-[60px] max-h-[200px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={1}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute bottom-2 right-2"
                  size="sm"
                >
                  {isLoading ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 flex flex-col p-0 m-0">
          <CodeEditor settings={settings} setMessages={setMessages} isLoading={isLoading} setIsLoading={setIsLoading} />
        </TabsContent>
      </Tabs>

      {settingsOpen && (
        <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setSettingsOpen(false)} />
      )}
    </main>
  )
}
