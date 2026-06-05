// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// Capture/DxgiCapture.cs - High-performance DXGI Desktop Duplication capture
// ============================================================================

using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

namespace G2C.Capture;

/// <summary>
/// High-performance screen capture using Windows Desktop Duplication API (DXGI).
/// Provides GPU-accelerated screen capture with minimal CPU overhead.
/// 
/// Requirements:
/// - Windows 8 or later
/// - Direct3D 11 capable GPU
/// - Not running in a remote desktop session (some configurations)
/// 
/// Advantages:
/// - GPU-accelerated, very low CPU usage
/// - Captures all desktop content including hardware overlays
/// - Low latency, frame-accurate capture
/// - Supports HDR and high refresh rate monitors
/// 
/// Limitations:
/// - May fail in remote desktop or some VM configurations
/// - Requires Windows 8+
/// - May lose access when switching users or locking screen
/// </summary>
public sealed class DxgiCapture : IScreenCapture
{
    // D3D11 and DXGI handles
    private nint _device;
    private nint _context;
    private nint _duplication;
    private nint _stagingTexture;

    // Screen dimensions
    private int _screenWidth;
    private int _screenHeight;

    // State
    private bool _initialized;
    private bool _disposed;
    private bool _frameAcquired;
    private readonly object _captureLock = new();

    // Error recovery
    private int _consecutiveErrors;
    private const int MaxConsecutiveErrors = 10;
    private DateTime _lastReinitAttempt = DateTime.MinValue;
    private static readonly TimeSpan ReinitCooldown = TimeSpan.FromSeconds(2);

    // Performance tracking
    private long _framesCaptured;
    private long _framesDropped;
    private double _totalCaptureTimeMs;
    private double _lastCaptureTimeMs;
    private readonly Stopwatch _captureStopwatch = new();

    public bool IsAvailable { get; private set; }
    public string Name => "DXGI Desktop Duplication";

    public DxgiCapture()
    {
        try
        {
            Initialize();
        }
        catch (Exception ex)
        {
            Cleanup();
            Debug.WriteLine($"[DxgiCapture] Initialization failed: {ex.Message}");
            IsAvailable = false;
        }
    }

    private void Initialize()
    {
        // Create DXGI Factory
        var hr = CreateDXGIFactory1(typeof(IDXGIFactory1).GUID, out nint factory);
        if (hr < 0)
        {
            throw new InvalidOperationException($"Failed to create DXGI factory: 0x{hr:X8}");
        }

        try
        {
            // Get primary adapter (GPU)
            hr = IDXGIFactory1_EnumAdapters1(factory, 0, out nint adapter);
            if (hr < 0)
            {
                throw new InvalidOperationException($"Failed to enumerate adapters: 0x{hr:X8}");
            }

            try
            {
                // Get primary output (monitor)
                hr = IDXGIAdapter1_EnumOutputs(adapter, 0, out nint output);
                if (hr < 0)
                {
                    throw new InvalidOperationException($"Failed to enumerate outputs: 0x{hr:X8}");
                }

                try
                {
                    // Get output description for dimensions
                    var desc = new DXGI_OUTPUT_DESC();
                    hr = IDXGIOutput_GetDesc(output, ref desc);
                    if (hr < 0)
                    {
                        throw new InvalidOperationException($"Failed to get output desc: 0x{hr:X8}");
                    }

                    _screenWidth = desc.DesktopCoordinates.Right - desc.DesktopCoordinates.Left;
                    _screenHeight = desc.DesktopCoordinates.Bottom - desc.DesktopCoordinates.Top;

                    if (_screenWidth <= 0 || _screenHeight <= 0)
                    {
                        throw new InvalidOperationException(
                            $"Invalid screen dimensions: {_screenWidth}x{_screenHeight}");
                    }

                    // Create D3D11 device
                    D3D_FEATURE_LEVEL[] featureLevels = [D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0];
                    hr = D3D11CreateDevice(
                        adapter,
                        D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_UNKNOWN,
                        nint.Zero,
                        0, // No debug flags
                        featureLevels,
                        1,
                        D3D11_SDK_VERSION,
                        out _device,
                        out _,
                        out _context);

                    if (hr < 0)
                    {
                        throw new InvalidOperationException($"Failed to create D3D11 device: 0x{hr:X8}");
                    }

                    // Query IDXGIOutput1 for DuplicateOutput
                    hr = IDXGIOutput_QueryInterface(output, typeof(IDXGIOutput1).GUID, out nint output1);
                    if (hr < 0)
                    {
                        throw new InvalidOperationException($"Failed to get IDXGIOutput1: 0x{hr:X8}");
                    }

                    try
                    {
                        // Create desktop duplication
                        hr = IDXGIOutput1_DuplicateOutput(output1, _device, out _duplication);
                        if (hr < 0)
                        {
                            string errorMessage = hr switch
                            {
                                DXGI_ERROR_NOT_CURRENTLY_AVAILABLE =>
                                    "Desktop Duplication not available (may be in use by another app)",
                                DXGI_ERROR_UNSUPPORTED =>
                                    "Desktop Duplication not supported on this system",
                                E_ACCESSDENIED =>
                                    "Access denied (may need to run as administrator or not in RDP)",
                                _ => $"Error code: 0x{hr:X8}"
                            };
                            throw new InvalidOperationException($"Failed to create duplication: {errorMessage}");
                        }

                        // Create staging texture for CPU readback
                        var textureDesc = new D3D11_TEXTURE2D_DESC
                        {
                            Width = (uint)_screenWidth,
                            Height = (uint)_screenHeight,
                            MipLevels = 1,
                            ArraySize = 1,
                            Format = DXGI_FORMAT.DXGI_FORMAT_B8G8R8A8_UNORM,
                            SampleDesc = new DXGI_SAMPLE_DESC { Count = 1, Quality = 0 },
                            Usage = D3D11_USAGE.D3D11_USAGE_STAGING,
                            BindFlags = 0,
                            CPUAccessFlags = D3D11_CPU_ACCESS_FLAG.D3D11_CPU_ACCESS_READ,
                            MiscFlags = 0
                        };

                        hr = ID3D11Device_CreateTexture2D(_device, ref textureDesc, nint.Zero, out _stagingTexture);
                        if (hr < 0)
                        {
                            throw new InvalidOperationException($"Failed to create staging texture: 0x{hr:X8}");
                        }

                        _initialized = true;
                        IsAvailable = true;
                    }
                    finally
                    {
                        Marshal.Release(output1);
                    }
                }
                finally
                {
                    Marshal.Release(output);
                }
            }
            finally
            {
                Marshal.Release(adapter);
            }
        }
        finally
        {
            Marshal.Release(factory);
        }
    }

    /// <summary>
    /// Captures the current screen frame.
    /// Returns false if no new frame is available (no screen changes).
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    public bool CaptureFrame(byte[] buffer, out int width, out int height)
    {
        width = _screenWidth;
        height = _screenHeight;

        if (!_initialized || _disposed)
        {
            TryReinitialize();
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
                // Release any previously acquired frame
                if (_frameAcquired)
                {
                    IDXGIOutputDuplication_ReleaseFrame(_duplication);
                    _frameAcquired = false;
                }

                // Acquire next frame (non-blocking)
                var hr = IDXGIOutputDuplication_AcquireNextFrame(
                    _duplication,
                    0, // Don't wait - return immediately
                    out var frameInfo,
                    out nint desktopResource);

                if (hr == DXGI_ERROR_WAIT_TIMEOUT)
                {
                    // No new frame available (screen hasn't changed)
                    return false;
                }

                if (hr < 0)
                {
                    HandleCaptureError(hr);
                    return false;
                }

                _frameAcquired = true;
                _consecutiveErrors = 0;

                try
                {
                    // Query ID3D11Texture2D from the desktop resource
                    hr = IUnknown_QueryInterface(desktopResource, typeof(ID3D11Texture2D).GUID, out nint texture);
                    if (hr < 0)
                    {
                        Interlocked.Increment(ref _framesDropped);
                        return false;
                    }

                    try
                    {
                        // Copy desktop texture to staging texture
                        ID3D11DeviceContext_CopyResource(_context, _stagingTexture, texture);

                        // Map staging texture for CPU access
                        hr = ID3D11DeviceContext_Map(
                            _context, _stagingTexture, 0,
                            D3D11_MAP.D3D11_MAP_READ, 0,
                            out var mappedResource);

                        if (hr < 0)
                        {
                            Interlocked.Increment(ref _framesDropped);
                            return false;
                        }

                        try
                        {
                            // Copy pixel data to output buffer
                            CopyTextureData(mappedResource, buffer);

                            _captureStopwatch.Stop();
                            _lastCaptureTimeMs = _captureStopwatch.Elapsed.TotalMilliseconds;
                            _totalCaptureTimeMs += _lastCaptureTimeMs;
                            Interlocked.Increment(ref _framesCaptured);

                            return true;
                        }
                        finally
                        {
                            ID3D11DeviceContext_Unmap(_context, _stagingTexture, 0);
                        }
                    }
                    finally
                    {
                        Marshal.Release(texture);
                    }
                }
                finally
                {
                    Marshal.Release(desktopResource);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[DxgiCapture] Exception: {ex.Message}");
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
        // For span version, we need to use unsafe code
        width = _screenWidth;
        height = _screenHeight;

        if (!_initialized || _disposed || buffer.Length < GetRequiredBufferSize())
        {
            Interlocked.Increment(ref _framesDropped);
            return false;
        }

        // Convert span to array for the main capture method
        // Note: This creates a copy, but maintains the interface contract
        byte[] temp = buffer.ToArray();
        bool result = CaptureFrame(temp, out width, out height);
        if (result)
        {
            temp.CopyTo(buffer);
        }
        return result;
    }

    /// <summary>
    /// Copies texture data from mapped resource to output buffer.
    /// Handles row pitch differences between texture and buffer.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private unsafe void CopyTextureData(D3D11_MAPPED_SUBRESOURCE mappedResource, byte[] buffer)
    {
        if (mappedResource.pData == nint.Zero)
            throw new InvalidOperationException("DXGI mapped texture data pointer was null.");

        int rowPitch = checked((int)mappedResource.RowPitch);
        int destRowPitch = checked(_screenWidth * 4);
        int requiredSize = GetRequiredBufferSize();

        if (buffer.Length < requiredSize)
            throw new ArgumentException("Destination buffer is too small for the captured frame.", nameof(buffer));

        if (rowPitch < destRowPitch)
            throw new InvalidOperationException(
                $"DXGI mapped row pitch {rowPitch} is smaller than expected row size {destRowPitch}.");

        fixed (byte* dst = buffer)
        {
            byte* src = (byte*)mappedResource.pData;

            if (rowPitch == destRowPitch)
            {
                // Fast path: no row pitch difference
                Buffer.MemoryCopy(src, dst, buffer.Length, requiredSize);
            }
            else
            {
                // Row pitch differs, copy row by row
                for (int y = 0; y < _screenHeight; y++)
                {
                    Buffer.MemoryCopy(
                        src + y * rowPitch,
                        dst + y * destRowPitch,
                        destRowPitch,
                        destRowPitch);
                }
            }
        }
    }

    private void HandleCaptureError(int hr)
    {
        _consecutiveErrors++;
        Interlocked.Increment(ref _framesDropped);

        if (hr == DXGI_ERROR_ACCESS_LOST || hr == DXGI_ERROR_DEVICE_REMOVED)
        {
            Debug.WriteLine($"[DxgiCapture] Access lost or device removed, will reinitialize");
            _initialized = false;
            TryReinitialize();
        }
        else if (_consecutiveErrors >= MaxConsecutiveErrors)
        {
            Debug.WriteLine($"[DxgiCapture] Too many consecutive errors, marking as unavailable");
            _initialized = false;
            IsAvailable = false;
        }
    }

    private void TryReinitialize()
    {
        if (DateTime.UtcNow - _lastReinitAttempt < ReinitCooldown)
            return;

        _lastReinitAttempt = DateTime.UtcNow;

        try
        {
            Cleanup();
            Initialize();
            _consecutiveErrors = 0;
        }
        catch (Exception ex)
        {
            Cleanup();
            Debug.WriteLine($"[DxgiCapture] Reinitialization failed: {ex.Message}");
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

    public void Reset()
    {
        lock (_captureLock)
        {
            if (_frameAcquired && _duplication != nint.Zero)
            {
                IDXGIOutputDuplication_ReleaseFrame(_duplication);
                _frameAcquired = false;
            }

            _consecutiveErrors = 0;
        }
    }

    private void Cleanup()
    {
        lock (_captureLock)
        {
            if (_frameAcquired && _duplication != nint.Zero)
            {
                try { IDXGIOutputDuplication_ReleaseFrame(_duplication); }
                catch { }
                _frameAcquired = false;
            }

            SafeRelease(ref _stagingTexture);
            SafeRelease(ref _duplication);
            SafeRelease(ref _context);
            SafeRelease(ref _device);

            _initialized = false;
            IsAvailable = false;
        }
    }

    private static void SafeRelease(ref nint handle)
    {
        if (handle != nint.Zero)
        {
            try { Marshal.Release(handle); }
            catch { }
            handle = nint.Zero;
        }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        Cleanup();
        GC.SuppressFinalize(this);
    }

    ~DxgiCapture()
    {
        Dispose();
    }

    #region Native Interop

    // Error codes
    private const int DXGI_ERROR_WAIT_TIMEOUT = unchecked((int)0x887A0027);
    private const int DXGI_ERROR_ACCESS_LOST = unchecked((int)0x887A0026);
    private const int DXGI_ERROR_DEVICE_REMOVED = unchecked((int)0x887A0005);
    private const int DXGI_ERROR_NOT_CURRENTLY_AVAILABLE = unchecked((int)0x887A0022);
    private const int DXGI_ERROR_UNSUPPORTED = unchecked((int)0x887A0004);
    private const int E_ACCESSDENIED = unchecked((int)0x80070005);
    private const uint D3D11_SDK_VERSION = 7;

    [DllImport("dxgi.dll")]
    private static extern int CreateDXGIFactory1(in Guid riid, out nint ppFactory);

    [DllImport("d3d11.dll")]
    private static extern int D3D11CreateDevice(
        nint pAdapter,
        D3D_DRIVER_TYPE DriverType,
        nint Software,
        uint Flags,
        D3D_FEATURE_LEVEL[] pFeatureLevels,
        uint FeatureLevels,
        uint SDKVersion,
        out nint ppDevice,
        out D3D_FEATURE_LEVEL pFeatureLevel,
        out nint ppImmediateContext);

    // COM vtable method wrappers
    private static int IDXGIFactory1_EnumAdapters1(nint factory, uint index, out nint adapter)
    {
        var vtable = Marshal.ReadIntPtr(factory);
        var fn = Marshal.GetDelegateForFunctionPointer<EnumAdapters1Delegate>(
            Marshal.ReadIntPtr(vtable, 12 * nint.Size));
        return fn(factory, index, out adapter);
    }

    private static int IDXGIAdapter1_EnumOutputs(nint adapter, uint index, out nint output)
    {
        var vtable = Marshal.ReadIntPtr(adapter);
        var fn = Marshal.GetDelegateForFunctionPointer<EnumOutputsDelegate>(
            Marshal.ReadIntPtr(vtable, 7 * nint.Size));
        return fn(adapter, index, out output);
    }

    private static int IDXGIOutput_GetDesc(nint output, ref DXGI_OUTPUT_DESC desc)
    {
        var vtable = Marshal.ReadIntPtr(output);
        var fn = Marshal.GetDelegateForFunctionPointer<GetDescDelegate>(
            Marshal.ReadIntPtr(vtable, 7 * nint.Size));
        return fn(output, ref desc);
    }

    private static int IDXGIOutput_QueryInterface(nint output, in Guid riid, out nint ppvObject)
    {
        var vtable = Marshal.ReadIntPtr(output);
        var fn = Marshal.GetDelegateForFunctionPointer<QueryInterfaceDelegate>(
            Marshal.ReadIntPtr(vtable, 0));
        return fn(output, riid, out ppvObject);
    }

    private static int IDXGIOutput1_DuplicateOutput(nint output1, nint device, out nint duplication)
    {
        var vtable = Marshal.ReadIntPtr(output1);
        var fn = Marshal.GetDelegateForFunctionPointer<DuplicateOutputDelegate>(
            Marshal.ReadIntPtr(vtable, 22 * nint.Size));
        return fn(output1, device, out duplication);
    }

    private static int IDXGIOutputDuplication_AcquireNextFrame(
        nint duplication, uint timeout,
        out DXGI_OUTDUPL_FRAME_INFO frameInfo, out nint resource)
    {
        var vtable = Marshal.ReadIntPtr(duplication);
        var fn = Marshal.GetDelegateForFunctionPointer<AcquireNextFrameDelegate>(
            Marshal.ReadIntPtr(vtable, 8 * nint.Size));
        return fn(duplication, timeout, out frameInfo, out resource);
    }

    private static int IDXGIOutputDuplication_ReleaseFrame(nint duplication)
    {
        var vtable = Marshal.ReadIntPtr(duplication);
        var fn = Marshal.GetDelegateForFunctionPointer<ReleaseFrameDelegate>(
            Marshal.ReadIntPtr(vtable, 14 * nint.Size));
        return fn(duplication);
    }

    private static int IUnknown_QueryInterface(nint obj, in Guid riid, out nint ppvObject)
    {
        var vtable = Marshal.ReadIntPtr(obj);
        var fn = Marshal.GetDelegateForFunctionPointer<QueryInterfaceDelegate>(
            Marshal.ReadIntPtr(vtable, 0));
        return fn(obj, riid, out ppvObject);
    }

    private static int ID3D11Device_CreateTexture2D(
        nint device, ref D3D11_TEXTURE2D_DESC desc,
        nint initialData, out nint texture)
    {
        var vtable = Marshal.ReadIntPtr(device);
        var fn = Marshal.GetDelegateForFunctionPointer<CreateTexture2DDelegate>(
            Marshal.ReadIntPtr(vtable, 5 * nint.Size));
        return fn(device, ref desc, initialData, out texture);
    }

    private static void ID3D11DeviceContext_CopyResource(nint context, nint dst, nint src)
    {
        var vtable = Marshal.ReadIntPtr(context);
        var fn = Marshal.GetDelegateForFunctionPointer<CopyResourceDelegate>(
            Marshal.ReadIntPtr(vtable, 47 * nint.Size));
        fn(context, dst, src);
    }

    private static int ID3D11DeviceContext_Map(
        nint context, nint resource, uint subresource,
        D3D11_MAP mapType, uint mapFlags, out D3D11_MAPPED_SUBRESOURCE mappedResource)
    {
        var vtable = Marshal.ReadIntPtr(context);
        var fn = Marshal.GetDelegateForFunctionPointer<MapDelegate>(
            Marshal.ReadIntPtr(vtable, 14 * nint.Size));
        return fn(context, resource, subresource, mapType, mapFlags, out mappedResource);
    }

    private static void ID3D11DeviceContext_Unmap(nint context, nint resource, uint subresource)
    {
        var vtable = Marshal.ReadIntPtr(context);
        var fn = Marshal.GetDelegateForFunctionPointer<UnmapDelegate>(
            Marshal.ReadIntPtr(vtable, 15 * nint.Size));
        fn(context, resource, subresource);
    }

    // Delegates for COM method calls
    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int QueryInterfaceDelegate(nint self, in Guid riid, out nint ppvObject);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int EnumAdapters1Delegate(nint self, uint index, out nint adapter);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int EnumOutputsDelegate(nint self, uint index, out nint output);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int GetDescDelegate(nint self, ref DXGI_OUTPUT_DESC desc);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int DuplicateOutputDelegate(nint self, nint device, out nint duplication);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int AcquireNextFrameDelegate(
        nint self, uint timeout,
        out DXGI_OUTDUPL_FRAME_INFO frameInfo, out nint resource);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int ReleaseFrameDelegate(nint self);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int CreateTexture2DDelegate(
        nint self, ref D3D11_TEXTURE2D_DESC desc,
        nint initialData, out nint texture);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate void CopyResourceDelegate(nint self, nint dst, nint src);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int MapDelegate(
        nint self, nint resource, uint subresource,
        D3D11_MAP mapType, uint mapFlags, out D3D11_MAPPED_SUBRESOURCE mappedResource);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate void UnmapDelegate(nint self, nint resource, uint subresource);

    // COM interface GUIDs
    [ComImport, Guid("770aae78-f26f-4dba-a829-253c83d1b387"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IDXGIFactory1 { }

    [ComImport, Guid("29038f61-3839-4626-91fd-086879011a05"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IDXGIAdapter1 { }

    [ComImport, Guid("00cddea8-939b-4b83-a340-a685226666cc"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IDXGIOutput1 { }

    [ComImport, Guid("6f15aaf2-d208-4e89-9ab4-489535d34f9c"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface ID3D11Texture2D { }

    // Structures
    [StructLayout(LayoutKind.Sequential)]
    private struct DXGI_OUTPUT_DESC
    {
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 32)]
        public char[] DeviceName;
        public RECT DesktopCoordinates;
        public int AttachedToDesktop;
        public int Rotation;
        public nint Monitor;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT
    {
        public int Left, Top, Right, Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct DXGI_OUTDUPL_FRAME_INFO
    {
        public long LastPresentTime;
        public long LastMouseUpdateTime;
        public uint AccumulatedFrames;
        public int RectsCoalesced;
        public int ProtectedContentMaskedOut;
        public DXGI_OUTDUPL_POINTER_POSITION PointerPosition;
        public uint TotalMetadataBufferSize;
        public uint PointerShapeBufferSize;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct DXGI_OUTDUPL_POINTER_POSITION
    {
        public POINT Position;
        public int Visible;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int X, Y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct D3D11_TEXTURE2D_DESC
    {
        public uint Width;
        public uint Height;
        public uint MipLevels;
        public uint ArraySize;
        public DXGI_FORMAT Format;
        public DXGI_SAMPLE_DESC SampleDesc;
        public D3D11_USAGE Usage;
        public uint BindFlags;
        public D3D11_CPU_ACCESS_FLAG CPUAccessFlags;
        public uint MiscFlags;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct DXGI_SAMPLE_DESC
    {
        public uint Count;
        public uint Quality;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct D3D11_MAPPED_SUBRESOURCE
    {
        public nint pData;
        public uint RowPitch;
        public uint DepthPitch;
    }

    private enum D3D_DRIVER_TYPE
    {
        D3D_DRIVER_TYPE_UNKNOWN = 0,
        D3D_DRIVER_TYPE_HARDWARE = 1
    }

    private enum D3D_FEATURE_LEVEL
    {
        D3D_FEATURE_LEVEL_11_0 = 0xb000
    }

    private enum DXGI_FORMAT
    {
        DXGI_FORMAT_B8G8R8A8_UNORM = 87
    }

    private enum D3D11_USAGE
    {
        D3D11_USAGE_DEFAULT = 0,
        D3D11_USAGE_STAGING = 3
    }

    [Flags]
    private enum D3D11_CPU_ACCESS_FLAG : uint
    {
        D3D11_CPU_ACCESS_READ = 0x20000
    }

    private enum D3D11_MAP
    {
        D3D11_MAP_READ = 1
    }

    #endregion
}
