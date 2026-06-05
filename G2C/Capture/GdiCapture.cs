// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// Capture/GdiCapture.cs - GDI-based screen capture fallback
// ============================================================================

using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

namespace G2C.Capture;

/// <summary>
/// Fallback screen capture using Windows GDI (Graphics Device Interface).
/// Used when DXGI Desktop Duplication is unavailable.
/// 
/// Advantages:
/// - Universal Windows compatibility (works on all versions)
/// - Simple and reliable
/// - Works even when DXGI fails (remote desktop, some VMs)
/// 
/// Disadvantages:
/// - Higher CPU usage compared to DXGI
/// - Higher latency (no GPU acceleration)
/// - May not capture hardware-accelerated content (some videos)
/// </summary>
public sealed class GdiCapture : IScreenCapture
{
    // Screen dimensions
    private int _screenWidth;
    private int _screenHeight;

    // GDI handles
    private nint _hdcScreen;
    private nint _hdcMemory;
    private nint _hBitmap;
    private nint _hOldBitmap;
    private BITMAPINFO _bitmapInfo;

    // State
    private bool _initialized;
    private bool _disposed;
    private readonly object _captureLock = new();

    // Performance tracking
    private long _framesCaptured;
    private long _framesDropped;
    private double _totalCaptureTimeMs;
    private double _lastCaptureTimeMs;
    private readonly Stopwatch _captureStopwatch = new();

    public bool IsAvailable { get; private set; }
    public string Name => "GDI BitBlt";

    public GdiCapture()
    {
        try
        {
            Initialize();
        }
        catch (Exception ex)
        {
            CleanupGdiResources();
            Debug.WriteLine($"[GdiCapture] Initialization failed: {ex.Message}");
            IsAvailable = false;
        }
    }

    private void Initialize()
    {
        // Get primary monitor dimensions
        _screenWidth = GetSystemMetrics(SM_CXSCREEN);
        _screenHeight = GetSystemMetrics(SM_CYSCREEN);

        if (_screenWidth <= 0 || _screenHeight <= 0)
        {
            throw new InvalidOperationException(
                $"Invalid screen dimensions: {_screenWidth}x{_screenHeight}");
        }

        // Get DC for the entire screen
        _hdcScreen = GetDC(nint.Zero);
        if (_hdcScreen == nint.Zero)
        {
            throw new InvalidOperationException(
                $"Failed to get screen DC. Error: {Marshal.GetLastWin32Error()}");
        }

        // Create a compatible memory DC
        _hdcMemory = CreateCompatibleDC(_hdcScreen);
        if (_hdcMemory == nint.Zero)
        {
            ReleaseDC(nint.Zero, _hdcScreen);
            throw new InvalidOperationException(
                $"Failed to create compatible DC. Error: {Marshal.GetLastWin32Error()}");
        }

        // Create a compatible bitmap
        _hBitmap = CreateCompatibleBitmap(_hdcScreen, _screenWidth, _screenHeight);
        if (_hBitmap == nint.Zero)
        {
            DeleteDC(_hdcMemory);
            ReleaseDC(nint.Zero, _hdcScreen);
            throw new InvalidOperationException(
                $"Failed to create bitmap. Error: {Marshal.GetLastWin32Error()}");
        }

        // Select bitmap into memory DC
        _hOldBitmap = SelectObject(_hdcMemory, _hBitmap);
        if (_hOldBitmap == nint.Zero)
        {
            DeleteObject(_hBitmap);
            DeleteDC(_hdcMemory);
            ReleaseDC(nint.Zero, _hdcScreen);
            throw new InvalidOperationException("Failed to select bitmap into DC");
        }

        // Setup BITMAPINFO for GetDIBits
        // Using negative height for top-down DIB (origin at top-left)
        _bitmapInfo = new BITMAPINFO
        {
            bmiHeader = new BITMAPINFOHEADER
            {
                biSize = (uint)Marshal.SizeOf<BITMAPINFOHEADER>(),
                biWidth = _screenWidth,
                biHeight = -_screenHeight, // Negative = top-down
                biPlanes = 1,
                biBitCount = 32, // BGRA format
                biCompression = BI_RGB,
                biSizeImage = checked((uint)GetRequiredBufferSize())
            }
        };

        _initialized = true;
        IsAvailable = true;
    }

    /// <summary>
    /// Captures the current screen frame.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    public bool CaptureFrame(byte[] buffer, out int width, out int height)
    {
        width = _screenWidth;
        height = _screenHeight;

        if (!_initialized || _disposed)
        {
            Interlocked.Increment(ref _framesDropped);
            return false;
        }

        if (buffer == null || buffer.Length < GetRequiredBufferSize())
        {
            Interlocked.Increment(ref _framesDropped);
            return false;
        }

        lock (_captureLock)
        {
            _captureStopwatch.Restart();

            try
            {
                // BitBlt: copy screen to memory DC
                // Using SRCCOPY | CAPTUREBLT to capture layered windows
                if (!BitBlt(_hdcMemory, 0, 0, _screenWidth, _screenHeight,
                    _hdcScreen, 0, 0, SRCCOPY | CAPTUREBLT))
                {
                    Debug.WriteLine($"[GdiCapture] BitBlt failed: {Marshal.GetLastWin32Error()}");
                    Interlocked.Increment(ref _framesDropped);
                    return false;
                }

                // GetDIBits: copy bitmap data to buffer
                unsafe
                {
                    fixed (byte* pBuffer = buffer)
                    {
                        int scanLines = GetDIBits(
                            _hdcMemory, _hBitmap,
                            0, (uint)_screenHeight,
                            (nint)pBuffer,
                            ref _bitmapInfo,
                            DIB_RGB_COLORS);

                        if (scanLines != _screenHeight)
                        {
                            Debug.WriteLine($"[GdiCapture] GetDIBits returned {scanLines} lines, expected {_screenHeight}");
                            Interlocked.Increment(ref _framesDropped);
                            return false;
                        }
                    }
                }

                _captureStopwatch.Stop();
                _lastCaptureTimeMs = _captureStopwatch.Elapsed.TotalMilliseconds;
                _totalCaptureTimeMs += _lastCaptureTimeMs;
                Interlocked.Increment(ref _framesCaptured);

                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[GdiCapture] Exception: {ex.Message}");
                Interlocked.Increment(ref _framesDropped);
                return false;
            }
        }
    }

    /// <summary>
    /// Captures the current screen frame into a span.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    public bool CaptureFrame(Span<byte> buffer, out int width, out int height)
    {
        width = _screenWidth;
        height = _screenHeight;

        if (!_initialized || _disposed)
        {
            Interlocked.Increment(ref _framesDropped);
            return false;
        }

        if (buffer.Length < GetRequiredBufferSize())
        {
            Interlocked.Increment(ref _framesDropped);
            return false;
        }

        lock (_captureLock)
        {
            _captureStopwatch.Restart();

            try
            {
                if (!BitBlt(_hdcMemory, 0, 0, _screenWidth, _screenHeight,
                    _hdcScreen, 0, 0, SRCCOPY | CAPTUREBLT))
                {
                    Interlocked.Increment(ref _framesDropped);
                    return false;
                }

                unsafe
                {
                    fixed (byte* pBuffer = buffer)
                    {
                        int scanLines = GetDIBits(
                            _hdcMemory, _hBitmap,
                            0, (uint)_screenHeight,
                            (nint)pBuffer,
                            ref _bitmapInfo,
                            DIB_RGB_COLORS);

                        if (scanLines != _screenHeight)
                        {
                            Interlocked.Increment(ref _framesDropped);
                            return false;
                        }
                    }
                }

                _captureStopwatch.Stop();
                _lastCaptureTimeMs = _captureStopwatch.Elapsed.TotalMilliseconds;
                _totalCaptureTimeMs += _lastCaptureTimeMs;
                Interlocked.Increment(ref _framesCaptured);

                return true;
            }
            catch
            {
                Interlocked.Increment(ref _framesDropped);
                return false;
            }
        }
    }

    public (int Width, int Height) GetScreenSize() => (_screenWidth, _screenHeight);

    public int GetRequiredBufferSize() => checked(_screenWidth * _screenHeight * 4);

    public CaptureStats GetStats()
    {
        long captured = Interlocked.Read(ref _framesCaptured);
        long dropped = Interlocked.Read(ref _framesDropped);
        double avgMs = captured > 0 ? _totalCaptureTimeMs / captured : 0;
        long bytes = captured * GetRequiredBufferSize();

        return new CaptureStats(captured, dropped, avgMs, _lastCaptureTimeMs, bytes);
    }

    /// <summary>
    /// Resets the capture state. Useful after display mode changes.
    /// </summary>
    public void Reset()
    {
        lock (_captureLock)
        {
            // Check if screen dimensions changed
            int newWidth = GetSystemMetrics(SM_CXSCREEN);
            int newHeight = GetSystemMetrics(SM_CYSCREEN);

            if (newWidth != _screenWidth || newHeight != _screenHeight)
            {
                // Cleanup old resources
                CleanupGdiResources();

                // Reinitialize with new dimensions
                _screenWidth = 0;
                _screenHeight = 0;
                _initialized = false;

                Initialize();
            }
        }
    }

    private void CleanupGdiResources()
    {
        if (_hOldBitmap != nint.Zero && _hdcMemory != nint.Zero)
        {
            SelectObject(_hdcMemory, _hOldBitmap);
            _hOldBitmap = nint.Zero;
        }

        if (_hBitmap != nint.Zero)
        {
            DeleteObject(_hBitmap);
            _hBitmap = nint.Zero;
        }

        if (_hdcMemory != nint.Zero)
        {
            DeleteDC(_hdcMemory);
            _hdcMemory = nint.Zero;
        }

        if (_hdcScreen != nint.Zero)
        {
            ReleaseDC(nint.Zero, _hdcScreen);
            _hdcScreen = nint.Zero;
        }

        _initialized = false;
        IsAvailable = false;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        lock (_captureLock)
        {
            CleanupGdiResources();
        }

        GC.SuppressFinalize(this);
    }

    ~GdiCapture()
    {
        Dispose();
    }

    #region Native Interop

    private const int SM_CXSCREEN = 0;
    private const int SM_CYSCREEN = 1;
    private const uint SRCCOPY = 0x00CC0020;
    private const uint CAPTUREBLT = 0x40000000; // Include layered windows
    private const uint BI_RGB = 0;
    private const uint DIB_RGB_COLORS = 0;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int GetSystemMetrics(int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern nint GetDC(nint hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int ReleaseDC(nint hWnd, nint hDC);

    [DllImport("gdi32.dll", SetLastError = true)]
    private static extern nint CreateCompatibleDC(nint hdc);

    [DllImport("gdi32.dll", SetLastError = true)]
    private static extern nint CreateCompatibleBitmap(nint hdc, int nWidth, int nHeight);

    [DllImport("gdi32.dll", SetLastError = true)]
    private static extern nint SelectObject(nint hdc, nint hgdiobj);

    [DllImport("gdi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DeleteObject(nint hObject);

    [DllImport("gdi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DeleteDC(nint hdc);

    [DllImport("gdi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool BitBlt(
        nint hdcDest, int nXDest, int nYDest, int nWidth, int nHeight,
        nint hdcSrc, int nXSrc, int nYSrc, uint dwRop);

    [DllImport("gdi32.dll", SetLastError = true)]
    private static extern int GetDIBits(
        nint hdc, nint hbmp,
        uint uStartScan, uint cScanLines,
        nint lpvBits, ref BITMAPINFO lpbi, uint uUsage);

    [StructLayout(LayoutKind.Sequential)]
    private struct BITMAPINFOHEADER
    {
        public uint biSize;
        public int biWidth;
        public int biHeight;
        public ushort biPlanes;
        public ushort biBitCount;
        public uint biCompression;
        public uint biSizeImage;
        public int biXPelsPerMeter;
        public int biYPelsPerMeter;
        public uint biClrUsed;
        public uint biClrImportant;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct BITMAPINFO
    {
        public BITMAPINFOHEADER bmiHeader;
        // bmiColors array follows in memory but we don't use it
    }

    #endregion
}
