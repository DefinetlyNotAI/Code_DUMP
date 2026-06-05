// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// Renderer/AnsiRenderer.cs - High-performance ANSI truecolor rendering engine
// ============================================================================

using System.Buffers;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using G2C.DiffEngine;
using G2C.FrameBuffer;

namespace G2C.Renderer;

/// <summary>
/// Color mode for terminal output.
/// </summary>
public enum ColorMode
{
    /// <summary>24-bit truecolor (16.7M colors)</summary>
    TrueColor,
    /// <summary>256-color palette</summary>
    Color256,
    /// <summary>16-color palette</summary>
    Color16,
    /// <summary>Grayscale only</summary>
    Grayscale
}

/// <summary>
/// Rendering statistics for performance monitoring.
/// </summary>
public readonly struct RenderStats
{
    public readonly int CellsRendered;
    public readonly int BytesWritten;
    public readonly int EscapeSequences;
    public readonly int ColorChanges;
    public readonly double RenderTimeMs;
    public readonly double WriteTimeMs;

    public RenderStats(int cells, int bytes, int escapes, int colorChanges, double renderMs, double writeMs)
    {
        CellsRendered = cells;
        BytesWritten = bytes;
        EscapeSequences = escapes;
        ColorChanges = colorChanges;
        RenderTimeMs = renderMs;
        WriteTimeMs = writeMs;
    }

    public double TotalTimeMs => RenderTimeMs + WriteTimeMs;
    public double BytesPerCell => CellsRendered > 0 ? BytesWritten / (double)CellsRendered : 0;
}

/// <summary>
/// High-performance ANSI terminal renderer using truecolor (24-bit RGB) and half-block characters.
/// Implements extensive optimizations for minimal escape sequences, cursor movements, and memory allocations.
/// </summary>
public sealed class AnsiRenderer : IDisposable
{
    // Terminal dimensions
    private int _terminalWidth;
    private int _terminalHeight;

    // Configuration
    private readonly ColorMode _colorMode;
    private readonly bool _useAlternateBuffer;
    private readonly bool _enableSynchronizedOutput;

    // Rendering state
    private Pixel _lastFg;
    private Pixel _lastBg;
    private int _lastCursorX = -1;
    private int _lastCursorY = -1;
    private bool _colorsInitialized;
    private bool _isInitialized;

    // Buffers - using ArrayPool for reduced allocations
    private char[] _charBuffer;
    private byte[] _byteBuffer;
    private int _charPos;
    private int _bytePos;

    // Pre-computed escape sequences
    private static readonly byte[] HideCursor = Encoding.ASCII.GetBytes("\x1b[?25l");
    private static readonly byte[] ShowCursor = Encoding.ASCII.GetBytes("\x1b[?25h");
    private static readonly byte[] ClearScreen = Encoding.ASCII.GetBytes("\x1b[2J");
    private static readonly byte[] Home = Encoding.ASCII.GetBytes("\x1b[H");
    private static readonly byte[] Reset = Encoding.ASCII.GetBytes("\x1b[0m");
    private static readonly byte[] AltScreenOn = Encoding.ASCII.GetBytes("\x1b[?1049h");
    private static readonly byte[] AltScreenOff = Encoding.ASCII.GetBytes("\x1b[?1049l");
    private static readonly byte[] SyncBegin = Encoding.ASCII.GetBytes("\x1b[?2026h");
    private static readonly byte[] SyncEnd = Encoding.ASCII.GetBytes("\x1b[?2026l");
    private static readonly byte[] InverseOn = Encoding.ASCII.GetBytes("\x1b[7m");
    private static readonly byte[] InverseOff = Encoding.ASCII.GetBytes("\x1b[27m");

    // Character constants
    private const char HalfBlockUpper = '▀';
    private const char HalfBlockLower = '▄';
    private const char FullBlock = '█';
    private const char LightShade = '░';
    private const char MediumShade = '▒';
    private const char DarkShade = '▓';

    // Performance tracking
    private long _totalFrames;
    private double _totalRenderTimeMs;
    private double _totalWriteTimeMs;
    private long _totalBytesWritten;

    // Output stream (for direct byte writing)
    private readonly Stream _outputStream;
    private readonly bool _ownsStream;

    /// <summary>
    /// Creates a new ANSI renderer with the specified configuration.
    /// </summary>
    /// <param name="terminalWidth">Terminal width in columns</param>
    /// <param name="terminalHeight">Terminal height in rows</param>
    /// <param name="colorMode">Color rendering mode</param>
    /// <param name="useAlternateBuffer">Use alternate screen buffer</param>
    /// <param name="enableSynchronizedOutput">Enable synchronized output for reduced flicker</param>
    public AnsiRenderer(
        int terminalWidth,
        int terminalHeight,
        ColorMode colorMode = ColorMode.TrueColor,
        bool useAlternateBuffer = true,
        bool enableSynchronizedOutput = true)
    {
        _terminalWidth = terminalWidth;
        _terminalHeight = terminalHeight;
        _colorMode = colorMode;
        _useAlternateBuffer = useAlternateBuffer;
        _enableSynchronizedOutput = enableSynchronizedOutput;

        // Calculate buffer sizes - estimate ~40 bytes per cell worst case
        int estimatedSize = terminalWidth * terminalHeight * 40;
        _charBuffer = ArrayPool<char>.Shared.Rent(estimatedSize);
        _byteBuffer = ArrayPool<byte>.Shared.Rent(estimatedSize);

        // Get output stream - prefer raw stdout for performance
        try
        {
            _outputStream = Console.OpenStandardOutput();
            _ownsStream = true;
        }
        catch
        {
            _outputStream = Stream.Null;
            _ownsStream = false;
        }
    }

    /// <summary>Gets average render time in milliseconds.</summary>
    public double AverageRenderTimeMs => _totalFrames > 0 ? _totalRenderTimeMs / _totalFrames : 0;

    /// <summary>Gets average write time in milliseconds.</summary>
    public double AverageWriteTimeMs => _totalFrames > 0 ? _totalWriteTimeMs / _totalFrames : 0;

    /// <summary>Gets total bytes written to the terminal.</summary>
    public long TotalBytesWritten => _totalBytesWritten;

    /// <summary>
    /// Resizes the renderer for new terminal dimensions.
    /// </summary>
    public void Resize(int width, int height)
    {
        if (width == _terminalWidth && height == _terminalHeight)
            return;

        _terminalWidth = width;
        _terminalHeight = height;

        // Reallocate buffers if needed
        int requiredSize = width * height * 40;
        if (_charBuffer.Length < requiredSize)
        {
            ArrayPool<char>.Shared.Return(_charBuffer);
            ArrayPool<byte>.Shared.Return(_byteBuffer);
            _charBuffer = ArrayPool<char>.Shared.Rent(requiredSize);
            _byteBuffer = ArrayPool<byte>.Shared.Rent(requiredSize);
        }

        // Reset cursor tracking
        _lastCursorX = -1;
        _lastCursorY = -1;
    }

    /// <summary>
    /// Initializes the terminal for rendering.
    /// </summary>
    public void Initialize()
    {
        if (_isInitialized) return;

        _bytePos = 0;

        // Alternate screen buffer
        if (_useAlternateBuffer)
            AppendBytes(AltScreenOn);

        // Hide cursor
        AppendBytes(HideCursor);

        // Clear screen and home
        AppendBytes(ClearScreen);
        AppendBytes(Home);

        FlushBuffer();
        _isInitialized = true;
    }

    /// <summary>
    /// Restores the terminal to normal state.
    /// </summary>
    public void Cleanup()
    {
        if (!_isInitialized) return;

        _bytePos = 0;

        // Reset colors
        AppendBytes(Reset);

        // Show cursor
        AppendBytes(ShowCursor);

        // Alternate screen buffer off
        if (_useAlternateBuffer)
        {
            AppendBytes(AltScreenOff);
        }
        else
        {
            AppendBytes(ClearScreen);
            AppendBytes(Home);
        }

        FlushBuffer();
        _isInitialized = false;
    }

    /// <summary>
    /// Renders optimized cell runs to the terminal.
    /// </summary>
    public RenderStats RenderRuns(IReadOnlyList<CellRun> runs)
    {
        var renderStart = System.Diagnostics.Stopwatch.GetTimestamp();
        
        _bytePos = 0;
        _colorsInitialized = false;
        int cellsRendered = 0;
        int escapeSequences = 0;
        int colorChanges = 0;

        // Begin synchronized output
        if (_enableSynchronizedOutput)
            AppendBytes(SyncBegin);

        foreach (var run in runs)
        {
            // Move cursor if needed
            if (run.Row != _lastCursorY || run.StartCol != _lastCursorX)
            {
                AppendCursorMove(run.Row + 1, run.StartCol + 1);
                escapeSequences++;
            }

            // Render cells in run
            for (int i = 0; i < run.Cells.Length; i++)
            {
                var (fg, bg, escaped, colors) = AppendCell(run.Cells[i]);
                escapeSequences += escaped;
                colorChanges += colors;
                cellsRendered++;
            }

            // Update cursor tracking
            _lastCursorY = run.Row;
            _lastCursorX = run.StartCol + run.Cells.Length;
        }

        // End synchronized output
        if (_enableSynchronizedOutput)
            AppendBytes(SyncEnd);

        var renderTime = GetElapsedMs(renderStart);
        var writeStart = System.Diagnostics.Stopwatch.GetTimestamp();

        FlushBuffer();

        var writeTime = GetElapsedMs(writeStart);
        int bytesWritten = _bytePos;

        _totalFrames++;
        _totalRenderTimeMs += renderTime;
        _totalWriteTimeMs += writeTime;
        _totalBytesWritten += bytesWritten;

        return new RenderStats(cellsRendered, bytesWritten, escapeSequences, colorChanges, renderTime, writeTime);
    }

    /// <summary>
    /// Renders optimized cell updates using legacy tuple format.
    /// </summary>
    public void RenderUpdates(List<(int Row, int StartCol, List<TerminalCell> Cells)> updates)
    {
        if (updates.Count == 0) return;

        _bytePos = 0;
        _colorsInitialized = false;

        if (_enableSynchronizedOutput)
            AppendBytes(SyncBegin);

        foreach (var (row, startCol, cells) in updates)
        {
            AppendCursorMove(row + 1, startCol + 1);

            foreach (var cell in cells)
            {
                AppendCell(cell);
            }
        }

        if (_enableSynchronizedOutput)
            AppendBytes(SyncEnd);

        FlushBuffer();
    }

    /// <summary>
    /// Renders full frame (for initial draw or when diff is disabled).
    /// </summary>
    public RenderStats RenderFullFrame(TerminalCell[] frame)
    {
        var renderStart = System.Diagnostics.Stopwatch.GetTimestamp();

        _bytePos = 0;
        _colorsInitialized = false;
        int colorChanges = 0;

        if (_enableSynchronizedOutput)
            AppendBytes(SyncBegin);

        // Home position
        AppendBytes(Home);

        for (int y = 0; y < _terminalHeight; y++)
        {
            for (int x = 0; x < _terminalWidth; x++)
            {
                int idx = y * _terminalWidth + x;
                var (_, _, _, colors) = AppendCell(frame[idx]);
                colorChanges += colors;
            }
        }

        if (_enableSynchronizedOutput)
            AppendBytes(SyncEnd);

        var renderTime = GetElapsedMs(renderStart);
        var writeStart = System.Diagnostics.Stopwatch.GetTimestamp();

        FlushBuffer();

        var writeTime = GetElapsedMs(writeStart);
        int cells = _terminalWidth * _terminalHeight;

        _totalFrames++;
        _totalRenderTimeMs += renderTime;
        _totalWriteTimeMs += writeTime;
        _totalBytesWritten += _bytePos;

        _lastCursorY = _terminalHeight - 1;
        _lastCursorX = _terminalWidth;

        return new RenderStats(cells, _bytePos, 1, colorChanges, renderTime, writeTime);
    }

    /// <summary>
    /// Appends a cell to the buffer with optimized color codes.
    /// Returns (fg changed, bg changed, escape count, color change count).
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private (bool, bool, int, int) AppendCell(TerminalCell cell)
    {
        bool fgChanged = !_colorsInitialized || cell.Foreground != _lastFg;
        bool bgChanged = !_colorsInitialized || cell.Background != _lastBg;
        int escapes = 0;
        int colors = 0;

        if (fgChanged || bgChanged)
        {
            colors = (fgChanged ? 1 : 0) + (bgChanged ? 1 : 0);
            escapes = 1;

            switch (_colorMode)
            {
                case ColorMode.TrueColor:
                    AppendTrueColorEscape(cell.Foreground, cell.Background, fgChanged, bgChanged);
                    break;

                case ColorMode.Color256:
                    AppendColor256Escape(cell.Foreground, cell.Background, fgChanged, bgChanged);
                    break;

                case ColorMode.Grayscale:
                    AppendGrayscaleEscape(cell.Foreground, cell.Background, fgChanged, bgChanged);
                    break;

                default:
                    AppendColor16Escape(cell.Foreground, cell.Background, fgChanged, bgChanged);
                    break;
            }

            _lastFg = cell.Foreground;
            _lastBg = cell.Background;
            _colorsInitialized = true;
        }

        // Append the half-block character (UTF-8: 3 bytes)
        AppendUtf8Char(HalfBlockUpper);

        return (fgChanged, bgChanged, escapes, colors);
    }

    /// <summary>
    /// Appends truecolor (24-bit) escape sequence.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void AppendTrueColorEscape(Pixel fg, Pixel bg, bool fgChanged, bool bgChanged)
    {
        // \x1b[38;2;R;G;B;48;2;R;G;Bm
        EnsureCapacity(40);

        _byteBuffer[_bytePos++] = 0x1b; // ESC
        _byteBuffer[_bytePos++] = (byte)'[';

        if (fgChanged && bgChanged)
        {
            // Combined sequence
            _byteBuffer[_bytePos++] = (byte)'3';
            _byteBuffer[_bytePos++] = (byte)'8';
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'2';
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(fg.R);
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(fg.G);
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(fg.B);
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'4';
            _byteBuffer[_bytePos++] = (byte)'8';
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'2';
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(bg.R);
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(bg.G);
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(bg.B);
        }
        else if (fgChanged)
        {
            _byteBuffer[_bytePos++] = (byte)'3';
            _byteBuffer[_bytePos++] = (byte)'8';
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'2';
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(fg.R);
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(fg.G);
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(fg.B);
        }
        else
        {
            _byteBuffer[_bytePos++] = (byte)'4';
            _byteBuffer[_bytePos++] = (byte)'8';
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'2';
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(bg.R);
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(bg.G);
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(bg.B);
        }

        _byteBuffer[_bytePos++] = (byte)'m';
    }

    /// <summary>
    /// Appends 256-color palette escape sequence.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void AppendColor256Escape(Pixel fg, Pixel bg, bool fgChanged, bool bgChanged)
    {
        EnsureCapacity(24);
        _byteBuffer[_bytePos++] = 0x1b;
        _byteBuffer[_bytePos++] = (byte)'[';

        if (fgChanged)
        {
            byte fgIndex = RgbTo256Color(fg.R, fg.G, fg.B);
            _byteBuffer[_bytePos++] = (byte)'3';
            _byteBuffer[_bytePos++] = (byte)'8';
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'5';
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(fgIndex);
            if (bgChanged) _byteBuffer[_bytePos++] = (byte)';';
        }

        if (bgChanged)
        {
            byte bgIndex = RgbTo256Color(bg.R, bg.G, bg.B);
            _byteBuffer[_bytePos++] = (byte)'4';
            _byteBuffer[_bytePos++] = (byte)'8';
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'5';
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(bgIndex);
        }

        _byteBuffer[_bytePos++] = (byte)'m';
    }

    /// <summary>
    /// Appends grayscale escape sequence using 256-color grayscale ramp.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void AppendGrayscaleEscape(Pixel fg, Pixel bg, bool fgChanged, bool bgChanged)
    {
        EnsureCapacity(24);
        _byteBuffer[_bytePos++] = 0x1b;
        _byteBuffer[_bytePos++] = (byte)'[';

        if (fgChanged)
        {
            byte gray = (byte)((fg.R * 299 + fg.G * 587 + fg.B * 114) / 1000);
            byte index = (byte)(232 + gray * 23 / 255);
            _byteBuffer[_bytePos++] = (byte)'3';
            _byteBuffer[_bytePos++] = (byte)'8';
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'5';
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(index);
            if (bgChanged) _byteBuffer[_bytePos++] = (byte)';';
        }

        if (bgChanged)
        {
            byte gray = (byte)((bg.R * 299 + bg.G * 587 + bg.B * 114) / 1000);
            byte index = (byte)(232 + gray * 23 / 255);
            _byteBuffer[_bytePos++] = (byte)'4';
            _byteBuffer[_bytePos++] = (byte)'8';
            _byteBuffer[_bytePos++] = (byte)';';
            _byteBuffer[_bytePos++] = (byte)'5';
            _byteBuffer[_bytePos++] = (byte)';';
            AppendNumber(index);
        }

        _byteBuffer[_bytePos++] = (byte)'m';
    }

    /// <summary>
    /// Appends 16-color escape sequence.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void AppendColor16Escape(Pixel fg, Pixel bg, bool fgChanged, bool bgChanged)
    {
        EnsureCapacity(12);
        _byteBuffer[_bytePos++] = 0x1b;
        _byteBuffer[_bytePos++] = (byte)'[';

        if (fgChanged)
        {
            byte code = RgbTo16Color(fg.R, fg.G, fg.B);
            AppendNumber(code < 8 ? 30 + code : 90 + code - 8);
            if (bgChanged) _byteBuffer[_bytePos++] = (byte)';';
        }

        if (bgChanged)
        {
            byte code = RgbTo16Color(bg.R, bg.G, bg.B);
            AppendNumber(code < 8 ? 40 + code : 100 + code - 8);
        }

        _byteBuffer[_bytePos++] = (byte)'m';
    }

    /// <summary>
    /// Appends cursor move escape sequence.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void AppendCursorMove(int row, int col)
    {
        EnsureCapacity(12);
        _byteBuffer[_bytePos++] = 0x1b;
        _byteBuffer[_bytePos++] = (byte)'[';
        AppendNumber(row);
        _byteBuffer[_bytePos++] = (byte)';';
        AppendNumber(col);
        _byteBuffer[_bytePos++] = (byte)'H';
    }

    /// <summary>
    /// Appends a number as ASCII digits.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void AppendNumber(int value)
    {
        if (value >= 100)
        {
            _byteBuffer[_bytePos++] = (byte)('0' + value / 100);
            value %= 100;
            _byteBuffer[_bytePos++] = (byte)('0' + value / 10);
            _byteBuffer[_bytePos++] = (byte)('0' + value % 10);
        }
        else if (value >= 10)
        {
            _byteBuffer[_bytePos++] = (byte)('0' + value / 10);
            _byteBuffer[_bytePos++] = (byte)('0' + value % 10);
        }
        else
        {
            _byteBuffer[_bytePos++] = (byte)('0' + value);
        }
    }

    /// <summary>
    /// Appends a UTF-8 character to the buffer.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void AppendUtf8Char(char c)
    {
        // Half-block characters are in the range U+2580-U+259F (3 bytes UTF-8)
        int codepoint = c;
        if (codepoint < 0x80)
        {
            _byteBuffer[_bytePos++] = (byte)codepoint;
        }
        else if (codepoint < 0x800)
        {
            _byteBuffer[_bytePos++] = (byte)(0xC0 | (codepoint >> 6));
            _byteBuffer[_bytePos++] = (byte)(0x80 | (codepoint & 0x3F));
        }
        else
        {
            _byteBuffer[_bytePos++] = (byte)(0xE0 | (codepoint >> 12));
            _byteBuffer[_bytePos++] = (byte)(0x80 | ((codepoint >> 6) & 0x3F));
            _byteBuffer[_bytePos++] = (byte)(0x80 | (codepoint & 0x3F));
        }
    }

    /// <summary>
    /// Appends raw bytes to the buffer.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void AppendBytes(ReadOnlySpan<byte> bytes)
    {
        EnsureCapacity(bytes.Length);
        bytes.CopyTo(_byteBuffer.AsSpan(_bytePos));
        _bytePos += bytes.Length;
    }

    /// <summary>
    /// Ensures buffer has enough capacity.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void EnsureCapacity(int needed)
    {
        if (_bytePos + needed > _byteBuffer.Length)
        {
            var newBuffer = ArrayPool<byte>.Shared.Rent(_byteBuffer.Length * 2);
            _byteBuffer.AsSpan(0, _bytePos).CopyTo(newBuffer);
            ArrayPool<byte>.Shared.Return(_byteBuffer);
            _byteBuffer = newBuffer;
        }
    }

    /// <summary>
    /// Flushes the buffer to the output stream.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void FlushBuffer()
    {
        if (_bytePos > 0)
        {
            _outputStream.Write(_byteBuffer, 0, _bytePos);
            _outputStream.Flush();
        }
    }

    /// <summary>
    /// Converts RGB to 256-color palette index.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static byte RgbTo256Color(byte r, byte g, byte b)
    {
        // Check for grayscale
        if (r == g && g == b)
        {
            if (r < 8) return 16;
            if (r > 248) return 231;
            return (byte)(232 + (r - 8) / 10);
        }

        // 6x6x6 color cube
        return (byte)(16 + 36 * (r / 51) + 6 * (g / 51) + (b / 51));
    }

    /// <summary>
    /// Converts RGB to 16-color palette index.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static byte RgbTo16Color(byte r, byte g, byte b)
    {
        // Simple threshold-based conversion
        int brightness = (r + g + b) / 3;
        bool isBright = brightness > 127;

        int index = 0;
        if (r > 127) index |= 1;
        if (g > 127) index |= 2;
        if (b > 127) index |= 4;

        return (byte)(isBright ? index + 8 : index);
    }

    /// <summary>
    /// Renders debug information overlay at the bottom of the screen.
    /// </summary>
    public void RenderDebugInfo(
        double fps, 
        double captureTime, 
        double renderTime, 
        int updatedCells, 
        int totalCells,
        string captureMethod,
        DiffStats? diffStats = null)
    {
        _bytePos = 0;

        // Build debug string
        var sb = new StringBuilder(128);
        sb.Append($" FPS: {fps:F1}");
        sb.Append($" | Capture: {captureTime:F1}ms");
        sb.Append($" | Render: {renderTime:F1}ms");
        sb.Append($" | Cells: {updatedCells}/{totalCells}");
        sb.Append($" | {captureMethod}");
        
        if (diffStats.HasValue)
        {
            sb.Append($" | {diffStats.Value.StrategyUsed}");
        }

        string debug = sb.ToString();
        int maxLen = Math.Min(debug.Length, _terminalWidth);

        // Position at bottom-left
        AppendCursorMove(_terminalHeight, 1);

        // Inverse video
        AppendBytes(InverseOn);

        // Write text (ASCII only for debug)
        EnsureCapacity(maxLen);
        for (int i = 0; i < maxLen; i++)
        {
            _byteBuffer[_bytePos++] = (byte)debug[i];
        }

        // Pad with spaces
        for (int i = maxLen; i < _terminalWidth; i++)
        {
            _byteBuffer[_bytePos++] = (byte)' ';
        }

        // Reset inverse
        AppendBytes(InverseOff);

        FlushBuffer();
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static double GetElapsedMs(long startTimestamp)
    {
        long elapsed = System.Diagnostics.Stopwatch.GetTimestamp() - startTimestamp;
        return elapsed * 1000.0 / System.Diagnostics.Stopwatch.Frequency;
    }

    public void Dispose()
    {
        Cleanup();

        ArrayPool<char>.Shared.Return(_charBuffer);
        ArrayPool<byte>.Shared.Return(_byteBuffer);
        _charBuffer = Array.Empty<char>();
        _byteBuffer = Array.Empty<byte>();

        if (_ownsStream)
        {
            _outputStream.Dispose();
        }
    }
}
