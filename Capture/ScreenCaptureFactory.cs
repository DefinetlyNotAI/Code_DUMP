// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// Capture/ScreenCaptureFactory.cs - Factory for screen capture implementations
// ============================================================================

namespace G2C.Capture;

/// <summary>
/// Factory for creating screen capture implementations.
/// Handles automatic selection based on system capabilities.
/// </summary>
public static class ScreenCaptureFactory
{
    /// <summary>
    /// Creates the best available screen capture implementation.
    /// </summary>
    /// <param name="preferredMethod">Preferred capture method (default: Auto)</param>
    /// <returns>A screen capture implementation.</returns>
    /// <exception cref="PlatformNotSupportedException">
    /// Thrown when no capture method is available on the current system.
    /// </exception>
    public static IScreenCapture Create(CaptureMethod preferredMethod = CaptureMethod.Auto)
    {
        // If a specific method is requested, try it first
        if (preferredMethod == CaptureMethod.Dxgi)
        {
            var dxgi = new DxgiCapture();
            if (dxgi.IsAvailable)
            {
                LogCaptureMethod("DXGI Desktop Duplication", true);
                return dxgi;
            }
            dxgi.Dispose();
            LogCaptureMethod("DXGI Desktop Duplication", false);
        }
        else if (preferredMethod == CaptureMethod.Gdi)
        {
            var gdi = new GdiCapture();
            if (gdi.IsAvailable)
            {
                LogCaptureMethod("GDI BitBlt", true);
                return gdi;
            }
            gdi.Dispose();
            LogCaptureMethod("GDI BitBlt", false);
        }

        // Auto selection: try methods in order of preference
        return CreateAuto();
    }

    public static IScreenCapture CreateForWindow(nint windowHandle)
    {
        var capture = new GdiWindowCapture(windowHandle);
        if (capture.IsAvailable)
        {
            LogCaptureMethod("GDI Window BitBlt", true);
            return capture;
        }

        capture.Dispose();
        LogCaptureMethod("GDI Window BitBlt", false);
        throw new PlatformNotSupportedException("The target application window is not available for capture.");
    }

    /// <summary>
    /// Automatically selects the best available capture method.
    /// Order of preference: DXGI > GDI
    /// </summary>
    private static IScreenCapture CreateAuto()
    {
        // Try DXGI Desktop Duplication first (highest performance, lowest latency)
        // Requires Windows 8+ and a D3D11 capable GPU
        try
        {
            var dxgi = new DxgiCapture();
            if (dxgi.IsAvailable)
            {
                LogCaptureMethod("DXGI Desktop Duplication", true);
                return dxgi;
            }
            dxgi.Dispose();
            LogCaptureMethod("DXGI Desktop Duplication", false);
        }
        catch (Exception ex)
        {
            LogCaptureError("DXGI", ex);
        }

        // Fall back to GDI BitBlt (universal compatibility)
        // Works on all Windows versions but higher CPU usage
        try
        {
            var gdi = new GdiCapture();
            if (gdi.IsAvailable)
            {
                LogCaptureMethod("GDI BitBlt (fallback)", true);
                return gdi;
            }
            gdi.Dispose();
            LogCaptureMethod("GDI BitBlt", false);
        }
        catch (Exception ex)
        {
            LogCaptureError("GDI", ex);
        }

        throw new PlatformNotSupportedException(
            "No screen capture method is available on this system. " +
            "G2C requires Windows with either DXGI Desktop Duplication (Windows 8+) " +
            "or GDI support.");
    }

    /// <summary>
    /// Gets information about available capture methods without creating instances.
    /// </summary>
    public static CaptureMethodInfo[] GetAvailableMethods()
    {
        var methods = new List<CaptureMethodInfo>();

        try
        {
            using var dxgi = new DxgiCapture();
            methods.Add(new CaptureMethodInfo(
                CaptureMethod.Dxgi,
                "DXGI Desktop Duplication",
                dxgi.IsAvailable,
                "Highest performance, GPU-accelerated, lowest latency. Requires Windows 8+ and D3D11 GPU."));
        }
        catch { }

        try
        {
            using var gdi = new GdiCapture();
            methods.Add(new CaptureMethodInfo(
                CaptureMethod.Gdi,
                "GDI BitBlt",
                gdi.IsAvailable,
                "Universal compatibility, CPU-based capture. Works on all Windows versions."));
        }
        catch { }

        return methods.ToArray();
    }

    private static void LogCaptureMethod(string method, bool available)
    {
        string status = available ? "available" : "not available";
        Console.WriteLine($"[G2C] Capture method: {method} - {status}");
    }

    private static void LogCaptureError(string method, Exception ex)
    {
        Console.WriteLine($"[G2C] {method} initialization error: {ex.Message}");
    }
}

/// <summary>
/// Information about a capture method.
/// </summary>
public readonly struct CaptureMethodInfo
{
    public readonly CaptureMethod Method;
    public readonly string Name;
    public readonly bool IsAvailable;
    public readonly string Description;

    public CaptureMethodInfo(CaptureMethod method, string name, bool available, string description)
    {
        Method = method;
        Name = name;
        IsAvailable = available;
        Description = description;
    }
}
