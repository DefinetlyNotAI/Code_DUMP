"use client"

import { useState } from "react"
import { User, Bot, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism"

interface ChatMessageProps {
  message: {
    role: "user" | "assistant"
    content: string
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser
          ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          : "bg-gray-50 dark:bg-gray-900",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border text-[0.625rem] font-medium",
          isUser
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto break-words">
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 dark:text-gray-50" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900 dark:text-gray-50" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-bold mb-3 mt-4 text-gray-900 dark:text-gray-50" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-base font-bold mb-2 mt-4 text-gray-900 dark:text-gray-50" {...props} />
                ),
                h5: ({ node, ...props }) => (
                  <h5 className="text-sm font-bold mb-2 mt-3 text-gray-900 dark:text-gray-50" {...props} />
                ),
                h6: ({ node, ...props }) => (
                  <h6 className="text-xs font-bold mb-2 mt-3 text-gray-900 dark:text-gray-50" {...props} />
                ),
                p: ({ node, children, ...props }) => (
                  <p className="mb-4 whitespace-pre-wrap break-words" {...props}>
                    {children}
                  </p>
                ),
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="w-full border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
                th: ({ node, ...props }) => (
                  <th
                    className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold"
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "")
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md my-4"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className={cn(
                        "bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm",
                        inline ? "inline-block" : "block p-4 my-4",
                        className,
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4 text-gray-700 dark:text-gray-300"
                    {...props}
                  />
                ),
                a: ({ node, ...props }) => (
                  <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />
                ),
                img: ({ node, ...props }) => <img className="max-w-full h-auto rounded-md my-4" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-6 border-gray-300 dark:border-gray-700" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {!isUser && (
          <button
            onClick={copyToClipboard}
            className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
