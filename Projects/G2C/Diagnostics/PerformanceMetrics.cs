using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;

namespace G2C.Diagnostics;

/// <summary>
/// High-precision performance metrics collection for G2C pipeline profiling.
/// Uses hardware timestamps when available for sub-microsecond accuracy.
/// </summary>
public sealed class PerformanceMetrics : IDisposable
{
    #region Metric Categories

    /// <summary>Categories of metrics tracked by the profiler.</summary>
    public enum MetricCategory
    {
        FrameTotal,
        ScreenCapture,
        FrameBufferProcess,
        Downscaling,
        ColorQuantization,
        DiffComputation,
        AnsiGeneration,
        ConsoleOutput,
        InputProcessing,
        MemoryAllocation
    }

    #endregion

    #region Metric Data Structures

    /// <summary>
    /// Statistics for a single metric category.
    /// </summary>
    public readonly struct MetricStats
    {
        public double MinMs { get; init; }
        public double MaxMs { get; init; }
        public double AvgMs { get; init; }
        public double MedianMs { get; init; }
        public double P95Ms { get; init; }
        public double P99Ms { get; init; }
        public double StdDevMs { get; init; }
        public long SampleCount { get; init; }
        public double TotalMs { get; init; }

        public override string ToString() =>
            $"avg={AvgMs:F3}ms, min={MinMs:F3}ms, max={MaxMs:F3}ms, " +
            $"p95={P95Ms:F3}ms, p99={P99Ms:F3}ms, stddev={StdDevMs:F3}ms, " +
            $"samples={SampleCount}";
    }

    /// <summary>
    /// Complete frame timing breakdown.
    /// </summary>
    public sealed class FrameTimings
    {
        public long FrameNumber { get; init; }
        public double TotalMs { get; init; }
        public double CaptureMs { get; init; }
        public double ProcessMs { get; init; }
        public double DiffMs { get; init; }
        public double RenderMs { get; init; }
        public double OutputMs { get; init; }
        public int CellsChanged { get; init; }
        public int BytesWritten { get; init; }
        public double EffectiveFps { get; init; }
        public DateTime Timestamp { get; init; }

        public override string ToString() =>
            $"Frame {FrameNumber}: {TotalMs:F2}ms total " +
            $"(capture={CaptureMs:F2}, process={ProcessMs:F2}, " +
            $"diff={DiffMs:F2}, render={RenderMs:F2}, output={OutputMs:F2}) " +
            $"cells={CellsChanged}, bytes={BytesWritten}";
    }

    #endregion

    #region Fields

    private readonly Dictionary<MetricCategory, List<double>> _samples = new();
    private readonly Dictionary<MetricCategory, Stopwatch> _activeTimers = new();
    private readonly List<FrameTimings> _frameHistory = new();
    private readonly object _lock = new();
    
    private readonly int _maxSamplesPerCategory;
    private readonly int _maxFrameHistory;
    private readonly bool _useHighPrecision;
    
    private long _frameCounter;
    private readonly Stopwatch _sessionTimer = Stopwatch.StartNew();
    private readonly Stopwatch _frameTimer = new();
    
    // Current frame accumulators
    private double _currentCaptureMs;
    private double _currentProcessMs;
    private double _currentDiffMs;
    private double _currentRenderMs;
    private double _currentOutputMs;
    private int _currentCellsChanged;
    private int _currentBytesWritten;

    #endregion

    #region Constructor

    public PerformanceMetrics(
        int maxSamplesPerCategory = 1000,
        int maxFrameHistory = 100,
        bool useHighPrecision = true)
    {
        _maxSamplesPerCategory = maxSamplesPerCategory;
        _maxFrameHistory = maxFrameHistory;
        _useHighPrecision = useHighPrecision;

        // Initialize sample lists for each category
        foreach (MetricCategory category in Enum.GetValues<MetricCategory>())
        {
            _samples[category] = new List<double>(_maxSamplesPerCategory);
            _activeTimers[category] = new Stopwatch();
        }
    }

    #endregion

    #region Frame Lifecycle

    /// <summary>
    /// Begins timing a new frame.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public void BeginFrame()
    {
        _frameTimer.Restart();
        _currentCaptureMs = 0;
        _currentProcessMs = 0;
        _currentDiffMs = 0;
        _currentRenderMs = 0;
        _currentOutputMs = 0;
        _currentCellsChanged = 0;
        _currentBytesWritten = 0;
    }

    /// <summary>
    /// Ends timing the current frame and records metrics.
    /// </summary>
    public FrameTimings EndFrame()
    {
        _frameTimer.Stop();
        
        var frameNumber = Interlocked.Increment(ref _frameCounter);
        var totalMs = _frameTimer.Elapsed.TotalMilliseconds;
        
        var timings = new FrameTimings
        {
            FrameNumber = frameNumber,
            TotalMs = totalMs,
            CaptureMs = _currentCaptureMs,
            ProcessMs = _currentProcessMs,
            DiffMs = _currentDiffMs,
            RenderMs = _currentRenderMs,
            OutputMs = _currentOutputMs,
            CellsChanged = _currentCellsChanged,
            BytesWritten = _currentBytesWritten,
            EffectiveFps = totalMs > 0 ? 1000.0 / totalMs : 0,
            Timestamp = DateTime.UtcNow
        };

        lock (_lock)
        {
            RecordSampleInternal(MetricCategory.FrameTotal, totalMs);
            
            _frameHistory.Add(timings);
            while (_frameHistory.Count > _maxFrameHistory)
            {
                _frameHistory.RemoveAt(0);
            }
        }

        return timings;
    }

    #endregion

    #region Timing Methods

    /// <summary>
    /// Starts timing a specific category.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public void StartTiming(MetricCategory category)
    {
        _activeTimers[category].Restart();
    }

    /// <summary>
    /// Stops timing a category and records the sample.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public double StopTiming(MetricCategory category)
    {
        var timer = _activeTimers[category];
        timer.Stop();
        var elapsed = timer.Elapsed.TotalMilliseconds;
        
        RecordSample(category, elapsed);
        
        // Update frame accumulators
        switch (category)
        {
            case MetricCategory.ScreenCapture:
                _currentCaptureMs += elapsed;
                break;
            case MetricCategory.FrameBufferProcess:
            case MetricCategory.Downscaling:
            case MetricCategory.ColorQuantization:
                _currentProcessMs += elapsed;
                break;
            case MetricCategory.DiffComputation:
                _currentDiffMs += elapsed;
                break;
            case MetricCategory.AnsiGeneration:
                _currentRenderMs += elapsed;
                break;
            case MetricCategory.ConsoleOutput:
                _currentOutputMs += elapsed;
                break;
        }
        
        return elapsed;
    }

    /// <summary>
    /// Creates a scoped timer that automatically records when disposed.
    /// </summary>
    public ScopedTimer Time(MetricCategory category) => new(this, category);

    /// <summary>
    /// Scoped timer for using statements.
    /// </summary>
    public readonly struct ScopedTimer : IDisposable
    {
        private readonly PerformanceMetrics _metrics;
        private readonly MetricCategory _category;

        internal ScopedTimer(PerformanceMetrics metrics, MetricCategory category)
        {
            _metrics = metrics;
            _category = category;
            _metrics.StartTiming(category);
        }

        public void Dispose() => _metrics.StopTiming(_category);
    }

    #endregion

    #region Sample Recording

    /// <summary>
    /// Records a timing sample for a category.
    /// </summary>
    public void RecordSample(MetricCategory category, double milliseconds)
    {
        lock (_lock)
        {
            RecordSampleInternal(category, milliseconds);
        }
    }

    private void RecordSampleInternal(MetricCategory category, double milliseconds)
    {
        var samples = _samples[category];
        
        if (samples.Count >= _maxSamplesPerCategory)
        {
            samples.RemoveAt(0);
        }
        
        samples.Add(milliseconds);
    }

    /// <summary>
    /// Records additional frame metadata.
    /// </summary>
    public void RecordFrameData(int cellsChanged, int bytesWritten)
    {
        _currentCellsChanged = cellsChanged;
        _currentBytesWritten = bytesWritten;
    }

    #endregion

    #region Statistics

    /// <summary>
    /// Gets statistics for a specific category.
    /// </summary>
    public MetricStats GetStats(MetricCategory category)
    {
        lock (_lock)
        {
            var samples = _samples[category];
            
            if (samples.Count == 0)
            {
                return default;
            }

            var sorted = samples.OrderBy(x => x).ToList();
            int count = sorted.Count;

            double sum = 0;
            double min = double.MaxValue;
            double max = double.MinValue;

            foreach (var sample in sorted)
            {
                sum += sample;
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }

            double avg = sum / count;
            
            // Calculate standard deviation
            double sumSquaredDiff = sorted.Sum(x => (x - avg) * (x - avg));
            double stdDev = Math.Sqrt(sumSquaredDiff / count);

            return new MetricStats
            {
                MinMs = min,
                MaxMs = max,
                AvgMs = avg,
                MedianMs = sorted[count / 2],
                P95Ms = sorted[(int)(count * 0.95)],
                P99Ms = sorted[(int)(count * 0.99)],
                StdDevMs = stdDev,
                SampleCount = count,
                TotalMs = sum
            };
        }
    }

    /// <summary>
    /// Gets all statistics as a dictionary.
    /// </summary>
    public Dictionary<MetricCategory, MetricStats> GetAllStats()
    {
        var result = new Dictionary<MetricCategory, MetricStats>();
        
        foreach (MetricCategory category in Enum.GetValues<MetricCategory>())
        {
            result[category] = GetStats(category);
        }
        
        return result;
    }

    /// <summary>
    /// Gets recent frame history.
    /// </summary>
    public IReadOnlyList<FrameTimings> GetFrameHistory()
    {
        lock (_lock)
        {
            return _frameHistory.ToList();
        }
    }

    #endregion

    #region Reporting

    /// <summary>
    /// Gets session summary statistics.
    /// </summary>
    public SessionSummary GetSessionSummary()
    {
        var allStats = GetAllStats();
        var frameStats = allStats[MetricCategory.FrameTotal];
        
        return new SessionSummary
        {
            TotalFrames = _frameCounter,
            SessionDuration = _sessionTimer.Elapsed,
            AverageFps = frameStats.AvgMs > 0 ? 1000.0 / frameStats.AvgMs : 0,
            MinFps = frameStats.MaxMs > 0 ? 1000.0 / frameStats.MaxMs : 0,
            MaxFps = frameStats.MinMs > 0 ? 1000.0 / frameStats.MinMs : 0,
            FrameTimeStats = frameStats,
            CategoryStats = allStats
        };
    }

    /// <summary>
    /// Session summary data.
    /// </summary>
    public sealed class SessionSummary
    {
        public long TotalFrames { get; init; }
        public TimeSpan SessionDuration { get; init; }
        public double AverageFps { get; init; }
        public double MinFps { get; init; }
        public double MaxFps { get; init; }
        public MetricStats FrameTimeStats { get; init; }
        public Dictionary<MetricCategory, MetricStats> CategoryStats { get; init; } = new();

        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== G2C Performance Summary ===");
            sb.AppendLine($"Session Duration: {SessionDuration:hh\\:mm\\:ss\\.fff}");
            sb.AppendLine($"Total Frames: {TotalFrames:N0}");
            sb.AppendLine($"Average FPS: {AverageFps:F1} (min: {MinFps:F1}, max: {MaxFps:F1})");
            sb.AppendLine();
            sb.AppendLine("Category Breakdown:");
            
            foreach (var (category, stats) in CategoryStats)
            {
                if (stats.SampleCount > 0)
                {
                    sb.AppendLine($"  {category,-20}: {stats}");
                }
            }
            
            return sb.ToString();
        }
    }

    /// <summary>
    /// Generates a detailed performance report.
    /// </summary>
    public string GenerateReport()
    {
        var summary = GetSessionSummary();
        var sb = new StringBuilder();
        
        sb.AppendLine(summary.ToString());
        sb.AppendLine();
        
        // Frame time distribution
        var frameStats = summary.FrameTimeStats;
        if (frameStats.SampleCount > 0)
        {
            sb.AppendLine("Frame Time Distribution:");
            sb.AppendLine($"  0-8ms (125+ FPS):   {CountInRange(MetricCategory.FrameTotal, 0, 8)}");
            sb.AppendLine($"  8-16ms (60-125 FPS): {CountInRange(MetricCategory.FrameTotal, 8, 16)}");
            sb.AppendLine($"  16-33ms (30-60 FPS): {CountInRange(MetricCategory.FrameTotal, 16, 33)}");
            sb.AppendLine($"  33-50ms (20-30 FPS): {CountInRange(MetricCategory.FrameTotal, 33, 50)}");
            sb.AppendLine($"  50ms+ (<20 FPS):     {CountInRange(MetricCategory.FrameTotal, 50, double.MaxValue)}");
        }
        
        // Pipeline breakdown for average frame
        sb.AppendLine();
        sb.AppendLine("Average Frame Pipeline:");
        double totalAvg = summary.CategoryStats[MetricCategory.FrameTotal].AvgMs;
        if (totalAvg > 0)
        {
            foreach (var category in new[] 
            { 
                MetricCategory.ScreenCapture,
                MetricCategory.FrameBufferProcess,
                MetricCategory.DiffComputation,
                MetricCategory.AnsiGeneration,
                MetricCategory.ConsoleOutput
            })
            {
                var stats = summary.CategoryStats[category];
                if (stats.SampleCount > 0)
                {
                    double pct = (stats.AvgMs / totalAvg) * 100;
                    int barLen = (int)(pct / 2);
                    string bar = new string('█', Math.Max(1, barLen));
                    sb.AppendLine($"  {category,-20}: {stats.AvgMs,6:F2}ms ({pct,5:F1}%) {bar}");
                }
            }
        }
        
        return sb.ToString();
    }

    private int CountInRange(MetricCategory category, double minMs, double maxMs)
    {
        lock (_lock)
        {
            return _samples[category].Count(x => x >= minMs && x < maxMs);
        }
    }

    #endregion

    #region Memory Tracking

    private long _lastGcGen0;
    private long _lastGcGen1;
    private long _lastGcGen2;
    private long _peakWorkingSet;

    /// <summary>
    /// Captures current memory state.
    /// </summary>
    public MemorySnapshot CaptureMemorySnapshot()
    {
        var process = Process.GetCurrentProcess();
        
        long gen0 = GC.CollectionCount(0);
        long gen1 = GC.CollectionCount(1);
        long gen2 = GC.CollectionCount(2);
        
        var snapshot = new MemorySnapshot
        {
            WorkingSet = process.WorkingSet64,
            PrivateMemory = process.PrivateMemorySize64,
            ManagedHeap = GC.GetTotalMemory(false),
            Gen0Collections = gen0 - _lastGcGen0,
            Gen1Collections = gen1 - _lastGcGen1,
            Gen2Collections = gen2 - _lastGcGen2,
            TotalGen0 = gen0,
            TotalGen1 = gen1,
            TotalGen2 = gen2
        };
        
        _lastGcGen0 = gen0;
        _lastGcGen1 = gen1;
        _lastGcGen2 = gen2;
        
        if (process.WorkingSet64 > _peakWorkingSet)
        {
            _peakWorkingSet = process.WorkingSet64;
        }
        
        return snapshot;
    }

    /// <summary>
    /// Memory state snapshot.
    /// </summary>
    public readonly struct MemorySnapshot
    {
        public long WorkingSet { get; init; }
        public long PrivateMemory { get; init; }
        public long ManagedHeap { get; init; }
        public long Gen0Collections { get; init; }
        public long Gen1Collections { get; init; }
        public long Gen2Collections { get; init; }
        public long TotalGen0 { get; init; }
        public long TotalGen1 { get; init; }
        public long TotalGen2 { get; init; }

        public override string ToString() =>
            $"Working Set: {WorkingSet / 1024 / 1024}MB, " +
            $"Managed: {ManagedHeap / 1024 / 1024}MB, " +
            $"GC: {Gen0Collections}/{Gen1Collections}/{Gen2Collections}";
    }

    #endregion

    #region Disposal

    public void Dispose()
    {
        _sessionTimer.Stop();
        
        lock (_lock)
        {
            foreach (var samples in _samples.Values)
            {
                samples.Clear();
            }
            _frameHistory.Clear();
        }
    }

    #endregion
}

/// <summary>
/// Debug overlay renderer for displaying real-time performance metrics.
/// </summary>
public sealed class DebugOverlay
{
    private readonly PerformanceMetrics _metrics;
    private readonly StringBuilder _buffer = new();
    private int _updateCounter;
    private readonly int _updateInterval;

    public DebugOverlay(PerformanceMetrics metrics, int updateEveryNFrames = 10)
    {
        _metrics = metrics;
        _updateInterval = updateEveryNFrames;
    }

    /// <summary>
    /// Renders the debug overlay to an ANSI string.
    /// </summary>
    public string Render(int width, int row = 1)
    {
        if (++_updateCounter < _updateInterval)
        {
            return string.Empty;
        }
        
        _updateCounter = 0;
        _buffer.Clear();
        
        var summary = _metrics.GetSessionSummary();
        var memory = _metrics.CaptureMemorySnapshot();
        var frameStats = summary.FrameTimeStats;
        
        // Position and style
        _buffer.Append($"\x1b[{row};1H"); // Move to row
        _buffer.Append("\x1b[48;2;0;0;0m\x1b[38;2;0;255;0m"); // Green on black
        
        // FPS and frame time
        string line1 = $" FPS: {summary.AverageFps,5:F1} | Frame: {frameStats.AvgMs,5:F2}ms (p99: {frameStats.P99Ms,5:F2}ms) ";
        _buffer.Append(line1.PadRight(width));
        
        // Memory
        _buffer.Append($"\x1b[{row + 1};1H");
        string line2 = $" Mem: {memory.WorkingSet / 1024 / 1024}MB | GC: {memory.TotalGen0}/{memory.TotalGen1}/{memory.TotalGen2} ";
        _buffer.Append(line2.PadRight(width));
        
        // Reset
        _buffer.Append("\x1b[0m");
        
        return _buffer.ToString();
    }
}
