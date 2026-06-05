namespace G2C;

/// <summary>
/// Runtime configuration for G2C application.
/// Handles CLI argument parsing, validation, and environment detection.
/// </summary>
public sealed class Configuration
{
    // Rendering settings
    public int TargetFps { get; private set; } = 24;
    public bool Grayscale { get; private set; }
    public bool NoDiff { get; private set; }
    public ScaleMode ScaleMode { get; private set; } = ScaleMode.Fit;
    public ColorDepth ColorDepth { get; private set; } = ColorDepth.TrueColor;
    public DitherMode Dither { get; private set; } = DitherMode.None;
    
    // Input settings
    public bool EnableMouse { get; private set; } = true;
    public bool EnableKeyboard { get; private set; }
    
    // Display settings
    public bool ShowDebugInfo { get; private set; }
    public bool ShowStats { get; private set; }
    public int? TargetMonitor { get; private set; }
    public Rectangle? CaptureRegion { get; private set; }
    
    // Performance settings
    public CaptureMethod PreferredCaptureMethod { get; private set; } = CaptureMethod.Auto;
    public int ThreadCount { get; private set; } = Environment.ProcessorCount;
    public bool LowLatencyMode { get; private set; }

    // Character rendering
    public CharacterSet CharacterSet { get; private set; } = CharacterSet.HalfBlock;
    
    /// <summary>
    /// Parses command line arguments into configuration.
    /// </summary>
    public static Configuration Parse(string[] args)
    {
        var config = new Configuration();
        
        for (int i = 0; i < args.Length; i++)
        {
            var arg = args[i];
            
            // Handle --key=value format
            if (arg.Contains('='))
            {
                var parts = arg.Split('=', 2);
                var key = parts[0].ToLowerInvariant();
                var value = parts[1];
                
                switch (key)
                {
                    case "--fps":
                        if (int.TryParse(value, out int fps) && fps is > 0 and <= 120)
                            config.TargetFps = fps;
                        else
                            PrintWarning($"Invalid FPS value '{value}', using default (24)");
                        break;
                        
                    case "--scale":
                        config.ScaleMode = value.ToLowerInvariant() switch
                        {
                            "stretch" => ScaleMode.Stretch,
                            "fit" => ScaleMode.Fit,
                            "fill" => ScaleMode.Fill,
                            "pixel" => ScaleMode.PixelPerfect,
                            _ => ScaleMode.Fit
                        };
                        break;
                        
                    case "--color":
                    case "--colors":
                        config.ColorDepth = value.ToLowerInvariant() switch
                        {
                            "true" or "truecolor" or "24bit" => ColorDepth.TrueColor,
                            "256" or "8bit" => ColorDepth.Color256,
                            "16" or "4bit" => ColorDepth.Color16,
                            "ansi" => ColorDepth.AnsiBasic,
                            _ => ColorDepth.TrueColor
                        };
                        break;
                        
                    case "--dither":
                        config.Dither = value.ToLowerInvariant() switch
                        {
                            "none" => DitherMode.None,
                            "ordered" or "bayer" => DitherMode.Ordered,
                            "floyd" or "floyd-steinberg" => DitherMode.FloydSteinberg,
                            "atkinson" => DitherMode.Atkinson,
                            _ => DitherMode.None
                        };
                        break;
                        
                    case "--monitor":
                        if (int.TryParse(value, out int monitor) && monitor >= 0)
                            config.TargetMonitor = monitor;
                        break;
                        
                    case "--region":
                        if (TryParseRegion(value, out var region))
                            config.CaptureRegion = region;
                        break;
                        
                    case "--capture":
                        config.PreferredCaptureMethod = value.ToLowerInvariant() switch
                        {
                            "dxgi" => CaptureMethod.Dxgi,
                            "gdi" => CaptureMethod.Gdi,
                            "wgc" or "graphics-capture" => CaptureMethod.WindowsGraphicsCapture,
                            _ => CaptureMethod.Auto
                        };
                        break;
                        
                    case "--threads":
                        if (int.TryParse(value, out int threads) && threads is > 0 and <= 64)
                            config.ThreadCount = threads;
                        break;
                        
                    case "--charset":
                        config.CharacterSet = value.ToLowerInvariant() switch
                        {
                            "half" or "halfblock" => CharacterSet.HalfBlock,
                            "quarter" or "quadrant" => CharacterSet.Quadrant,
                            "braille" => CharacterSet.Braille,
                            "block" => CharacterSet.FullBlock,
                            "ascii" => CharacterSet.AsciiShade,
                            _ => CharacterSet.HalfBlock
                        };
                        break;
                }
            }
            else
            {
                // Handle flag arguments
                switch (arg.ToLowerInvariant())
                {
                    case "--grayscale":
                    case "--grey":
                    case "--gray":
                    case "-g":
                        config.Grayscale = true;
                        break;
                        
                    case "--no-diff":
                    case "--nodiff":
                        config.NoDiff = true;
                        break;
                        
                    case "--no-mouse":
                    case "--nomouse":
                        config.EnableMouse = false;
                        break;
                        
                    case "--keyboard":
                    case "-k":
                        config.EnableKeyboard = true;
                        break;
                        
                    case "--debug":
                    case "-d":
                        config.ShowDebugInfo = true;
                        break;
                        
                    case "--stats":
                    case "-s":
                        config.ShowStats = true;
                        break;
                        
                    case "--low-latency":
                    case "--fast":
                        config.LowLatencyMode = true;
                        config.NoDiff = false; // Diff is faster in low-latency mode
                        break;
                        
                    case "--help":
                    case "-h":
                    case "-?":
                        PrintHelp();
                        Environment.Exit(0);
                        break;
                        
                    case "--version":
                    case "-v":
                        PrintVersion();
                        Environment.Exit(0);
                        break;
                }
            }
        }
        
        // Auto-detect color depth if terminal doesn't support truecolor
        if (config.ColorDepth == ColorDepth.TrueColor && !DetectTrueColorSupport())
        {
            config.ColorDepth = ColorDepth.Color256;
            PrintWarning("Truecolor not detected, falling back to 256 colors");
        }
        
        return config;
    }
    
    private static bool TryParseRegion(string value, out Rectangle region)
    {
        region = default;
        var parts = value.Split(',', 'x', 'X');
        if (parts.Length == 4 &&
            int.TryParse(parts[0], out int x) &&
            int.TryParse(parts[1], out int y) &&
            int.TryParse(parts[2], out int w) &&
            int.TryParse(parts[3], out int h))
        {
            region = new Rectangle(x, y, w, h);
            return true;
        }
        return false;
    }
    
    private static bool DetectTrueColorSupport()
    {
        var colorTerm = Environment.GetEnvironmentVariable("COLORTERM");
        if (colorTerm is "truecolor" or "24bit")
            return true;
            
        var term = Environment.GetEnvironmentVariable("TERM");
        if (term?.Contains("256color") == true || term?.Contains("truecolor") == true)
            return true;
            
        // Windows Terminal and modern PowerShell support truecolor
        var wtSession = Environment.GetEnvironmentVariable("WT_SESSION");
        if (!string.IsNullOrEmpty(wtSession))
            return true;
            
        return true; // Assume support on Windows
    }
    
    private static void PrintWarning(string message)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.Error.WriteLine($"[G2C] Warning: {message}");
        Console.ResetColor();
    }

    private static void PrintVersion()
    {
        Console.WriteLine("G2C - GUI to CLI v1.0.0");
        Console.WriteLine($"Runtime: .NET {Environment.Version}");
        Console.WriteLine($"Platform: {Environment.OSVersion}");
    }

    private static void PrintHelp()
    {
        Console.WriteLine("""
            G2C - GUI to CLI
            Renders your Windows desktop in the terminal using ANSI escape sequences.

            USAGE:
                g2c [OPTIONS]

            RENDERING OPTIONS:
                --fps=<1-120>           Target frame rate (default: 24)
                --grayscale, -g         Render in grayscale
                --scale=<mode>          Scaling: fit, stretch, fill, pixel (default: fit)
                --color=<depth>         Color depth: truecolor, 256, 16, ansi (default: truecolor)
                --dither=<mode>         Dithering: none, ordered, floyd, atkinson (default: none)
                --charset=<set>         Characters: half, quarter, braille, block, ascii (default: half)
                --no-diff               Disable differential rendering

            CAPTURE OPTIONS:
                --monitor=<n>           Capture specific monitor (0-indexed)
                --region=<x,y,w,h>      Capture specific region
                --capture=<method>      Force capture method: dxgi, gdi, wgc, auto (default: auto)

            INPUT OPTIONS:
                --no-mouse              Disable mouse input forwarding
                --keyboard, -k          Enable keyboard input forwarding (experimental)

            PERFORMANCE OPTIONS:
                --threads=<n>           Number of worker threads (default: CPU count)
                --low-latency           Optimize for minimum latency

            DISPLAY OPTIONS:
                --debug, -d             Show debug overlay
                --stats, -s             Show performance statistics

            OTHER OPTIONS:
                --help, -h              Show this help message
                --version, -v           Show version information

            CONTROLS:
                Ctrl+C                  Exit gracefully
                Mouse                   Click/drag forwarded to desktop (if enabled)

            EXAMPLES:
                g2c                             Default settings (24 FPS, fit scaling, truecolor)
                g2c --fps=60 --low-latency      High performance mode
                g2c --grayscale --charset=braille    ASCII art style
                g2c --monitor=1 --scale=stretch Capture second monitor, stretched

            TERMINAL REQUIREMENTS:
                - Windows Terminal, PowerShell 7+, or any terminal with ANSI support
                - Truecolor support recommended (COLORTERM=truecolor)
                - Unicode support for block characters

            For more information, visit: https://github.com/g2c/g2c
            """);
    }
}

/// <summary>
/// Display scaling mode.
/// </summary>
public enum ScaleMode
{
    /// <summary>Fit within terminal, maintaining aspect ratio with letterboxing.</summary>
    Fit,
    /// <summary>Stretch to fill terminal, ignoring aspect ratio.</summary>
    Stretch,
    /// <summary>Fill terminal by cropping, maintaining aspect ratio.</summary>
    Fill,
    /// <summary>1:1 pixel mapping with scrolling if needed.</summary>
    PixelPerfect
}

/// <summary>
/// Color output depth.
/// </summary>
public enum ColorDepth
{
    /// <summary>24-bit RGB (16 million colors).</summary>
    TrueColor,
    /// <summary>8-bit indexed (256 colors).</summary>
    Color256,
    /// <summary>4-bit (16 colors).</summary>
    Color16,
    /// <summary>Basic ANSI (8 colors + bold).</summary>
    AnsiBasic
}

/// <summary>
/// Dithering algorithm for reduced color depths.
/// </summary>
public enum DitherMode
{
    None,
    Ordered,        // Bayer matrix
    FloydSteinberg, // Error diffusion
    Atkinson        // Lighter error diffusion
}

/// <summary>
/// Screen capture method.
/// </summary>
public enum CaptureMethod
{
    Auto,
    Dxgi,
    Gdi,
    WindowsGraphicsCapture
}

/// <summary>
/// Character set for rendering.
/// </summary>
public enum CharacterSet
{
    /// <summary>▀ Upper half block (2 pixels per cell).</summary>
    HalfBlock,
    /// <summary>▖▗▘▙▚▛▜▝▞▟ Quadrant characters (4 pixels per cell).</summary>
    Quadrant,
    /// <summary>Braille patterns (8 pixels per cell).</summary>
    Braille,
    /// <summary>█ Full block with shading.</summary>
    FullBlock,
    /// <summary>ASCII shading: .:-=+*#%@</summary>
    AsciiShade
}

/// <summary>
/// Represents a rectangular region.
/// </summary>
public readonly record struct Rectangle(int X, int Y, int Width, int Height);
