// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// Program.cs - Application entry point and main render loop
// ============================================================================

using System.Diagnostics;
using System.Runtime.CompilerServices;
using G2C;
using G2C.Capture;
using G2C.DiffEngine;
using G2C.FrameBuffer;
using G2C.InputBridge;
using G2C.Renderer;

// ============================================================================
// Application Entry Point
// ============================================================================

return await RunApplication(args);

static async Task<int> RunApplication(string[] args)
{
    // Parse configuration from command line
    var config = Configuration.Parse(args);

    // Handle help/version requests
    if (config.ShowHelp)
    {
        Configuration.PrintUsage();
        return 0;
    }

    if (config.ShowVersion)
    {
        Configuration.PrintVersion();
        return 0;
    }

    // Validate configuration
    var validationErrors = config.Validate();
    if (validationErrors.Count > 0)
    {
        Console.Error.WriteLine("Configuration errors:");
        foreach (var error in validationErrors)
        {
            Console.Error.WriteLine($"  - {error}");
        }
        return 1;
    }

    // Setup console for proper rendering
    if (!TerminalUtils.SetupConsole())
    {
        Console.Error.WriteLine("[G2C] Failed to setup console. Ensure you're running in a compatible terminal.");
        return 1;
    }

    // Initialize all components
    using var app = new G2CApplication(config);

    try
    {
        return await app.RunAsync();
    }
    catch (OperationCanceledException)
    {
        return 0;
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"\n[G2C] Fatal error: {ex.Message}");
        if (config.ShowDebugInfo)
        {
            Console.Error.WriteLine(ex.StackTrace);
        }
        return 1;
    }
}

// ============================================================================
// Main Application Class
// ============================================================================

/// <summary>
/// Main application class that orchestrates all G2C components.
/// Implements IDisposable for proper resource cleanup.
/// </summary>
sealed class G2CApplication : IDisposable
{
    private readonly Configuration _config;
    private readonly CancellationTokenSource _cts;
    
    // Components
    private IScreenCapture? _capture;
    private FrameBufferManager? _frameBuffer;
    private AnsiRenderer? _renderer;
    private DiffEngine? _diffEngine;
    private InputBridge? _inputBridge;
    
    // Screen dimensions
    private int _screenWidth;
    private int _screenHeight;
    
    // Terminal dimensions (can change during runtime)
    private int _termWidth;
    private int _termHeight;
    
    // Performance tracking
    private readonly Stopwatch _stopwatch = Stopwatch.StartNew();
    private readonly PerformanceTracker _perfTracker = new();
    
    // State
    private bool _isInitialized;
    private bool _isDisposed;

    public G2CApplication(Configuration config)
    {
        _config = config;
        _cts = new CancellationTokenSource();
        
        // Setup Ctrl+C handler
        Console.CancelKeyPress += OnCancelKeyPress;
    }

    /// <summary>
    /// Runs the main application loop.
    /// </summary>
    public async Task<int> RunAsync()
    {
        // Initialize all components
        if (!Initialize())
        {
            return 1;
        }

        // Display startup info
        PrintStartupInfo();

        // Brief pause to show info
        await Task.Delay(1500, _cts.Token);

        // Enter main render loop
        await MainLoopAsync();

        return 0;
    }

    /// <summary>
    /// Initializes all application components.
    /// </summary>
    private bool Initialize()
    {
        try
        {
            // Create screen capture
            _capture = ScreenCaptureFactory.Create(_config.PreferredCaptureMethod);
            (_screenWidth, _screenHeight) = _capture.GetScreenSize();

            if (_screenWidth <= 0 || _screenHeight <= 0)
            {
                Console.Error.WriteLine("[G2C] Failed to detect screen dimensions.");
                return false;
            }

            // Get terminal size
            (_termWidth, _termHeight) = TerminalUtils.GetTerminalSize();

            if (_termWidth <= 0 || _termHeight <= 0)
            {
                Console.Error.WriteLine("[G2C] Failed to detect terminal dimensions.");
                return false;
            }

            // Create frame buffer with scaling configuration
            _frameBuffer = new FrameBufferManager(
                _screenWidth, _screenHeight,
                _termWidth, _termHeight,
                _config.Grayscale,
                _config.ScaleMode,
                _config.CustomScale);

            // Create diff engine
            _diffEngine = new DiffEngine(_config.NoDiff);

            // Create renderer with appropriate color mode
            var colorMode = _config.Grayscale ? ColorMode.Grayscale : ColorMode.TrueColor;
            _renderer = new AnsiRenderer(
                _termWidth, _termHeight,
                colorMode,
                useAlternateBuffer: true,
                enableSynchronizedOutput: _config.UseSynchronizedOutput);

            _renderer.Initialize();

            // Create input bridge if mouse is enabled
            if (_config.EnableMouse)
            {
                _inputBridge = new InputBridge(
                    _screenWidth, _screenHeight,
                    _frameBuffer.TerminalToScreen);

                if (_inputBridge.EnableMouse())
                {
                    _inputBridge.Start();
                }
                else
                {
                    Console.Error.WriteLine("[G2C] Warning: Failed to enable mouse input.");
                }
            }

            _isInitialized = true;
            return true;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[G2C] Initialization failed: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Prints startup information to the console.
    /// </summary>
    private void PrintStartupInfo()
    {
        string captureMethod = _capture switch
        {
            DxgiCapture => "DXGI Desktop Duplication",
            GdiCapture => "GDI BitBlt",
            _ => "Unknown"
        };

        Console.WriteLine("╔══════════════════════════════════════════════════════════════╗");
        Console.WriteLine("║                   G2C - GUI to CLI                           ║");
        Console.WriteLine("║          Render your desktop in the terminal                 ║");
        Console.WriteLine("╠══════════════════════════════════════════════════════════════╣");
        Console.WriteLine($"║  Screen:     {_screenWidth}x{_screenHeight} pixels".PadRight(65) + "║");
        Console.WriteLine($"║  Terminal:   {_termWidth}x{_termHeight} cells".PadRight(65) + "║");
        Console.WriteLine($"║  Capture:    {captureMethod}".PadRight(65) + "║");
        Console.WriteLine($"║  Target FPS: {_config.TargetFps}".PadRight(65) + "║");
        Console.WriteLine($"║  Scale:      {_config.ScaleMode}".PadRight(65) + "║");
        Console.WriteLine($"║  Grayscale:  {(_config.Grayscale ? "Yes" : "No")}".PadRight(65) + "║");
        Console.WriteLine($"║  Diff:       {(_config.NoDiff ? "Disabled" : "Enabled")}".PadRight(65) + "║");
        Console.WriteLine($"║  Mouse:      {(_config.EnableMouse ? "Enabled" : "Disabled")}".PadRight(65) + "║");
        Console.WriteLine("╠══════════════════════════════════════════════════════════════╣");
        Console.WriteLine("║  Press Ctrl+C to exit                                        ║");
        Console.WriteLine("╚══════════════════════════════════════════════════════════════╝");
        Console.WriteLine();
    }

    /// <summary>
    /// Main render loop.
    /// </summary>
    private async Task MainLoopAsync()
    {
        // Frame timing
        long targetFrameTimeMs = 1000 / _config.TargetFps;
        int lastTermWidth = _termWidth;
        int lastTermHeight = _termHeight;
        bool isFirstFrame = true;

        // Get capture method name for debug display
        string captureMethodShort = _capture is DxgiCapture ? "DXGI" : "GDI";

        while (!_cts.Token.IsCancellationRequested)
        {
            long frameStart = _stopwatch.ElapsedMilliseconds;

            // Check for terminal resize
            if (await HandleTerminalResizeAsync(ref lastTermWidth, ref lastTermHeight))
            {
                isFirstFrame = true; // Force full redraw after resize
            }

            // Capture frame
            long captureStart = _stopwatch.ElapsedMilliseconds;
            byte[] rawBuffer = _frameBuffer!.GetRawBuffer();
            
            if (!_capture!.CaptureFrame(rawBuffer, out int capturedWidth, out int capturedHeight))
            {
                // No new frame available, yield briefly
                await Task.Delay(1, _cts.Token);
                continue;
            }
            
            long captureTime = _stopwatch.ElapsedMilliseconds - captureStart;

            // Process frame (downscale to terminal resolution)
            long processStart = _stopwatch.ElapsedMilliseconds;
            _frameBuffer.ProcessFrame();
            long processTime = _stopwatch.ElapsedMilliseconds - processStart;

            // Compute diff between frames
            long diffStart = _stopwatch.ElapsedMilliseconds;
            var updates = _diffEngine!.ComputeDiff(
                _frameBuffer.CurrentFrame,
                _frameBuffer.PreviousFrame,
                _termWidth, _termHeight,
                out var diffStats);
            long diffTime = _stopwatch.ElapsedMilliseconds - diffStart;

            // Render frame
            long renderStart = _stopwatch.ElapsedMilliseconds;
            RenderFrame(updates, isFirstFrame);
            long renderTime = _stopwatch.ElapsedMilliseconds - renderStart;

            isFirstFrame = false;

            // Update performance tracking
            _perfTracker.RecordFrame(captureTime, processTime, diffTime, renderTime, updates.Count);

            // Render debug overlay if enabled
            if (_config.ShowDebugInfo)
            {
                _renderer!.RenderDebugInfo(
                    _perfTracker.CurrentFps,
                    captureTime,
                    renderTime,
                    updates.Count,
                    _termWidth * _termHeight,
                    captureMethodShort,
                    diffStats);
            }

            // Frame rate limiting
            long frameTime = _stopwatch.ElapsedMilliseconds - frameStart;
            if (frameTime < targetFrameTimeMs)
            {
                int sleepTime = (int)(targetFrameTimeMs - frameTime);
                if (sleepTime > 0)
                {
                    await Task.Delay(sleepTime, _cts.Token);
                }
            }
        }
    }

    /// <summary>
    /// Renders a frame using the most efficient method.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void RenderFrame(List<CellUpdate> updates, bool forceFullRedraw)
    {
        int totalCells = _termWidth * _termHeight;
        
        // Decide rendering strategy
        bool useFullRedraw = forceFullRedraw || 
                            updates.Count > totalCells / 2 ||
                            updates.Count == totalCells;

        if (useFullRedraw)
        {
            _renderer!.RenderFullFrame(_frameBuffer!.CurrentFrame);
        }
        else if (updates.Count > 0)
        {
            var runs = _diffEngine!.OptimizeUpdates(updates, _termWidth);
            _renderer!.RenderRuns(runs);
        }
    }

    /// <summary>
    /// Handles terminal resize events.
    /// </summary>
    private async Task<bool> HandleTerminalResizeAsync(ref int lastWidth, ref int lastHeight)
    {
        if (!TerminalUtils.HasTerminalSizeChanged(lastWidth, lastHeight))
            return false;

        var (newWidth, newHeight) = TerminalUtils.GetTerminalSize();
        
        if (newWidth == lastWidth && newHeight == lastHeight)
            return false;

        lastWidth = newWidth;
        lastHeight = newHeight;
        _termWidth = newWidth;
        _termHeight = newHeight;

        // Resize all components
        _frameBuffer!.Resize(newWidth, newHeight);
        _renderer!.Resize(newWidth, newHeight);
        _diffEngine!.ResetAdaptiveState();

        // Reinitialize renderer for clean slate
        _renderer.Initialize();

        // Brief delay to let terminal settle
        await Task.Delay(50, _cts.Token);

        return true;
    }

    private void OnCancelKeyPress(object? sender, ConsoleCancelEventArgs e)
    {
        e.Cancel = true; // Prevent immediate termination
        _cts.Cancel();
    }

    public void Dispose()
    {
        if (_isDisposed) return;
        _isDisposed = true;

        // Unregister event handler
        Console.CancelKeyPress -= OnCancelKeyPress;

        // Cancel any pending operations
        _cts.Cancel();

        // Dispose components in reverse order of creation
        _inputBridge?.Dispose();
        _renderer?.Dispose();
        _diffEngine?.Dispose();
        _frameBuffer?.Dispose();
        _capture?.Dispose();

        // Print farewell message
        Console.WriteLine();
        Console.WriteLine("[G2C] Session statistics:");
        Console.WriteLine($"  Total frames:   {_perfTracker.TotalFrames}");
        Console.WriteLine($"  Average FPS:    {_perfTracker.AverageFps:F1}");
        Console.WriteLine($"  Avg capture:    {_perfTracker.AverageCaptureTimeMs:F2}ms");
        Console.WriteLine($"  Avg render:     {_perfTracker.AverageRenderTimeMs:F2}ms");
        Console.WriteLine("[G2C] Goodbye!");

        _cts.Dispose();
    }
}

// ============================================================================
// Performance Tracking
// ============================================================================

/// <summary>
/// Tracks rendering performance metrics.
/// </summary>
sealed class PerformanceTracker
{
    private readonly Stopwatch _fpsStopwatch = Stopwatch.StartNew();
    private int _frameCount;
    private int _fpsFrameCount;
    private long _fpsStartTime;
    
    private double _totalCaptureTimeMs;
    private double _totalProcessTimeMs;
    private double _totalDiffTimeMs;
    private double _totalRenderTimeMs;
    private long _totalCellsUpdated;
    
    private double _currentFps;

    public long TotalFrames => _frameCount;
    public double CurrentFps => _currentFps;
    public double AverageFps => _frameCount > 0 
        ? _frameCount * 1000.0 / _fpsStopwatch.ElapsedMilliseconds 
        : 0;
    public double AverageCaptureTimeMs => _frameCount > 0 ? _totalCaptureTimeMs / _frameCount : 0;
    public double AverageProcessTimeMs => _frameCount > 0 ? _totalProcessTimeMs / _frameCount : 0;
    public double AverageDiffTimeMs => _frameCount > 0 ? _totalDiffTimeMs / _frameCount : 0;
    public double AverageRenderTimeMs => _frameCount > 0 ? _totalRenderTimeMs / _frameCount : 0;
    public double AverageCellsPerFrame => _frameCount > 0 ? _totalCellsUpdated / (double)_frameCount : 0;

    public void RecordFrame(long captureMs, long processMs, long diffMs, long renderMs, int cellsUpdated)
    {
        _frameCount++;
        _fpsFrameCount++;
        
        _totalCaptureTimeMs += captureMs;
        _totalProcessTimeMs += processMs;
        _totalDiffTimeMs += diffMs;
        _totalRenderTimeMs += renderMs;
        _totalCellsUpdated += cellsUpdated;

        // Update FPS every second
        long now = _fpsStopwatch.ElapsedMilliseconds;
        if (now - _fpsStartTime >= 1000)
        {
            _currentFps = _fpsFrameCount * 1000.0 / (now - _fpsStartTime);
            _fpsFrameCount = 0;
            _fpsStartTime = now;
        }
    }
}
