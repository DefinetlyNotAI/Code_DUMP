# G2C Architecture Guide

## System Overview

G2C (GUI to CLI) is a high-performance Windows desktop streaming application that renders
graphical desktop content in terminal emulators using ANSI escape sequences. This document
provides an in-depth look at the system architecture, data flow, and design decisions.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              G2C SYSTEM ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │   Screen    │───▶│    Frame    │───▶│    Diff     │───▶│    ANSI     │           │
│  │   Capture   │    │    Buffer   │    │   Engine    │    │   Renderer  │           │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘           │
│        │                  │                  │                  │                   │
│        │                  │                  │                  │                   │
│        ▼                  ▼                  ▼                  ▼                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │    DXGI     │    │   Bilinear  │    │   Changed   │    │   stdout    │           │
│  │    + GDI    │    │   Scaling   │    │    Cells    │    │   Buffer    │           │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘           │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                         INPUT BRIDGE (Bidirectional)                         │   │
│  │  Terminal stdin ◀──────────────────────────────────────▶ Windows SendInput   │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Table of Contents

1. [Core Components](#core-components)
2. [Data Flow Pipeline](#data-flow-pipeline)
3. [Memory Management](#memory-management)
4. [Threading Model](#threading-model)
5. [Performance Optimizations](#performance-optimizations)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Extension Points](#extension-points)

---

## Core Components

### 1. Screen Capture Subsystem

The capture subsystem is responsible for acquiring raw pixel data from the Windows desktop.

#### Component Hierarchy

```
IScreenCapture (Interface)
    │
    ├── DxgiCapture (Primary - High Performance)
    │   ├── Uses DXGI Desktop Duplication API
    │   ├── Direct GPU memory access
    │   ├── Hardware cursor compositing
    │   └── Multi-monitor support
    │
    └── GdiCapture (Fallback - Compatibility)
        ├── Uses GDI BitBlt operations
        ├── CPU-based capture
        ├── Universal compatibility
        └── Window-specific capture support
```

#### DXGI Capture Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        DXGI DESKTOP DUPLICATION FLOW                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   GPU VRAM                          CPU RAM                                  │
│   ┌─────────────┐                   ┌─────────────┐                          │
│   │  Desktop    │   AcquireNext     │   Staging   │   MapSubresource         │
│   │  Texture    │──────────────────▶│   Texture   │─────────────────────▶    │
│   │  (D3D11)    │   Frame           │  (CPU-Read) │                          │
│   └─────────────┘                   └─────────────┘                          │
│         │                                 │                                  │
│         │                                 ▼                                  │
│         │                           ┌─────────────┐                          │
│         │                           │  Raw BGRA   │                          │
│         │                           │   Pixels    │                          │
│         │                           │  (byte[])   │                          │
│         │                           └─────────────┘                          │
│         │                                 │                                  │
│         ▼                                 ▼                                  │
│   ┌─────────────┐                   ┌─────────────┐                          │
│   │   Cursor    │   Composite       │   Frame     │                          │
│   │   Texture   │──────────────────▶│   Buffer    │                          │
│   └─────────────┘                   └─────────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Key Implementation Details

**Dirty Rectangle Tracking:**

```csharp
// DXGI provides dirty rectangles indicating changed screen regions
DXGI_OUTDUPL_FRAME_INFO frameInfo;
duplicatedOutput.AcquireNextFrame(timeout, out frameInfo, out resource);

// Only process dirty regions for efficiency
if (frameInfo.TotalMetadataBufferSize > 0)
{
    // Get move rectangles and dirty rectangles
    duplicatedOutput.GetFrameMoveRects(...);
    duplicatedOutput.GetFrameDirtyRects(...);
}
```

**Automatic Recovery:**

```csharp
// Handle desktop switches, UAC prompts, resolution changes
catch (SharpDXException ex) when (ex.ResultCode == DXGI_ERROR_ACCESS_LOST)
{
    ReinitializeDuplication();  // Automatic recovery
}
```

### 2. Frame Buffer Manager

The frame buffer manager handles pixel storage, color conversion, and scaling operations.

#### Memory Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         FRAME BUFFER MEMORY LAYOUT                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Source Buffer (Screen Resolution)          Target Buffer (Terminal Size)  │
│  ┌────────────────────────────────┐        ┌──────────────────────────┐    │
│  │ 1920 x 1080 x 4 bytes          │        │ 160 x 48 x 4 bytes       │    │
│  │ = 8,294,400 bytes              │───────▶│ = 30,720 bytes           │    │
│  │ (BGRA format)                  │ Scale  │ (BGRA format)            │    │
│  └────────────────────────────────┘        └──────────────────────────┘    │
│                                                    │                       │
│                                                    ▼                       │
│                                            ┌──────────────────────────┐    │
│                                            │ Terminal Cell Buffer     │    │
│                                            │ 160 x 24 cells           │    │
│                                            │ (2 pixels per cell)      │    │
│                                            └──────────────────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Scaling Algorithms

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         SCALING ALGORITHM COMPARISON                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  NEAREST NEIGHBOR              BILINEAR                  BICUBIC           │
│  ┌───┬───┬───┬───┐            ┌───┬───┬───┬───┐        ┌───┬───┬───┬───┐   │
│  │ A │   │ B │   │            │ A │ ─ │ B │   │        │   │ A │ B │   │   │
│  ├───┼───┼───┼───┤            ├───┼───┼───┼───┤        ├───┼───┼───┼───┤   │
│  │   │ X │   │   │            │ │ │ X │ │ │   │        │ C │ X │ X │ D │   │
│  ├───┼───┼───┼───┤            ├───┼───┼───┼───┤        ├───┼───┼───┼───┤   │
│  │ C │   │ D │   │            │ C │ ─ │ D │   │        │ E │ X │ X │ F │   │
│  ├───┼───┼───┼───┤            ├───┼───┼───┼───┤        ├───┼───┼───┼───┤   │
│  │   │   │   │   │            │   │   │   │   │        │   │ G │ H │   │   │
│  └───┴───┴───┴───┘            └───┴───┴───┴───┘        └───┴───┴───┴───┘   │
│                                                                            │
│  X = nearest pixel             X = weighted avg          X = cubic interp  │
│  Speed: Fastest                of 4 neighbors            of 16 neighbors   │
│  Quality: Lowest               Speed: Fast               Speed: Slow       │
│                                Quality: Good             Quality: Best     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Bilinear Interpolation Formula:**

```
P = A(1-dx)(1-dy) + B(dx)(1-dy) + C(1-dx)(dy) + D(dx)(dy)

Where:
  - A, B, C, D are the four surrounding pixels
  - dx, dy are the fractional distances (0.0 to 1.0)
  - P is the interpolated result
```

### 3. Diff Engine

The diff engine minimizes terminal output by detecting and tracking changes between frames.

#### Change Detection Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          DIFF ENGINE STRATEGY                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Frame N                    Frame N+1                   Change Mask        │
│  ┌─────────────────┐       ┌─────────────────┐        ┌─────────────────┐  │
│  │░░░░░░░░░░░░░░░░░│       │░░░░░░░░░░░░░░░░░│        │                 │  │
│  │░░░░░░░░░░░░░░░░░│       │░░░░░░░░░░░░░░░░░│        │                 │  │
│  │░░░░████░░░░░░░░░│       │░░░░░░░░████░░░░░│   ──▶  │    ████████     │  │
│  │░░░░████░░░░░░░░░│       │░░░░░░░░████░░░░░│        │    ████████     │  │
│  │░░░░░░░░░░░░░░░░░│       │░░░░░░░░░░░░░░░░░│        │                 │  │
│  └─────────────────┘       └─────────────────┘        └─────────────────┘  │
│                                                                            │
│  Only changed cells (marked in change mask) are redrawn                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Cell Comparison with Threshold

```csharp
public bool CellsEqual(TerminalCell a, TerminalCell b, int threshold = 0)
{
    if (threshold == 0)
        return a.Equals(b);  // Exact match
    
    // Perceptual threshold - ignore minor color variations
    int dr = Math.Abs(a.FgR - b.FgR) + Math.Abs(a.BgR - b.BgR);
    int dg = Math.Abs(a.FgG - b.FgG) + Math.Abs(a.BgG - b.BgG);
    int db = Math.Abs(a.FgB - b.FgB) + Math.Abs(a.BgB - b.BgB);
    
    return (dr + dg + db) <= threshold;
}
```

#### Run-Length Optimization

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      RUN-LENGTH CHANGE OPTIMIZATION                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Without RLE:  Move to (5,3), draw cell                                    │
│                Move to (6,3), draw cell                                    │
│                Move to (7,3), draw cell                                    │
│                Move to (8,3), draw cell                                    │
│                = 4 cursor moves + 4 draws                                  │
│                                                                            │
│  With RLE:     Move to (5,3), draw 4 cells                                 │
│                = 1 cursor move + 4 draws                                   │
│                                                                            │
│  Savings:      3 cursor moves = ~18 bytes of escape sequences              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4. ANSI Renderer

The renderer converts terminal cells into optimized ANSI escape sequences.

#### Half-Block Rendering Technique

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     HALF-BLOCK CHARACTER RENDERING                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Traditional (1 pixel per cell):     Half-Block (2 pixels per cell):       │
│                                                                            │
│  ┌───┐                               ┌───┐                                 │
│  │   │ = 1 color                     │▀▀▀│ = foreground (top pixel)        │
│  └───┘                               │   │ = background (bottom pixel)     │
│                                      └───┘                                 │
│  Resolution: W x H                   Resolution: W x (H * 2)               │
│                                                                            │
│  Character: U+2580 UPPER HALF BLOCK  '▀'                                   │
│  Foreground color = top pixel RGB                                          │
│  Background color = bottom pixel RGB                                       │
│                                                                            │
│  Example:                                                                  │
│  ┌───────────────────────────────────────────────────────────┐             │
│  │  \x1b[38;2;255;0;0m      Set FG to red (top pixel)        │             │
│  │  \x1b[48;2;0;0;255m      Set BG to blue (bottom pixel)    │             │
│  │  ▀                       Print half-block                 │             │
│  └───────────────────────────────────────────────────────────┘             │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Escape Sequence Optimization

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    ANSI ESCAPE SEQUENCE OPTIMIZATION                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  UNOPTIMIZED OUTPUT (redundant sequences):                                 │
│  \x1b[38;2;255;128;64m\x1b[48;2;32;32;32m▀                                 │
│  \x1b[38;2;255;128;64m\x1b[48;2;32;32;32m▀  <-- Same colors, repeated!     │
│  \x1b[38;2;255;128;64m\x1b[48;2;32;32;32m▀                                 │
│                                                                            │
│  OPTIMIZED OUTPUT (state tracking):                                        │
│  \x1b[38;2;255;128;64m\x1b[48;2;32;32;32m▀▀▀  <-- Colors set once          │
│                                                                            │
│  Savings: ~38 bytes per repeated cell                                      │
│                                                                            │
│  ─────────────────────────────────────────────────────────────────────     │
│                                                                            │
│  CURSOR MOVEMENT OPTIMIZATION:                                             │
│                                                                            │
│  Sequential cells:  Just print characters (cursor auto-advances)           │
│  Same row jump:     \x1b[{n}C  (move right n columns)                      │
│  Different row:     \x1b[{row};{col}H  (absolute position)                 │
│                                                                            │
│  Decision tree:                                                            │
│  if (newCol == lastCol + 1 && newRow == lastRow)                           │
│      // No movement needed, cursor auto-advances                           │
│  else if (newRow == lastRow && newCol - lastCol < 5)                       │
│      // Use relative movement \x1b[{delta}C                                │
│  else                                                                      │
│      // Use absolute positioning \x1b[{row};{col}H                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Color Mode Fallbacks

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         COLOR MODE HIERARCHY                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  TRUECOLOR (24-bit)           256 COLOR                   16 COLOR         │
│  ┌─────────────────┐         ┌─────────────────┐        ┌─────────────┐    │
│  │ 16.7M colors    │         │ 256 colors      │        │ 16 colors   │    │
│  │ \x1b[38;2;R;G;Bm│         │ \x1b[38;5;Nm    │        │ \x1b[3Nm    │    │
│  │ Best quality    │         │ 216 color cube  │        │ Basic ANSI  │    │
│  │ Modern terms    │         │ + 24 grays      │        │ All terms   │    │
│  └─────────────────┘         └─────────────────┘        └─────────────┘    │
│         │                           │                          │           │
│         │ Not supported?            │ Not supported?           │           │
│         └──────────────────────────▶└─────────────────────────▶│           │
│                   Fallback                    Fallback                     │
│                                                                            │
│  256-Color Palette Mapping:                                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Colors 0-15:    * Standard ANSI colors                             │    │
│  │ Colors 16-231:  * 6x6x6 color cube (216 colors)                    │    │
│  │                 index = 16 + 36*r + 6*g + b  (r,g,b in 0-5)        │    │
│  │ Colors 232-255: * Grayscale ramp (24 shades)                       │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5. Input Bridge

The input bridge translates terminal input events to Windows input injection.

#### Mouse Coordinate Translation

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      MOUSE COORDINATE TRANSLATION                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Terminal Space                              Screen Space                  │
│  (Character Cells)                           (Pixels)                      │
│  ┌─────────────────────┐                    ┌─────────────────────────┐    │
│  │ (0,0)        (159,0)│                    │ (0,0)         (1919,0)  │    │
│  │                     │     Translation    │                         │    │
│  │     (80, 24)        │ ─────────────────▶ │      (960, 540)         │    │
│  │         ●           │                    │          ●              │    │
│  │                     │                    │                         │    │
│  │ (0,47)      (159,47)│                    │ (0,1079)     (1919,1079)│    │
│  └─────────────────────┘                    └─────────────────────────┘    │
│                                                                            │
│  Formula:                                                                  │
│  screenX = (termX * screenWidth) / terminalColumns                         │
│  screenY = (termY * 2 * screenHeight) / (terminalRows * 2)                 │
│                      ↑                                                     │
│                  Half-block doubles vertical resolution                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### SGR Mouse Protocol Parsing

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        SGR MOUSE PROTOCOL FORMAT                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Format: \x1b[<Btn;X;Y;M                                                   │
│                                                                            │
│  Where:                                                                    │
│    Btn = Button code + Modifier flags                                      │
│    X   = Column (1-based)                                                  │
│    Y   = Row (1-based)                                                     │
│    M   = 'M' for press, 'm' for release                                    │
│                                                                            │
│  Button codes:                                                             │
│    0 = Left button                                                         │
│    1 = Middle button                                                       │
│    2 = Right button                                                        │
│    64 = Scroll up                                                          │
│    65 = Scroll down                                                        │
│                                                                            │
│  Modifier flags (OR'd with button):                                        │
│    4  = Shift                                                              │
│    8  = Alt                                                                │
│    16 = Control                                                            │
│    32 = Motion (mouse moved while button held)                             │
│                                                                            │
│  Examples:                                                                 │
│    \x1b[<0;50;25M   = Left click at column 50, row 25                      │
│    \x1b[<0;50;25m   = Left release at column 50, row 25                    │
│    \x1b[<64;50;25M  = Scroll up at column 50, row 25                       │
│    \x1b[<32;60;30M  = Mouse motion at column 60, row 30                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Pipeline

### Complete Frame Pipeline

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE FRAME PIPELINE                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STAGE 1: CAPTURE (DxgiCapture / GdiCapture)                         │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Input:  Desktop surface                                             │   │
│  │ Output: byte[] rawPixels (BGRA, screen resolution)                  │   │
│  │ Time:   0.5-2ms (DXGI) / 5-15ms (GDI)                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STAGE 2: SCALE (FrameBufferManager)                                 │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Input:  byte[] rawPixels (1920x1080)                                │   │
│  │ Output: Pixel[,] scaledBuffer (160x96)                              │   │
│  │ Algorithm: Bilinear interpolation                                   │   │
│  │ Time:   1-3ms                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STAGE 3: CELL CONVERSION (FrameBufferManager)                       │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Input:  Pixel[,] scaledBuffer (160x96 pixels)                       │   │
│  │ Output: TerminalCell[,] cellBuffer (160x48 cells)                   │   │
│  │ Process: Pair vertical pixels into half-block cells                 │   │
│  │ Time:   0.5-1ms                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STAGE 4: DIFF (DiffEngine)                                          │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Input:  TerminalCell[,] currentFrame, TerminalCell[,] previousFrame │   │
│  │ Output: List<CellChange> changes                                    │   │
│  │ Process: Compare cells, emit only differences                       │   │
│  │ Time:   0.2-1ms                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STAGE 5: RENDER (AnsiRenderer)                                      │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Input:  List<CellChange> changes                                    │   │
│  │ Output: string ansiSequence (optimized escape codes)                │   │
│  │ Process: Generate cursor moves + color codes + characters           │   │
│  │ Time:   0.5-2ms                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STAGE 6: OUTPUT (Console.Write)                                     │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Input:  string ansiSequence                                         │   │
│  │ Output: Terminal display update                                     │   │
│  │ Time:   Variable (depends on terminal + data size)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  TOTAL PIPELINE TIME: 3-25ms per frame (40-333 FPS theoretical max)        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Memory Management

### Buffer Pooling Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         BUFFER POOLING STRATEGY                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Problem: Allocating large buffers every frame causes GC pressure          │
│                                                                            │
│  Solution: Pre-allocate and reuse buffers                                  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Buffer Pool                                │   │
│  │       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │       │ Raw Capture │  │   Scaled    │  │    Cell     │             │   │
│  │       │   Buffer    │  │   Buffer    │  │   Buffer    │             │   │
│  │       │  (8.3 MB)   │  │  (60 KB)    │  │  (30 KB)    │             │   │
│  │       └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  │              │                │                │                    │   │
│  │              └────────────────┼────────────────┘                    │   │
│  │                               ▼                                     │   │
│  │                       - Allocated once                              │   │
│  │                       - Reused every frame                          │   │
│  │                       - Zero GC allocations                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Implementation:                                                           │
│  private readonly byte[] _captureBuffer = new byte[1920 * 1080 * 4];       │
│  private readonly Pixel[,] _scaledBuffer = new Pixel[160, 96];             │
│  private readonly TerminalCell[,] _cellBuffer = new TerminalCell[160, 48]; │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Double Buffering for Diff

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      DOUBLE BUFFERING FOR DIFF                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Frame N:                                                                  │
│  ┌──────────────┐    ┌──────────────┐                                      │
│  │ Front Buffer │◀───│ Back Buffer  │                                      │
│  │ (Display)    │    │ (Render)     │                                      │
│  └──────────────┘    └──────────────┘                                      │
│                                                                            │
│  Frame N+1: (Swap)                                                         │
│  ┌──────────────┐    ┌──────────────┐                                      │
│  │ Back Buffer  │◀───│ Front Buffer │                                      │
│  │ (Display)    │    │ (Render)     │                                      │
│  └──────────────┘    └──────────────┘                                      │
│                                                                            │
│  Benefits:                                                                 │
│  - Previous frame always available for diff comparison                     │
│  - No buffer copying needed                                                │
│  - Just swap pointers/references                                           │
│                                                                            │
│  Code:                                                                     │
│  (_currentBuffer, _previousBuffer) = (_previousBuffer, _currentBuffer);    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Threading Model

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           THREADING MODEL                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                            MAIN THREAD                              │   │
│  │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐             │   │
│  │   │ Capture │──▶│  Scale  │──▶│  Diff   │──▶│ Render  │──▶ Output   │   │
│  │   └─────────┘   └─────────┘   └─────────┘   └─────────┘             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           INPUT THREAD                              │   │
│  │        ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │   │
│  │        │ Read stdin  │──▶│ Parse input │──▶│ SendInput() │          │   │
│  │        └─────────────┘   └─────────────┘   └─────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      RESIZE MONITOR THREAD                          │   │
│  │          ┌───────────────────┐   ┌───────────────────┐              │   │
│  │          │ Poll terminal size│──▶│ Signal main thread│              │   │
│  │          └───────────────────┘   └───────────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Synchronization:                                                          │
│  - CancellationToken for graceful shutdown                                 │
│  - Volatile bool for resize signaling                                      │
│  - No locks in hot path (single-threaded render pipeline)                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimizations

### SIMD Acceleration

```csharp
// Vector operations for bulk pixel processing
if (Vector.IsHardwareAccelerated && data.Length >= Vector<byte>.Count)
{
    int vectorSize = Vector<byte>.Count;
    int vectorEnd = data.Length - (data.Length % vectorSize);
    
    for (int i = 0; i < vectorEnd; i += vectorSize)
    {
        var vec = new Vector<byte>(data, i);
        // Process entire vector at once (16-32 bytes)
        var result = ProcessVector(vec);
        result.CopyTo(output, i);
    }
}
```

### Span<T> for Zero-Copy Operations

```csharp
// Avoid array allocations by using Span<T>
public void ProcessPixels(Span<byte> pixels)
{
    for (int i = 0; i < pixels.Length; i += 4)
    {
        // Direct memory access, no bounds checking in release
        byte b = pixels[i];
        byte g = pixels[i + 1];
        byte r = pixels[i + 2];
        // Process pixel...
    }
}
```

### StringBuilder Pooling

```csharp
// Reuse StringBuilder to avoid string allocations
private readonly StringBuilder _outputBuilder = new(65536);

public string Render(List<CellChange> changes)
{
    _outputBuilder.Clear();  // Reuse, don't reallocate
    
    foreach (var change in changes)
    {
        _outputBuilder.Append("\x1b[");
        _outputBuilder.Append(change.Row);
        // ... build escape sequence
    }
    
    return _outputBuilder.ToString();
}
```

---

## Error Handling Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       ERROR HANDLING STRATEGY                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  CAPTURE ERRORS                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Error: DXGI_ERROR_ACCESS_LOST                                       │   │
│  │ Cause: Desktop switch, UAC, screen saver, resolution change         │   │
│  │ Action: Reinitialize duplication, continue                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Error: DXGI_ERROR_WAIT_TIMEOUT                                      │   │
│  │ Cause: No desktop changes (static screen)                           │   │
│  │ Action: Skip frame, continue (not an error)                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Error: D3D11 device creation failed                                 │   │
│  │ Cause: No GPU, driver issues, remote desktop                        │   │
│  │ Action: Fall back to GDI capture                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  RENDER ERRORS                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Error: Console write failed                                         │   │
│  │ Cause: Broken pipe, terminal closed                                 │   │
│  │ Action: Clean exit with appropriate error code                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  INPUT ERRORS                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Error: SendInput failed                                             │   │
│  │ Cause: UIPI (User Interface Privilege Isolation)                    │   │
│  │ Action: Log warning, skip input (don't crash)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Extension Points

### Adding a New Capture Method

```csharp
// 1. Implement IScreenCapture
public class MyCustomCapture : IScreenCapture
{
    public bool Initialize(int monitorIndex) { /* ... */ }
    public CaptureResult CaptureFrame(Span<byte> buffer) { /* ... */ }
    public void Dispose() { /* ... */ }
}

// 2. Register in ScreenCaptureFactory
public static IScreenCapture Create(CaptureMethod method)
{
    return method switch
    {
        CaptureMethod.Dxgi => new DxgiCapture(),
        CaptureMethod.Gdi => new GdiCapture(),
        CaptureMethod.Custom => new MyCustomCapture(),  // Add here
        _ => throw new ArgumentException()
    };
}
```

### Adding a New Color Mode

```csharp
// 1. Add enum value
public enum ColorMode { TrueColor, Color256, Color16, Grayscale, MyMode }

// 2. Implement in AnsiRenderer
private string FormatColor(Pixel pixel, bool foreground)
{
    return _colorMode switch
    {
        ColorMode.TrueColor => $"\x1b[{(foreground ? 38 : 48)};2;{pixel.R};{pixel.G};{pixel.B}m",
        ColorMode.MyMode => FormatMyCustomColor(pixel, foreground),
        // ...
    };
}
```

### Adding a New Scaling Algorithm

```csharp
// 1. Add enum value
public enum ScalingAlgorithm { NearestNeighbor, Bilinear, Bicubic, Lanczos, MyAlgorithm }

// 2. Implement scaling method
private Pixel ScaleMyAlgorithm(float srcX, float srcY, Pixel[,] source)
{
    // Your custom algorithm implementation
}

// 3. Register in scale dispatcher
private Pixel SamplePixel(float x, float y)
{
    return _algorithm switch
    {
        ScalingAlgorithm.MyAlgorithm => ScaleMyAlgorithm(x, y, _source),
        // ...
    };
}
```

---

## Appendix: ANSI Escape Sequence Reference

| Sequence                 | Description                     |
|--------------------------|---------------------------------|
| `\x1b[H`                 | Move cursor to home (1,1)       |
| `\x1b[{r};{c}H`          | Move cursor to row r, column c  |
| `\x1b[{n}A`              | Move cursor up n rows           |
| `\x1b[{n}B`              | Move cursor down n rows         |
| `\x1b[{n}C`              | Move cursor right n columns     |
| `\x1b[{n}D`              | Move cursor left n columns      |
| `\x1b[38;2;{r};{g};{b}m` | Set foreground RGB color        |
| `\x1b[48;2;{r};{g};{b}m` | Set background RGB color        |
| `\x1b[38;5;{n}m`         | Set foreground 256-color        |
| `\x1b[48;5;{n}m`         | Set background 256-color        |
| `\x1b[0m`                | Reset all attributes            |
| `\x1b[?25l`              | Hide cursor                     |
| `\x1b[?25h`              | Show cursor                     |
| `\x1b[?1049h`            | Enable alternate screen buffer  |
| `\x1b[?1049l`            | Disable alternate screen buffer |
| `\x1b[?1000h`            | Enable mouse tracking           |
| `\x1b[?1006h`            | Enable SGR mouse mode           |
| `\x1b[2J`                | Clear entire screen             |

---

*This architecture document is maintained alongside the codebase. For implementation details, refer to the XML
documentation comments in each source file.*
