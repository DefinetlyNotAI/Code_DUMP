using System.Collections.Concurrent;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Text;

namespace G2C.Logging;

/// <summary>
/// High-performance structured logging for G2C with minimal allocation.
/// </summary>
public sealed class Logger : IDisposable
{
    #region Log Levels

    public enum LogLevel
    {
        Trace = 0,
        Debug = 1,
        Info = 2,
        Warning = 3,
        Error = 4,
        Fatal = 5,
        None = 6
    }

    #endregion

    #region Log Entry

    public readonly struct LogEntry
    {
        public DateTime Timestamp { get; init; }
        public LogLevel Level { get; init; }
        public string Category { get; init; }
        public string Message { get; init; }
        public Exception? Exception { get; init; }
        public string? CallerFile { get; init; }
        public string? CallerMember { get; init; }
        public int CallerLine { get; init; }
        public IReadOnlyDictionary<string, object>? Properties { get; init; }

        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append($"[{Timestamp:HH:mm:ss.fff}] ");
            sb.Append($"[{Level,-7}] ");
            sb.Append($"[{Category}] ");
            sb.Append(Message);
            
            if (Properties?.Count > 0)
            {
                sb.Append(" {");
                bool first = true;
                foreach (var (key, value) in Properties)
                {
                    if (!first) sb.Append(", ");
                    sb.Append($"{key}={value}");
                    first = false;
                }
                sb.Append('}');
            }
            
            if (Exception != null)
            {
                sb.AppendLine();
                sb.Append($"  Exception: {Exception.GetType().Name}: {Exception.Message}");
                if (Exception.StackTrace != null)
                {
                    sb.AppendLine();
                    sb.Append($"  StackTrace: {Exception.StackTrace}");
                }
            }
            
            return sb.ToString();
        }
    }

    #endregion

    #region Sinks

    public interface ILogSink
    {
        void Write(in LogEntry entry);
        void Flush();
    }

    public sealed class ConsoleSink : ILogSink
    {
        private readonly object _lock = new();
        private readonly bool _useColors;

        public ConsoleSink(bool useColors = true) => _useColors = useColors;

        public void Write(in LogEntry entry)
        {
            lock (_lock)
            {
                if (_useColors)
                {
                    Console.ForegroundColor = entry.Level switch
                    {
                        LogLevel.Trace => ConsoleColor.DarkGray,
                        LogLevel.Debug => ConsoleColor.Gray,
                        LogLevel.Info => ConsoleColor.White,
                        LogLevel.Warning => ConsoleColor.Yellow,
                        LogLevel.Error => ConsoleColor.Red,
                        LogLevel.Fatal => ConsoleColor.DarkRed,
                        _ => ConsoleColor.White
                    };
                }

                Console.Error.WriteLine(entry.ToString());

                if (_useColors)
                {
                    Console.ResetColor();
                }
            }
        }

        public void Flush() => Console.Error.Flush();
    }

    public sealed class FileSink : ILogSink, IDisposable
    {
        private readonly StreamWriter _writer;
        private readonly object _lock = new();
        private readonly bool _autoFlush;

        public FileSink(string path, bool append = true, bool autoFlush = false)
        {
            var directory = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            _writer = new StreamWriter(path, append, Encoding.UTF8)
            {
                AutoFlush = autoFlush
            };
            _autoFlush = autoFlush;
        }

        public void Write(in LogEntry entry)
        {
            lock (_lock)
            {
                _writer.WriteLine(entry.ToString());
            }
        }

        public void Flush()
        {
            lock (_lock)
            {
                _writer.Flush();
            }
        }

        public void Dispose()
        {
            lock (_lock)
            {
                _writer.Dispose();
            }
        }
    }

    public sealed class AsyncBufferedSink : ILogSink, IDisposable
    {
        private readonly ILogSink _innerSink;
        private readonly BlockingCollection<LogEntry> _buffer;
        private readonly Thread _writerThread;
        private volatile bool _disposed;

        public AsyncBufferedSink(ILogSink innerSink, int bufferSize = 1000)
        {
            _innerSink = innerSink;
            _buffer = new BlockingCollection<LogEntry>(bufferSize);
            _writerThread = new Thread(WriterLoop)
            {
                IsBackground = true,
                Name = "G2C-LogWriter"
            };
            _writerThread.Start();
        }

        private void WriterLoop()
        {
            try
            {
                foreach (var entry in _buffer.GetConsumingEnumerable())
                {
                    _innerSink.Write(entry);
                }
            }
            catch (OperationCanceledException) { }
        }

        public void Write(in LogEntry entry)
        {
            if (!_disposed)
            {
                _buffer.TryAdd(entry);
            }
        }

        public void Flush()
        {
            while (_buffer.Count > 0)
            {
                Thread.Sleep(10);
            }
            _innerSink.Flush();
        }

        public void Dispose()
        {
            _disposed = true;
            _buffer.CompleteAdding();
            _writerThread.Join(TimeSpan.FromSeconds(5));
            _buffer.Dispose();
            
            if (_innerSink is IDisposable disposable)
            {
                disposable.Dispose();
            }
        }
    }

    #endregion

    #region Fields

    private readonly List<ILogSink> _sinks = new();
    private readonly string _category;
    private LogLevel _minimumLevel;
    private readonly bool _includeCallerInfo;
    private static Logger? _default;

    #endregion

    #region Constructor

    public Logger(string category, LogLevel minimumLevel = LogLevel.Info, bool includeCallerInfo = false)
    {
        _category = category;
        _minimumLevel = minimumLevel;
        _includeCallerInfo = includeCallerInfo;
    }

    public static Logger Default => _default ??= new Logger("G2C");

    public static void SetDefault(Logger logger) => _default = logger;

    #endregion

    #region Configuration

    public Logger AddSink(ILogSink sink)
    {
        _sinks.Add(sink);
        return this;
    }

    public Logger SetMinimumLevel(LogLevel level)
    {
        _minimumLevel = level;
        return this;
    }

    public static Logger CreateConsoleLogger(string category, LogLevel level = LogLevel.Info)
    {
        return new Logger(category, level)
            .AddSink(new ConsoleSink());
    }

    public static Logger CreateFileLogger(string category, string path, LogLevel level = LogLevel.Debug)
    {
        return new Logger(category, level)
            .AddSink(new AsyncBufferedSink(new FileSink(path)));
    }

    #endregion

    #region Logging Methods

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public bool IsEnabled(LogLevel level) => level >= _minimumLevel;

    public void Log(
        LogLevel level,
        string message,
        Exception? exception = null,
        Dictionary<string, object>? properties = null,
        [CallerFilePath] string? callerFile = null,
        [CallerMemberName] string? callerMember = null,
        [CallerLineNumber] int callerLine = 0)
    {
        if (level < _minimumLevel || _sinks.Count == 0)
            return;

        var entry = new LogEntry
        {
            Timestamp = DateTime.Now,
            Level = level,
            Category = _category,
            Message = message,
            Exception = exception,
            CallerFile = _includeCallerInfo ? Path.GetFileName(callerFile) : null,
            CallerMember = _includeCallerInfo ? callerMember : null,
            CallerLine = _includeCallerInfo ? callerLine : 0,
            Properties = properties
        };

        foreach (var sink in _sinks)
        {
            try
            {
                sink.Write(entry);
            }
            catch { /* Sink failure shouldn't crash the app */ }
        }
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public void Trace(string message, [CallerFilePath] string? f = null, [CallerMemberName] string? m = null, [CallerLineNumber] int l = 0)
        => Log(LogLevel.Trace, message, callerFile: f, callerMember: m, callerLine: l);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public void Debug(string message, [CallerFilePath] string? f = null, [CallerMemberName] string? m = null, [CallerLineNumber] int l = 0)
        => Log(LogLevel.Debug, message, callerFile: f, callerMember: m, callerLine: l);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public void Info(string message, [CallerFilePath] string? f = null, [CallerMemberName] string? m = null, [CallerLineNumber] int l = 0)
        => Log(LogLevel.Info, message, callerFile: f, callerMember: m, callerLine: l);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public void Warning(string message, [CallerFilePath] string? f = null, [CallerMemberName] string? m = null, [CallerLineNumber] int l = 0)
        => Log(LogLevel.Warning, message, callerFile: f, callerMember: m, callerLine: l);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public void Error(string message, Exception? ex = null, [CallerFilePath] string? f = null, [CallerMemberName] string? m = null, [CallerLineNumber] int l = 0)
        => Log(LogLevel.Error, message, ex, callerFile: f, callerMember: m, callerLine: l);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public void Fatal(string message, Exception? ex = null, [CallerFilePath] string? f = null, [CallerMemberName] string? m = null, [CallerLineNumber] int l = 0)
        => Log(LogLevel.Fatal, message, ex, callerFile: f, callerMember: m, callerLine: l);

    public void Flush()
    {
        foreach (var sink in _sinks)
        {
            sink.Flush();
        }
    }

    #endregion

    #region Scoped Logging

    public IDisposable BeginScope(string operationName)
    {
        return new LogScope(this, operationName);
    }

    private sealed class LogScope : IDisposable
    {
        private readonly Logger _logger;
        private readonly string _operationName;
        private readonly Stopwatch _stopwatch;

        public LogScope(Logger logger, string operationName)
        {
            _logger = logger;
            _operationName = operationName;
            _stopwatch = Stopwatch.StartNew();
            _logger.Debug($"Starting: {operationName}");
        }

        public void Dispose()
        {
            _stopwatch.Stop();
            _logger.Debug($"Completed: {_operationName} in {_stopwatch.ElapsedMilliseconds}ms");
        }
    }

    #endregion

    #region Disposal

    public void Dispose()
    {
        Flush();
        
        foreach (var sink in _sinks)
        {
            if (sink is IDisposable disposable)
            {
                disposable.Dispose();
            }
        }
        
        _sinks.Clear();
    }

    #endregion
}

/// <summary>
/// Result type for operations that can fail.
/// </summary>
public readonly struct Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public Exception? Exception { get; }

    private Result(bool success, T? value, string? error, Exception? exception)
    {
        IsSuccess = success;
        Value = value;
        Error = error;
        Exception = exception;
    }

    public static Result<T> Success(T value) => new(true, value, null, null);
    public static Result<T> Failure(string error) => new(false, default, error, null);
    public static Result<T> Failure(Exception exception) => new(false, default, exception.Message, exception);

    public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<string, TResult> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error!);

    public Result<TResult> Map<TResult>(Func<T, TResult> mapper)
        => IsSuccess ? Result<TResult>.Success(mapper(Value!)) : Result<TResult>.Failure(Error!);

    public Result<TResult> Bind<TResult>(Func<T, Result<TResult>> binder)
        => IsSuccess ? binder(Value!) : Result<TResult>.Failure(Error!);

    public T ValueOr(T fallback) => IsSuccess ? Value! : fallback;
    public T ValueOr(Func<T> fallbackFactory) => IsSuccess ? Value! : fallbackFactory();

    public void ThrowIfFailed()
    {
        if (!IsSuccess)
        {
            throw Exception ?? new InvalidOperationException(Error);
        }
    }
}

/// <summary>
/// Global error handling and crash reporting.
/// </summary>
public static class ErrorHandler
{
    private static Logger? _logger;
    private static Action<Exception>? _crashCallback;

    public static void Initialize(Logger logger, Action<Exception>? crashCallback = null)
    {
        _logger = logger;
        _crashCallback = crashCallback;

        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
    }

    private static void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        var exception = e.ExceptionObject as Exception ?? new Exception($"Unknown error: {e.ExceptionObject}");
        _logger?.Fatal("Unhandled exception", exception);
        _logger?.Flush();
        _crashCallback?.Invoke(exception);
    }

    private static void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
        _logger?.Error("Unobserved task exception", e.Exception);
        e.SetObserved();
    }

    public static T? SafeExecute<T>(Func<T> action, T? fallback = default, [CallerMemberName] string? caller = null)
    {
        try
        {
            return action();
        }
        catch (Exception ex)
        {
            _logger?.Warning($"SafeExecute failed in {caller}: {ex.Message}");
            return fallback;
        }
    }

    public static async Task<T?> SafeExecuteAsync<T>(
        Func<Task<T>> action, 
        T? fallback = default, 
        [CallerMemberName] string? caller = null)
    {
        try
        {
            return await action();
        }
        catch (Exception ex)
        {
            _logger?.Warning($"SafeExecuteAsync failed in {caller}: {ex.Message}");
            return fallback;
        }
    }
}
