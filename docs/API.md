# G2C API Reference

Complete API documentation for all public classes and interfaces in the G2C project.

## Table of Contents

1. [Core Interfaces](#core-interfaces)
2. [Capture Module](#capture-module)
3. [FrameBuffer Module](#framebuffer-module)
4. [DiffEngine Module](#diffengine-module)
5. [Renderer Module](#renderer-module)
6. [InputBridge Module](#inputbridge-module)
7. [Diagnostics Module](#diagnostics-module)
8. [Configuration](#configuration)
9. [Utility Classes](#utility-classes)

---

## Core Interfaces

### IScreenCapture

The primary interface for screen capture implementations.

```csharp
namespace G2C.Capture
{
    /// <summary>
    /// Interface for screen capture implementations.
    /// Implementations must be thread-safe for initialization and disposal.
    /// </summary>
    public interface IScreenCapture : IDisposable
    {
        /// <summary>
        /// Gets the current capture status and statistics.
        /// </summary>
        CaptureStatus Status { get; }
        
        /// <summary>
        /// Gets the dimensions of the captured screen.
        /// </summary>
        ScreenDimensions Dimensions { get; }
        
        /// <summary>
        /// Initializes the capture system for the specified monitor.
        /// </summary>
        /// <param name="monitorIndex">Zero-based monitor index, or -1 for all monitors.</param>
        /// <returns>True if initialization succeeded.</returns>
        bool Initialize(int monitorIndex = 0);
        
        /// <summary>
        /// Captures a single frame into the provided buffer.
        /// </summary>
        /// <param name="buffer">Pre-allocated buffer for BGRA pixel data.</param>
        /// <returns>Result indicating success, timeout, or error.</returns>
        CaptureResult CaptureFrame(Span<byte> buffer);
        
        /// <summary>
        /// Captures a frame with region-of-interest optimization.
        /// </summary>
        /// <param name="buffer">Pre-allocated buffer.</param>
        /// <param name="region">Region to capture, or null for full screen.</param>
        /// <returns>Capture result with dirty rectangle information.</returns>
        CaptureResult CaptureFrame(Span<byte> buffer, Rectangle? region);
        
        /// <summary>
        /// Reinitializes capture after a recoverable error.
        /// </summary>
        /// <returns>True if reinitialization succeeded.</returns>
        bool Reinitialize();
    }
}
```

### CaptureResult

```csharp
/// <summary>
/// Result of a capture operation.
/// </summary>
public readonly struct CaptureResult
{
    /// <summary>Status code for the capture operation.</summary>
    public CaptureStatus Status { get; init; }
    
    /// <summary>True if frame data is valid and can be processed.</summary>
    public bool Success { get; init; }
    
    /// <summary>Regions that changed since the last frame (DXGI only).</summary>
    public ReadOnlyMemory<Rectangle> DirtyRectangles { get; init; }
    
    /// <summary>Time taken to capture in milliseconds.</summary>
    public double CaptureTimeMs { get; init; }
    
    /// <summary>Frame number (monotonically increasing).</summary>
    public long FrameNumber { get; init; }
    
    /// <summary>Timestamp when capture completed.</summary>
    public DateTime Timestamp { get; init; }
}

/// <summary>
/// Status codes for capture operations.
/// </summary>
public enum CaptureStatus
{
    /// <summary>Frame captured successfully.</summary>
    Success,
    
    /// <summary>Timeout waiting for new frame (screen unchanged).</summary>
    Timeout,
    
    /// <summary>Access lost, reinitialize required.</summary>
    AccessLost,
    
    /// <summary>Capture not initialized.</summary>
    NotInitialized,
    
    /// <summary>Unrecoverable error occurred.</summary>
    Error
}
```

---

## Capture Module

### DxgiCapture

High-performance capture using DXGI Desktop Duplication API.

```csharp
namespace G2C.Capture
{
    /// <summary>
    /// DXGI Desktop Duplication capture implementation.
    /// Provides high-performance GPU-accelerated screen capture on Windows 8+.
    /// </summary>
    /// <remarks>
    /// Features:
    /// - Direct GPU memory access (minimal CPU overhead)
    /// - Dirty rectangle tracking
    /// - Hardware cursor compositing
    /// - Automatic recovery from access lost events
    /// 
    /// Limitations:
    /// - Requires Windows 8 or later
    /// - May fail in Remote Desktop sessions
    /// - Requires appropriate GPU drivers
    /// </remarks>
    public sealed class DxgiCapture : IScreenCapture
    {
        /// <summary>
        /// Creates a new DXGI capture instance.
        /// </summary>
        /// <param name="options">Optional configuration options.</param>
        public DxgiCapture(DxgiCaptureOptions? options = null);
        
        /// <summary>
        /// Gets whether the current system supports DXGI capture.
        /// </summary>
        public static bool IsSupported { get; }
        
        /// <summary>
        /// Gets available monitors for capture.
        /// </summary>
        public static IReadOnlyList<MonitorInfo> GetMonitors();
    }
    
    /// <summary>
    /// Configuration options for DXGI capture.
    /// </summary>
    public sealed class DxgiCaptureOptions
    {
        /// <summary>Timeout in milliseconds for frame acquisition. Default: 100.</summary>
        public int AcquireTimeoutMs { get; set; } = 100;
        
        /// <summary>Whether to include the hardware cursor. Default: true.</summary>
        public bool IncludeCursor { get; set; } = true;
        
        /// <summary>Maximum retry attempts for reinitialization. Default: 3.</summary>
        public int MaxReinitAttempts { get; set; } = 3;
        
        /// <summary>Whether to use staging texture for CPU access. Default: true.</summary>
        public bool UseStagingTexture { get; set; } = true;
    }
}
```

### GdiCapture

Fallback capture using GDI BitBlt operations.

```csharp
namespace G2C.Capture
{
    /// <summary>
    /// GDI-based screen capture implementation.
    /// Provides universal compatibility but lower performance than DXGI.
    /// </summary>
    /// <remarks>
    /// Features:
    /// - Works on all Windows versions
    /// - Works in Remote Desktop sessions
    /// - Can capture specific windows by handle
    /// 
    /// Limitations:
    /// - Higher CPU usage than DXGI
    /// - No dirty rectangle tracking
    /// - May not capture hardware-accelerated content
    /// </remarks>
    public sealed class GdiCapture : IScreenCapture
    {
        /// <summary>
        /// Creates a GDI capture instance for full screen.
        /// </summary>
        public GdiCapture();
        
        /// <summary>
        /// Creates a GDI capture instance for a specific window.
        /// </summary>
        /// <param name="windowHandle">Handle to the window to capture.</param>
        public GdiCapture(IntPtr windowHandle);
        
        /// <summary>
        /// Finds a window by title and prepares for capture.
        /// </summary>
        /// <param name="windowTitle">Partial or full window title.</param>
        /// <returns>True if window was found.</returns>
        public bool SetTargetWindow(string windowTitle);
    }
}
```

### ScreenCaptureFactory

```csharp
namespace G2C.Capture
{
    /// <summary>
    /// Factory for creating screen capture instances with automatic fallback.
    /// </summary>
    public static class ScreenCaptureFactory
    {
        /// <summary>
        /// Creates the best available capture method for the current system.
        /// </summary>
        /// <param name="preferredMethod">Preferred capture method, or Auto.</param>
        /// <returns>Initialized capture instance.</returns>
        public static IScreenCapture Create(CaptureMethod preferredMethod = CaptureMethod.Auto);
        
        /// <summary>
        /// Creates a capture instance with full configuration.
        /// </summary>
        public static IScreenCapture Create(CaptureConfiguration config);
    }
    
    /// <summary>
    /// Available capture methods.
    /// </summary>
    public enum CaptureMethod
    {
        /// <summary>Automatically select best available method.</summary>
        Auto,
        
        /// <summary>DXGI Desktop Duplication (high performance).</summary>
        Dxgi,
        
        /// <summary>GDI BitBlt (compatibility fallback).</summary>
        Gdi
    }
}
```

---

## FrameBuffer Module

### Pixel

```csharp
namespace G2C.FrameBuffer
{
    /// <summary>
    /// Represents an RGB pixel with optional alpha channel.
    /// </summary>
    /// <remarks>
    /// This struct is optimized for memory layout and SIMD operations.
    /// Size: 4 bytes (same as BGRA format in memory).
    /// </remarks>
    [StructLayout(LayoutKind.Sequential)]
    public readonly struct Pixel : IEquatable<Pixel>
    {
        public readonly byte R;
        public readonly byte G;
        public readonly byte B;
        public readonly byte A;
        
        /// <summary>Creates a pixel from RGB values.</summary>
        public Pixel(byte r, byte g, byte b);
        
        /// <summary>Creates a pixel from RGBA values.</summary>
        public Pixel(byte r, byte g, byte b, byte a);
        
        /// <summary>Creates a grayscale pixel.</summary>
        public static Pixel FromGray(byte gray);
        
        /// <summary>Creates a pixel from HSL values.</summary>
        public static Pixel FromHsl(float h, float s, float l);
        
        /// <summary>Converts to grayscale using luminance formula.</summary>
        public byte ToGray();
        
        /// <summary>Calculates perceptual color distance (CIE76).</summary>
        public float DistanceTo(Pixel other);
        
        /// <summary>Linearly interpolates between two pixels.</summary>
        public static Pixel Lerp(Pixel a, Pixel b, float t);
        
        /// <summary>Blends this pixel over another using alpha.</summary>
        public Pixel BlendOver(Pixel background);
    }
}
```

### TerminalCell

```csharp
namespace G2C.FrameBuffer
{
    /// <summary>
    /// Represents a terminal cell with foreground and background colors.
    /// Uses the half-block rendering technique (▀) to display two pixels per cell.
    /// </summary>
    [StructLayout(LayoutKind.Sequential)]
    public readonly struct TerminalCell : IEquatable<TerminalCell>
    {
        /// <summary>Foreground color (top pixel) red component.</summary>
        public readonly byte FgR;
        /// <summary>Foreground color (top pixel) green component.</summary>
        public readonly byte FgG;
        /// <summary>Foreground color (top pixel) blue component.</summary>
        public readonly byte FgB;
        
        /// <summary>Background color (bottom pixel) red component.</summary>
        public readonly byte BgR;
        /// <summary>Background color (bottom pixel) green component.</summary>
        public readonly byte BgG;
        /// <summary>Background color (bottom pixel) blue component.</summary>
        public readonly byte BgB;
        
        /// <summary>Creates a cell from two pixels (top and bottom).</summary>
        public TerminalCell(Pixel top, Pixel bottom);
        
        /// <summary>Creates a cell from explicit color values.</summary>
        public TerminalCell(byte fgR, byte fgG, byte fgB, byte bgR, byte bgG, byte bgB);
        
        /// <summary>Gets the foreground (top) pixel.</summary>
        public Pixel Foreground => new(FgR, FgG, FgB);
        
        /// <summary>Gets the background (bottom) pixel.</summary>
        public Pixel Background => new(BgR, BgG, BgB);
        
        /// <summary>
        /// Checks equality with threshold for minor color variations.
        /// </summary>
        /// <param name="other">Cell to compare with.</param>
        /// <param name="threshold">Maximum RGB distance to consider equal.</param>
        public bool ApproximatelyEquals(TerminalCell other, int threshold);
    }
}
```

### FrameBufferManager

```csharp
namespace G2C.FrameBuffer
{
    /// <summary>
    /// Manages frame buffers, scaling, and pixel-to-cell conversion.
    /// </summary>
    /// <remarks>
    /// Thread Safety: Not thread-safe. Use separate instances for concurrent access.
    /// 
    /// Memory: Pre-allocates buffers to avoid GC pressure during rendering.
    /// Call Resize() when terminal dimensions change.
    /// </remarks>
    public sealed class FrameBufferManager : IDisposable
    {
        /// <summary>
        /// Creates a frame buffer manager for the specified dimensions.
        /// </summary>
        /// <param name="sourceWidth">Source image width in pixels.</param>
        /// <param name="sourceHeight">Source image height in pixels.</param>
        /// <param name="terminalColumns">Terminal width in characters.</param>
        /// <param name="terminalRows">Terminal height in rows.</param>
        /// <param name="options">Optional configuration.</param>
        public FrameBufferManager(
            int sourceWidth, int sourceHeight,
            int terminalColumns, int terminalRows,
            FrameBufferOptions? options = null);
        
        /// <summary>
        /// Processes a raw frame into terminal cells.
        /// </summary>
        /// <param name="rawBgra">Raw BGRA pixel data from capture.</param>
        /// <returns>2D array of terminal cells.</returns>
        public TerminalCell[,] ProcessFrame(ReadOnlySpan<byte> rawBgra);
        
        /// <summary>
        /// Resizes buffers for new dimensions.
        /// </summary>
        public void Resize(int sourceWidth, int sourceHeight, 
                          int terminalColumns, int terminalRows);
        
        /// <summary>
        /// Gets the current cell buffer (read-only view).
        /// </summary>
        public ReadOnlySpan2D<TerminalCell> CurrentCells { get; }
        
        /// <summary>
        /// Gets performance statistics for the last frame.
        /// </summary>
        public FrameBufferStats LastFrameStats { get; }
    }
    
    /// <summary>
    /// Configuration options for frame buffer processing.
    /// </summary>
    public sealed class FrameBufferOptions
    {
        /// <summary>Scaling algorithm to use. Default: Bilinear.</summary>
        public ScalingAlgorithm ScalingAlgorithm { get; set; } = ScalingAlgorithm.Bilinear;
        
        /// <summary>Scale factor (0.1 to 2.0). Default: 1.0.</summary>
        public float ScaleFactor { get; set; } = 1.0f;
        
        /// <summary>Whether to convert to grayscale. Default: false.</summary>
        public bool Grayscale { get; set; } = false;
        
        /// <summary>Whether to use SIMD acceleration. Default: true.</summary>
        public bool UseSIMD { get; set; } = true;
        
        /// <summary>Gamma correction value (1.0 = none). Default: 1.0.</summary>
        public float Gamma { get; set; } = 1.0f;
    }
    
    /// <summary>
    /// Available scaling algorithms.
    /// </summary>
    public enum ScalingAlgorithm
    {
        /// <summary>Nearest neighbor (fastest, pixelated).</summary>
        NearestNeighbor,
        
        /// <summary>Bilinear interpolation (good balance).</summary>
        Bilinear,
        
        /// <summary>Bicubic interpolation (smoother).</summary>
        Bicubic,
        
        /// <summary>Lanczos resampling (best quality, slowest).</summary>
        Lanczos
    }
}
```

---

## DiffEngine Module

### DiffEngine

```csharp
namespace G2C.DiffEngine
{
    /// <summary>
    /// Detects changes between frames and generates optimized change lists.
    /// </summary>
    /// <remarks>
    /// The diff engine maintains the previous frame state internally.
    /// For best performance, reuse the same instance across frames.
    /// 
    /// Optimization: Uses run-length encoding to batch consecutive changes,
    /// reducing the number of cursor movements needed.
    /// </remarks>
    public sealed class DiffEngine
    {
        /// <summary>
        /// Creates a diff engine with default settings.
        /// </summary>
        public DiffEngine();
        
        /// <summary>
        /// Creates a diff engine with custom options.
        /// </summary>
        public DiffEngine(DiffEngineOptions options);
        
        /// <summary>
        /// Computes changes between the current frame and the previous frame.
        /// </summary>
        /// <param name="currentFrame">The new frame to compare.</param>
        /// <returns>List of cell changes, optimized for rendering.</returns>
        public IReadOnlyList<CellChange> ComputeDiff(TerminalCell[,] currentFrame);
        
        /// <summary>
        /// Computes changes with region hints from capture.
        /// </summary>
        /// <param name="currentFrame">The new frame.</param>
        /// <param name="dirtyRegions">Regions known to have changed.</param>
        /// <returns>Optimized change list.</returns>
        public IReadOnlyList<CellChange> ComputeDiff(
            TerminalCell[,] currentFrame,
            ReadOnlySpan<Rectangle> dirtyRegions);
        
        /// <summary>
        /// Forces a full refresh on the next frame.
        /// </summary>
        public void InvalidateAll();
        
        /// <summary>
        /// Gets statistics from the last diff operation.
        /// </summary>
        public DiffStats LastDiffStats { get; }
    }
    
    /// <summary>
    /// Represents a cell change for rendering.
    /// </summary>
    public readonly struct CellChange
    {
        /// <summary>Column position (0-indexed).</summary>
        public readonly int Column;
        
        /// <summary>Row position (0-indexed).</summary>
        public readonly int Row;
        
        /// <summary>The new cell value.</summary>
        public readonly TerminalCell Cell;
        
        /// <summary>Number of consecutive cells with same colors (for RLE).</summary>
        public readonly int RunLength;
    }
    
    /// <summary>
    /// Configuration options for the diff engine.
    /// </summary>
    public sealed class DiffEngineOptions
    {
        /// <summary>
        /// Color threshold for considering cells equal (0-765).
        /// Higher values ignore more minor color differences.
        /// Default: 0 (exact match required).
        /// </summary>
        public int ColorThreshold { get; set; } = 0;
        
        /// <summary>
        /// Whether to use run-length encoding for consecutive changes.
        /// Default: true.
        /// </summary>
        public bool UseRunLengthEncoding { get; set; } = true;
        
        /// <summary>
        /// Minimum run length to encode (shorter runs are emitted individually).
        /// Default: 2.
        /// </summary>
        public int MinRunLength { get; set; } = 2;
    }
    
    /// <summary>
    /// Statistics from a diff operation.
    /// </summary>
    public readonly struct DiffStats
    {
        /// <summary>Total cells in the frame.</summary>
        public int TotalCells { get; init; }
        
        /// <summary>Cells that changed.</summary>
        public int ChangedCells { get; init; }
        
        /// <summary>Cells skipped (unchanged).</summary>
        public int SkippedCells { get; init; }
        
        /// <summary>Percentage of cells skipped (0-100).</summary>
        public float SkipPercentage => TotalCells > 0 
            ? (SkippedCells * 100f) / TotalCells 
            : 0;
        
        /// <summary>Time taken in milliseconds.</summary>
        public double TimeMs { get; init; }
    }
}
```

---

## Renderer Module

### AnsiRenderer

```csharp
namespace G2C.Renderer
{
    /// <summary>
    /// Renders terminal cells as optimized ANSI escape sequences.
    /// </summary>
    /// <remarks>
    /// Optimization Techniques:
    /// - State tracking: Only emits color codes when colors change
    /// - Cursor optimization: Uses relative movement when shorter
    /// - String pooling: Reuses StringBuilder to avoid allocations
    /// - Run-length optimization: Batches consecutive same-color cells
    /// 
    /// Thread Safety: Not thread-safe. Use separate instances for concurrent rendering.
    /// </remarks>
    public sealed class AnsiRenderer
    {
        /// <summary>
        /// Creates a renderer with default settings (TrueColor mode).
        /// </summary>
        public AnsiRenderer();
        
        /// <summary>
        /// Creates a renderer with custom options.
        /// </summary>
        public AnsiRenderer(AnsiRendererOptions options);
        
        /// <summary>
        /// Renders cell changes to an ANSI escape sequence string.
        /// </summary>
        /// <param name="changes">Cell changes from the diff engine.</param>
        /// <returns>ANSI escape sequence string ready for output.</returns>
        public string Render(IReadOnlyList<CellChange> changes);
        
        /// <summary>
        /// Renders directly to a Span for zero-allocation output.
        /// </summary>
        /// <param name="changes">Cell changes to render.</param>
        /// <param name="output">Output buffer (must be large enough).</param>
        /// <returns>Number of characters written.</returns>
        public int Render(IReadOnlyList<CellChange> changes, Span<char> output);
        
        /// <summary>
        /// Gets the escape sequence to initialize the terminal.
        /// </summary>
        public string GetInitSequence();
        
        /// <summary>
        /// Gets the escape sequence to restore the terminal.
        /// </summary>
        public string GetResetSequence();
        
        /// <summary>
        /// Resets internal state (colors, cursor position).
        /// Call when terminal is cleared or resized.
        /// </summary>
        public void ResetState();
        
        /// <summary>
        /// Gets statistics from the last render operation.
        /// </summary>
        public RenderStats LastRenderStats { get; }
    }
    
    /// <summary>
    /// Configuration options for the ANSI renderer.
    /// </summary>
    public sealed class AnsiRendererOptions
    {
        /// <summary>Color output mode. Default: TrueColor.</summary>
        public ColorMode ColorMode { get; set; } = ColorMode.TrueColor;
        
        /// <summary>Character to use for cell rendering. Default: '▀'.</summary>
        public char CellCharacter { get; set; } = '▀';
        
        /// <summary>Initial buffer capacity. Default: 65536.</summary>
        public int BufferCapacity { get; set; } = 65536;
        
        /// <summary>Whether to use relative cursor movement. Default: true.</summary>
        public bool UseRelativeCursor { get; set; } = true;
        
        /// <summary>Whether to batch same-color cells. Default: true.</summary>
        public bool BatchSameColor { get; set; } = true;
    }
    
    /// <summary>
    /// Available color output modes.
    /// </summary>
    public enum ColorMode
    {
        /// <summary>24-bit RGB color (16.7M colors).</summary>
        TrueColor,
        
        /// <summary>256-color palette.</summary>
        Color256,
        
        /// <summary>16 standard ANSI colors.</summary>
        Color16,
        
        /// <summary>Grayscale (24 shades).</summary>
        Grayscale,
        
        /// <summary>ASCII art (no color, brightness via characters).</summary>
        Ascii
    }
}
```

---

## InputBridge Module

### InputBridge

```csharp
namespace G2C.InputBridge
{
    /// <summary>
    /// Bridges terminal input events to Windows input injection.
    /// Translates mouse coordinates from terminal space to screen space.
    /// </summary>
    /// <remarks>
    /// Security Note: Uses SendInput which requires appropriate privileges.
    /// May be blocked by UIPI when targeting elevated windows.
    /// 
    /// Mouse Protocol: Supports SGR extended mouse mode (\x1b[?1006h).
    /// Enable with: Console.Write("\x1b[?1000h\x1b[?1006h");
    /// </remarks>
    public sealed class InputBridge : IDisposable
    {
        /// <summary>
        /// Creates an input bridge for the specified dimensions.
        /// </summary>
        /// <param name="screenWidth">Screen width in pixels.</param>
        /// <param name="screenHeight">Screen height in pixels.</param>
        /// <param name="terminalColumns">Terminal columns.</param>
        /// <param name="terminalRows">Terminal rows.</param>
        public InputBridge(
            int screenWidth, int screenHeight,
            int terminalColumns, int terminalRows);
        
        /// <summary>
        /// Starts the input processing loop on a background thread.
        /// </summary>
        /// <param name="cancellationToken">Token to stop processing.</param>
        public void Start(CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Processes a single input sequence.
        /// </summary>
        /// <param name="input">Input sequence from terminal.</param>
        /// <returns>True if input was recognized and processed.</returns>
        public bool ProcessInput(ReadOnlySpan<char> input);
        
        /// <summary>
        /// Updates dimensions after terminal resize.
        /// </summary>
        public void UpdateDimensions(
            int screenWidth, int screenHeight,
            int terminalColumns, int terminalRows);
        
        /// <summary>
        /// Gets the escape sequence to enable mouse tracking.
        /// </summary>
        public static string GetMouseEnableSequence();
        
        /// <summary>
        /// Gets the escape sequence to disable mouse tracking.
        /// </summary>
        public static string GetMouseDisableSequence();
        
        /// <summary>
        /// Event raised when an unrecognized input sequence is received.
        /// </summary>
        public event EventHandler<string>? UnrecognizedInput;
    }
}
```

---

## Diagnostics Module

### PerformanceMetrics

```csharp
namespace G2C.Diagnostics
{
    /// <summary>
    /// Collects and reports performance metrics for profiling.
    /// </summary>
    /// <remarks>
    /// Uses high-resolution timing (Stopwatch) for accurate measurements.
    /// Maintains a rolling history of frame timings for trend analysis.
    /// 
    /// Usage:
    /// using var scope = metrics.Measure("Capture");
    /// // ... capture code ...
    /// // Measurement recorded automatically when scope disposes
    /// </remarks>
    public sealed class PerformanceMetrics
    {
        /// <summary>
        /// Creates a performance metrics collector.
        /// </summary>
        /// <param name="historySize">Number of frames to keep in history.</param>
        public PerformanceMetrics(int historySize = 100);
        
        /// <summary>
        /// Starts measuring a named operation.
        /// </summary>
        /// <param name="category">Category name (e.g., "Capture", "Render").</param>
        /// <returns>Disposable scope that records timing on dispose.</returns>
        public MeasurementScope Measure(string category);
        
        /// <summary>
        /// Records a manual timing measurement.
        /// </summary>
        /// <param name="category">Category name.</param>
        /// <param name="elapsedMs">Elapsed time in milliseconds.</param>
        public void Record(string category, double elapsedMs);
        
        /// <summary>
        /// Marks the end of a frame and calculates FPS.
        /// </summary>
        public void EndFrame();
        
        /// <summary>
        /// Gets the current frames per second.
        /// </summary>
        public double CurrentFps { get; }
        
        /// <summary>
        /// Gets average timing for a category.
        /// </summary>
        public double GetAverageMs(string category);
        
        /// <summary>
        /// Gets the 99th percentile timing for a category.
        /// </summary>
        public double GetP99Ms(string category);
        
        /// <summary>
        /// Generates a formatted performance report.
        /// </summary>
        public string GenerateReport();
        
        /// <summary>
        /// Resets all collected metrics.
        /// </summary>
        public void Reset();
    }
    
    /// <summary>
    /// Disposable scope for automatic timing measurement.
    /// </summary>
    public readonly struct MeasurementScope : IDisposable
    {
        public void Dispose();
    }
}
```

---

## Configuration

### Configuration Class

```csharp
namespace G2C
{
    /// <summary>
    /// Application configuration parsed from command-line arguments.
    /// </summary>
    public sealed class Configuration
    {
        /// <summary>Target frames per second. Default: 24.</summary>
        public int TargetFps { get; set; } = 24;
        
        /// <summary>Scaling factor (0.1 to 2.0). Default: 1.0.</summary>
        public float ScaleFactor { get; set; } = 1.0f;
        
        /// <summary>Preferred capture method. Default: Auto.</summary>
        public CaptureMethod CaptureMethod { get; set; } = CaptureMethod.Auto;
        
        /// <summary>Color output mode. Default: TrueColor.</summary>
        public ColorMode ColorMode { get; set; } = ColorMode.TrueColor;
        
        /// <summary>Scaling algorithm. Default: Bilinear.</summary>
        public ScalingAlgorithm ScalingAlgorithm { get; set; } = ScalingAlgorithm.Bilinear;
        
        /// <summary>Whether to enable diff-based rendering. Default: true.</summary>
        public bool EnableDiff { get; set; } = true;
        
        /// <summary>Whether to enable mouse input. Default: true.</summary>
        public bool EnableMouse { get; set; } = true;
        
        /// <summary>Whether to show debug output. Default: false.</summary>
        public bool Debug { get; set; } = false;
        
        /// <summary>Monitor index to capture. Default: 0.</summary>
        public int MonitorIndex { get; set; } = 0;
        
        /// <summary>Diff color threshold. Default: 0.</summary>
        public int DiffThreshold { get; set; } = 0;
        
        /// <summary>
        /// Parses configuration from command-line arguments.
        /// </summary>
        /// <param name="args">Command-line arguments.</param>
        /// <returns>Parsed configuration.</returns>
        /// <exception cref="ArgumentException">Thrown for invalid arguments.</exception>
        public static Configuration Parse(string[] args);
        
        /// <summary>
        /// Parses configuration, returning success status.
        /// </summary>
        /// <param name="args">Command-line arguments.</param>
        /// <param name="config">Parsed configuration if successful.</param>
        /// <param name="error">Error message if parsing failed.</param>
        /// <returns>True if parsing succeeded.</returns>
        public static bool TryParse(string[] args, out Configuration config, out string error);
        
        /// <summary>
        /// Gets the help text for all options.
        /// </summary>
        public static string GetHelpText();
    }
}
```

---

## Utility Classes

### TerminalUtils

```csharp
namespace G2C
{
    /// <summary>
    /// Utilities for terminal detection and configuration.
    /// </summary>
    public static class TerminalUtils
    {
        /// <summary>
        /// Gets information about the current terminal.
        /// </summary>
        public static TerminalInfo GetTerminalInfo();
        
        /// <summary>
        /// Gets the current terminal dimensions.
        /// </summary>
        /// <param name="columns">Output: number of columns.</param>
        /// <param name="rows">Output: number of rows.</param>
        /// <returns>True if dimensions could be determined.</returns>
        public static bool GetTerminalSize(out int columns, out int rows);
        
        /// <summary>
        /// Enables virtual terminal processing on Windows.
        /// </summary>
        /// <returns>True if successful.</returns>
        public static bool EnableVirtualTerminal();
        
        /// <summary>
        /// Checks if the terminal supports true color.
        /// </summary>
        public static bool SupportsTrueColor();
        
        /// <summary>
        /// Sets up console for raw input mode.
        /// </summary>
        /// <returns>Disposable that restores original mode.</returns>
        public static IDisposable EnableRawMode();
    }
    
    /// <summary>
    /// Information about the current terminal.
    /// </summary>
    public sealed class TerminalInfo
    {
        /// <summary>Terminal emulator name (if detectable).</summary>
        public string Name { get; init; } = "Unknown";
        
        /// <summary>Whether true color is supported.</summary>
        public bool SupportsTrueColor { get; init; }
        
        /// <summary>Whether 256 colors are supported.</summary>
        public bool Supports256Color { get; init; }
        
        /// <summary>Whether mouse tracking is supported.</summary>
        public bool SupportsMouse { get; init; }
        
        /// <summary>Whether running inside tmux.</summary>
        public bool InTmux { get; init; }
        
        /// <summary>Whether running over SSH.</summary>
        public bool OverSsh { get; init; }
    }
}
```

---

## Error Handling

### Common Exceptions

```csharp
namespace G2C
{
    /// <summary>
    /// Exception thrown when capture initialization fails.
    /// </summary>
    public class CaptureInitializationException : Exception
    {
        /// <summary>The capture method that failed.</summary>
        public CaptureMethod Method { get; }
        
        /// <summary>Suggested fallback method, if any.</summary>
        public CaptureMethod? SuggestedFallback { get; }
    }
    
    /// <summary>
    /// Exception thrown when terminal is not compatible.
    /// </summary>
    public class TerminalNotSupportedException : Exception
    {
        /// <summary>Missing capability.</summary>
        public string MissingCapability { get; }
    }
}
```

---

*This API reference is generated from XML documentation comments. For the most up-to-date documentation, see the source
code.*
