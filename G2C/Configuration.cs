using G2C.Capture;

namespace G2C;

/// <summary>
/// Runtime configuration for G2C application.
/// Handles CLI argument parsing, validation, and environment detection.
/// </summary>
public sealed class Configuration
{
    private readonly List<string> _parseErrors = new();

    public bool ShowHelp { get; private set; }
    public bool ShowVersion { get; private set; }
    public double? CustomScale { get; private set; }
    public bool UseSynchronizedOutput { get; private set; } = true;

    public int TargetFps { get; private set; } = 24;
    public bool Grayscale { get; private set; }
    public bool NoDiff { get; private set; }
    public ScaleMode ScaleMode { get; private set; } = ScaleMode.Fit;
    public ColorDepth ColorDepth { get; private set; } = ColorDepth.TrueColor;
    public DitherMode Dither { get; private set; } = DitherMode.None;

    public bool EnableMouse { get; private set; }
    public bool EnableKeyboard { get; private set; }

    public bool ShowDebugInfo { get; private set; }
    public bool ShowStats { get; private set; }
    public int? TargetMonitor { get; private set; }
    public Rectangle? CaptureRegion { get; private set; }

    public CaptureMethod PreferredCaptureMethod { get; private set; } = CaptureMethod.Auto;
    public int ThreadCount { get; private set; } = Environment.ProcessorCount;
    public bool LowLatencyMode { get; private set; }

    public CharacterSet CharacterSet { get; private set; } = CharacterSet.HalfBlock;
    public string? TargetApplicationPath { get; private set; }

    public static Configuration Parse(string[] args)
    {
        var config = new Configuration();

        foreach (string arg in args)
        {
            if (arg.Contains('='))
            {
                string[] parts = arg.Split('=', 2);
                string key = parts[0].ToLowerInvariant();
                string value = parts[1];

                switch (key)
                {
                    case "--fps":
                        if (int.TryParse(value, out int fps) && fps is > 0 and <= 120)
                            config.TargetFps = fps;
                        else
                            config._parseErrors.Add("--fps must be an integer from 1 to 120.");
                        break;

                    case "--scale":
                        config.ScaleMode = value.ToLowerInvariant() switch
                        {
                            "stretch" => ScaleMode.Stretch,
                            "fit" => ScaleMode.Fit,
                            "fill" => ScaleMode.Fill,
                            "pixel" => ScaleMode.PixelPerfect,
                            _ => AddParseError(config, "--scale must be one of: fit, stretch, fill, pixel.", ScaleMode.Fit)
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
                            _ => AddParseError(config, "--color must be one of: truecolor, 256, 16, ansi.", ColorDepth.TrueColor)
                        };
                        break;

                    case "--dither":
                        config.Dither = value.ToLowerInvariant() switch
                        {
                            "none" => DitherMode.None,
                            "ordered" or "bayer" => DitherMode.Ordered,
                            "floyd" or "floyd-steinberg" => DitherMode.FloydSteinberg,
                            "atkinson" => DitherMode.Atkinson,
                            _ => AddParseError(config, "--dither must be one of: none, ordered, floyd, atkinson.", DitherMode.None)
                        };
                        break;

                    case "--monitor":
                        if (int.TryParse(value, out int monitor) && monitor >= 0)
                            config.TargetMonitor = monitor;
                        else
                            config._parseErrors.Add("--monitor must be a non-negative integer.");
                        break;

                    case "--region":
                        if (TryParseRegion(value, out Rectangle region))
                            config.CaptureRegion = region;
                        else
                            config._parseErrors.Add("--region must use x,y,width,height with positive width and height.");
                        break;

                    case "--capture":
                        config.PreferredCaptureMethod = value.ToLowerInvariant() switch
                        {
                            "dxgi" => CaptureMethod.Dxgi,
                            "gdi" => CaptureMethod.Gdi,
                            "auto" => CaptureMethod.Auto,
                            "wgc" or "graphics-capture" => AddParseError(config, "--capture=wgc is not implemented. Use dxgi, gdi, or auto.", CaptureMethod.Auto),
                            _ => AddParseError(config, "--capture must be one of: dxgi, gdi, auto.", CaptureMethod.Auto)
                        };
                        break;

                    case "--threads":
                        if (int.TryParse(value, out int threads) && threads is > 0 and <= 64)
                            config.ThreadCount = threads;
                        else
                            config._parseErrors.Add("--threads must be an integer from 1 to 64.");
                        break;

                    case "--charset":
                        config.CharacterSet = value.ToLowerInvariant() switch
                        {
                            "half" or "halfblock" => CharacterSet.HalfBlock,
                            "quarter" or "quadrant" => CharacterSet.Quadrant,
                            "braille" => CharacterSet.Braille,
                            "block" => CharacterSet.FullBlock,
                            "ascii" => CharacterSet.AsciiShade,
                            _ => AddParseError(config, "--charset must be one of: half, quarter, braille, block, ascii.", CharacterSet.HalfBlock)
                        };
                        break;

                    default:
                        config._parseErrors.Add($"Unknown option '{parts[0]}'.");
                        break;
                }

                continue;
            }

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

                case "--mouse":
                    config.EnableMouse = true;
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
                    config.NoDiff = false;
                    break;

                case "--help":
                case "-h":
                case "-?":
                    config.ShowHelp = true;
                    break;

                case "--version":
                case "-v":
                    config.ShowVersion = true;
                    break;

                default:
                    if (arg.StartsWith('-'))
                    {
                        config._parseErrors.Add($"Unknown option '{arg}'.");
                    }
                    else if (config.TargetApplicationPath is null)
                    {
                        config.TargetApplicationPath = arg;
                    }
                    else
                    {
                        config._parseErrors.Add($"Unexpected positional argument '{arg}'.");
                    }
                    break;
            }
        }

        if (config.ColorDepth == ColorDepth.TrueColor && !DetectTrueColorSupport())
        {
            config.ColorDepth = ColorDepth.Color256;
            PrintWarning("Truecolor not detected, falling back to 256 colors");
        }

        return config;
    }

    public List<string> Validate()
    {
        List<string> errors = new();
        errors.AddRange(_parseErrors);

        if (TargetFps <= 0)
            errors.Add("Target FPS must be greater than 0.");

        if (ThreadCount <= 0)
            errors.Add("Thread count must be greater than 0.");

        if (Dither != DitherMode.None)
            errors.Add("Dithering modes are not implemented yet. Use --dither=none.");

        if (EnableKeyboard)
            errors.Add("Keyboard input forwarding is not implemented yet. Omit --keyboard.");

        if (TargetMonitor.HasValue)
            errors.Add("Monitor selection is not implemented yet. Omit --monitor.");

        if (CaptureRegion.HasValue)
            errors.Add("Region capture is not implemented yet. Omit --region.");

        if (TargetApplicationPath is { Length: > 0 } && !File.Exists(TargetApplicationPath))
            errors.Add($"Target application path does not exist: {TargetApplicationPath}");

        return errors;
    }

    public static void PrintUsage()
    {
        PrintHelp();
    }

    public static void PrintVersion()
    {
        Console.WriteLine("G2C - GUI to CLI v1.0.0");
        Console.WriteLine($"Runtime: .NET {Environment.Version}");
        Console.WriteLine($"Platform: {Environment.OSVersion}");
    }

    private static bool TryParseRegion(string value, out Rectangle region)
    {
        region = default;

        string[] parts = value.Split(',', 'x', 'X');
        if (parts.Length != 4)
            return false;

        if (!int.TryParse(parts[0], out int x))
            return false;

        if (!int.TryParse(parts[1], out int y))
            return false;

        if (!int.TryParse(parts[2], out int width))
            return false;

        if (!int.TryParse(parts[3], out int height))
            return false;

        if (width <= 0 || height <= 0)
            return false;

        region = new Rectangle(x, y, width, height);
        return true;
    }

    private static T AddParseError<T>(Configuration config, string message, T fallback)
    {
        config._parseErrors.Add(message);
        return fallback;
    }

    private static bool DetectTrueColorSupport()
    {
        string? colorTerm = Environment.GetEnvironmentVariable("COLORTERM");
        if (colorTerm is "truecolor" or "24bit")
            return true;

        string? term = Environment.GetEnvironmentVariable("TERM");
        if (term?.Contains("256color") == true || term?.Contains("truecolor") == true)
            return true;

        string? wtSession = Environment.GetEnvironmentVariable("WT_SESSION");
        if (!string.IsNullOrEmpty(wtSession))
            return true;

        return true;
    }

    private static void PrintWarning(string message)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.Error.WriteLine($"[G2C] Warning: {message}");
        Console.ResetColor();
    }

    private static void PrintHelp()
    {
        Console.WriteLine("""
            G2C - GUI to CLI
            Renders your Windows desktop in the terminal using ANSI escape sequences.

            USAGE:
                g2c [OPTIONS] [APPLICATION_PATH]

            TARGET APPLICATION:
                APPLICATION_PATH        Launch and render only that application's window

            RENDERING OPTIONS:
                --fps=<1-120>           Target frame rate (default: 24)
                --grayscale, -g         Render in grayscale
                --scale=<mode>          Scaling: fit, stretch, fill, pixel
                --color=<depth>         Color depth: truecolor, 256, 16, ansi
                --dither=<mode>         Dithering: none (other modes reserved)
                --charset=<set>         Characters: half, quarter, braille, block, ascii
                --no-diff               Disable differential rendering

            CAPTURE OPTIONS:
                --monitor=<n>           Reserved; not implemented
                --region=<x,y,w,h>      Reserved; not implemented
                --capture=<method>      Capture method: dxgi, gdi, auto

            INPUT OPTIONS:
                --mouse                 Enable mouse input forwarding
                --no-mouse              Keep mouse input forwarding disabled
                --keyboard, -k          Reserved; not implemented

            DISPLAY OPTIONS:
                --debug, -d             Show debug overlay
                --stats, -s             Show performance statistics

            OTHER OPTIONS:
                --help, -h              Show help
                --version, -v           Show version
            """);
    }
}

public enum ScaleMode
{
    Fit,
    Stretch,
    Fill,
    PixelPerfect
}

public enum ColorDepth
{
    TrueColor,
    Color256,
    Color16,
    AnsiBasic
}

public enum DitherMode
{
    None,
    Ordered,
    FloydSteinberg,
    Atkinson
}

public enum CharacterSet
{
    HalfBlock,
    Quadrant,
    Braille,
    FullBlock,
    AsciiShade
}

public readonly record struct Rectangle(int X, int Y, int Width, int Height);
