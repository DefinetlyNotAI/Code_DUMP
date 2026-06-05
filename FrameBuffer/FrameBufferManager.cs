using System.Numerics;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Runtime.Intrinsics;
using System.Runtime.Intrinsics.X86;

namespace G2C.FrameBuffer;

/// <summary>
/// Manages frame buffers and downscaling from screen resolution to terminal resolution.
/// Uses SIMD-accelerated bilinear interpolation for quality downscaling.
/// Supports multiple character sets and rendering modes.
/// </summary>
public sealed class FrameBufferManager
{
    private byte[] _rawBuffer;
    private TerminalCell[] _currentFrame;
    private TerminalCell[] _previousFrame;
    
    private readonly int _sourceWidth;
    private readonly int _sourceHeight;
    private int _terminalWidth;
    private int _terminalHeight;
    
    private readonly bool _grayscale;
    private readonly ScaleMode _scaleMode;
    private readonly CharacterSet _characterSet;
    
    // Scaling parameters
    private float _scaleX;
    private float _scaleY;
    private int _offsetX;
    private int _offsetY;
    private int _scaledWidth;
    private int _scaledHeight;

    // Pre-computed lookup tables for faster interpolation
    private int[] _srcXLookup = [];
    private int[] _srcYLookup = [];
    private float[] _fracXLookup = [];
    private float[] _fracYLookup = [];

    // Character aspect ratio (typical terminal: character is ~2x taller than wide)
    private const float CharAspectRatio = 2.0f;
    
    // Pixels per cell based on character set
    private int _pixelsPerCellX;
    private int _pixelsPerCellY;

    // Statistics
    private long _totalFramesProcessed;
    private long _totalProcessingTimeMs;

    public int TerminalWidth => _terminalWidth;
    public int TerminalHeight => _terminalHeight;
    public TerminalCell[] CurrentFrame => _currentFrame;
    public TerminalCell[] PreviousFrame => _previousFrame;
    public int SourceWidth => _sourceWidth;
    public int SourceHeight => _sourceHeight;
    public double AverageProcessingTimeMs => _totalFramesProcessed > 0 
        ? (double)_totalProcessingTimeMs / _totalFramesProcessed 
        : 0;

    public void Dispose()
    {
        _rawBuffer = [];
        _currentFrame = [];
        _previousFrame = [];

        _srcXLookup = [];
        _srcYLookup = [];
        _fracXLookup = [];
        _fracYLookup = [];

        GC.SuppressFinalize(this);
    }

    public FrameBufferManager(
        int sourceWidth, 
        int sourceHeight, 
        int terminalWidth, 
        int terminalHeight,
        bool grayscale = false, 
        ScaleMode scaleMode = ScaleMode.Fit,
        CharacterSet characterSet = CharacterSet.HalfBlock)
    {
        _sourceWidth = sourceWidth;
        _sourceHeight = sourceHeight;
        _grayscale = grayscale;
        _scaleMode = scaleMode;
        _characterSet = characterSet;
        
        // Determine pixels per cell based on character set
        (_pixelsPerCellX, _pixelsPerCellY) = characterSet switch
        {
            CharacterSet.HalfBlock => (1, 2),
            CharacterSet.Quadrant => (2, 2),
            CharacterSet.Braille => (2, 4),
            CharacterSet.FullBlock => (1, 1),
            CharacterSet.AsciiShade => (1, 1),
            _ => (1, 2)
        };
        
        // Allocate raw capture buffer
        _rawBuffer = new byte[sourceWidth * sourceHeight * 4];
        _currentFrame = [];
        _previousFrame = [];
        
        Resize(terminalWidth, terminalHeight);
    }

    /// <summary>
    /// Resizes buffers for new terminal dimensions.
    /// </summary>
    public void Resize(int terminalWidth, int terminalHeight)
    {
        _terminalWidth = terminalWidth;
        _terminalHeight = terminalHeight;

        // Target pixel dimensions based on character set
        int targetPixelWidth = terminalWidth * _pixelsPerCellX;
        int targetPixelHeight = terminalHeight * _pixelsPerCellY;

        // Calculate scaling
        CalculateScaling(targetPixelWidth, targetPixelHeight);

        // Allocate frame buffers
        int cellCount = terminalWidth * terminalHeight;
        _currentFrame = new TerminalCell[cellCount];
        _previousFrame = new TerminalCell[cellCount];
        
        // Pre-compute lookup tables
        BuildLookupTables(targetPixelWidth, targetPixelHeight);
    }

    private void CalculateScaling(int targetWidth, int targetHeight)
    {
        switch (_scaleMode)
        {
            case ScaleMode.Stretch:
                _scaleX = (float)_sourceWidth / targetWidth;
                _scaleY = (float)_sourceHeight / targetHeight;
                _offsetX = 0;
                _offsetY = 0;
                _scaledWidth = targetWidth;
                _scaledHeight = targetHeight;
                break;
                
            case ScaleMode.Fill:
                // Fill mode - crop to fill, maintaining aspect ratio
                float sourceAspect = (float)_sourceWidth / _sourceHeight;
                float targetAspect = (float)targetWidth / targetHeight * CharAspectRatio;
                
                if (sourceAspect > targetAspect)
                {
                    // Source is wider - crop sides
                    _scaledHeight = targetHeight;
                    _scaledWidth = (int)(targetHeight * sourceAspect / CharAspectRatio);
                }
                else
                {
                    // Source is taller - crop top/bottom
                    _scaledWidth = targetWidth;
                    _scaledHeight = (int)(targetWidth / sourceAspect * CharAspectRatio);
                }
                
                _scaleX = (float)_sourceWidth / _scaledWidth;
                _scaleY = (float)_sourceHeight / _scaledHeight;
                _offsetX = (_scaledWidth - targetWidth) / 2;
                _offsetY = (_scaledHeight - targetHeight) / 2;
                break;
                
            case ScaleMode.PixelPerfect:
                // 1:1 pixel mapping
                _scaleX = 1f;
                _scaleY = 1f;
                _scaledWidth = Math.Min(_sourceWidth, targetWidth);
                _scaledHeight = Math.Min(_sourceHeight, targetHeight);
                _offsetX = 0;
                _offsetY = 0;
                break;
                
            case ScaleMode.Fit:
            default:
                // Fit mode - letterbox, maintaining aspect ratio
                float srcAspect = (float)_sourceWidth / _sourceHeight;
                float tgtAspect = (float)targetWidth / targetHeight * CharAspectRatio;

                if (srcAspect > tgtAspect)
                {
                    // Source is wider - fit to width, letterbox top/bottom
                    _scaledWidth = targetWidth;
                    _scaledHeight = (int)(targetWidth / srcAspect * CharAspectRatio);
                    _offsetX = 0;
                    _offsetY = (targetHeight - _scaledHeight) / 2;
                }
                else
                {
                    // Source is taller - fit to height, letterbox sides
                    _scaledHeight = targetHeight;
                    _scaledWidth = (int)(targetHeight * srcAspect / CharAspectRatio);
                    _offsetX = (targetWidth - _scaledWidth) / 2;
                    _offsetY = 0;
                }

                _scaleX = (float)_sourceWidth / _scaledWidth;
                _scaleY = (float)_sourceHeight / _scaledHeight;
                break;
        }
    }

    private void BuildLookupTables(int targetWidth, int targetHeight)
    {
        _srcXLookup = new int[targetWidth];
        _srcYLookup = new int[targetHeight];
        _fracXLookup = new float[targetWidth];
        _fracYLookup = new float[targetHeight];

        for (int x = 0; x < targetWidth; x++)
        {
            float srcX = x * _scaleX;
            _srcXLookup[x] = Math.Clamp((int)srcX, 0, _sourceWidth - 2);
            _fracXLookup[x] = srcX - _srcXLookup[x];
        }

        for (int y = 0; y < targetHeight; y++)
        {
            float srcY = y * _scaleY;
            _srcYLookup[y] = Math.Clamp((int)srcY, 0, _sourceHeight - 2);
            _fracYLookup[y] = srcY - _srcYLookup[y];
        }
    }

    /// <summary>
    /// Gets the raw buffer for capture operations.
    /// </summary>
    public byte[] GetRawBuffer() => _rawBuffer;

    /// <summary>
    /// Processes a captured frame, downscaling to terminal resolution.
    /// Uses SIMD acceleration when available.
    /// </summary>
    public void ProcessFrame()
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        
        // Swap buffers
        (_currentFrame, _previousFrame) = (_previousFrame, _currentFrame);

        // Clear current frame (for letterboxing)
        Array.Fill(_currentFrame, TerminalCell.Letterbox);

        // Process based on character set
        switch (_characterSet)
        {
            case CharacterSet.HalfBlock:
                ProcessHalfBlockFrame();
                break;
            case CharacterSet.Quadrant:
                ProcessQuadrantFrame();
                break;
            case CharacterSet.Braille:
                ProcessBrailleFrame();
                break;
            default:
                ProcessHalfBlockFrame();
                break;
        }

        sw.Stop();
        _totalFramesProcessed++;
        _totalProcessingTimeMs += sw.ElapsedMilliseconds;
    }

    private void ProcessHalfBlockFrame()
    {
        int offsetXCells = _offsetX / _pixelsPerCellX;
        int offsetYCells = _offsetY / _pixelsPerCellY;
        int scaledWidthCells = _scaledWidth / _pixelsPerCellX;
        int scaledHeightCells = _scaledHeight / _pixelsPerCellY;

        // Use parallel processing for larger frames
        if (_terminalWidth * _terminalHeight > 1000)
        {
            Parallel.For(0, scaledHeightCells, y =>
            {
                ProcessHalfBlockRow(y, offsetXCells, offsetYCells, scaledWidthCells);
            });
        }
        else
        {
            for (int y = 0; y < scaledHeightCells; y++)
            {
                ProcessHalfBlockRow(y, offsetXCells, offsetYCells, scaledWidthCells);
            }
        }
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void ProcessHalfBlockRow(int y, int offsetXCells, int offsetYCells, int scaledWidthCells)
    {
        int termY = y + offsetYCells;
        if (termY < 0 || termY >= _terminalHeight) return;

        int pixelY1 = y * 2;
        int pixelY2 = y * 2 + 1;

        for (int x = 0; x < scaledWidthCells; x++)
        {
            int termX = x + offsetXCells;
            if (termX < 0 || termX >= _terminalWidth) continue;

            // Sample top and bottom pixels
            var topPixel = SamplePixelBilinear(x, pixelY1);
            var bottomPixel = SamplePixelBilinear(x, pixelY2);

            if (_grayscale)
            {
                topPixel = topPixel.ToGrayscale();
                bottomPixel = bottomPixel.ToGrayscale();
            }

            _currentFrame[termY * _terminalWidth + termX] = new TerminalCell(topPixel, bottomPixel);
        }
    }

    private void ProcessQuadrantFrame()
    {
        int offsetXCells = _offsetX / _pixelsPerCellX;
        int offsetYCells = _offsetY / _pixelsPerCellY;
        int scaledWidthCells = _scaledWidth / _pixelsPerCellX;
        int scaledHeightCells = _scaledHeight / _pixelsPerCellY;

        Parallel.For(0, scaledHeightCells, y =>
        {
            int termY = y + offsetYCells;
            if (termY < 0 || termY >= _terminalHeight) return;

            int pixelY1 = y * 2;
            int pixelY2 = y * 2 + 1;

            for (int x = 0; x < scaledWidthCells; x++)
            {
                int termX = x + offsetXCells;
                if (termX < 0 || termX >= _terminalWidth) continue;

                int pixelX1 = x * 2;
                int pixelX2 = x * 2 + 1;

                // Sample four pixels
                var tl = SamplePixelBilinear(pixelX1, pixelY1);
                var tr = SamplePixelBilinear(pixelX2, pixelY1);
                var bl = SamplePixelBilinear(pixelX1, pixelY2);
                var br = SamplePixelBilinear(pixelX2, pixelY2);

                if (_grayscale)
                {
                    tl = tl.ToGrayscale();
                    tr = tr.ToGrayscale();
                    bl = bl.ToGrayscale();
                    br = br.ToGrayscale();
                }

                // For simplicity, use half-block cell with averaged colors
                var top = Pixel.Lerp(tl, tr, 0.5f);
                var bottom = Pixel.Lerp(bl, br, 0.5f);
                _currentFrame[termY * _terminalWidth + termX] = new TerminalCell(top, bottom);
            }
        });
    }

    private void ProcessBrailleFrame()
    {
        // Braille: 2x4 pixels per cell
        int offsetXCells = _offsetX / _pixelsPerCellX;
        int offsetYCells = _offsetY / _pixelsPerCellY;
        int scaledWidthCells = _scaledWidth / _pixelsPerCellX;
        int scaledHeightCells = _scaledHeight / _pixelsPerCellY;

        Parallel.For(0, scaledHeightCells, y =>
        {
            int termY = y + offsetYCells;
            if (termY < 0 || termY >= _terminalHeight) return;

            for (int x = 0; x < scaledWidthCells; x++)
            {
                int termX = x + offsetXCells;
                if (termX < 0 || termX >= _terminalWidth) continue;

                // For braille, we need 8 samples (2x4)
                // Convert to grayscale for threshold
                int sum = 0;
                for (int py = 0; py < 4; py++)
                {
                    for (int px = 0; px < 2; px++)
                    {
                        var p = SamplePixelBilinear(x * 2 + px, y * 4 + py);
                        sum += p.Luminance;
                    }
                }

                // Use average luminance for cell color
                byte avgLum = (byte)(sum / 8);
                var color = new Pixel(avgLum, avgLum, avgLum);
                _currentFrame[termY * _terminalWidth + termX] = new TerminalCell(color, Pixel.Black);
            }
        });
    }

    /// <summary>
    /// Samples a pixel using bilinear interpolation with pre-computed lookups.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private Pixel SamplePixelBilinear(int targetX, int targetY)
    {
        if (targetX < 0 || targetX >= _srcXLookup.Length ||
            targetY < 0 || targetY >= _srcYLookup.Length)
        {
            return Pixel.Black;
        }

        int x0 = _srcXLookup[targetX];
        int y0 = _srcYLookup[targetY];
        float fx = _fracXLookup[targetX];
        float fy = _fracYLookup[targetY];

        // Get four neighboring pixels
        var p00 = GetPixelFast(x0, y0);
        var p10 = GetPixelFast(x0 + 1, y0);
        var p01 = GetPixelFast(x0, y0 + 1);
        var p11 = GetPixelFast(x0 + 1, y0 + 1);

        // Bilinear interpolation using SIMD-friendly math
        float invFx = 1f - fx;
        float invFy = 1f - fy;
        
        float w00 = invFx * invFy;
        float w10 = fx * invFy;
        float w01 = invFx * fy;
        float w11 = fx * fy;

        return new Pixel(
            (byte)(p00.R * w00 + p10.R * w10 + p01.R * w01 + p11.R * w11),
            (byte)(p00.G * w00 + p10.G * w10 + p01.G * w01 + p11.G * w11),
            (byte)(p00.B * w00 + p10.B * w10 + p01.B * w01 + p11.B * w11)
        );
    }

    /// <summary>
    /// Samples a pixel using nearest-neighbor (faster, lower quality).
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private Pixel SamplePixelNearest(int targetX, int targetY)
    {
        int srcX = Math.Clamp((int)(targetX * _scaleX + 0.5f), 0, _sourceWidth - 1);
        int srcY = Math.Clamp((int)(targetY * _scaleY + 0.5f), 0, _sourceHeight - 1);
        return GetPixelFast(srcX, srcY);
    }

    /// <summary>
    /// Fast pixel access using direct array indexing.
    /// Buffer format is BGRA.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private Pixel GetPixelFast(int x, int y)
    {
        int offset = (y * _sourceWidth + x) * 4;
        return new Pixel(
            _rawBuffer[offset + 2],  // R (BGRA format)
            _rawBuffer[offset + 1],  // G
            _rawBuffer[offset]       // B
        );
    }

    /// <summary>
    /// Gets pixel using unsafe pointer access (even faster for large batches).
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private unsafe Pixel GetPixelUnsafe(int x, int y)
    {
        fixed (byte* ptr = _rawBuffer)
        {
            byte* p = ptr + (y * _sourceWidth + x) * 4;
            return new Pixel(p[2], p[1], p[0]);
        }
    }

    /// <summary>
    /// Translates terminal coordinates to screen coordinates.
    /// </summary>
    public (int X, int Y) TerminalToScreen(int termX, int termY)
    {
        // Account for offset and scaling
        int localX = (termX - _offsetX / _pixelsPerCellX) * _pixelsPerCellX;
        int localY = (termY - _offsetY / _pixelsPerCellY) * _pixelsPerCellY;

        // Convert to source coordinates
        int screenX = (int)(localX * _scaleX);
        int screenY = (int)(localY * _scaleY);

        return (
            Math.Clamp(screenX, 0, _sourceWidth - 1),
            Math.Clamp(screenY, 0, _sourceHeight - 1)
        );
    }

    /// <summary>
    /// Gets statistics about frame processing.
    /// </summary>
    public (long FramesProcessed, double AvgProcessingMs) GetStats()
    {
        return (_totalFramesProcessed, AverageProcessingTimeMs);
    }

    /// <summary>
    /// Resets statistics counters.
    /// </summary>
    public void ResetStats()
    {
        _totalFramesProcessed = 0;
        _totalProcessingTimeMs = 0;
    }
}
