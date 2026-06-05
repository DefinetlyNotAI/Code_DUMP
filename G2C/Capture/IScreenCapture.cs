// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// Capture/IScreenCapture.cs - Screen capture interface definition
// ============================================================================

namespace G2C.Capture;

/// <summary>
/// Preferred capture method for screen capture.
/// </summary>
public enum CaptureMethod
{
    /// <summary>Automatically select the best available method</summary>
    Auto,
    /// <summary>Force DXGI Desktop Duplication (highest performance)</summary>
    Dxgi,
    /// <summary>Force GDI BitBlt (compatibility fallback)</summary>
    Gdi
}

/// <summary>
/// Statistics about capture performance.
/// </summary>
public readonly struct CaptureStats
{
    public readonly long FramesCaptured;
    public readonly long FramesDropped;
    public readonly double AverageCaptureTimeMs;
    public readonly double LastCaptureTimeMs;
    public readonly long TotalBytesTransferred;

    public CaptureStats(long captured, long dropped, double avgMs, double lastMs, long bytes)
    {
        FramesCaptured = captured;
        FramesDropped = dropped;
        AverageCaptureTimeMs = avgMs;
        LastCaptureTimeMs = lastMs;
        TotalBytesTransferred = bytes;
    }

    public double SuccessRate => FramesCaptured + FramesDropped > 0
        ? FramesCaptured / (double)(FramesCaptured + FramesDropped)
        : 0;
}

/// <summary>
/// Interface for screen capture implementations.
/// Implementations must be thread-safe for CaptureFrame calls.
/// </summary>
public interface IScreenCapture : IDisposable
{
    /// <summary>
    /// Captures the current screen frame into the provided buffer.
    /// </summary>
    /// <param name="buffer">
    /// Pre-allocated buffer to receive BGRA pixel data.
    /// Must be at least GetRequiredBufferSize() bytes.
    /// Pixel format is BGRA (Blue, Green, Red, Alpha), 4 bytes per pixel.
    /// Pixels are stored row-major, top-to-bottom, left-to-right.
    /// </param>
    /// <param name="width">Output: captured frame width in pixels.</param>
    /// <param name="height">Output: captured frame height in pixels.</param>
    /// <returns>
    /// True if capture succeeded and buffer contains new frame data.
    /// False if no new frame is available (DXGI) or capture failed.
    /// </returns>
    bool CaptureFrame(byte[] buffer, out int width, out int height);

    /// <summary>
    /// Captures the current screen frame into the provided span.
    /// </summary>
    /// <param name="buffer">Span to receive BGRA pixel data.</param>
    /// <param name="width">Output: captured frame width in pixels.</param>
    /// <param name="height">Output: captured frame height in pixels.</param>
    /// <returns>True if capture succeeded, false otherwise.</returns>
    bool CaptureFrame(Span<byte> buffer, out int width, out int height);

    /// <summary>
    /// Gets the screen dimensions.
    /// </summary>
    /// <returns>Tuple of (Width, Height) in pixels.</returns>
    (int Width, int Height) GetScreenSize();

    /// <summary>
    /// Gets the required buffer size for capturing a full frame.
    /// </summary>
    /// <returns>Buffer size in bytes (width * height * 4 for BGRA).</returns>
    int GetRequiredBufferSize();

    /// <summary>
    /// Whether this capture method is available on the current system.
    /// </summary>
    bool IsAvailable { get; }

    /// <summary>
    /// Gets a human-readable name for this capture method.
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Gets capture performance statistics.
    /// </summary>
    CaptureStats GetStats();

    /// <summary>
    /// Resets capture state, useful after errors or display changes.
    /// </summary>
    void Reset();
}
