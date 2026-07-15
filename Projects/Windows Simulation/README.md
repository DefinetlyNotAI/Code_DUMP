> [!WARNING]
>
> This is close to be complete, but I also lost motivation, it works barely - but hasn't been thoroughly tested, although some UI/UX have been implemented for features not yet logically implemented, You are free to modify this project as its more of a boilerplate for devs to add features using the API!

# Windows 98 OS Simulation

A comprehensive Windows 98 operating system simulation built with Next.js, TypeScript, and Tailwind CSS. This project recreates the classic Windows 98 experience with a modern web-based implementation, featuring a complete desktop environment, file system, applications, and system APIs.

## 🚀 Features

### Core System
- **Authentic Windows 98 UI**: Pixel-perfect recreation of the classic Windows 98 interface
- **Desktop Environment**: Interactive desktop with draggable icons, context menus, and wallpaper
- **Taskbar & Start Menu**: Fully functional taskbar with system tray, clock, and hierarchical start menu
- **Window Management**: Resizable, draggable windows with minimize, maximize, and close functionality
- **File System**: Complete in-memory file system with folders, files, and CRUD operations
- **Clipboard System**: Cut, copy, and paste functionality across applications
- **Notification System**: Toast notifications for system events and errors

### Applications
- **File Explorer**: Full-featured file manager with list/grid views, drag & drop, context menus
- **Notepad**: Text editor with file operations (new, open, save, save as)
- **Paint**: Drawing application with brush tools, shapes, colors, and image loading/saving
- **Command Prompt**: DOS-style terminal with 20+ commands and command history
- **Browser**: Local HTML file viewer for static content
- **Control Panel**: System settings and configuration interface
- **Run Dialog**: Application launcher with file browsing capabilities

### Advanced Features
- **Dynamic File System**: Real-time updates across all applications when files change
- **Drag & Drop**: Move files between folders and applications
- **Context Menus**: Right-click menus throughout the interface
- **File Associations**: Automatic application launching based on file extensions
- **Command History**: Arrow key navigation in command prompt
- **Auto-save**: Persistent file changes across sessions

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Windows 98 theme
- **State Management**: React Context API
- **Architecture**: Modular component system with plugin-like app registry

## 📁 Project Structure

```
├── app/                         # Next.js app directory
│   ├── globals.css              # Windows 98 CSS theme
│   ├── layout.tsx               # Root layout with system provider
│   └── page.tsx                 # Main OS entry point
├── components/
│   ├── apps/                    # Application components
│   │   ├── browser/             # Browser application
│   │   ├── cmd/                 # Command prompt
│   │   ├── control-panel/       # Control panel
│   │   ├── file-explorer/       # File manager
│   │   ├── notepad/             # Text editor
│   │   ├── paint/               # Drawing application
│   │   └── run/                 # Run dialog
│   ├── desktop/                 # Desktop environment
│   │   ├── Desktop.tsx          # Desktop with icons
│   │   ├── StartMenu.tsx        # Start menu component
│   │   ├── Taskbar.tsx          # Taskbar with system tray
│   │   ├── Window.tsx           # Window wrapper
│   │   └── WindowManager.tsx    # Window management
│   ├── icons/                   # SVG icon components
│   └── system/                  # System-level components
│       ├── ContextMenu.tsx      # Right-click menus
│       ├── FilePickerDialog.tsx # File selection dialog
│       └── NotificationManager.tsx # Toast notifications
└── lib/                         # Core system libraries
    ├── api.ts                   # System API and hooks
    ├── file-system.ts           # In-memory file system
    ├── registry.ts              # Application registry
    ├── system-context.tsx       # Global state management
    └── types.ts                 # TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DefinetlyNotAI/Code_DUMP
   cd "Code_DUMP/Windows Simulation"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the development server**
   ```bash
   npm run dev
   ```
   
4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 🎮 Usage Guide

### Desktop Interaction
- **Single-click**: Select desktop icons
- **Double-click**: Launch applications or open files
- **Right-click**: Access context menus
- **Drag & drop**: Rearrange desktop icons

### File Management
- **File Explorer**: Navigate folders, create/delete/rename files
- **Context menus**: Right-click for file operations
- **Drag & drop**: Move files between folders
- **Cut/Copy/Paste**: Use context menu or keyboard shortcuts

### Command Prompt Commands
```bash
# File operations
dir                   # List directory contents
cd <path>             # Change directory
type <file>           # Display file contents
copy <src> <dest>     # Copy files
move <src> <dest>     # Move files
del <file>            # Delete files

# Directory operations
md <name>             # Create directory
rd <name>             # Remove directory

# System commands
cls                   # Clear screen
date                  # Show current date
time                  # Show current time
ver                   # Show Windows version
exit                  # Close command prompt
```

### Application Development
See [API Documentation](API_README.md) for detailed information on:
- Creating new applications
- Using the System API
- File system operations
- Inter-app communication

## 🏗️ Architecture

### Component Hierarchy
```
App
├── SystemProvider (Global state)
├── Desktop (Icon management)
├── WindowManager (Window rendering)
├── Taskbar (System controls)
└── NotificationManager (Toast messages)
```

### Data Flow
1. **User Interaction** → Desktop/Taskbar components
2. **System API** → Centralized operation handling
3. **File System** → In-memory storage operations
4. **State Updates** → React Context propagation
5. **UI Updates** → Component re-rendering

### Key Design Patterns
- **Registry Pattern**: Dynamic application loading
- **Observer Pattern**: File system change notifications
- **Context Pattern**: Global state management
- **Factory Pattern**: Window and component creation

## 🔧 Configuration

### Adding New Applications

1. **Create app component**
   ```typescript
   // components/apps/myapp/App.tsx
   export default function MyApp() {
     const api = useSystemAPI()
     return <div>My Application</div>
   }
   ```

2. **Define metadata**
   ```typescript
   // components/apps/myapp/metadata.ts
   export const myAppMetadata: AppMetadata = {
     name: "My App",
     iconPath: "/icon.svg",
     capabilities: ["CUSTOM"],
     runnableBy: "both",
     singleInstance: false,
     showOnDesktop: true,
     defaultWidth: 800,
     defaultHeight: 600,
     category: "productivity"
   }
   ```

3. **Register application**
   ```typescript
   // lib/registry.ts
   import MyApp from "@/components/apps/myapp/App"
   import { myAppMetadata } from "@/components/apps/myapp/metadata"
   
   AppRegistry.registerApp("myapp", MyApp, myAppMetadata)
   ```

### Customizing File Associations

```typescript
// lib/api.ts - executeFile method
case "myext":
  appIdToOpen = "myapp"
  break
```

## 🙏 Acknowledgments

- Microsoft Windows 98 for the original design inspiration
- React and Next.js communities for excellent documentation
- Tailwind CSS for utility-first styling approach
- The open-source community for various implementation ideas

## 🐛 Known Issues

- Canvas operations may be slow on older devices
- File system is in-memory only (resets on page refresh)
- Some advanced Windows 98 features are simplified
- Mobile responsiveness is limited
- Minor UI bugs especially with icons
- Some features aren't actually implemented logically, but the buttons exist for them

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the [API Documentation](API_README.md)
- Review existing issues and discussions
