namespace G2C.FrameBuffer;

/// <summary>
/// Represents a single pixel with RGB values.
/// Uses readonly struct for stack allocation and zero GC pressure.
/// </summary>
public readonly struct Pixel : IEquatable<Pixel>
{
    public readonly byte R;
    public readonly byte G;
    public readonly byte B;

    public Pixel(byte r, byte g, byte b)
    {
        R = r;
        G = g;
        B = b;
    }

    /// <summary>
    /// Creates a pixel from a packed BGRA value (common screen capture format).
    /// </summary>
    public static Pixel FromBgra(uint bgra) => new(
        (byte)((bgra >> 16) & 0xFF),
        (byte)((bgra >> 8) & 0xFF),
        (byte)(bgra & 0xFF)
    );

    /// <summary>
    /// Creates a pixel from a packed RGBA value.
    /// </summary>
    public static Pixel FromRgba(uint rgba) => new(
        (byte)((rgba >> 24) & 0xFF),
        (byte)((rgba >> 16) & 0xFF),
        (byte)((rgba >> 8) & 0xFF)
    );

    /// <summary>
    /// Packs pixel as BGRA for output.
    /// </summary>
    public uint ToBgra() => (uint)((0xFF << 24) | (R << 16) | (G << 8) | B);

    /// <summary>
    /// Converts to grayscale using luminosity method (ITU-R BT.709).
    /// </summary>
    public Pixel ToGrayscale()
    {
        // Using integer math for performance: (R*77 + G*150 + B*29) >> 8
        byte gray = (byte)((R * 77 + G * 150 + B * 29) >> 8);
        return new Pixel(gray, gray, gray);
    }

    /// <summary>
    /// Converts to grayscale using average method (faster but less accurate).
    /// </summary>
    public Pixel ToGrayscaleFast()
    {
        byte gray = (byte)((R + G + B) / 3);
        return new Pixel(gray, gray, gray);
    }

    /// <summary>
    /// Calculates perceptual luminance (0-255).
    /// </summary>
    public byte Luminance => (byte)((R * 77 + G * 150 + B * 29) >> 8);

    /// <summary>
    /// Linear interpolation between two pixels.
    /// </summary>
    public static Pixel Lerp(Pixel a, Pixel b, float t)
    {
        float invT = 1f - t;
        return new Pixel(
            (byte)(a.R * invT + b.R * t),
            (byte)(a.G * invT + b.G * t),
            (byte)(a.B * invT + b.B * t)
        );
    }

    /// <summary>
    /// Blends two pixels with alpha.
    /// </summary>
    public Pixel Blend(Pixel other, byte alpha)
    {
        int invAlpha = 255 - alpha;
        return new Pixel(
            (byte)((R * invAlpha + other.R * alpha) >> 8),
            (byte)((G * invAlpha + other.G * alpha) >> 8),
            (byte)((B * invAlpha + other.B * alpha) >> 8)
        );
    }

    /// <summary>
    /// Calculates color distance (squared Euclidean in RGB space).
    /// </summary>
    public int DistanceSquared(Pixel other)
    {
        int dr = R - other.R;
        int dg = G - other.G;
        int db = B - other.B;
        return dr * dr + dg * dg + db * db;
    }

    /// <summary>
    /// Calculates perceptual color distance using weighted RGB.
    /// </summary>
    public int PerceptualDistanceSquared(Pixel other)
    {
        int dr = R - other.R;
        int dg = G - other.G;
        int db = B - other.B;
        // Weights based on human perception (red-green more sensitive)
        return (dr * dr * 2) + (dg * dg * 4) + (db * db * 3);
    }

    /// <summary>
    /// Clamps all color channels to valid range.
    /// </summary>
    public static Pixel Clamp(int r, int g, int b) => new(
        (byte)Math.Clamp(r, 0, 255),
        (byte)Math.Clamp(g, 0, 255),
        (byte)Math.Clamp(b, 0, 255)
    );

    /// <summary>
    /// Converts to nearest ANSI 256-color palette index.
    /// </summary>
    public byte ToAnsi256()
    {
        // Grayscale ramp (232-255)
        if (R == G && G == B)
        {
            if (R < 8) return 16;
            if (R > 248) return 231;
            return (byte)(232 + (R - 8) / 10);
        }

        // Color cube (16-231): 6x6x6
        int ri = R < 48 ? 0 : R < 115 ? 1 : (R - 35) / 40;
        int gi = G < 48 ? 0 : G < 115 ? 1 : (G - 35) / 40;
        int bi = B < 48 ? 0 : B < 115 ? 1 : (B - 35) / 40;
        return (byte)(16 + 36 * ri + 6 * gi + bi);
    }

    /// <summary>
    /// Converts to nearest ANSI 16-color index.
    /// </summary>
    public byte ToAnsi16()
    {
        int value = (Luminance > 128 ? 8 : 0);
        value |= (B > 128 ? 4 : 0);
        value |= (G > 128 ? 2 : 0);
        value |= (R > 128 ? 1 : 0);
        return (byte)value;
    }

    // Predefined colors
    public static readonly Pixel Black = new(0, 0, 0);
    public static readonly Pixel White = new(255, 255, 255);
    public static readonly Pixel Red = new(255, 0, 0);
    public static readonly Pixel Green = new(0, 255, 0);
    public static readonly Pixel Blue = new(0, 0, 255);
    public static readonly Pixel Transparent = new(0, 0, 0); // Used for letterboxing

    public bool Equals(Pixel other) => R == other.R && G == other.G && B == other.B;
    public override bool Equals(object? obj) => obj is Pixel other && Equals(other);
    public override int GetHashCode() => (R << 16) | (G << 8) | B;
    public override string ToString() => $"#{R:X2}{G:X2}{B:X2}";
    
    public static bool operator ==(Pixel left, Pixel right) => left.Equals(right);
    public static bool operator !=(Pixel left, Pixel right) => !left.Equals(right);
}

/// <summary>
/// Represents a terminal cell with foreground (top pixel) and background (bottom pixel) colors.
/// The half-block character ▀ uses foreground for top and background for bottom.
/// </summary>
public readonly struct TerminalCell : IEquatable<TerminalCell>
{
    public readonly Pixel Foreground; // Top pixel (▀ character color)
    public readonly Pixel Background; // Bottom pixel (cell background)
    public readonly char Glyph;

    public TerminalCell(Pixel foreground, Pixel background, char glyph = '▀')
    {
        Foreground = foreground;
        Background = background;
        Glyph = glyph;
    }

    /// <summary>
    /// Creates a cell with the same color for both pixels (solid color).
    /// </summary>
    public TerminalCell(Pixel color) : this(color, color) { }

    /// <summary>
    /// Checks if this cell is significantly different from another (for diff detection).
    /// Uses a threshold to avoid updating cells with imperceptible differences.
    /// </summary>
    public bool IsSimilarTo(TerminalCell other, int threshold = 8)
    {
        return Glyph == other.Glyph &&
               Foreground.DistanceSquared(other.Foreground) < threshold * threshold &&
               Background.DistanceSquared(other.Background) < threshold * threshold;
    }

    /// <summary>
    /// Converts to grayscale.
    /// </summary>
    public TerminalCell ToGrayscale() => new(Foreground.ToGrayscale(), Background.ToGrayscale());

    /// <summary>
    /// Gets average luminance of the cell.
    /// </summary>
    public byte AverageLuminance => (byte)((Foreground.Luminance + Background.Luminance) >> 1);

    /// <summary>
    /// Creates a cell for letterboxing (black bars).
    /// </summary>
    public static readonly TerminalCell Letterbox = new(Pixel.Black, Pixel.Black, ' ');

    public bool Equals(TerminalCell other) =>
        Foreground == other.Foreground && Background == other.Background && Glyph == other.Glyph;

    public override bool Equals(object? obj) => obj is TerminalCell other && Equals(other);
    public override int GetHashCode() => HashCode.Combine(Foreground.GetHashCode(), Background.GetHashCode(), Glyph);
    
    public static bool operator ==(TerminalCell left, TerminalCell right) => left.Equals(right);
    public static bool operator !=(TerminalCell left, TerminalCell right) => !left.Equals(right);
}

/// <summary>
/// Represents a cell for quadrant character rendering (4 pixels per cell).
/// Uses characters like ▖▗▘▙▚▛▜▝▞▟.
/// </summary>
public readonly struct QuadrantCell
{
    public readonly Pixel TopLeft;
    public readonly Pixel TopRight;
    public readonly Pixel BottomLeft;
    public readonly Pixel BottomRight;

    public QuadrantCell(Pixel tl, Pixel tr, Pixel bl, Pixel br)
    {
        TopLeft = tl;
        TopRight = tr;
        BottomLeft = bl;
        BottomRight = br;
    }

    /// <summary>
    /// Determines the best character and colors for this cell.
    /// Returns (character, foreground, background).
    /// </summary>
    public (char Char, Pixel Fg, Pixel Bg) GetBestRepresentation()
    {
        // Find the two dominant colors (simple k-means with k=2)
        var pixels = new[] { TopLeft, TopRight, BottomLeft, BottomRight };
        
        // Use first pixel as initial centroid
        var c1 = pixels[0];
        var c2 = pixels[0];
        int maxDist = 0;
        
        // Find most different pixel for second centroid
        for (int i = 1; i < 4; i++)
        {
            int dist = pixels[i].DistanceSquared(c1);
            if (dist > maxDist)
            {
                maxDist = dist;
                c2 = pixels[i];
            }
        }

        // Assign each pixel to nearest centroid
        bool[] assignments = new bool[4];
        for (int i = 0; i < 4; i++)
        {
            assignments[i] = pixels[i].DistanceSquared(c2) < pixels[i].DistanceSquared(c1);
        }

        // Build character from assignments
        // Quadrant bits: TL=0, TR=1, BL=2, BR=3
        int pattern = 0;
        if (assignments[0]) pattern |= 1;
        if (assignments[1]) pattern |= 2;
        if (assignments[2]) pattern |= 4;
        if (assignments[3]) pattern |= 8;

        // Map pattern to Unicode quadrant character
        char ch = pattern switch
        {
            0 => ' ',      // All c1
            15 => '█',     // All c2
            1 => '▘',      // TL only
            2 => '▝',      // TR only
            3 => '▀',      // Top only
            4 => '▖',      // BL only
            5 => '▌',      // Left only
            6 => '▞',      // Diagonal TL-BR
            7 => '▛',      // All except BR
            8 => '▗',      // BR only
            9 => '▚',      // Diagonal TR-BL
            10 => '▐',     // Right only
            11 => '▜',     // All except BL
            12 => '▄',     // Bottom only
            13 => '▙',     // All except TR
            14 => '▟',     // All except TL
            _ => '?'
        };

        // Average colors for each cluster
        var fg = c2;
        var bg = c1;
        
        return (ch, fg, bg);
    }
}

/// <summary>
/// Represents a cell for braille rendering (8 pixels per cell).
/// Braille pattern: ⠁⠂⠃⠄⠅⠆⠇⠈⠉... (U+2800 - U+28FF)
/// </summary>
public readonly struct BrailleCell
{
    // Braille dot positions (2x4 grid):
    // 0 3
    // 1 4
    // 2 5
    // 6 7
    public readonly byte Luminances; // 8 bits, one per dot

    public BrailleCell(byte luminances)
    {
        Luminances = luminances;
    }

    /// <summary>
    /// Creates a braille cell from 8 pixel luminances and a threshold.
    /// </summary>
    public static BrailleCell FromLuminances(ReadOnlySpan<byte> lums, byte threshold = 128)
    {
        byte bits = 0;
        for (int i = 0; i < 8 && i < lums.Length; i++)
        {
            if (lums[i] >= threshold)
                bits |= (byte)(1 << i);
        }
        return new BrailleCell(bits);
    }

    /// <summary>
    /// Gets the Unicode braille character for this cell.
    /// </summary>
    public char ToChar()
    {
        // Remap bits to braille encoding
        // Input: 01234567 (row-major)
        // Braille: 03142567 (column-major with dots 7,8 at bottom)
        int braille = 0;
        if ((Luminances & 0x01) != 0) braille |= 0x01; // 0 -> dot 1
        if ((Luminances & 0x02) != 0) braille |= 0x02; // 1 -> dot 2
        if ((Luminances & 0x04) != 0) braille |= 0x04; // 2 -> dot 3
        if ((Luminances & 0x08) != 0) braille |= 0x08; // 3 -> dot 4
        if ((Luminances & 0x10) != 0) braille |= 0x10; // 4 -> dot 5
        if ((Luminances & 0x20) != 0) braille |= 0x20; // 5 -> dot 6
        if ((Luminances & 0x40) != 0) braille |= 0x40; // 6 -> dot 7
        if ((Luminances & 0x80) != 0) braille |= 0x80; // 7 -> dot 8
        
        return (char)(0x2800 + braille);
    }
}
