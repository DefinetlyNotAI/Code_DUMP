# Windows 98 OS Simulation - API Documentation

This document provides comprehensive documentation for the Windows 98 OS Simulation APIs, including system interfaces, file operations, application development, and inter-component communication.

## Table of Contents

1. [System API Overview](#system-api-overview)
2. [File System API](#file-system-api)
3. [Application Registry](#application-registry)
4. [System Context](#system-context)
5. [Component APIs](#component-apis)
6. [Type Definitions](#type-definitions)
7. [Development Guide](#development-guide)
8. [Best Practices](#best-practices)

## System API Overview

The `SystemAPI` class provides a centralized interface for all system-level operations. It's implemented as a singleton and enhanced with React hooks for state management.

### Core Features
- System notifications and messaging
- Application lifecycle management
- File system operations
- Clipboard management
- Inter-application communication
- System state access

### Usage

```typescript
import { useSystemAPI } from "@/lib/api"

function MyComponent() {
  const api = useSystemAPI()

  // Use any API method
  api.info("Hello from my component!")
}
```

## System API Methods

### Messaging & Notifications

#### `error(message: string, title?: string): void`
Displays an error notification to the user.

```typescript
api.error("File not found", "Error")
api.error("Operation failed") // Uses default title "Error"
```

#### `info(message: string, title?: string): void`
Displays an informational notification.

```typescript
api.info("File saved successfully", "Success")
```

#### `warn(message: string, title?: string): void`
Displays a warning notification.

```typescript
api.warn("File already exists", "Warning")
```

#### `success(message: string, title?: string): void`
Displays a success notification.

```typescript
api.success("Operation completed", "Success")
```

### Application Lifecycle

#### `openApp(appId: string, props?: any): void`
Opens an application with optional props.

```typescript
// Open notepad
api.openApp("notepad")

// Open notepad with a specific file
api.openApp("notepad", { initialFilePath: "C:\\My Documents\\readme.txt" })

// Open file explorer in picker mode
api.openApp("file-explorer", { 
  onFileSelect: (path) => console.log(path),
  filter: ["txt", "html"]
})
```

#### `closeApp(instanceId: string): void`
Closes a specific application instance.

```typescript
api.closeApp("notepad-12345")
```

#### `getAppMetadata(appId: string): AppMetadata | undefined`
Retrieves metadata for a registered application.

```typescript
const metadata = api.getAppMetadata("notepad")
if (metadata) {
  console.log(metadata.name) // "Notepad"
  console.log(metadata.capabilities) // ["TXT", "TEXT_EDITOR"]
}
```

### File System Operations

#### `readFile(path: string): Promise<string>`
Reads the content of a file.

```typescript
try {
  const content = await api.readFile("C:\\My Documents\\readme.txt")
  console.log(content)
} catch (error) {
  api.error(`Failed to read file: ${error.message}`)
}
```

#### `writeFile(path: string, content: string): Promise<void>`
Writes content to a file, creating it if it doesn't exist.

```typescript
try {
  await api.writeFile("C:\\My Documents\\myfile.txt", "Hello World!")
  api.success("File saved successfully")
} catch (error) {
  api.error(`Failed to save file: ${error.message}`)
}
```

#### `listDirectory(path: string): Promise<FileSystemItem[]>`
Lists the contents of a directory.

```typescript
try {
  const items = await api.listDirectory("C:\\My Documents")
  items.forEach(item => {
    console.log(`${item.name} (${item.type})`)
  })
} catch (error) {
  api.error(`Failed to list directory: ${error.message}`)
}
```

#### `createDirectory(path: string): Promise<void>`
Creates a new directory.

```typescript
try {
  await api.createDirectory("C:\\My Documents\\New Folder")
  api.success("Folder created successfully")
} catch (error) {
  api.error(`Failed to create folder: ${error.message}`)
}
```

#### `deleteItem(path: string): Promise<void>`
Deletes a file or directory.

```typescript
try {
  await api.deleteItem("C:\\My Documents\\oldfile.txt")
  api.success("File deleted successfully")
} catch (error) {
  api.error(`Failed to delete file: ${error.message}`)
}
```

#### `renameItem(oldPath: string, newName: string): Promise<void>`
Renames a file or directory within the same parent directory.

```typescript
try {
  await api.renameItem("C:\\My Documents\\oldname.txt", "newname.txt")
  api.success("File renamed successfully")
} catch (error) {
  api.error(`Failed to rename file: ${error.message}`)
}
```

#### `copyItem(sourcePath: string, destinationPath: string): Promise<void>`
Copies a file or directory to a new location.

```typescript
try {
  await api.copyItem(
    "C:\\My Documents\\source.txt",
    "C:\\My Documents\\Backup\\source.txt"
  )
  api.success("File copied successfully")
} catch (error) {
  api.error(`Failed to copy file: ${error.message}`)
}
```

#### `moveItem(sourcePath: string, destinationPath: string): Promise<void>`
Moves a file or directory to a new location.

```typescript
try {
  await api.moveItem(
    "C:\\My Documents\\file.txt",
    "C:\\My Documents\\Archive\\file.txt"
  )
  api.success("File moved successfully")
} catch (error) {
  api.error(`Failed to move file: ${error.message}`)
}
```

### Clipboard Operations

#### `readClipboard(): ClipboardContent | null`
Reads the current clipboard content.

```typescript
const clipboardContent = api.readClipboard()
if (clipboardContent) {
  console.log(`Type: ${clipboardContent.type}`)
  console.log(`Data: ${clipboardContent.data}`)
  console.log(`Is Cut: ${clipboardContent.isCut}`)
}
```

#### `writeClipboard(content: ClipboardContent | null): void`
Writes content to the clipboard.

```typescript
// Copy a file
api.writeClipboard({
  type: "file",
  data: "C:\\My Documents\\myfile.txt",
  isCut: false
})

// Cut a folder
api.writeClipboard({
  type: "folder", 
  data: "C:\\My Documents\\My Folder",
  isCut: true
})

// Copy text
api.writeClipboard({
  type: "text",
  data: "Hello World!",
  isCut: false
})

// Clear clipboard
api.writeClipboard(null)
```

### File Execution

#### `executeFile(filePath: string, props?: any): void`
Opens a file with its associated application.

```typescript
// Open a text file with Notepad
api.executeFile("C:\\My Documents\\readme.txt")

// Open an HTML file with Browser
api.executeFile("C:\\My Documents\\index.html")

// Open an image with Paint
api.executeFile("C:\\My Documents\\image.png")
```

### Inter-Application Communication

#### `broadcast(channel: string, data: any): void`
Broadcasts a message to all subscribed applications.

```typescript
// Broadcast a custom event
api.broadcast("file-updated", { 
  path: "C:\\My Documents\\data.txt",
  timestamp: Date.now()
})
```

#### `subscribe(channel: string, callback: (data: any) => void): () => void`
Subscribes to broadcast messages on a specific channel.

```typescript
// Subscribe to file updates
const unsubscribe = api.subscribe("file-updated", (data) => {
  console.log(`File updated: ${data.path}`)
  // Refresh UI or take other action
})

// Clean up subscription
useEffect(() => {
  return unsubscribe
}, [])
```

### File System Change Events

#### `subscribeToFileSystemChanges(callback: (data: { path: string; timestamp: number }) => void): () => void`
Subscribes to file system change notifications.

```typescript
useEffect(() => {
  const unsubscribe = api.subscribeToFileSystemChanges((change) => {
    if (change.path.startsWith(currentDirectory)) {
      // Refresh directory listing
      loadDirectory(currentDirectory)
    }
  })

  return unsubscribe
}, [currentDirectory])
```

### System State

#### `getSystemState(): SystemState`
Retrieves current system state information.

```typescript
const state = api.getSystemState()
console.log(`Current time: ${state.time}`)
console.log(`Battery level: ${state.battery.level}%`)
console.log(`Network connected: ${state.network.connected}`)
```

## File System API

The `FileSystem` class manages an in-memory file system with full CRUD operations.

### Core Features
- Hierarchical folder structure
- File content storage
- Metadata tracking (size, modified date)
- Path normalization
- Recursive operations

### Internal Structure

```typescript
interface FileSystemItem {
  name: string
  type: "file" | "folder"
  content?: string // For files
  children?: Record<string, FileSystemItem> // For folders
  size?: number
  modified: Date
}
```

### Path Handling
- Supports both forward and backward slashes
- Automatically normalizes paths
- Handles relative paths (., ..)
- Case-insensitive drive letters

```typescript
// All these are equivalent:
"C:\\My Documents\\file.txt"
"C:/My Documents/file.txt"
"c:\\my documents\\file.txt"
```

## Application Registry

The `AppRegistry` manages application registration and discovery.

### Registration

```typescript
import { AppRegistry } from "@/lib/registry"
import MyApp from "./MyApp"
import { myAppMetadata } from "./metadata"

// Register during initialization
AppRegistry.registerApp("myapp", MyApp, myAppMetadata)
```

### Discovery

```typescript
// Get all registered apps
const allApps = AppRegistry.getApps()

// Get apps by capability
const textEditors = AppRegistry.getAppsByCapability("TEXT_EDITOR")

// Get apps by category
const systemApps = AppRegistry.getAppsByCategory("system")

// Get specific app
const notepad = AppRegistry.getApp("notepad")
```

## System Context

The `SystemContext` provides global state management using React Context.

### State Structure

```typescript
interface SystemContextType {
  openApps: AppInstance[]
  activeApp: string | null
  notifications: SystemNotification[]
  clipboard: ClipboardContent | null
  openApp: (appId: string, props?: any) => void
  closeApp: (appId: string) => void
  setActiveApp: (appId: string) => void
  addNotification: (notification: Omit<SystemNotification, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  setClipboard: (content: ClipboardContent | null) => void
}
```

### Usage

```typescript
import { useSystem } from "@/lib/system-context"

function MyComponent() {
  const { openApps, activeApp, setActiveApp } = useSystem()

  return (
    <div>
      <p>Open apps: {openApps.length}</p>
      <p>Active app: {activeApp}</p>
    </div>
  )
}
```

## Component APIs

### Window Component

The `Window` component wraps applications with window chrome (title bar, borders, controls).

#### Props
```typescript
interface WindowProps {
  app: AppInstance
}
```

#### Features
- Draggable title bar
- Resizable borders
- Minimize/maximize/close buttons
- Z-index management
- Window state persistence

### ContextMenu Component

Provides right-click context menus throughout the interface.

#### Props
```typescript
interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

interface ContextMenuItem {
  label: string
  action: () => void
  separator?: boolean
  disabled?: boolean
}
```

#### Usage
```typescript
const [contextMenu, setContextMenu] = useState(null)

const handleRightClick = (e: React.MouseEvent) => {
  e.preventDefault()
  setContextMenu({
    visible: true,
    x: e.clientX,
    y: e.clientY,
    items: [
      { label: "Copy", action: () => handleCopy() },
      { label: "Paste", action: () => handlePaste(), disabled: !canPaste },
      { separator: true, label: "" },
      { label: "Delete", action: () => handleDelete() }
    ]
  })
}
```

### FilePickerDialog Component

Provides file selection functionality for applications.

#### Props
```typescript
interface FilePickerDialogProps {
  onSelect: (path: string) => void
  onClose: () => void
  filter?: string[]
  title?: string
}
```

#### Usage
```typescript
const [showFilePicker, setShowFilePicker] = useState(false)

const handleFileSelect = (filePath: string) => {
  console.log(`Selected: ${filePath}`)
  setShowFilePicker(false)
}

return (
  <>
    <button onClick={() => setShowFilePicker(true)}>
      Browse...
    </button>
    {showFilePicker && (
      <FilePickerDialog
        onSelect={handleFileSelect}
        onClose={() => setShowFilePicker(false)}
        filter={["txt", "html"]}
        title="Open File"
      />
    )}
  </>
)
```

## Type Definitions

### Core Types

```typescript
interface AppMetadata {
  name: string
  iconPath: string
  capabilities: string[]
  runnableBy: "system" | "user" | "both"
  singleInstance?: boolean
  showOnDesktop?: boolean
  defaultWidth?: number
  defaultHeight?: number
  category?: string
}

interface AppInstance {
  id: string
  appId: string
  component: React.ComponentType<any>
  metadata: AppMetadata
  props: any
}

interface SystemNotification {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  timestamp: Date
}

interface ClipboardContent {
  type: "text" | "file" | "folder"
  data: string
  isCut?: boolean
}

interface FileSystemItem {
  name: string
  type: "file" | "folder"
  content?: string
  children?: Record<string, FileSystemItem>
  size?: number
  modified: Date
}
```

## Development Guide

### Creating a New Application

1. **Create the component structure**
   ```
   components/apps/myapp/
   ├── App.tsx
   ├── metadata.ts
   └── index.ts
   ```

2. **Implement the main component**
   ```typescript
   // App.tsx
   import { useSystemAPI } from "@/lib/api"
   
   interface MyAppProps {
     initialData?: string
   }
   
   export default function MyApp({ initialData }: MyAppProps) {
     const api = useSystemAPI()
   
     return (
       <div className="h-full bg-gray-300 p-4">
         <h1>My Application</h1>
         <button onClick={() => api.info("Hello from My App!")}>
           Test Notification
         </button>
       </div>
     )
   }
   ```

3. **Define metadata**
   ```typescript
   // metadata.ts
   import type { AppMetadata } from "@/lib/types"
   
   export const myAppMetadata: AppMetadata = {
     name: "My App",
     iconPath: "/placeholder.svg?height=32&width=32",
     capabilities: ["CUSTOM_CAPABILITY"],
     runnableBy: "both",
     singleInstance: false,
     showOnDesktop: true,
     defaultWidth: 600,
     defaultHeight: 400,
     category: "productivity"
   }
   ```

4. **Register the application**
   ```typescript
   // lib/registry.ts
   import MyApp from "@/components/apps/myapp/App"
   import { myAppMetadata } from "@/components/apps/myapp/metadata"
   
   // Add to initialize() method
   this.registerApp("myapp", MyApp, myAppMetadata)
   ```

### File Operations Best Practices

1. **Always handle errors**
   ```typescript
   try {
     await api.writeFile(path, content)
     api.success("File saved")
   } catch (error) {
     api.error(`Save failed: ${error.message}`)
   }
   ```

2. **Use absolute paths**
   ```typescript
   // Good
   const filePath = "C:\\My Documents\\myfile.txt"
   
   // Avoid relative paths in API calls
   const filePath = "..\\myfile.txt"
   ```

3. **Subscribe to file system changes**
   ```typescript
   useEffect(() => {
     const unsubscribe = api.subscribeToFileSystemChanges((change) => {
       if (change.path === currentFilePath) {
         // Reload file content
         loadFile(currentFilePath)
       }
     })
     return unsubscribe
   }, [currentFilePath])
   ```

### State Management

1. **Use SystemAPI for cross-component communication**
   ```typescript
   // Component A
   api.broadcast("data-updated", { id: 123, value: "new data" })
   
   // Component B
   useEffect(() => {
     const unsubscribe = api.subscribe("data-updated", (data) => {
       updateLocalState(data)
     })
     return unsubscribe
   }, [])
   ```

2. **Use local state for component-specific data**
   ```typescript
   const [localData, setLocalData] = useState("")
   const [isLoading, setIsLoading] = useState(false)
   ```

3. **Use system context for global state**
   ```typescript
   const { openApps, activeApp } = useSystem()
   ```

## Best Practices

### Performance

1. **Debounce file system operations**
   ```typescript
   const debouncedSave = useCallback(
     debounce(async (content: string) => {
       await api.writeFile(filePath, content)
     }, 500),
     [filePath]
   )
   ```

2. **Cleanup subscriptions**
   ```typescript
   useEffect(() => {
     const unsubscribe = api.subscribe("channel", handler)
     return unsubscribe // Always return cleanup function
   }, [])
   ```

3. **Optimize re-renders**
   ```typescript
   const memoizedComponent = useMemo(() => (
     <ExpensiveComponent data={data} />
   ), [data])
   ```

### Error Handling

1. **Provide meaningful error messages**
   ```typescript
   try {
     await api.deleteItem(path)
   } catch (error) {
     if (error.message.includes("not empty")) {
       api.error("Cannot delete folder: folder is not empty")
     } else {
       api.error(`Delete failed: ${error.message}`)
     }
   }
   ```

2. **Validate inputs**
   ```typescript
   const saveFile = async (filename: string, content: string) => {
     if (!filename.trim()) {
       api.warn("Please enter a filename")
       return
     }
   
     if (filename.includes("\\") || filename.includes("/")) {
       api.error("Filename cannot contain path separators")
       return
     }
   
     // Proceed with save
   }
   ```

### UI/UX

1. **Follow Windows 98 design patterns**
   ```typescript
   // Use provided CSS classes
   <div className="win98-window">
     <div className="win98-titlebar">Title</div>
     <div className="win98-panel-raised p-2">Content</div>
   </div>
   ```

2. **Provide user feedback**
   ```typescript
   const handleSave = async () => {
     setIsLoading(true)
     try {
       await api.writeFile(path, content)
       api.success("File saved successfully")
     } catch (error) {
       api.error(`Save failed: ${error.message}`)
     } finally {
       setIsLoading(false)
     }
   }
   ```

3. **Handle loading states**
   ```typescript
   if (isLoading) {
     return <div className="p-4">Loading...</div>
   }
   ```

### Security

1. **Validate file paths**
   ```typescript
   const isValidPath = (path: string) => {
     return path.startsWith("C:\\") && !path.includes("..")
   }
   ```

2. **Sanitize user inputs**
   ```typescript
   const sanitizeFilename = (filename: string) => {
     return filename.replace(/[<>:"/\\|?*]/g, "")
   }
   ```

### Testing

1. **Test error conditions**
   ```typescript
   // Test file not found
   try {
     await api.readFile("C:\\nonexistent.txt")
   } catch (error) {
     expect(error.message).toContain("File not found")
   }
   ```

2. **Test file system operations**
   ```typescript
   // Create, read, update, delete cycle
   await api.writeFile(testPath, "initial content")
   const content = await api.readFile(testPath)
   expect(content).toBe("initial content")
   
   await api.writeFile(testPath, "updated content")
   const updatedContent = await api.readFile(testPath)
   expect(updatedContent).toBe("updated content")
   
   await api.deleteItem(testPath)
   await expect(api.readFile(testPath)).rejects.toThrow()
   ```

---

This API documentation provides a comprehensive guide for developing applications within the Windows 98 OS Simulation. For additional examples and implementation details, refer to the existing application components in the codebase.
