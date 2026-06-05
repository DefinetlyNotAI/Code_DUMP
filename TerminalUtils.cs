using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Text;

namespace G2C;

/// <summary>
/// Comprehensive terminal utilities for console manipulation, capability detection,
/// raw mode handling, and cross-platform terminal support.
/// </summary>
[SupportedOSPlatform("windows")]
public static class TerminalUtils
{
    #region Console Mode Flags

    private const int STD_OUTPUT_HANDLE = -11;
    private const int STD_INPUT_HANDLE = -10;
    private const int SW_MAXIMIZE = 3;
    
    // Output mode flags
    private const uint ENABLE_PROCESSED_OUTPUT = 0x0001;
    private const uint ENABLE_WRAP_AT_EOL_OUTPUT = 0x0002;
    private const uint ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
    private const uint DISABLE_NEWLINE_AUTO_RETURN = 0x0008;
    private const uint ENABLE_LVB_GRID_WORLDWIDE = 0x0010;
    
    // Input mode flags
    private const uint ENABLE_PROCESSED_INPUT = 0x0001;
    private const uint ENABLE_LINE_INPUT = 0x0002;
    private const uint ENABLE_ECHO_INPUT = 0x0004;
    private const uint ENABLE_WINDOW_INPUT = 0x0008;
    private const uint ENABLE_MOUSE_INPUT = 0x0010;
    private const uint ENABLE_INSERT_MODE = 0x0020;
    private const uint ENABLE_QUICK_EDIT_MODE = 0x0040;
    private const uint ENABLE_EXTENDED_FLAGS = 0x0080;
    private const uint ENABLE_AUTO_POSITION = 0x0100;
    private const uint ENABLE_VIRTUAL_TERMINAL_INPUT = 0x0200;

    #endregion

    #region State Tracking

    private static uint _originalOutputMode;
    private static uint _originalInputMode;
    private static bool _modesPreserved;
    private static readonly object _lock = new();

    #endregion

    #region Terminal Capabilities

    /// <summary>
    /// Detected terminal capabilities.
    /// </summary>
    public sealed class TerminalCapabilities
    {
        /// <summary>Whether the terminal supports ANSI escape sequences.</summary>
        public bool SupportsAnsi { get; init; }
        
        /// <summary>Whether the terminal supports 24-bit true color.</summary>
        public bool SupportsTrueColor { get; init; }
        
        /// <summary>Whether the terminal supports 256 colors.</summary>
        public bool Supports256Colors { get; init; }
        
        /// <summary>Whether the terminal supports mouse input.</summary>
        public bool SupportsMouse { get; init; }
        
        /// <summary>Whether the terminal supports Unicode/UTF-8.</summary>
        public bool SupportsUnicode { get; init; }
        
        /// <summary>Whether the terminal supports the alternate screen buffer.</summary>
        public bool SupportsAlternateScreen { get; init; }
        
        /// <summary>Whether the terminal supports bracketed paste mode.</summary>
        public bool SupportsBracketedPaste { get; init; }
        
        /// <summary>Whether the terminal supports synchronized output.</summary>
        public bool SupportsSynchronizedOutput { get; init; }
        
        /// <summary>The detected terminal emulator name.</summary>
        public string TerminalName { get; init; } = "Unknown";
        
        /// <summary>The terminal's color depth (1, 4, 8, or 24 bits).</summary>
        public int ColorDepth { get; init; }
        
        /// <summary>Maximum supported colors.</summary>
        public int MaxColors => ColorDepth switch
        {
            24 => 16_777_216,
            8 => 256,
            4 => 16,
            _ => 2
        };

        public override string ToString() => 
            $"Terminal: {TerminalName}, Colors: {MaxColors}, " +
            $"ANSI: {SupportsAnsi}, TrueColor: {SupportsTrueColor}, " +
            $"Mouse: {SupportsMouse}, Unicode: {SupportsUnicode}";
    }

    /// <summary>
    /// Detects terminal capabilities by examining environment variables and terminal responses.
    /// </summary>
    public static TerminalCapabilities DetectCapabilities()
    {
        var termProgram = Environment.GetEnvironmentVariable("TERM_PROGRAM") ?? "";
        var term = Environment.GetEnvironmentVariable("TERM") ?? "";
        var colorTerm = Environment.GetEnvironmentVariable("COLORTERM") ?? "";
        var wtSession = Environment.GetEnvironmentVariable("WT_SESSION");
        var conEmuAnsi = Environment.GetEnvironmentVariable("ConEmuANSI");
        
        // Detect terminal name
        string terminalName = termProgram switch
        {
            "vscode" => "VS Code Terminal",
            "iTerm.app" => "iTerm2",
            "Apple_Terminal" => "Apple Terminal",
            "Hyper" => "Hyper",
            "Tabby" => "Tabby",
            _ when !string.IsNullOrEmpty(wtSession) => "Windows Terminal",
            _ when !string.IsNullOrEmpty(conEmuAnsi) => "ConEmu",
            _ when term.Contains("xterm") => "xterm-compatible",
            _ when term.Contains("rxvt") => "rxvt",
            _ when term.Contains("screen") => "screen",
            _ when term.Contains("tmux") => "tmux",
            _ => DetectWindowsTerminal()
        };

        // Detect true color support
        bool supportsTrueColor = 
            colorTerm == "truecolor" || 
            colorTerm == "24bit" ||
            !string.IsNullOrEmpty(wtSession) ||
            termProgram == "vscode" ||
            termProgram == "Hyper" ||
            term.Contains("256color") ||
            term.Contains("direct") ||
            conEmuAnsi == "ON";

        // Detect 256 color support
        bool supports256 = supportsTrueColor || 
            term.Contains("256") || 
            term.Contains("xterm");

        // Color depth
        int colorDepth = supportsTrueColor ? 24 : (supports256 ? 8 : 4);

        // Check ANSI support
        bool supportsAnsi = TestAnsiSupport();

        return new TerminalCapabilities
        {
            SupportsAnsi = supportsAnsi,
            SupportsTrueColor = supportsTrueColor && supportsAnsi,
            Supports256Colors = supports256 && supportsAnsi,
            SupportsMouse = supportsAnsi,
            SupportsUnicode = Console.OutputEncoding.WebName == "utf-8" || 
                              Console.OutputEncoding is UTF8Encoding,
            SupportsAlternateScreen = supportsAnsi,
            SupportsBracketedPaste = supportsAnsi && !terminalName.Contains("ConEmu"),
            SupportsSynchronizedOutput = terminalName == "Windows Terminal" || 
                                         termProgram == "vscode",
            TerminalName = terminalName,
            ColorDepth = colorDepth
        };
    }

    private static string DetectWindowsTerminal()
    {
        try
        {
            var process = Process.GetCurrentProcess();
            var parent = GetParentProcess(process);
            
            while (parent != null)
            {
                var name = parent.ProcessName.ToLowerInvariant();
                if (name.Contains("windowsterminal")) return "Windows Terminal";
                if (name.Contains("conemu")) return "ConEmu";
                if (name.Contains("cmder")) return "Cmder";
                if (name.Contains("alacritty")) return "Alacritty";
                if (name.Contains("wezterm")) return "WezTerm";
                if (name.Contains("mintty")) return "MinTTY";
                if (name == "cmd" || name == "powershell" || name == "pwsh")
                {
                    parent = GetParentProcess(parent);
                    continue;
                }
                break;
            }
        }
        catch { /* Ignore process inspection errors */ }
        
        return "Windows Console";
    }

    private static Process? GetParentProcess(Process process)
    {
        try
        {
            var pbi = new PROCESS_BASIC_INFORMATION();
            int status = NtQueryInformationProcess(
                process.Handle, 0, ref pbi, 
                Marshal.SizeOf(pbi), out _);
            
            if (status == 0 && pbi.InheritedFromUniqueProcessId != IntPtr.Zero)
            {
                return Process.GetProcessById(pbi.InheritedFromUniqueProcessId.ToInt32());
            }
        }
        catch { /* Ignore errors */ }
        
        return null;
    }

    private static bool TestAnsiSupport()
    {
        try
        {
            nint handle = GetStdHandle(STD_OUTPUT_HANDLE);
            if (GetConsoleMode(handle, out uint mode))
            {
                // Try to enable VT processing
                if (SetConsoleMode(handle, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING))
                {
                    // Restore original mode
                    SetConsoleMode(handle, mode);
                    return true;
                }
            }
        }
        catch { /* Ignore errors */ }
        
        return false;
    }

    #endregion

    #region Terminal Size

    /// <summary>
    /// Terminal dimensions with pixel size support.
    /// </summary>
    public readonly struct TerminalSize
    {
        public int Columns { get; init; }
        public int Rows { get; init; }
        public int PixelWidth { get; init; }
        public int PixelHeight { get; init; }
        
        /// <summary>Approximate character width in pixels.</summary>
        public double CharWidth => PixelWidth > 0 && Columns > 0 
            ? (double)PixelWidth / Columns : 8.0;
        
        /// <summary>Approximate character height in pixels.</summary>
        public double CharHeight => PixelHeight > 0 && Rows > 0 
            ? (double)PixelHeight / Rows : 16.0;
        
        /// <summary>Character aspect ratio (width/height).</summary>
        public double CharAspectRatio => CharWidth / CharHeight;

        public override string ToString() => 
            $"{Columns}x{Rows} ({PixelWidth}x{PixelHeight}px)";
    }

    /// <summary>
    /// Gets the current terminal dimensions.
    /// </summary>
    public static TerminalSize GetTerminalSize()
    {
        try
        {
            int columns = Console.WindowWidth;
            int rows = Console.WindowHeight;
            
            // Try to get pixel dimensions via console screen buffer info
            var (pixelWidth, pixelHeight) = GetConsolePixelSize();
            
            return new TerminalSize
            {
                Columns = columns,
                Rows = rows,
                PixelWidth = pixelWidth,
                PixelHeight = pixelHeight
            };
        }
        catch
        {
            return new TerminalSize
            {
                Columns = 80,
                Rows = 24,
                PixelWidth = 640,
                PixelHeight = 384
            };
        }
    }

    private static (int Width, int Height) GetConsolePixelSize()
    {
        try
        {
            nint handle = GetStdHandle(STD_OUTPUT_HANDLE);
            if (GetConsoleScreenBufferInfoEx(handle, ref _bufferInfo))
            {
                int width = _bufferInfo.srWindow.Right - _bufferInfo.srWindow.Left + 1;
                int height = _bufferInfo.srWindow.Bottom - _bufferInfo.srWindow.Top + 1;
                
                // Estimate pixel size based on typical font metrics
                // Windows Console typically uses 8x16 or similar
                return (width * 8, height * 16);
            }
        }
        catch { /* Ignore errors */ }
        
        return (0, 0);
    }

    private static CONSOLE_SCREEN_BUFFER_INFOEX _bufferInfo = new() 
    { 
        cbSize = (uint)Marshal.SizeOf<CONSOLE_SCREEN_BUFFER_INFOEX>() 
    };

    /// <summary>
    /// Checks if the terminal size has changed.
    /// </summary>
    public static bool HasTerminalSizeChanged(int lastWidth, int lastHeight)
    {
        var size = GetTerminalSize();
        return size.Columns != lastWidth || size.Rows != lastHeight;
    }

    /// <summary>
    /// Event args for terminal resize events.
    /// </summary>
    public sealed class TerminalResizeEventArgs : EventArgs
    {
        public TerminalSize OldSize { get; init; }
        public TerminalSize NewSize { get; init; }
    }

    /// <summary>
    /// Monitors terminal size changes and invokes callback on resize.
    /// </summary>
    public static IDisposable MonitorResize(
        Action<TerminalResizeEventArgs> onResize,
        int pollIntervalMs = 100)
    {
        var cts = new CancellationTokenSource();
        var lastSize = GetTerminalSize();
        
        Task.Run(async () =>
        {
            while (!cts.Token.IsCancellationRequested)
            {
                await Task.Delay(pollIntervalMs, cts.Token).ConfigureAwait(false);
                
                var newSize = GetTerminalSize();
                if (newSize.Columns != lastSize.Columns || 
                    newSize.Rows != lastSize.Rows)
                {
                    var args = new TerminalResizeEventArgs
                    {
                        OldSize = lastSize,
                        NewSize = newSize
                    };
                    lastSize = newSize;
                    
                    try { onResize(args); }
                    catch { /* Ignore callback errors */ }
                }
            }
        }, cts.Token);
        
        return new ResizeMonitorDisposable(cts);
    }

    private sealed class ResizeMonitorDisposable(CancellationTokenSource cts) : IDisposable
    {
        public void Dispose() => cts.Cancel();
    }

    #endregion

    #region Console Setup

    /// <summary>
    /// Sets up console for optimal G2C rendering.
    /// </summary>
    public static void SetupConsole(bool enableMouse = true, bool useAlternateScreen = true)
    {
        lock (_lock)
        {
            // Preserve original modes for restoration
            PreserveConsoleModes();
            
            // Set UTF-8 encoding
            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;
            
            // Configure output mode
            nint stdOut = GetStdHandle(STD_OUTPUT_HANDLE);
            if (GetConsoleMode(stdOut, out uint outputMode))
            {
                outputMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
                outputMode |= DISABLE_NEWLINE_AUTO_RETURN;
                outputMode &= ~ENABLE_WRAP_AT_EOL_OUTPUT; // Disable auto-wrap
                SetConsoleMode(stdOut, outputMode);
            }
            
            // Configure input mode
            nint stdIn = GetStdHandle(STD_INPUT_HANDLE);
            if (GetConsoleMode(stdIn, out uint inputMode))
            {
                inputMode |= ENABLE_VIRTUAL_TERMINAL_INPUT;
                inputMode |= ENABLE_WINDOW_INPUT;
                
                if (enableMouse)
                {
                    inputMode |= ENABLE_MOUSE_INPUT;
                    inputMode &= ~ENABLE_QUICK_EDIT_MODE; // Disable quick edit for mouse
                    inputMode |= ENABLE_EXTENDED_FLAGS;
                }
                
                // Disable line buffering for immediate input
                inputMode &= ~ENABLE_LINE_INPUT;
                inputMode &= ~ENABLE_ECHO_INPUT;
                
                SetConsoleMode(stdIn, inputMode);
            }
            
            // Enter alternate screen buffer if supported
            if (useAlternateScreen)
            {
                Console.Write("\x1b[?1049h"); // Enter alternate screen
            }
            
            // Hide cursor
            Console.Write("\x1b[?25l");
            
            // Enable mouse tracking (SGR extended mode for better coordinates)
            if (enableMouse)
            {
                Console.Write("\x1b[?1000h"); // Enable mouse click tracking
                Console.Write("\x1b[?1002h"); // Enable mouse drag tracking
                Console.Write("\x1b[?1006h"); // Enable SGR extended mouse mode
            }
            
            Console.CursorVisible = false;
        }
    }

    public static void OptimizeConsoleForRendering()
    {
        TryRequestTerminalResize();

        try
        {
            nint consoleWindow = GetConsoleWindow();
            if (consoleWindow != nint.Zero)
                ShowWindow(consoleWindow, SW_MAXIMIZE);
        }
        catch { }

        TrySetTinyConsoleFont();
        TryUseLargestConsoleWindow();
        TryRequestTerminalResize();
    }

    private static void TryRequestTerminalResize()
    {
        try
        {
            // xterm-compatible terminals: maximize window and request a very large character grid.
            Console.Write("\x1b[9;1t\x1b[8;999;999t");
        }
        catch { }
    }

    private static void TrySetTinyConsoleFont()
    {
        try
        {
            nint stdOut = GetStdHandle(STD_OUTPUT_HANDLE);
            var font = new CONSOLE_FONT_INFOEX
            {
                cbSize = (uint)Marshal.SizeOf<CONSOLE_FONT_INFOEX>(),
                nFont = 0,
                dwFontSize = new COORD { X = 4, Y = 6 },
                FontFamily = 54,
                FontWeight = 400,
                FaceName = "Consolas"
            };

            SetCurrentConsoleFontEx(stdOut, false, ref font);
        }
        catch { }
    }

    private static void TryUseLargestConsoleWindow()
    {
        try
        {
            int width = Math.Max(1, Console.LargestWindowWidth);
            int height = Math.Max(1, Console.LargestWindowHeight);

            Console.SetBufferSize(
                Math.Max(Console.BufferWidth, width),
                Math.Max(Console.BufferHeight, height));
            Console.SetWindowSize(width, height);
            Console.SetBufferSize(width, height);
        }
        catch { }
    }

    /// <summary>
    /// Preserves current console modes for later restoration.
    /// </summary>
    private static void PreserveConsoleModes()
    {
        if (_modesPreserved) return;
        
        nint stdOut = GetStdHandle(STD_OUTPUT_HANDLE);
        nint stdIn = GetStdHandle(STD_INPUT_HANDLE);
        
        GetConsoleMode(stdOut, out _originalOutputMode);
        GetConsoleMode(stdIn, out _originalInputMode);
        
        _modesPreserved = true;
    }

    /// <summary>
    /// Restores console to original state.
    /// </summary>
    public static void RestoreConsole()
    {
        lock (_lock)
        {
            // Disable mouse tracking
            Console.Write("\x1b[?1006l");
            Console.Write("\x1b[?1002l");
            Console.Write("\x1b[?1000l");
            
            // Show cursor
            Console.Write("\x1b[?25h");
            
            // Exit alternate screen buffer
            Console.Write("\x1b[?1049l");
            
            // Reset all attributes
            Console.Write("\x1b[0m");
            
            // Clear screen
            Console.Write("\x1b[2J\x1b[H");
            
            // Restore original console modes
            if (_modesPreserved)
            {
                nint stdOut = GetStdHandle(STD_OUTPUT_HANDLE);
                nint stdIn = GetStdHandle(STD_INPUT_HANDLE);
                
                SetConsoleMode(stdOut, _originalOutputMode);
                SetConsoleMode(stdIn, _originalInputMode);
            }
            
            Console.CursorVisible = true;
        }
    }

    #endregion

    #region ANSI Escape Sequences

    /// <summary>
    /// Common ANSI escape sequences.
    /// </summary>
    public static class Ansi
    {
        public const string Escape = "\x1b";
        public const string Csi = "\x1b[";
        public const string Osc = "\x1b]";
        public const string Dcs = "\x1bP";
        public const string St = "\x1b\\";
        
        // Cursor movement
        public static string CursorTo(int row, int col) => $"\x1b[{row};{col}H";
        public static string CursorUp(int n = 1) => $"\x1b[{n}A";
        public static string CursorDown(int n = 1) => $"\x1b[{n}B";
        public static string CursorForward(int n = 1) => $"\x1b[{n}C";
        public static string CursorBack(int n = 1) => $"\x1b[{n}D";
        public const string CursorHome = "\x1b[H";
        public const string CursorSave = "\x1b[s";
        public const string CursorRestore = "\x1b[u";
        
        // Cursor visibility
        public const string CursorShow = "\x1b[?25h";
        public const string CursorHide = "\x1b[?25l";
        
        // Screen
        public const string ClearScreen = "\x1b[2J";
        public const string ClearScreenFromCursor = "\x1b[0J";
        public const string ClearScreenToCursor = "\x1b[1J";
        public const string ClearLine = "\x1b[2K";
        public const string ClearLineFromCursor = "\x1b[0K";
        public const string ClearLineToCursor = "\x1b[1K";
        
        // Alternate screen buffer
        public const string EnterAlternateScreen = "\x1b[?1049h";
        public const string ExitAlternateScreen = "\x1b[?1049l";
        
        // Synchronized output (reduces flicker)
        public const string BeginSyncUpdate = "\x1b[?2026h";
        public const string EndSyncUpdate = "\x1b[?2026l";
        
        // Colors
        public const string Reset = "\x1b[0m";
        public static string Fg256(byte color) => $"\x1b[38;5;{color}m";
        public static string Bg256(byte color) => $"\x1b[48;5;{color}m";
        public static string FgRgb(byte r, byte g, byte b) => $"\x1b[38;2;{r};{g};{b}m";
        public static string BgRgb(byte r, byte g, byte b) => $"\x1b[48;2;{r};{g};{b}m";
        
        // Text attributes
        public const string Bold = "\x1b[1m";
        public const string Dim = "\x1b[2m";
        public const string Italic = "\x1b[3m";
        public const string Underline = "\x1b[4m";
        public const string Blink = "\x1b[5m";
        public const string Reverse = "\x1b[7m";
        public const string Hidden = "\x1b[8m";
        public const string Strikethrough = "\x1b[9m";
        
        // Mouse tracking
        public const string EnableMouseClick = "\x1b[?1000h";
        public const string DisableMouseClick = "\x1b[?1000l";
        public const string EnableMouseDrag = "\x1b[?1002h";
        public const string DisableMouseDrag = "\x1b[?1002l";
        public const string EnableMouseAll = "\x1b[?1003h";
        public const string DisableMouseAll = "\x1b[?1003l";
        public const string EnableSgrMouse = "\x1b[?1006h";
        public const string DisableSgrMouse = "\x1b[?1006l";
        
        // Bracketed paste
        public const string EnableBracketedPaste = "\x1b[?2004h";
        public const string DisableBracketedPaste = "\x1b[?2004l";
        
        // Terminal queries
        public const string QueryCursorPosition = "\x1b[6n";
        public const string QueryDeviceAttributes = "\x1b[c";
        public const string QueryTerminalSize = "\x1b[18t";
    }

    #endregion

    #region Native Interop

    [StructLayout(LayoutKind.Sequential)]
    private struct PROCESS_BASIC_INFORMATION
    {
        public IntPtr Reserved1;
        public IntPtr PebBaseAddress;
        public IntPtr Reserved2_0;
        public IntPtr Reserved2_1;
        public IntPtr UniqueProcessId;
        public IntPtr InheritedFromUniqueProcessId;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct SMALL_RECT
    {
        public short Left;
        public short Top;
        public short Right;
        public short Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct COORD
    {
        public short X;
        public short Y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct COLORREF
    {
        public uint Value;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct CONSOLE_SCREEN_BUFFER_INFOEX
    {
        public uint cbSize;
        public COORD dwSize;
        public COORD dwCursorPosition;
        public ushort wAttributes;
        public SMALL_RECT srWindow;
        public COORD dwMaximumWindowSize;
        public ushort wPopupAttributes;
        public int bFullscreenSupported;
        
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
        public COLORREF[] ColorTable;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct CONSOLE_FONT_INFOEX
    {
        public uint cbSize;
        public uint nFont;
        public COORD dwFontSize;
        public int FontFamily;
        public int FontWeight;

        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
        public string FaceName;
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern nint GetStdHandle(int nStdHandle);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern nint GetConsoleWindow();

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ShowWindow(nint hWnd, int nCmdShow);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetConsoleMode(nint hConsoleHandle, out uint lpMode);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetConsoleMode(nint hConsoleHandle, uint dwMode);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetConsoleScreenBufferInfoEx(
        nint hConsoleOutput, 
        ref CONSOLE_SCREEN_BUFFER_INFOEX lpConsoleScreenBufferInfoEx);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetCurrentConsoleFontEx(
        nint consoleOutput,
        bool maximumWindow,
        ref CONSOLE_FONT_INFOEX consoleCurrentFontEx);

    [DllImport("ntdll.dll")]
    private static extern int NtQueryInformationProcess(
        IntPtr processHandle,
        int processInformationClass,
        ref PROCESS_BASIC_INFORMATION processInformation,
        int processInformationLength,
        out int returnLength);

    #endregion
}
