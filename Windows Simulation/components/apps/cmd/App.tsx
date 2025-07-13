"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSystemAPI } from "@/lib/api"

interface CommandHistoryEntry {
  command: string
  output: string
  type: "command" | "output" | "error"
}

export default function CmdApp() {
  const api = useSystemAPI()
  const [history, setHistory] = useState<CommandHistoryEntry[]>([
    { command: "", output: "Microsoft Windows 98 [Version 4.10.1998]", type: "output" },
    { command: "", output: "(C) Copyright Microsoft Corp 1981-1998.", type: "output" },
    { command: "", output: "", type: "output" },
  ])
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([]) // Stores executed commands
  const [historyIndex, setHistoryIndex] = useState(-1) // Index for navigating commandHistory
  const [variables, setVariables] = useState<Record<string, string>>({
    PATH: "C:\\WINDOWS;C:\\WINDOWS\\COMMAND",
    PROMPT: "$P$G",
    COMSPEC: "C:\\WINDOWS\\COMMAND.COM",
  })
  const [currentDir, setCurrentDir] = useState("C:\\My Documents") // Start in My Documents for easier testing
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [history])

  const addToHistory = (command: string, output: string, type: "command" | "output" | "error" = "output") => {
    setHistory((prev) => [...prev, { command, output, type }])
  }

  const resolvePath = useCallback(
    (path: string) => {
      if (path.startsWith("C:\\") || path.startsWith("c:\\")) {
        return path
      }
      // Handle relative paths
      const parts = currentDir.split("\\")
      const newParts = path.split("\\")
      const resolvedParts = [...parts]

      for (const part of newParts) {
        if (part === "..") {
          if (resolvedParts.length > 1) {
            resolvedParts.pop()
          }
        } else if (part !== ".") {
          resolvedParts.push(part)
        }
      }
      return resolvedParts.join("\\")
    },
    [currentDir],
  )

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim()
    if (!trimmedCmd) return

    addToHistory(trimmedCmd, "", "command")
    setCommandHistory((prev) => [...prev, trimmedCmd])
    setHistoryIndex(commandHistory.length + 1) // Reset history index

    const parts = trimmedCmd.split(" ")
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    try {
      switch (command) {
        case "help":
          addToHistory(
            "",
            `For more information on a specific command, type HELP command-name
ATTRIB          Displays or changes file attributes. (Not implemented)
CD              Displays the name of or changes the current directory.
CHDIR           Displays the name of or changes the current directory.
CLS             Clears the screen.
COPY            Copies one or more files to another location.
DATE            Displays or sets the date.
DEL             Deletes one or more files.
DIR             Displays a list of files and subdirectories in a directory.
ECHO            Displays messages, or turns command echoing on or off.
EXIT            Quits the CMD.EXE program (command interpreter).
HELP            Provides Help information for Windows commands.
MD              Creates a directory.
MKDIR           Creates a directory.
MOVE            Moves one or more files from one directory to another.
RD              Removes a directory.
RMDIR           Removes a directory.
SET             Displays, sets, or removes environment variables.
TIME            Displays or sets the system time.
TYPE            Displays the contents of a text file.
VER             Displays the Windows version.`,
            "output",
          )
          break

        case "dir":
          const dirPath = args[0] ? resolvePath(args[0]) : currentDir
          const items = await api.listDirectory(dirPath)
          let output = ` Volume in drive C is WINDOWS98\n Volume Serial Number is 1234-ABCD\n\n Directory of ${dirPath}\n\n`
          let fileCount = 0
          let dirCount = 0
          let totalFileSize = 0

          items.forEach((item) => {
            const modifiedDate = item.modified.toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "2-digit",
            })
            const modifiedTime = item.modified.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            if (item.type === "folder") {
              output += `${modifiedDate}  ${modifiedTime}        <DIR>          ${item.name}\n`
              dirCount++
            } else {
              output += `${modifiedDate}  ${modifiedTime} ${String(item.size || 0).padStart(10, " ")} ${item.name}\n`
              fileCount++
              totalFileSize += item.size || 0
            }
          })
          output += `               ${fileCount} file(s)         ${totalFileSize} bytes\n`
          output += `               ${dirCount} dir(s)      1,457,664 bytes free` // Placeholder free space
          addToHistory("", output, "output")
          break

        case "cd":
        case "chdir":
          if (args.length === 0) {
            addToHistory("", currentDir, "output")
          } else {
            const newDir = resolvePath(args[0])
            try {
              // Check if it's a valid directory
              await api.listDirectory(newDir)
              setCurrentDir(newDir.toUpperCase())
              addToHistory("", "", "output")
            } catch (e: any) {
              addToHistory("", `The system cannot find the path specified.`, "error")
            }
          }
          break

        case "echo":
          const text = args.join(" ")
          if (text.includes("=")) {
            const [varName, ...valueParts] = text.split("=")
            const value = valueParts.join("=")
            setVariables((prev) => ({ ...prev, [varName]: value }))
            addToHistory("", "", "output")
          } else {
            let expandedText = text
            Object.entries(variables).forEach(([key, value]) => {
              expandedText = expandedText.replace(new RegExp(`%${key}%`, "g"), value)
            })
            addToHistory("", expandedText, "output")
          }
          break

        case "set":
          if (args.length === 0) {
            const varList = Object.entries(variables)
              .map(([key, value]) => `${key}=${value}`)
              .join("\n")
            addToHistory("", varList, "output")
          } else if (args[0].includes("=")) {
            const [varName, ...valueParts] = args[0].split("=")
            const value = valueParts.join("=")
            setVariables((prev) => ({ ...prev, [varName]: value }))
            addToHistory("", "", "output")
          } else {
            const varName = args[0]
            const value = variables[varName]
            addToHistory(
              "",
              value ? `${varName}=${value}` : `Environment variable ${varName} not defined`,
              value ? "output" : "error",
            )
          }
          break

        case "cls":
          setHistory([])
          break

        case "date":
          addToHistory("", `Current date is ${new Date().toLocaleDateString()}`, "output")
          break

        case "time":
          addToHistory("", `Current time is ${new Date().toLocaleTimeString()}`, "output")
          break

        case "ver":
          addToHistory("", "Microsoft Windows 98 [Version 4.10.1998]", "output")
          break

        case "type":
          if (args.length > 0) {
            const filePath = resolvePath(args[0])
            try {
              const content = await api.readFile(filePath)
              addToHistory("", content, "output")
            } catch (e: any) {
              addToHistory("", `The system cannot find the file specified.`, "error")
            }
          } else {
            addToHistory("", "The syntax of the command is incorrect.", "error")
          }
          break

        case "md":
        case "mkdir":
          if (args.length > 0) {
            const newDirPath = resolvePath(args[0])
            try {
              await api.createDirectory(newDirPath)
              addToHistory("", "", "output")
            } catch (e: any) {
              addToHistory("", `Error creating directory: ${e.message}`, "error")
            }
          } else {
            addToHistory("", "The syntax of the command is incorrect.", "error")
          }
          break

        case "rd":
        case "rmdir":
          if (args.length > 0) {
            const dirToDeletePath = resolvePath(args[0])
            try {
              await api.deleteItem(dirToDeletePath)
              addToHistory("", "", "output")
            } catch (e: any) {
              addToHistory("", `Error removing directory: ${e.message}`, "error")
            }
          } else {
            addToHistory("", "The syntax of the command is incorrect.", "error")
          }
          break

        case "del":
        case "erase":
          if (args.length > 0) {
            const fileToDeletePath = resolvePath(args[0])
            try {
              await api.deleteItem(fileToDeletePath)
              addToHistory("", "", "output")
            } catch (e: any) {
              addToHistory("", `Error deleting file: ${e.message}`, "error")
            }
          } else {
            addToHistory("", "The syntax of the command is incorrect.", "error")
          }
          break

        case "copy":
          if (args.length === 2) {
            const sourcePath = resolvePath(args[0])
            const destinationPath = resolvePath(args[1])
            try {
              await api.copyItem(sourcePath, destinationPath)
              addToHistory("", `        1 file(s) copied.`, "output")
            } catch (e: any) {
              addToHistory("", `Error copying file: ${e.message}`, "error")
            }
          } else {
            addToHistory("", "The syntax of the command is incorrect.", "error")
          }
          break

        case "move":
          if (args.length === 2) {
            const sourcePath = resolvePath(args[0])
            const destinationPath = resolvePath(args[1])
            try {
              await api.moveItem(sourcePath, destinationPath)
              addToHistory("", `        1 file(s) moved.`, "output")
            } catch (e: any) {
              addToHistory("", `Error moving file: ${e.message}`, "error")
            }
          } else {
            addToHistory("", "The syntax of the command is incorrect.", "error")
          }
          break

        case "exit":
          api.closeApp("cmd")
          break

        default:
          addToHistory("", `Bad command or file name`, "error")
      }
    } catch (e: any) {
      addToHistory("", `An unexpected error occurred: ${e.message}`, "error")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand)
      setCurrentCommand("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault() // Prevent cursor from moving
      if (commandHistory.length > 0 && historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      } else if (commandHistory.length > 0 && historyIndex === -1) {
        // If at the end, go to the last command
        const newIndex = commandHistory.length - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault() // Prevent cursor from moving
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      } else {
        setHistoryIndex(commandHistory.length) // Go past last command to empty
        setCurrentCommand("")
      }
    }
  }

  return (
    <div
      className="h-full bg-black text-white font-mono text-xs flex flex-col"
      style={{ fontFamily: "Courier New, monospace" }}
    >
      <div ref={containerRef} className="flex-1 p-2 overflow-y-auto" onClick={() => inputRef.current?.focus()}>
        {history.map((entry, index) => (
          <div key={index} className="whitespace-pre-wrap">
            {entry.type === "command" && (
              <div className="flex">
                <span className="text-white">
                  {currentDir}
                  {">"}
                </span>
                <span className="ml-1">{entry.command}</span>
              </div>
            )}
            {entry.output && (
              <div className={entry.type === "error" ? "text-red-400" : "text-white"}>{entry.output}</div>
            )}
          </div>
        ))}

        <div className="flex items-center">
          <span className="text-white">
            {currentDir}
            {">"}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyPress} // Use onKeyDown for arrow keys
            className="ml-1 bg-transparent border-none outline-none text-white flex-1"
            style={{ fontFamily: "Courier New, monospace" }}
            autoFocus
          />
          <span className="animate-pulse">_</span>
        </div>
      </div>
    </div>
  )
}
