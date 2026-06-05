// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// Capture/GdiWindowCapture.cs - GDI-based target-window capture
// ============================================================================

using System.Diagnostics;
using System.Runtime.InteropServices;

namespace G2C.Capture;

/// <summary>
/// Captures a single top-level window by cropping the desktop DC to the window rectangle.
/// </summary>
public sealed class GdiWindowCapture : IScreenCapture
{
    private readonly nint _windowHandle;
    private readonly object _captureLock = new();

    private nint _hdcScreen;
    private nint _hdcMemory;
    private nint _hBitmap;
    private nint _hOldBitmap;
    private BITMAPINFO _bitmapInfo;
    private RECT _windowRect;
    private int _width;
    private int _height;
    private bool _initialized;
    private bool _disposed;

    private long _framesCaptured;
    private long _framesDropped;
    private double _totalCaptureTimeMs;
    private double _lastCaptureTimeMs;
    private readonly Stopwatch _captureStopwatch = new();

    public bool IsAvailable { get; private set; }
    public string Name => "GDI Window BitBlt";

    public GdiWindowCapture(nint windowHandle)
    {
        _windowHandle = windowHandle;

        try
        {
            Initialize();
        }
        catch (Exception ex)
        {
            CleanupGdiResources();
            Debug.WriteLine($"[GdiWindowCapture] Initialization failed: {ex.Message}");
            IsAvailable = false;
        }
    }

    private void Initialize()
    {
        if (!IsWindow(_windowHandle))
            throw new InvalidOperationException("Target window is no longer available.");

        if (IsIconic(_windowHandle))
            ShowWindow(_windowHandle, SW_RESTORE);

        if (!TryGetWindowDimensions(out RECT rect, out int width, out int height))
            throw new InvalidOperationException("Target window has invalid dimensions.");

        _windowRect = rect;
        _width = width;
        _height = height;

        _hdcScreen = GetDC(nint.Zero);
        if (_hdcScreen == nint.Zero)
            throw new InvalidOperationException($"Failed to get screen DC. Error: {Marshal.GetLastWin32Error()}");

        _hdcMemory = CreateCompatibleDC(_hdcScreen);
        if (_hdcMemory == nint.Zero)
            throw new InvalidOperationException($"Failed to create compatible DC. Error: {Marshal.GetLastWin32Error()}");

        _hBitmap = CreateCompatibleBitmap(_hdcScreen, _width, _height);
        if (_hBitmap == nint.Zero)
            throw new InvalidOperationException($"Failed to create bitmap. Error: {Marshal.GetLastWin32Error()}");

        _hOldBitmap = SelectObject(_hdcMemory, _hBitmap);
        if (_hOldBitmap == nint.Zero)
            throw new InvalidOperationException("Failed to select bitmap into DC.");

        _bitmapInfo = new BITMAPINFO
        {
            bmiHeader = new BITMAPINFOHEADER
            {
                biSize = (uint)Marshal.SizeOf<BITMAPINFOHEADER>(),
                biWidth = _width,
                biHeight = -_height,
                biPlanes = 1,
                biBitCount = 32,
                biCompression = BI_RGB,
                biSizeImage = checked((uint)GetRequiredBufferSize())
            }
        };

        _initialized = true;
        IsAvailable = true;
    }

    public bool CaptureFrame(byte[] buffer, out int width, out int height)
    {
        width = _width;
        height = _height;

        if (!_initialized || _disposed || !IsWindow(_windowHandle))
        {
            Interlocked.Increment(ref _framesDropped);
            return false;
        }

        lock (_captureLock)
        {
            if (RefreshWindowResourcesIfNeeded())
            {
                width = _width;
                height = _height;
            }

            if (buffer.Length < GetRequiredBufferSize())
            {
                Interlocked.Increment(ref _framesDropped);
                return false;
            }

            _captureStopwatch.Restart();

            try
            {
                if (!BitBlt(_hdcMemory, 0, 0, _width, _height, _hdcScreen,
                    _windowRect.Left, _windowRect.Top, SRCCOPY | CAPTUREBLT))
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
                            0, (uint)_height,
                            (nint)pBuffer,
                            ref _bitmapInfo,
                            DIB_RGB_COLORS);

                        if (scanLines != _height)
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
            catch (Exception ex)
            {
                Debug.WriteLine($"[GdiWindowCapture] Exception: {ex.Message}");
                Interlocked.Increment(ref _framesDropped);
                return false;
            }
        }
    }

    public bool CaptureFrame(Span<byte> buffer, out int width, out int height)
    {
        width = _width;
        height = _height;

        byte[] temp = new byte[GetRequiredBufferSize()];
        bool result = CaptureFrame(temp, out width, out height);
        if (result)
            temp.CopyTo(buffer);

        return result;
    }

    public (int Width, int Height) GetScreenSize()
    {
        lock (_captureLock)
        {
            RefreshWindowResourcesIfNeeded();
            return (_width, _height);
        }
    }

    public int GetRequiredBufferSize() => checked(_width * _height * 4);

    public CaptureStats GetStats()
    {
        long captured = Interlocked.Read(ref _framesCaptured);
        long dropped = Interlocked.Read(ref _framesDropped);
        double avgMs = captured > 0 ? _totalCaptureTimeMs / captured : 0;
        long bytes = captured * GetRequiredBufferSize();
        return new CaptureStats(captured, dropped, avgMs, _lastCaptureTimeMs, bytes);
    }

    public void Reset()
    {
        lock (_captureLock)
        {
            CleanupGdiResources();
            Initialize();
        }
    }

    private bool RefreshWindowResourcesIfNeeded()
    {
        if (!TryGetWindowDimensions(out RECT rect, out int width, out int height))
            return false;

        bool changed = rect.Left != _windowRect.Left ||
                       rect.Top != _windowRect.Top ||
                       width != _width ||
                       height != _height;

        _windowRect = rect;

        if (!changed)
            return false;

        CleanupGdiResources();
        Initialize();
        return true;
    }

    private bool TryGetWindowDimensions(out RECT rect, out int width, out int height)
    {
        rect = default;
        width = 0;
        height = 0;

        if (!GetWindowRect(_windowHandle, out rect))
            return false;

        width = rect.Right - rect.Left;
        height = rect.Bottom - rect.Top;
        return width > 0 && height > 0;
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

    private const int SW_RESTORE = 9;
    private const uint SRCCOPY = 0x00CC0020;
    private const uint CAPTUREBLT = 0x40000000;
    private const uint BI_RGB = 0;
    private const uint DIB_RGB_COLORS = 0;

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool IsWindow(nint hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool IsIconic(nint hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ShowWindow(nint hWnd, int nCmdShow);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetWindowRect(nint hWnd, out RECT lpRect);

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
    private struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

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
    }
}
