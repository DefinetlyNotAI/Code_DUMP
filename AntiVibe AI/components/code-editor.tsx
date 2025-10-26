"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Copy, Check, Code, Bug, Wand2, Lightbulb, Zap, FileCode, Download, Upload, Trash2 } from "lucide-react"
import ChatMessage from "@/components/chat-message"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X } from "lucide-react"

interface CodeEditorProps {
  settings: {
    darkMode: boolean
    emojiMode: {
      enabled: boolean
      intensity: number
    }
    useContext: boolean
  }
  setMessages: React.Dispatch<
    React.SetStateAction<
      {
        role: "user" | "assistant"
        content: string
      }[]
    >
  >
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

// Code templates for different languages
const codeTemplates = {
  javascript: `// JavaScript Template
function calculateSum(arr) {
  // TODO: Implement a function that calculates the sum of an array
  // Avoid "vibe coding" - use proper algorithms and data structures
  
  return arr.reduce((sum, num) => sum + num, 0);
}

// Example usage
const numbers = [1, 2, 3, 4, 5];
console.log(calculateSum(numbers));
`,
  python: `# Python Template
def calculate_sum(arr):
    # TODO: Implement a function that calculates the sum of an array
    # Avoid "vibe coding" - use proper algorithms and data structures
    
    return sum(arr)

# Example usage
numbers = [1, 2, 3, 4, 5]
print(calculate_sum(numbers))
`,
  typescript: `// TypeScript Template
function calculateSum(arr: number[]): number {
  // TODO: Implement a function that calculates the sum of an array
  // Avoid "vibe coding" - use proper algorithms and data structures
  
  return arr.reduce((sum, num) => sum + num, 0);
}

// Example usage
const numbers: number[] = [1, 2, 3, 4, 5];
console.log(calculateSum(numbers));
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web Page</title>
  <style>
    /* Add your CSS here */
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a simple HTML template.</p>
  
  <script>
    // Add your JavaScript here
    console.log('Page loaded');
  </script>
</body>
</html>
`,
  css: `/* CSS Template */
/* Use meaningful class names and avoid excessive nesting */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background-color: #f5f5f5;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
}

.button {
  background-color: #0070f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #0051a2;
}
`,
  sql: `-- SQL Template
-- Create a table with proper constraints and types
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (id, username, email) VALUES
(1, 'john_doe', 'john@example.com'),
(2, 'jane_smith', 'jane@example.com');

-- Write a query with proper joins and conditions
SELECT 
  users.username,
  users.email
FROM 
  users
WHERE 
  users.created_at > '2023-01-01';
`,
  rust: `// Rust Template
fn calculate_sum(numbers: &[i32]) -> i32 {
    // TODO: Implement a function that calculates the sum of a slice
    // Avoid "vibe coding" - use proper algorithms and data structures
    
    numbers.iter().sum()
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    println!("Sum: {}", calculate_sum(&numbers));
}
`,
  go: `// Go Template
package main

import "fmt"

// CalculateSum calculates the sum of an array of integers
func CalculateSum(numbers []int) int {
	// TODO: Implement a function that calculates the sum of an array
	// Avoid "vibe coding" - use proper algorithms and data structures
	
	sum := 0
	for _, num := range numbers {
		sum += num
	}
	return sum
}

func main() {
	numbers := []int{1, 2, 3, 4, 5}
	fmt.Println("Sum:", CalculateSum(numbers))
}
`,
}

// Analysis types with descriptions
const analysisTypes = [
  {
    id: "explain",
    name: "Explain Code",
    icon: <Code className="h-4 w-4 mr-2" />,
    prompt:
      "Explain this code in detail. What does it do? How does it work? Focus on the algorithms and data structures used.",
  },
  {
    id: "debug",
    name: "Debug & Fix",
    icon: <Bug className="h-4 w-4 mr-2" />,
    prompt:
      "Debug this code and identify any issues or bugs. Provide specific fixes with explanations. Focus on logical errors, edge cases, and performance issues.",
  },
  {
    id: "optimize",
    name: "Optimize",
    icon: <Zap className="h-4 w-4 mr-2" />,
    prompt:
      "Optimize this code for better performance and readability. Suggest specific improvements with explanations. Focus on time complexity, space complexity, and code organization.",
  },
  {
    id: "refactor",
    name: "Refactor",
    icon: <Wand2 className="h-4 w-4 mr-2" />,
    prompt:
      "Refactor this code to improve its structure and maintainability. Suggest specific changes with explanations. Focus on design patterns, SOLID principles, and clean code practices.",
  },
  {
    id: "bestPractices",
    name: "Best Practices",
    icon: <Lightbulb className="h-4 w-4 mr-2" />,
    prompt:
      "Review this code for adherence to best practices. Suggest specific improvements with explanations. Focus on industry standards, coding conventions, and security considerations.",
  },
]

export default function CodeEditor({ settings, setMessages, isLoading, setIsLoading }: CodeEditorProps) {
  const [code, setCode] = useState(codeTemplates.javascript)
  const [language, setLanguage] = useState("javascript")
  const [output, setOutput] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [copied, setCopied] = useState(false)
  const [analysisType, setAnalysisType] = useState("explain")
  const [jsOutput, setJsOutput] = useState("")
  const [jsError, setJsError] = useState("")
  const [showOutput, setShowOutput] = useState(false)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const outputEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Apply syntax highlighting or editor enhancements here
    if (editorRef.current) {
      // Set tab behavior to insert spaces instead of changing focus
      editorRef.current.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault()
          const start = editorRef.current!.selectionStart
          const end = editorRef.current!.selectionEnd

          // Insert 2 spaces at cursor position
          const newValue = editorRef.current!.value.substring(0, start) + "  " + editorRef.current!.value.substring(end)
          editorRef.current!.value = newValue

          // Move cursor position after the inserted spaces
          editorRef.current!.selectionStart = editorRef.current!.selectionEnd = start + 2
        }
      })
    }
  }, [])

  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    // Load template for the selected language
    if (codeTemplates[value as keyof typeof codeTemplates]) {
      setCode(codeTemplates[value as keyof typeof codeTemplates])
    }
  }

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the analysis history?")) {
      setOutput([])
    }
  }

  const handleAnalyzeCode = async () => {
    if (!code.trim()) return

    setIsLoading(true)
    setOutput((prev) => [...prev, { role: "user", content: code }])
    setShowOutput(false)

    // Get the selected analysis type
    const selectedAnalysis = analysisTypes.find((type) => type.id === analysisType) || analysisTypes[0]

    // Prepare prompt with code context and analysis type
    const prompt = `${selectedAnalysis.prompt}

\`\`\`${language}
${code}
\`\`\`

IMPORTANT: 
1. Discourage "vibe coding" - emphasize structured, maintainable approaches
2. Provide specific, actionable feedback
3. Explain the reasoning behind your suggestions
4. Include code examples where appropriate
5. If you use tables in your response, format them properly with markdown table syntax
6. Use proper markdown heading format for sections (e.g., "## Analysis" or "### Performance Issues")`

    // Prepare messages array with context if enabled
    const contextualMessages = []

    // Add previous messages as context if enabled
    if (settings.useContext && output.length > 0) {
      contextualMessages.push(...output)
    }

    contextualMessages.push({ role: "user", content: prompt })

    try {
      const response = await fetch("https://ai.hackclub.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          messages: contextualMessages,
          // Add emoji instruction if enabled
          ...(settings.emojiMode.enabled && {
            system_prompt: `${
              settings.emojiMode.intensity === 1
                ? "Occasionally use emojis in your responses. Make sure to use actual emoji unicode characters, not text representations like :smile:."
                : settings.emojiMode.intensity === 2
                  ? "Use emojis frequently in your responses. Make sure to use actual emoji unicode characters, not text representations like :smile:."
                  : "Use LOTS of emojis throughout your responses! Make sure to use actual emoji unicode characters, not text representations like :smile:. 🚀✨"
            }`,
          }),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.choices[0].message.content

      setOutput((prev) => [...prev, { role: "assistant", content: assistantMessage }])
      scrollToBottom()
    } catch (error) {
      console.error("Error:", error)
      setOutput((prev) => [...prev, { role: "assistant", content: "Sorry, there was an error processing your code." }])
    } finally {
      setIsLoading(false)
    }
  }

  const executeJavaScript = () => {
    if (language !== "javascript" && language !== "typescript") {
      setJsError("Only JavaScript and TypeScript code can be executed in the browser.")
      setShowOutput(true)
      return
    }

    setJsOutput("")
    setJsError("")
    setShowOutput(true)

    // Create a safe execution environment
    const originalConsoleLog = console.log
    const logs: string[] = []

    try {
      // Override console.log to capture output
      console.log = (...args) => {
        logs.push(args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" "))
      }

      // Execute the code
      const result = new Function(code)()

      // If the code returns a value, add it to the output
      if (result !== undefined) {
        logs.push(`Return value: ${result}`)
      }

      setJsOutput(logs.join("\n"))
    } catch (error) {
      setJsError(error instanceof Error ? error.message : String(error))
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCode = () => {
    const fileExtensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      sql: "sql",
      rust: "rs",
      go: "go",
    }

    const extension = fileExtensions[language] || "txt"
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `code.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const uploadCode = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCode(content)

      // Try to detect language from file extension
      const extension = file.name.split(".").pop()?.toLowerCase()
      if (extension) {
        const extensionToLanguage: Record<string, string> = {
          js: "javascript",
          ts: "typescript",
          py: "python",
          html: "html",
          css: "css",
          sql: "sql",
          rs: "rust",
          go: "go",
        }

        if (extensionToLanguage[extension]) {
          setLanguage(extensionToLanguage[extension])
        }
      }
    }
    reader.readAsText(file)

    // Reset the input value so the same file can be uploaded again
    event.target.value = ""
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Code Editor Section */}
        <div className="flex flex-col w-full md:w-1/2 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={uploadCode} className="h-8 w-8">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload Code</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={downloadCode} className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download Code</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-8 w-8">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copied ? "Copied!" : "Copy Code"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Analysis Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center">
                          {type.icon}
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleAnalyzeCode}
                    disabled={isLoading || !code.trim()}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Analyze Code
                  </Button>

                  {(language === "javascript" || language === "typescript") && (
                    <Button
                      onClick={executeJavaScript}
                      disabled={isLoading || !code.trim()}
                      size="sm"
                      variant="outline"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex-1 flex flex-col">
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 font-mono text-sm resize-none bg-gray-900 text-gray-100 outline-none"
              spellCheck="false"
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".js,.ts,.py,.html,.css,.sql,.rs,.go,.txt"
            />

            {showOutput && (
              <div className="border-t border-gray-700 bg-gray-800 text-gray-100 p-4 font-mono text-sm overflow-auto max-h-[200px]">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Execution Output</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowOutput(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {jsError ? (
                  <div className="text-red-400">{jsError}</div>
                ) : (
                  <pre className="whitespace-pre-wrap">{jsOutput || "No output"}</pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col w-full md:w-1/2">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">AI Analysis</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleClearChat} className="flex items-center text-sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear History
                </Button>
                <div className="flex items-center space-x-1">
                  <FileCode className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{language}</span>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
            {output.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
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
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Code Buddy</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Select an analysis type and click "Analyze Code" to get AI feedback on your code.
                </p>

                <Alert className="mt-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>Avoid "vibe coding"</strong> - Write structured, maintainable code with proper algorithms
                    and data structures.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                {output.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">AI is analyzing your code...</span>
                  </div>
                )}
                <div ref={outputEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
