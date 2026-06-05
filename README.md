# G2C - GUI to CLI

<div align="center">

```
 ██████╗ ██████╗  ██████╗
██╔════╝ ╚════██╗██╔════╝
██║  ███╗ █████╔╝██║     
██║   ██║██╔═══╝ ██║     
╚██████╔╝███████╗╚██████╗
 ╚═════╝ ╚══════╝ ╚═════╝
```

**High-Performance Windows Desktop Mirroring for Terminal Environments**

[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com/)
[![Windows](https://img.shields.io/badge/Windows-10%2B-0078D6?style=flat-square&logo=windows)](https://www.microsoft.com/windows)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![ANSI Truecolor](https://img.shields.io/badge/Colors-16.7M%20Truecolor-ff69b4?style=flat-square)]()

*Render your entire Windows desktop in real-time using Unicode block characters and ANSI escape sequences*

</div>

---

## Overview

G2C (GUI to CLI) is a sophisticated desktop mirroring application that captures your Windows screen and renders it
directly in any terminal that supports ANSI truecolor escape sequences. Using the Unicode upper-half block character (
`▀`) combined with foreground/background coloring, G2C achieves effective double vertical resolution - displaying two
pixels per terminal cell.

### Why G2C?

- **Remote Access Without VNC/RDP**: View and interact with your desktop over SSH
- **Lightweight Monitoring**: Keep an eye on GUI applications from a terminal session
- **Accessibility**: Provide alternative desktop viewing methods
- **Development & Testing**: Debug GUI applications while monitoring from another terminal
- **Novelty & Education**: Explore the limits of terminal-based graphics

---

## Table of Contents

1. [Features](#features)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Usage Guide](#usage-guide)
6. [Architecture](#architecture)
7. [Module Reference](#module-reference)
8. [Configuration](#configuration)
9. [Performance Optimization](#performance-optimization)
10. [Terminal Compatibility](#terminal-compatibility)
11. [Advanced Topics](#advanced-topics)
12. [Troubleshooting](#troubleshooting)
13. [API Reference](#api-reference)
14. [Development](#development)
15. [Changelog](#changelog)
16. [Contributing](#contributing)
17. [License](#license)

---

## Features

### Core Rendering Engine

| Feature                  | Description                                                 |
|--------------------------|-------------------------------------------------------------|
| **ANSI Truecolor**       | Full 24-bit RGB color support (16,777,216 colors)           |
| **Half-Block Rendering** | 2 vertical pixels per cell using `▀` character              |
| **Multi-Mode Scaling**   | Fit, fill, stretch, and pixel-perfect scaling modes         |
| **SIMD Acceleration**    | Hardware-accelerated pixel processing using AVX2/SSE        |
| **Diff-Based Updates**   | Smart change detection - only redraw modified cells         |
| **Color Space Support**  | RGB, HSL, HSV, LAB, LCH with perceptual color distance      |

### Capture System

| Feature                      | Description                                     |
|------------------------------|-------------------------------------------------|
| **DXGI Desktop Duplication** | Zero-copy GPU capture with minimal CPU overhead |
| **GDI Fallback**             | Universal compatibility mode for older systems  |
| **Multi-Monitor Support**    | Capture any connected display                   |
| **Hardware Cursor**          | Proper cursor overlay in captured frames        |
| **Auto-Recovery**            | Automatic reinitialization on capture failures  |

### Input & Interaction

| Feature                    | Description                                  |
|----------------------------|----------------------------------------------|
| **Mouse Bridging**         | Click, drag, and scroll through the terminal |
| **Coordinate Translation** | Automatic terminal-to-screen mapping         |
| **SGR Mouse Protocol**     | Full mouse tracking with button states       |
| **Modifier Keys**          | Ctrl, Shift, Alt key state tracking          |

### Performance & Diagnostics

| Feature                | Description                                  |
|------------------------|----------------------------------------------|
| **Real-Time Metrics**  | FPS, capture time, render time, cell changes |
| **Memory Profiling**   | Track allocation patterns and GC pressure    |
| **Per-Stage Timing**   | Detailed breakdown of each pipeline stage    |
| **Structured Logging** | Async logging with multiple output sinks     |

---

## System Requirements

### Minimum Requirements

| Component    | Requirement                                    |
|--------------|------------------------------------------------|
| **OS**       | Windows 10 version 1903 (May 2019 Update)      |
| **Runtime**  | .NET 8.0 Runtime or SDK                        |
| **Terminal** | Any terminal with ANSI escape sequence support |
| **RAM**      | 256 MB available                               |
| **CPU**      | x64 processor                                  |

### Recommended Requirements

| Component    | Recommendation                           |
|--------------|------------------------------------------|
| **OS**       | Windows 11 or Windows 10 21H2+           |
| **Terminal** | Windows Terminal 1.12+                   |
| **GPU**      | DirectX 11 compatible (for DXGI capture) |
| **RAM**      | 512 MB+ available                        |
| **CPU**      | Multi-core with AVX2 support             |

### DXGI Requirements

DXGI Desktop Duplication requires:

- Windows 10 1903 or later
- DirectX 11 compatible GPU
- Desktop Composition enabled (Aero)
- Not running in a Remote Desktop session (RDP)

If DXGI is unavailable, G2C automatically falls back to GDI capture.

---

## Installation

### Option 1: Download Pre-Built Binary

1) Download the latest release from https://github.com/DefinetlyNotAI/g2c/releases/

2) Extract the archive and navigate to the directory and run the EXE

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/DefinetlyNotAI/g2c.git
cd g2c/G2C

# Restore dependencies
dotnet restore

# Build in Release mode
dotnet build -c Release

# Run
./bin/Release/net8.0-windows/g2c.exe
```

### Option 3: Self-Contained Executable

Create a single-file executable with no external dependencies:

```bash
# Publish as self-contained single file
dotnet publish -c Release -r win-x64 \
  --self-contained true \
  -p:PublishSingleFile=true \
  -p:IncludeNativeLibrariesForSelfExtract=true \
  -p:EnableCompressionInSingleFile=true

# Output: bin/Release/net8.0-windows/win-x64/publish/g2c.exe
```

### Option 4: Install as Global Tool

```bash
# Pack as NuGet tool
dotnet pack -c Release

# Install globally
dotnet tool install --global --add-source ./nupkg G2C

# Run from anywhere
g2c --help
```

---

## Quick Start

### Basic Usage

```bash
# Run with default settings (30 FPS, DXGI capture, diff enabled)
g2c.exe

# Press Ctrl+C or Ctrl+Q to exit
```

### Common Scenarios

```bash
# High quality local viewing
g2c.exe --fps=60 --scale=fit --color=truecolor

# Low bandwidth SSH session
g2c.exe --fps=15 --grayscale --color=256

# Debugging and development
g2c.exe --debug --stats

# View-only mode (no mouse interaction)
g2c.exe --no-mouse

# Use a specific capture backend
g2c.exe --capture=dxgi
```

---

## Usage Guide

### Command Line Interface

```
g2c [OPTIONS]

DISPLAY OPTIONS:
  --fps=<N>              Target frame rate (1-120, default: 24)
  --grayscale            Render in grayscale instead of color
  --color=<MODE>         Color output mode:
                           truecolor  - 24-bit RGB (default)
                           256        - 256-color palette
                           16         - 16-color ANSI
                           ansi       - 16-color ANSI alias
  --scale=<MODE>         Scaling: fit, stretch, fill, pixel
  --charset=<SET>        Characters: half, quarter, braille, block, ascii
  --dither=none          Dithering placeholder; other modes are rejected

CAPTURE OPTIONS:
  --capture=<METHOD>     Capture method:
                           auto       - Best available (default)
                           dxgi       - Force DXGI Desktop Duplication
                           gdi        - Force GDI capture
  --monitor=<N>          Reserved; currently rejected
  --region=<X,Y,W,H>     Reserved; currently rejected

INPUT OPTIONS:
  --no-mouse             Disable mouse input bridging
  --keyboard, -k         Reserved; currently rejected

PERFORMANCE OPTIONS:
  --no-diff              Disable diff engine (redraw all cells)
  --threads=<N>          Framebuffer worker limit (1-64)
  --low-latency          Prefer low-latency settings

DEBUG OPTIONS:
  --debug                Show performance overlay
  --stats                Show performance statistics

OTHER:
  --help, -h             Display this help message
  --version, -v          Display version information
```

### Environment Variables

G2C respects the following environment variables:

| Variable         | Description               | Default    |
|------------------|---------------------------|------------|
| `G2C_FPS`        | Default frame rate        | 30         |
| `G2C_CAPTURE`    | Default capture method    | auto       |
| `G2C_COLOR_MODE` | Default color mode        | truecolor  |
| `G2C_LOG_LEVEL`  | Logging verbosity         | info       |
| `G2C_LOG_FILE`   | Log file path             | (none)     |
| `COLORTERM`      | Terminal color capability | (detected) |
| `TERM`           | Terminal type             | (detected) |

### Keyboard Shortcuts

| Key      | Action                         |
|----------|--------------------------------|
| `Ctrl+C` | Exit application               |
| `Ctrl+Q` | Exit application (alternative) |
| `Ctrl+D` | Toggle debug overlay           |
| `Ctrl+P` | Pause/resume capture           |
| `Ctrl+R` | Force full redraw              |
| `Ctrl++` | Increase FPS by 5              |
| `Ctrl+-` | Decrease FPS by 5              |

### Mouse Controls

When mouse bridging is enabled:

| Action       | Behavior                                   |
|--------------|--------------------------------------------|
| Left Click   | Translated to screen position and injected |
| Right Click  | Context menu click                         |
| Middle Click | Middle button click                        |
| Scroll       | Vertical scrolling                         |
| Drag         | Click-and-drag operations                  |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                G2C Architecture                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           CAPTURE LAYER                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │   │
│  │  │  DXGI Capture   │  │   GDI Capture   │  │ WGC Capture     │           │   │
│  │  │  (GPU Direct)   │  │   (BitBlt)      │  │ (Win Graphics)  │           │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │   │
│  │           └────────────────────┼────────────────────┘                    │   │
│  │                                ▼                                         │   │
│  │                     ┌─────────────────────┐                              │   │
│  │                     │  IScreenCapture     │                              │   │
│  │                     │  (Unified Interface)│                              │   │
│  │                     └──────────┬──────────┘                              │   │
│  └────────────────────────────────┼─────────────────────────────────────────┘   │
│                                   ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                          PROCESSING LAYER                                │   │
│  │                                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │   │
│  │  │  Color          │  │  Frame Buffer   │  │  Diff Engine    │           │   │
│  │  │  Processor      │  │  Manager        │  │                 │           │   │
│  │  │                 │  │                 │  │  ┌───────────┐  │           │   │
│  │  │  • RGB/HSL/LAB  │  │  • Downscaling  │  │  │ Previous  │  │           │   │
│  │  │  • Grayscale    │  │  • Bilinear     │  │  │ Frame     │  │           │   │
│  │  │  • ANSI Palettes│  │  • Fit/Fill     │  │  └─────┬─────┘  │           │   │
│  │  │  • Quantization │  │  • Pixel Mode   │  │        │        │           │   │
│  │  │                 │  │  • SIMD Accel   │  │  ┌─────▼─────┐  │           │   │
│  │  └────────┬────────┘  └────────┬────────┘  │  │ Current   │  │           │   │
│  │           │                    │           │  │ Frame     │  │           │   │
│  │           └──────────┬─────────┘           │  └─────┬─────┘  │           │   │
│  │                      │                     │        │        │           │   │
│  │                      ▼                     │  ┌─────▼─────┐  │           │   │
│  │           ┌─────────────────────┐          │  │ Changed   │  │           │   │
│  │           │  TerminalCell[][]   │◀──────── │  │ Cells     │  │           │   │
│  │           │  (Top/Bottom Pixels)│          │  └───────────┘  │           │   │
│  │           └──────────┬──────────┘          └─────────────────┘           │   │
│  └──────────────────────┼───────────────────────────────────────────────────┘   │
│                         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           OUTPUT LAYER                                   │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐     │   │
│  │  │                      ANSI Renderer                              │     │   │
│  │  │                                                                 │     │   │
│  │  │  ┌───────────────┐  ┌─────────────┐  ┌─────────────┐            │     │   │
│  │  │  │ Truecolor     │  │ 256-Color   │  │ 16-Color    │            │     │   │
│  │  │  │ \e[38;2;r;g;b │  │ \e[38;5;N   │  │ \e[3Nm      │            │     │   │
│  │  │  └───────────────┘  └─────────────┘  └─────────────┘            │     │   │
│  │  │                                                                 │     │   │
│  │  │  Optimizations:                                                 │     │   │
│  │  │  • Color state tracking (skip redundant escapes)                │     │   │
│  │  │  • Run-length encoding (combine same-color cells)               │     │   │
│  │  │  • Synchronized output (buffer entire frame)                    │     │   │
│  │  │  • Cursor positioning optimization                              │     │   │
│  │  └─────────────────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                         │                                                       │
│                         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           INPUT LAYER                                    │   │
│  │                                                                          │   │
│  │  Terminal Input ──▶ SGR Mouse Parser ──▶ Co-ord Transform ──▶ SendInput  │   │
│  │     (col, row)        Button State      (screenX, screenY)    Win32 API  │   │
│  │                                                                          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Frame Processing Pipeline                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Time ──────────────────────────────────────────────────────────────────────▶  │
│                                                                                 │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐           │
│   │ CAPTURE │──▶│ SCALE   │──▶│ CONVERT │──▶│  DIFF   │──▶│ RENDER  │           │
│   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘           │
│                                                                                 │
│   Screen        Terminal      Pixel to       Compare       Generate             │
│   Bitmap        Resolution    Cell           Frames        ANSI                 │
│   (BGRA)        (Bilinear)    (2 per cell)   (Changed)     (Escape Seq)         │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ Example: 1920x1080 screen → 120x40 terminal                             │   │
│   │                                                                         │   │
│   │ Stage 1: Capture  = 1920 × 1080 × 4 = 8.3 MB BGRA bitmap                │   │
│   │ Stage 2: Scale    = 120 × 80 × 3 = 28.8 KB RGB (80 = 40×2 for cells)    │   │
│   │ Stage 3: Convert  = 120 × 40 × 6 = 28.8 KB terminal cells               │   │
│   │ Stage 4: Diff     = ~1000 changed cells (typical)                       │   │
│   │ Stage 5: Render   = ~30 KB ANSI output (varies with changes)            │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Memory Layout

```
Screen Buffer (BGRA Format)
────────────────────────────────────────────────────────────────
Offset:    0         4         8         12        16
           ┌─────────┬─────────┬─────────┬─────────┬─────────
           │ B G R A │ B G R A │ B G R A │ B G R A │ ...
           └─────────┴─────────┴─────────┴─────────┴─────────
           Pixel 0    Pixel 1   Pixel 2   Pixel 3

Stride = Width × 4 bytes


Terminal Cell Buffer
────────────────────────────────────────────────────────────────
              Column 0      Column 1      Column 2
            ┌────────────┬────────────┬────────────┬────
Row 0       │ Top    Bot │ Top    Bot │ Top    Bot │ ...
            │ RGB    RGB │ RGB    RGB │ RGB    RGB │
            ├────────────┼────────────┼────────────┼────
Row 1       │ Top    Bot │ Top    Bot │ Top    Bot │ ...
            │ RGB    RGB │ RGB    RGB │ RGB    RGB │
            ├────────────┼────────────┼────────────┼────
            │    ...     │    ...     │    ...     │

Each cell: 6 bytes (2 × RGB)
Total: Width × Height × 6 bytes
```

---

## Module Reference

### Capture Module (`Capture/`)

#### `IScreenCapture` Interface

The unified interface for all capture implementations:

```csharp
public interface IScreenCapture : IDisposable
{
    // Display information
    int Width { get; }
    int Height { get; }
    int Stride { get; }
    PixelFormat Format { get; }
    
    // Capture methods
    CaptureResult CaptureFrame(Span<byte> buffer);
    CaptureResult CaptureFrame(out byte[] buffer);
    
    // Statistics
    CaptureStatistics Statistics { get; }
    
    // State management
    bool Reinitialize();
    void WaitForNextFrame(int timeoutMs);
}
```

#### `DxgiCapture`

High-performance capture using DXGI Desktop Duplication API:

**Advantages:**

- Zero-copy GPU texture access
- Minimal CPU overhead
- Hardware cursor overlay
- Dirty region tracking
- Move region optimization

**Technical Details:**

```
DXGI Pipeline:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Desktop     │───▶│ Output      │───▶│ Staging     │───▶│ CPU Memory  │
│ Compositor  │    │ Duplication │    │ Texture     │    │ (Map/Unmap) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

#### `GdiCapture`

Universal fallback using GDI (Graphics Device Interface):

**Advantages:**

- Works on all Windows versions
- No GPU requirements
- Simple and reliable

**Technical Details:**

```
GDI Pipeline:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Desktop DC  │───▶│ Memory DC   │───▶│ DIB Section │
│ (GetDC)     │    │ (CreateDC)  │    │ (BitBlt)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Frame Buffer Module (`FrameBuffer/`)

#### `Pixel` Structure

```csharp
[StructLayout(LayoutKind.Sequential, Pack = 1)]
public readonly struct Pixel : IEquatable<Pixel>
{
    public readonly byte R;
    public readonly byte G;
    public readonly byte B;
    
    // Color operations
    public byte ToGrayscale();                    // ITU-R BT.709 luminance
    public float GetLuminance();                  // Normalized 0-1
    public (float H, float S, float L) ToHsl();  // HSL color space
    public (float L, float A, float B) ToLab();  // CIELAB color space
    
    // Color distance
    public float DistanceRgb(Pixel other);       // Euclidean RGB
    public float DistanceCiede2000(Pixel other); // Perceptual (recommended)
    
    // Interpolation
    public static Pixel Lerp(Pixel a, Pixel b, float t);
    public static Pixel BilinearSample(Pixel tl, Pixel tr, Pixel bl, Pixel br, float fx, float fy);
}
```

#### `TerminalCell` Structure

```csharp
public struct TerminalCell : IEquatable<TerminalCell>
{
    public Pixel Top;      // Foreground color (▀ upper half)
    public Pixel Bottom;   // Background color (lower half)
    
    public bool IsMonochrome => Top.Equals(Bottom);
    public Pixel GetAverageColor();
}
```

#### `FrameBufferManager`

Handles downscaling and cell conversion:

```csharp
public class FrameBufferManager : IDisposable
{
    // Configuration
    public int SourceWidth { get; }
    public int SourceHeight { get; }
    public int TerminalWidth { get; }
    public int TerminalHeight { get; }
    public ScaleMode ScaleMode { get; set; }
    
    // Processing
    public void ProcessFrame(ReadOnlySpan<byte> bgraData, ColorMode colorMode);
    public void ProcessFrameParallel(ReadOnlySpan<byte> bgraData, ColorMode colorMode);
    
    // Access
    public ref TerminalCell GetCell(int col, int row);
    public ReadOnlySpan<TerminalCell> GetRow(int row);
    
    // Resize
    public void Resize(int newTermWidth, int newTermHeight);
}
```

**Scaling Modes:**

| Mode       | Quality | Speed   | Use Case                        |
|------------|---------|---------|---------------------------------|
| `Fit`      | Good    | Fast    | Preserve aspect ratio           |
| `Fill`     | Good    | Fast    | Fill terminal, crop overflow    |
| `Stretch`  | Basic   | Fastest | Use every terminal cell         |
| `Pixel`    | Sharp   | Fast    | Pixel-perfect where possible    |

### Diff Engine Module (`DiffEngine/`)

#### `DiffEngine`

Optimizes rendering by detecting changed cells:

```csharp
public class DiffEngine
{
    // Configuration
    public int Width { get; }
    public int Height { get; }
    public DiffStrategy Strategy { get; set; }
    public float ChangeThreshold { get; set; }
    
    // Core operations
    public DiffResult ComputeDiff(FrameBufferManager current);
    public void Reset();  // Force full redraw next frame
    
    // Statistics
    public DiffStatistics Statistics { get; }
}

public readonly struct DiffResult
{
    public ReadOnlySpan<CellChange> Changes { get; }
    public int TotalCells { get; }
    public int ChangedCells { get; }
    public float ChangeRatio { get; }
    public bool RequiresFullRedraw { get; }
}
```

**Diff Strategies:**

| Strategy     | Description                             |
|--------------|-----------------------------------------|
| `Exact`      | Byte-by-byte comparison (default)       |
| `Perceptual` | Uses color distance threshold           |
| `Region`     | Groups changes into rectangular regions |
| `Adaptive`   | Switches strategy based on change ratio |

### Renderer Module (`Renderer/`)

#### `AnsiRenderer`

Generates terminal output:

```csharp
public class AnsiRenderer : IDisposable
{
    // Configuration
    public ColorMode ColorMode { get; set; }
    public bool UseSynchronizedOutput { get; set; }
    public bool OptimizeColorChanges { get; set; }
    
    // Rendering
    public void RenderFull(FrameBufferManager buffer);
    public void RenderDiff(FrameBufferManager buffer, DiffResult diff);
    public void RenderRegion(FrameBufferManager buffer, int x, int y, int w, int h);
    
    // Screen control
    public void Clear();
    public void SetCursorVisible(bool visible);
    public void MoveCursor(int col, int row);
    public void SaveCursor();
    public void RestoreCursor();
    
    // Statistics
    public RenderStatistics Statistics { get; }
}
```

**ANSI Escape Sequences:**

| Sequence                 | Purpose                   |
|--------------------------|---------------------------|
| `\x1b[H`                 | Home cursor               |
| `\x1b[{r};{c}H`          | Position cursor           |
| `\x1b[38;2;{r};{g};{b}m` | Foreground truecolor      |
| `\x1b[48;2;{r};{g};{b}m` | Background truecolor      |
| `\x1b[38;5;{n}m`         | Foreground 256-color      |
| `\x1b[48;5;{n}m`         | Background 256-color      |
| `\x1b[0m`                | Reset attributes          |
| `\x1b[?25l`              | Hide cursor               |
| `\x1b[?25h`              | Show cursor               |
| `\x1b[2J`                | Clear screen              |
| `\x1b[?2026h`            | Begin synchronized update |
| `\x1b[?2026l`            | End synchronized update   |

### Input Module (`InputBridge/`)

#### `InputBridge`

Handles terminal input and Windows input injection:

```csharp
public class InputBridge : IDisposable
{
    // Configuration
    public bool MouseEnabled { get; set; }
    public bool KeyboardEnabled { get; set; }
    public float MouseScale { get; set; }
    
    // Processing
    public void ProcessInput(FrameBufferManager frameBuffer);
    public void InjectMouseMove(int screenX, int screenY);
    public void InjectMouseClick(MouseButton button, bool down);
    public void InjectKeyPress(VirtualKey key, bool down);
    
    // Coordinate translation
    public (int x, int y) TerminalToScreen(int col, int row);
    
    // Statistics
    public InputStatistics Statistics { get; }
}
```

**SGR Mouse Protocol:**

G2C uses SGR (Select Graphic Rendition) mouse encoding:

```
Format: \x1b[<Btn;Col;Row[Mm]

Examples:
  \x1b[<0;10;5M   - Left button press at column 10, row 5
  \x1b[<0;10;5m   - Left button release at column 10, row 5
  \x1b[<35;10;5M  - Mouse move at column 10, row 5
  \x1b[<64;10;5M  - Scroll up at column 10, row 5
  \x1b[<65;10;5M  - Scroll down at column 10, row 5
```

---

## Configuration

### Configuration File

G2C can be configured via `g2c.config.json`:

```json
{
    "display": {
        "fps": 30,
        "colorMode": "truecolor",
        "grayscale": false,
        "scaleMode": "bilinear",
        "manualScale": null
    },
    "capture": {
        "method": "auto",
        "monitor": 0,
        "region": null,
        "includeHardwareCursor": true
    },
    "input": {
        "mouseEnabled": true,
        "keyboardEnabled": true,
        "mouseScale": 1.0
    },
    "performance": {
        "diffEnabled": true,
        "simdEnabled": true,
        "parallelProcessing": false,
        "bufferCount": 2
    },
    "logging": {
        "level": "info",
        "file": null,
        "console": true,
        "async": true
    }
}
```

### Configuration Precedence

1. Command line arguments (highest priority)
2. Environment variables
3. Configuration file
4. Built-in defaults (lowest priority)

---

## Performance Optimization

### Optimization Tips

#### Terminal Size

Smaller terminals require less processing:

```bash
# Optimal for SSH: 80×24 = 1,920 cells
# Good balance: 120×40 = 4,800 cells
# Maximum practical: 200×60 = 12,000 cells
```

#### Frame Rate Selection

| Scenario      | Recommended FPS | Rationale         |
|---------------|-----------------|-------------------|
| Local viewing | 60              | Smooth updates    |
| LAN SSH       | 30              | Good balance      |
| WAN SSH       | 15              | Reduce bandwidth  |
| Monitoring    | 5-10            | Minimal resources |

#### Color Mode Selection

| Mode      | Bytes/Cell | Use Case          |
|-----------|------------|-------------------|
| Truecolor | ~25        | Full quality      |
| 256-color | ~12        | SSH compatibility |
| 16-color  | ~8         | Legacy terminals  |
| Grayscale | ~10        | Minimum bandwidth |

#### SIMD Optimization

G2C uses SIMD (AVX2/SSE) for:

- Pixel averaging during scaling
- Color space conversions
- Diff computation

Enable with:

```bash
g2c.exe --simd  # Enabled by default if supported
```

---

## Terminal Compatibility

### Compatibility Matrix

| Terminal         | Truecolor | 256-Color | Mouse | Sync Output | Notes           |
|------------------|-----------|-----------|-------|-------------|-----------------|
| Windows Terminal | Yes       | Yes       | Yes   | Yes         | Recommended     |
| Alacritty        | Yes       | Yes       | Yes   | Yes         | GPU accelerated |
| ConEmu           | Yes       | Yes       | Yes   | Partial     | Good fallback   |
| Hyper            | Yes       | Yes       | Yes   | Yes         | Electron-based  |
| mintty           | Yes       | Yes       | Yes   | Yes         | Cygwin/MSYS2    |
| iTerm2           | Yes       | Yes       | Yes   | Yes         | macOS (SSH)     |
| Kitty            | Yes       | Yes       | Yes   | Yes         | Linux (SSH)     |
| cmd.exe          | Partial   | Yes       | No    | No          | Limited support |
| PowerShell ISE   | No        | Partial   | No    | No          | Not recommended |
| PuTTY            | No        | Yes       | Yes   | No          | 256-color only  |

### Terminal Detection

G2C automatically detects terminal capabilities:

```bash
# Force specific color mode
g2c.exe --color=256
```

### SSH Configuration

For best results over SSH:

```bash
# Client-side (.ssh/config)
Host myserver
    SetEnv COLORTERM=truecolor
    SetEnv TERM=xterm-256color
    Compression yes
    
# Server-side
export COLORTERM=truecolor
export TERM=xterm-256color
```

---

## Advanced Topics

### Half-Block Rendering

G2C uses the Unicode upper-half block character (`▀` U+2580) to achieve 2:1 vertical pixel density:

```
Standard character cell:       Half-block rendering:
┌───────────┐                 ┌───────────┐
│           │                 │███████████│ ← Foreground (top pixel)
│     A     │                 │           │ ← Background (bottom pixel)
│           │                 └───────────┘
└───────────┘                 Character: ▀

1 character = 1 pixel          1 character = 2 pixels
Aspect ratio: 2:1              Aspect ratio: 1:1 (approximately)
```

### Color Distance Metrics

G2C supports multiple color distance calculations for perceptual diff:

| Metric        | Formula                                | Use Case          |
|---------------|----------------------------------------|-------------------|
| RGB Euclidean | `√((r₁-r₂)² + (g₁-g₂)² + (b₁-b₂)²)`    | Fast, simple      |
| Weighted RGB  | `√(2(r₁-r₂)² + 4(g₁-g₂)² + 3(b₁-b₂)²)` | Better perception |
| CIEDE2000     | Complex LAB formula                    | Best accuracy     |

### Memory Management

G2C uses several strategies to minimize GC pressure:

1. **Object Pooling**: Reusable frame buffers
2. **Span<T>**: Stack-allocated views into data
3. **ArrayPool**: Rented arrays for temporary storage
4. **Value Types**: Structs for Pixel, Cell, etc.

### Multi-Monitor And Region Capture

Multi-monitor selection and region capture are reserved CLI options but are not implemented in the current binary. Passing `--monitor` or `--region` returns a configuration error instead of being silently ignored.

---

## Troubleshooting

### Diagnostic Commands

```bash
# Show CLI help
g2c.exe --help

# Show version and runtime information
g2c.exe --version

# Show render performance overlay
g2c.exe --debug --stats
```

### Common Issues

#### Issue: "DXGI capture failed"

**Symptoms:** Falls back to GDI, reduced performance

**Causes & Solutions:**

| Cause              | Solution                            |
|--------------------|-------------------------------------|
| RDP session        | Run locally, not via Remote Desktop |
| Outdated Windows   | Update to Windows 10 1903+          |
| GPU not compatible | Update graphics drivers             |
| Secure Desktop     | Can't capture UAC prompts           |

#### Issue: Colors look wrong

**Symptoms:** Washed out, banded, or incorrect colors

**Causes & Solutions:**

| Cause                  | Solution                  |
|------------------------|---------------------------|
| No truecolor support   | Use `--color=256`         |
| Terminal misconfigured | Set `COLORTERM=truecolor` |
| Color profile mismatch | Check monitor ICC profile |

#### Issue: Mouse not working

**Symptoms:** Clicks not registering or wrong position

**Causes & Solutions:**

| Cause                   | Solution                |
|-------------------------|-------------------------|
| No admin rights         | Run as Administrator    |
| Mouse tracking disabled | Check terminal settings |
| Scale factor wrong      | Use `--mouse-scale`     |
| UAC blocking            | Disable UAC or accept   |

#### Issue: Low frame rate

**Symptoms:** FPS well below target, stuttering

**Causes & Solutions:**

| Cause           | Solution               |
|-----------------|------------------------|
| Large terminal  | Reduce terminal size   |
| Slow capture    | Check `--debug` output |
| Slow terminal   | Use faster terminal    |
| High resolution | Lower target FPS       |

### Debug Mode

Enable comprehensive debugging:

```bash
g2c.exe --debug --log-level=trace --log-file=debug.log
```

Debug output format:

```
[G2C] Frame 1234 | FPS: 29.8 | Cap: 8ms | Scale: 5ms | Diff: 2ms | Render: 12ms
      Changed: 847/4800 (17.6%) | DXGI | Truecolor | SIMD: AVX2
      Memory: 45.2 MB | GC0: 12 | GC1: 2 | GC2: 0
```

---

## API Reference

See [API.md](docs/API.md) for complete API documentation.

### Quick Reference

```csharp
// Basic usage
using var capture = ScreenCaptureFactory.Create();
using var renderer = new AnsiRenderer(ColorMode.TrueColor);
using var diffEngine = new DiffEngine(termWidth, termHeight);
using var frameBuffer = new FrameBufferManager(
    capture.Width, capture.Height, termWidth, termHeight);

while (running)
{
    if (capture.CaptureFrame(out byte[] data).Success)
    {
        frameBuffer.ProcessFrame(data, ColorMode.TrueColor);
        var diff = diffEngine.ComputeDiff(frameBuffer);
        
        if (diff.RequiresFullRedraw)
            renderer.RenderFull(frameBuffer);
        else
            renderer.RenderDiff(frameBuffer, diff);
    }
    
    Thread.Sleep(frameDelayMs);
}
```

---

## Development

### Building

```bash
# Debug build
dotnet build -c Debug

# Release build
dotnet build -c Release

# Run tests
dotnet test

# Generate coverage report
dotnet test --collect:"XPlat Code Coverage"
```

### Project Structure

```
G2C/
├── G2C.csproj                    # Project file
├── Program.cs                    # Entry point and main loop
├── Configuration.cs              # CLI argument parsing
├── TerminalUtils.cs              # Terminal detection and setup
│
├── Capture/                      # Screen capture implementations
│   ├── IScreenCapture.cs         # Capture interface
│   ├── DxgiCapture.cs            # DXGI Desktop Duplication
│   ├── GdiCapture.cs             # GDI fallback
│   └── ScreenCaptureFactory.cs   # Factory pattern
│
├── FrameBuffer/                  # Frame processing
│   ├── Pixel.cs                  # Pixel and color structures
│   └── FrameBufferManager.cs     # Scaling and cell conversion
│
├── DiffEngine/                   # Change detection
│   └── DiffEngine.cs             # Diff computation
│
├── Renderer/                     # Output generation
│   └── AnsiRenderer.cs           # ANSI escape sequence generation
│
├── InputBridge/                  # Input handling
│   └── InputBridge.cs            # Mouse bridging
│
├── Color/                        # Color processing
│   └── ColorProcessor.cs         # Color space conversions
│
├── Diagnostics/                  # Performance monitoring
│   └── PerformanceMetrics.cs     # Timing and statistics
│
└── Logging/                      # Logging infrastructure
    └── Logger.cs                 # Structured logging
```

### Code Style

- C# 12 with nullable reference types enabled
- XML documentation on all public APIs
- Unit tests for all modules
- Benchmark tests for performance-critical code

---

## Changelog

### Version 1.0.0

- Initial release
- DXGI and GDI capture support
- Truecolor, 256-color, and 16-color output modes
- Fit, fill, stretch, and pixel-perfect scaling
- Half-block, quadrant, braille, full-block, and shade character modes
- Diff-based rendering optimization
- Mouse input bridging
- Performance metrics and logging

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/DefinetlyNotAI/g2c.git
cd g2c/G2C
dotnet restore
dotnet build
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**G2C** - *Bringing your desktop to the terminal, one half-block at a time.*

[Report Bug](https://github.com/yourusername/g2c/issues) | [Request Feature](https://github.com/yourusername/g2c/issues) | [Documentation](https://github.com/yourusername/g2c/wiki)

</div>
