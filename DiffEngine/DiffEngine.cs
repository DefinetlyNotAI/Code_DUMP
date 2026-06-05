// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// DiffEngine/DiffEngine.cs - Intelligent frame differencing with SIMD optimization
// ============================================================================

using System.Numerics;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Runtime.Intrinsics;
using System.Runtime.Intrinsics.X86;
using G2C.FrameBuffer;

namespace G2C.DiffEngine;

/// <summary>
/// Strategy used for diff calculation based on frame characteristics.
/// </summary>
public enum DiffStrategy
{
    /// <summary>Full frame comparison without optimization</summary>
    FullFrame,
    /// <summary>SIMD-accelerated bulk memory comparison</summary>
    SimdBulk,
    /// <summary>Hierarchical block-based comparison for localized changes</summary>
    Hierarchical,
    /// <summary>Adaptive strategy selection based on change history</summary>
    Adaptive
}

/// <summary>
/// Statistics about the diff operation for performance monitoring and debugging.
/// </summary>
public readonly struct DiffStats
{
    public readonly int TotalCells;
    public readonly int ChangedCells;
    public readonly int SkippedCells;
    public readonly int RunCount;
    public readonly double DiffTimeMs;
    public readonly DiffStrategy StrategyUsed;

    public DiffStats(int total, int changed, int runs, double timeMs, DiffStrategy strategy)
    {
        TotalCells = total;
        ChangedCells = changed;
        SkippedCells = total - changed;
        RunCount = runs;
        DiffTimeMs = timeMs;
        StrategyUsed = strategy;
    }

    public float ChangeRatio => TotalCells > 0 ? ChangedCells / (float)TotalCells : 0;
    public float Efficiency => TotalCells > 0 ? SkippedCells / (float)TotalCells : 0;
    
    public override string ToString() =>
        $"Changed: {ChangedCells}/{TotalCells} ({ChangeRatio:P1}), Runs: {RunCount}, " +
        $"Time: {DiffTimeMs:F2}ms, Strategy: {StrategyUsed}";
}

/// <summary>
/// Represents a cell that needs to be updated with position and new value.
/// Packed for cache efficiency.
/// </summary>
[StructLayout(LayoutKind.Sequential, Pack = 1)]
public readonly struct CellUpdate
{
    public readonly ushort X;
    public readonly ushort Y;
    public readonly TerminalCell Cell;

    public CellUpdate(int x, int y, TerminalCell cell)
    {
        X = (ushort)x;
        Y = (ushort)y;
        Cell = cell;
    }
    
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public int GetIndex(int width) => Y * width + X;
}

/// <summary>
/// Represents a consecutive run of cells on the same row for optimized rendering.
/// </summary>
public readonly struct CellRun
{
    public readonly int Row;
    public readonly int StartCol;
    public readonly TerminalCell[] Cells;
    public readonly int Length;

    public CellRun(int row, int startCol, TerminalCell[] cells)
    {
        Row = row;
        StartCol = startCol;
        Cells = cells;
        Length = cells.Length;
    }
    
    public int EndCol => StartCol + Length - 1;
}

/// <summary>
/// High-performance diff engine for detecting changes between terminal frames.
/// Uses SIMD instructions, hierarchical block comparison, and adaptive strategy
/// selection to minimize rendering overhead.
/// </summary>
public sealed class DiffEngine : IDisposable
{
    // Configuration
    private readonly bool _noDiff;
    private readonly int _blockSize;
    private readonly bool _useSimd;
    
    // Adaptive strategy state
    private float _lastChangeRatio = 1.0f;
    private DiffStrategy _lastStrategy = DiffStrategy.FullFrame;
    private int _consecutiveLowChangeFrames;
    private const float LowChangeThreshold = 0.15f;
    private const float HighChangeThreshold = 0.50f;
    private const int HierarchicalTriggerFrames = 3;
    
    // Block-based diff state
    private bool[]? _blockDirtyFlags;
    private int _lastWidth;
    private int _lastHeight;
    private int _blocksX;
    private int _blocksY;
    
    // Performance tracking
    private long _totalOperations;
    private double _totalTimeMs;
    private readonly object _statsLock = new();

    // Object pools to reduce allocations
    private List<CellUpdate>? _updatePool;
    private List<CellRun>? _runPool;

    /// <summary>
    /// Creates a new diff engine with the specified options.
    /// </summary>
    /// <param name="noDiff">If true, disables diffing and always returns full frame</param>
    /// <param name="blockSize">Size of blocks for hierarchical comparison (default 8)</param>
    public DiffEngine(bool noDiff = false, int blockSize = 8)
    {
        _noDiff = noDiff;
        _blockSize = Math.Max(4, Math.Min(32, blockSize));
        _useSimd = Sse2.IsSupported || Vector.IsHardwareAccelerated;
    }

    /// <summary>Gets average diff time in milliseconds.</summary>
    public double AverageDiffTimeMs
    {
        get
        {
            lock (_statsLock)
            {
                return _totalOperations > 0 ? _totalTimeMs / _totalOperations : 0;
            }
        }
    }

    /// <summary>Gets the last frame's change ratio (0-1).</summary>
    public float LastChangeRatio => _lastChangeRatio;

    /// <summary>Gets the strategy used for the last diff operation.</summary>
    public DiffStrategy LastStrategy => _lastStrategy;

    /// <summary>
    /// Computes the diff between current and previous frames.
    /// Returns only the cells that have changed.
    /// </summary>
    /// <param name="current">Current frame buffer</param>
    /// <param name="previous">Previous frame buffer</param>
    /// <param name="width">Frame width in cells</param>
    /// <param name="height">Frame height in cells</param>
    /// <returns>List of cell updates needed to transform previous into current</returns>
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    public List<CellUpdate> ComputeDiff(
        TerminalCell[] current, 
        TerminalCell[] previous,
        int width, 
        int height)
    {
        return ComputeDiff(current, previous, width, height, out _);
    }

    /// <summary>
    /// Computes the diff between current and previous frames with statistics.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    public List<CellUpdate> ComputeDiff(
        TerminalCell[] current, 
        TerminalCell[] previous,
        int width, 
        int height,
        out DiffStats stats)
    {
        var startTime = System.Diagnostics.Stopwatch.GetTimestamp();
        int totalCells = width * height;

        // Ensure pools are allocated
        _updatePool ??= new List<CellUpdate>(totalCells / 4);
        _updatePool.Clear();

        // Ensure block state is sized correctly
        EnsureBlockState(width, height);

        DiffStrategy strategy;
        
        if (_noDiff)
        {
            // Full redraw mode - return all cells
            strategy = DiffStrategy.FullFrame;
            ComputeFullFrame(current, width, height);
        }
        else
        {
            // Choose optimal strategy based on history
            strategy = ChooseStrategy(totalCells);
            
            switch (strategy)
            {
                case DiffStrategy.SimdBulk when _useSimd:
                    ComputeDiffSimd(current, previous, width, height);
                    break;
                    
                case DiffStrategy.Hierarchical:
                    ComputeDiffHierarchical(current, previous, width, height);
                    break;
                    
                default:
                    strategy = DiffStrategy.FullFrame;
                    ComputeDiffScalar(current, previous, width, height);
                    break;
            }
        }

        // Update adaptive state
        _lastChangeRatio = totalCells > 0 ? _updatePool.Count / (float)totalCells : 0;
        _lastStrategy = strategy;
        
        if (_lastChangeRatio < LowChangeThreshold)
            _consecutiveLowChangeFrames++;
        else
            _consecutiveLowChangeFrames = 0;

        var elapsedMs = GetElapsedMs(startTime);
        
        lock (_statsLock)
        {
            _totalOperations++;
            _totalTimeMs += elapsedMs;
        }

        stats = new DiffStats(totalCells, _updatePool.Count, 0, elapsedMs, strategy);
        return _updatePool;
    }

    /// <summary>
    /// Returns all cells as updates (no diffing).
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void ComputeFullFrame(TerminalCell[] current, int width, int height)
    {
        for (int y = 0; y < height; y++)
        {
            int rowOffset = y * width;
            for (int x = 0; x < width; x++)
            {
                _updatePool!.Add(new CellUpdate(x, y, current[rowOffset + x]));
            }
        }
    }

    /// <summary>
    /// Scalar diff implementation for small frames or fallback.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    private void ComputeDiffScalar(TerminalCell[] current, TerminalCell[] previous, int width, int height)
    {
        for (int y = 0; y < height; y++)
        {
            int rowOffset = y * width;
            for (int x = 0; x < width; x++)
            {
                int idx = rowOffset + x;
                if (current[idx] != previous[idx])
                {
                    _updatePool!.Add(new CellUpdate(x, y, current[idx]));
                }
            }
        }
    }

    /// <summary>
    /// SIMD-accelerated diff using 128-bit or 256-bit vectors.
    /// Compares multiple cells at once using hardware vector instructions.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    private void ComputeDiffSimd(TerminalCell[] current, TerminalCell[] previous, int width, int height)
    {
        int totalCells = width * height;
        int cellSize = Unsafe.SizeOf<TerminalCell>();
        
        // Use Vector<byte> for portable SIMD
        int vectorBytes = Vector<byte>.Count;
        int cellsPerVector = Math.Max(1, vectorBytes / cellSize);
        int vectorEnd = totalCells - (totalCells % cellsPerVector);

        ref byte currentRef = ref Unsafe.As<TerminalCell, byte>(ref MemoryMarshal.GetArrayDataReference(current));
        ref byte previousRef = ref Unsafe.As<TerminalCell, byte>(ref MemoryMarshal.GetArrayDataReference(previous));

        int i = 0;

        // Vectorized comparison loop
        for (; i < vectorEnd; i += cellsPerVector)
        {
            int byteOffset = i * cellSize;
            
            var currentVec = Unsafe.ReadUnaligned<Vector<byte>>(ref Unsafe.Add(ref currentRef, byteOffset));
            var previousVec = Unsafe.ReadUnaligned<Vector<byte>>(ref Unsafe.Add(ref previousRef, byteOffset));

            // If vectors differ, check individual cells
            if (!currentVec.Equals(previousVec))
            {
                for (int j = 0; j < cellsPerVector && (i + j) < totalCells; j++)
                {
                    int idx = i + j;
                    if (current[idx] != previous[idx])
                    {
                        int x = idx % width;
                        int y = idx / width;
                        _updatePool!.Add(new CellUpdate(x, y, current[idx]));
                    }
                }
            }
        }

        // Handle remaining cells
        for (; i < totalCells; i++)
        {
            if (current[i] != previous[i])
            {
                int x = i % width;
                int y = i / width;
                _updatePool!.Add(new CellUpdate(x, y, current[i]));
            }
        }
    }

    /// <summary>
    /// Hierarchical block-based diff for localized changes.
    /// First identifies dirty blocks via sampling, then only scans those blocks.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveOptimization)]
    private void ComputeDiffHierarchical(TerminalCell[] current, TerminalCell[] previous, int width, int height)
    {
        // First pass: identify dirty blocks via corner + center sampling
        Array.Clear(_blockDirtyFlags!, 0, _blockDirtyFlags!.Length);
        
        for (int by = 0; by < _blocksY; by++)
        {
            for (int bx = 0; bx < _blocksX; bx++)
            {
                int startX = bx * _blockSize;
                int startY = by * _blockSize;
                int endX = Math.Min(startX + _blockSize - 1, width - 1);
                int endY = Math.Min(startY + _blockSize - 1, height - 1);
                int midX = (startX + endX) / 2;
                int midY = (startY + endY) / 2;

                // Sample 5 strategic points
                bool isDirty = 
                    !CellsEqual(current, previous, startX, startY, width) ||
                    !CellsEqual(current, previous, endX, startY, width) ||
                    !CellsEqual(current, previous, startX, endY, width) ||
                    !CellsEqual(current, previous, endX, endY, width) ||
                    !CellsEqual(current, previous, midX, midY, width);

                _blockDirtyFlags[by * _blocksX + bx] = isDirty;
            }
        }

        // Second pass: full scan of dirty blocks only
        for (int by = 0; by < _blocksY; by++)
        {
            for (int bx = 0; bx < _blocksX; bx++)
            {
                if (!_blockDirtyFlags[by * _blocksX + bx])
                    continue;

                int startX = bx * _blockSize;
                int startY = by * _blockSize;
                int endX = Math.Min(startX + _blockSize, width);
                int endY = Math.Min(startY + _blockSize, height);

                for (int y = startY; y < endY; y++)
                {
                    int rowOffset = y * width;
                    for (int x = startX; x < endX; x++)
                    {
                        int idx = rowOffset + x;
                        if (current[idx] != previous[idx])
                        {
                            _updatePool!.Add(new CellUpdate(x, y, current[idx]));
                        }
                    }
                }
            }
        }
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static bool CellsEqual(TerminalCell[] current, TerminalCell[] previous, int x, int y, int width)
    {
        int idx = y * width + x;
        return current[idx] == previous[idx];
    }

    /// <summary>
    /// Chooses optimal diff strategy based on frame characteristics and history.
    /// </summary>
    private DiffStrategy ChooseStrategy(int totalCells)
    {
        // Small frames: scalar is fastest (no SIMD setup overhead)
        if (totalCells < 500)
            return DiffStrategy.FullFrame;

        // Many consecutive low-change frames: use hierarchical
        if (_consecutiveLowChangeFrames >= HierarchicalTriggerFrames && _lastChangeRatio < LowChangeThreshold)
            return DiffStrategy.Hierarchical;

        // High change ratio: SIMD bulk is best
        if (_lastChangeRatio > HighChangeThreshold && _useSimd)
            return DiffStrategy.SimdBulk;

        // Medium change ratio with SIMD available
        if (_useSimd)
            return DiffStrategy.SimdBulk;

        return DiffStrategy.FullFrame;
    }

    /// <summary>
    /// Ensures block state arrays are properly sized for current dimensions.
    /// </summary>
    private void EnsureBlockState(int width, int height)
    {
        if (width == _lastWidth && height == _lastHeight && _blockDirtyFlags != null)
            return;

        _lastWidth = width;
        _lastHeight = height;
        _blocksX = (width + _blockSize - 1) / _blockSize;
        _blocksY = (height + _blockSize - 1) / _blockSize;
        _blockDirtyFlags = new bool[_blocksX * _blocksY];
    }

    /// <summary>
    /// Optimizes updates by grouping consecutive cells on the same row into runs.
    /// This dramatically reduces cursor movement ANSI sequences.
    /// </summary>
    /// <param name="updates">List of individual cell updates</param>
    /// <param name="width">Frame width for bounds checking</param>
    /// <returns>List of optimized cell runs</returns>
    public List<CellRun> OptimizeUpdates(List<CellUpdate> updates, int width)
    {
        _runPool ??= new List<CellRun>(updates.Count / 4 + 1);
        _runPool.Clear();

        if (updates.Count == 0)
            return _runPool;

        // Sort by position (row-major order)
        updates.Sort((a, b) =>
        {
            int cmp = a.Y.CompareTo(b.Y);
            return cmp != 0 ? cmp : a.X.CompareTo(b.X);
        });

        // Build runs of consecutive cells
        int currentRow = updates[0].Y;
        int runStart = updates[0].X;
        var runCells = new List<TerminalCell>(32) { updates[0].Cell };

        for (int i = 1; i < updates.Count; i++)
        {
            var update = updates[i];
            
            // Check if continues current run (same row, adjacent column)
            bool isContinuous = update.Y == currentRow && update.X == runStart + runCells.Count;

            if (isContinuous)
            {
                runCells.Add(update.Cell);
            }
            else
            {
                // Emit current run and start new one
                _runPool.Add(new CellRun(currentRow, runStart, runCells.ToArray()));
                
                currentRow = update.Y;
                runStart = update.X;
                runCells.Clear();
                runCells.Add(update.Cell);
            }
        }

        // Don't forget the last run
        _runPool.Add(new CellRun(currentRow, runStart, runCells.ToArray()));

        return _runPool;
    }

    /// <summary>
    /// Converts update list to legacy tuple format for compatibility.
    /// </summary>
    public List<(int Row, int StartCol, List<TerminalCell> Cells)> OptimizeUpdatesLegacy(
        List<CellUpdate> updates, int width)
    {
        var runs = OptimizeUpdates(updates, width);
        var result = new List<(int, int, List<TerminalCell>)>(runs.Count);
        
        foreach (var run in runs)
        {
            result.Add((run.Row, run.StartCol, new List<TerminalCell>(run.Cells)));
        }
        
        return result;
    }

    /// <summary>
    /// Resets the adaptive strategy state.
    /// Call this when the content changes dramatically (e.g., window switch).
    /// </summary>
    public void ResetAdaptiveState()
    {
        _lastChangeRatio = 1.0f;
        _lastStrategy = DiffStrategy.FullFrame;
        _consecutiveLowChangeFrames = 0;
    }

    /// <summary>
    /// Gets performance statistics for the diff engine.
    /// </summary>
    public (long Operations, double AvgTimeMs, float LastChangeRatio, DiffStrategy LastStrategy) GetStats()
    {
        lock (_statsLock)
        {
            return (_totalOperations, AverageDiffTimeMs, _lastChangeRatio, _lastStrategy);
        }
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static double GetElapsedMs(long startTimestamp)
    {
        long elapsed = System.Diagnostics.Stopwatch.GetTimestamp() - startTimestamp;
        return elapsed * 1000.0 / System.Diagnostics.Stopwatch.Frequency;
    }

    public void Dispose()
    {
        _blockDirtyFlags = null;
        _updatePool?.Clear();
        _updatePool = null;
        _runPool?.Clear();
        _runPool = null;
    }
}
