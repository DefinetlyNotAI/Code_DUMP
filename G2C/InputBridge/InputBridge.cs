// ============================================================================
// G2C - GUI to CLI Terminal Renderer
// InputBridge/InputBridge.cs - Terminal-to-desktop input translation layer
// ============================================================================

using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

namespace G2C.InputBridge;

/// <summary>
/// Mouse button identifiers.
/// </summary>
public enum MouseButton
{
    None = 0,
    Left = 1,
    Right = 2,
    Middle = 4,
    X1 = 8,
    X2 = 16
}

/// <summary>
/// Mouse event types.
/// </summary>
public enum MouseEventType
{
    Move,
    ButtonDown,
    ButtonUp,
    Scroll,
    DoubleClick
}

/// <summary>
/// Represents a mouse input event from the terminal.
/// </summary>
public readonly struct MouseInputEvent
{
    public readonly int TerminalX;
    public readonly int TerminalY;
    public readonly MouseButton Button;
    public readonly MouseEventType EventType;
    public readonly int ScrollDelta;
    public readonly DateTime Timestamp;

    public MouseInputEvent(int x, int y, MouseButton button, MouseEventType type, int scrollDelta = 0)
    {
        TerminalX = x;
        TerminalY = y;
        Button = button;
        EventType = type;
        ScrollDelta = scrollDelta;
        Timestamp = DateTime.UtcNow;
    }
}

/// <summary>
/// Keyboard modifier key state.
/// </summary>
[Flags]
public enum ModifierKeys
{
    None = 0,
    Shift = 1,
    Control = 2,
    Alt = 4
}

/// <summary>
/// Statistics about input bridge performance.
/// </summary>
public readonly struct InputStats
{
    public readonly long EventsProcessed;
    public readonly long EventsInjected;
    public readonly long EventsDropped;
    public readonly double AverageLatencyMs;

    public InputStats(long processed, long injected, long dropped, double latencyMs)
    {
        EventsProcessed = processed;
        EventsInjected = injected;
        EventsDropped = dropped;
        AverageLatencyMs = latencyMs;
    }
}

/// <summary>
/// Delegate for coordinate translation from terminal cells to screen pixels.
/// </summary>
public delegate (int X, int Y) CoordinateTranslator(int terminalX, int terminalY);

/// <summary>
/// High-performance terminal-to-desktop input bridge.
/// Handles mouse input from terminal and translates it to desktop mouse events
/// using the Windows SendInput API.
/// 
/// Features:
/// - SGR extended mouse mode for high-resolution coordinates
/// - Asynchronous event processing with queuing
/// - Double-click detection
/// - Scroll wheel support
/// - Mouse button state tracking
/// </summary>
public sealed class InputBridge : IDisposable
{
    // Configuration
    private readonly CoordinateTranslator _coordTranslator;
    private readonly int _screenWidth;
    private readonly int _screenHeight;
    private readonly double _doubleClickIntervalMs;
    private readonly int _doubleClickDistance;

    // State
    private bool _mouseEnabled;
    private volatile bool _running;
    private Thread? _inputThread;
    private Thread? _injectionThread;
    private nint _stdIn;
    private MouseButton _currentButtonState;
    private DateTime _lastClickTime;
    private int _lastClickX;
    private int _lastClickY;
    private MouseButton _lastClickButton;

    // Event queue for async processing
    private readonly BlockingCollection<MouseInputEvent> _eventQueue;
    private readonly CancellationTokenSource _cts;

    // Performance tracking
    private long _eventsProcessed;
    private long _eventsInjected;
    private long _eventsDropped;
    private double _totalLatencyMs;

    /// <summary>
    /// Creates a new input bridge for translating terminal input to desktop events.
    /// </summary>
    /// <param name="screenWidth">Desktop screen width in pixels</param>
    /// <param name="screenHeight">Desktop screen height in pixels</param>
    /// <param name="coordTranslator">Function to translate terminal coords to screen coords</param>
    /// <param name="doubleClickIntervalMs">Maximum interval for double-click detection</param>
    /// <param name="doubleClickDistance">Maximum distance for double-click detection</param>
    public InputBridge(
        int screenWidth,
        int screenHeight,
        CoordinateTranslator coordTranslator,
        double doubleClickIntervalMs = 500,
        int doubleClickDistance = 4)
    {
        _screenWidth = screenWidth;
        _screenHeight = screenHeight;
        _coordTranslator = coordTranslator ?? throw new ArgumentNullException(nameof(coordTranslator));
        _doubleClickIntervalMs = doubleClickIntervalMs;
        _doubleClickDistance = doubleClickDistance;

        _eventQueue = new BlockingCollection<MouseInputEvent>(1024);
        _cts = new CancellationTokenSource();
    }

    /// <summary>Gets whether mouse input is enabled.</summary>
    public bool IsMouseEnabled => _mouseEnabled;

    /// <summary>Gets whether the input bridge is running.</summary>
    public bool IsRunning => _running;

    /// <summary>Gets current button state.</summary>
    public MouseButton CurrentButtonState => _currentButtonState;

    /// <summary>
    /// Enables mouse tracking in the terminal.
    /// Configures both Windows console mouse input and ANSI SGR mouse mode.
    /// </summary>
    public bool EnableMouse()
    {
        if (_mouseEnabled) return true;

        try
        {
            // Get standard input handle
            _stdIn = GetStdHandle(STD_INPUT_HANDLE);
            if (_stdIn == nint.Zero || _stdIn == INVALID_HANDLE_VALUE)
                return false;

            // Get current console mode
            if (!GetConsoleMode(_stdIn, out uint mode))
                return false;

            // Enable mouse input, disable quick edit (which blocks mouse events)
            mode |= ENABLE_MOUSE_INPUT;
            mode |= ENABLE_EXTENDED_FLAGS;
            mode &= ~ENABLE_QUICK_EDIT_MODE;

            if (!SetConsoleMode(_stdIn, mode))
                return false;

            // Enable ANSI mouse modes for better coordinate support
            // Mode 1000: Basic mouse click tracking
            // Mode 1002: Cell motion tracking (report while button held)
            // Mode 1003: All motion tracking (report all movement)
            // Mode 1006: SGR extended mode (better coordinates, no ambiguity)
            Console.Write("\x1b[?1000h"); // Enable basic mouse tracking
            Console.Write("\x1b[?1002h"); // Enable button-event tracking
            Console.Write("\x1b[?1006h"); // Enable SGR extended mode

            _mouseEnabled = true;
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Disables mouse tracking in the terminal.
    /// </summary>
    public void DisableMouse()
    {
        if (!_mouseEnabled) return;

        try
        {
            // Disable ANSI mouse modes
            Console.Write("\x1b[?1006l");
            Console.Write("\x1b[?1002l");
            Console.Write("\x1b[?1000l");

            // Restore quick edit mode
            if (_stdIn != nint.Zero && GetConsoleMode(_stdIn, out uint mode))
            {
                mode |= ENABLE_QUICK_EDIT_MODE;
                SetConsoleMode(_stdIn, mode);
            }
        }
        catch { }

        _mouseEnabled = false;
    }

    /// <summary>
    /// Starts the input processing threads.
    /// </summary>
    public void Start()
    {
        if (_running) return;
        _running = true;

        // Start input reading thread
        _inputThread = new Thread(InputReadLoop)
        {
            IsBackground = true,
            Name = "G2C-Input-Reader",
            Priority = ThreadPriority.AboveNormal
        };
        _inputThread.Start();

        // Start injection processing thread
        _injectionThread = new Thread(InjectionLoop)
        {
            IsBackground = true,
            Name = "G2C-Input-Injector",
            Priority = ThreadPriority.AboveNormal
        };
        _injectionThread.Start();
    }

    /// <summary>
    /// Stops the input processing threads.
    /// </summary>
    public void Stop()
    {
        if (!_running) return;
        _running = false;

        _cts.Cancel();
        _eventQueue.CompleteAdding();

        _inputThread?.Join(1000);
        _injectionThread?.Join(1000);
    }

    /// <summary>
    /// Main input reading loop - reads Windows console input events.
    /// </summary>
    private void InputReadLoop()
    {
        var inputBuffer = new INPUT_RECORD[32];

        while (_running)
        {
            try
            {
                // Wait for input with timeout
                if (!WaitForSingleObject(_stdIn, 50))
                {
                    continue;
                }

                // Check how many events are available
                if (!GetNumberOfConsoleInputEvents(_stdIn, out uint numEvents) || numEvents == 0)
                    continue;

                // Read available events
                if (!ReadConsoleInput(_stdIn, inputBuffer, (uint)inputBuffer.Length, out uint eventsRead))
                    continue;

                for (int i = 0; i < eventsRead; i++)
                {
                    ref var record = ref inputBuffer[i];

                    if (record.EventType == MOUSE_EVENT)
                    {
                        ProcessMouseEvent(ref record.MouseEvent);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch
            {
                Thread.Sleep(10);
            }
        }
    }

    /// <summary>
    /// Processes a Windows console mouse event.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void ProcessMouseEvent(ref MOUSE_EVENT_RECORD mouseEvent)
    {
        int termX = mouseEvent.dwMousePosition.X;
        int termY = mouseEvent.dwMousePosition.Y;
        var eventFlags = mouseEvent.dwEventFlags;
        var buttonState = mouseEvent.dwButtonState;

        Interlocked.Increment(ref _eventsProcessed);

        // Handle mouse movement
        if ((eventFlags & MOUSE_MOVED) != 0)
        {
            var moveEvent = new MouseInputEvent(
                termX, termY,
                GetPressedButton(buttonState),
                MouseEventType.Move);

            TryEnqueueEvent(moveEvent);
        }

        // Handle scroll wheel
        if ((eventFlags & MOUSE_WHEELED) != 0)
        {
            int delta = (short)(buttonState >> 16);
            var scrollEvent = new MouseInputEvent(
                termX, termY,
                MouseButton.None,
                MouseEventType.Scroll,
                delta);

            TryEnqueueEvent(scrollEvent);
        }

        // Handle button changes
        if (eventFlags == 0 || (eventFlags & DOUBLE_CLICK) != 0)
        {
            ProcessButtonChanges(termX, termY, buttonState, (eventFlags & DOUBLE_CLICK) != 0);
        }
    }

    /// <summary>
    /// Processes button state changes and generates appropriate events.
    /// </summary>
    private void ProcessButtonChanges(int termX, int termY, uint buttonState, bool isDoubleClick)
    {
        var newState = GetPressedButton(buttonState);
        var oldState = _currentButtonState;

        // Check for button presses
        CheckButton(termX, termY, oldState, newState, MouseButton.Left, isDoubleClick);
        CheckButton(termX, termY, oldState, newState, MouseButton.Right, isDoubleClick);
        CheckButton(termX, termY, oldState, newState, MouseButton.Middle, isDoubleClick);

        _currentButtonState = newState;
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void CheckButton(int termX, int termY, MouseButton oldState, MouseButton newState,
        MouseButton button, bool isDoubleClick)
    {
        bool wasPressed = (oldState & button) != 0;
        bool isPressed = (newState & button) != 0;

        if (isPressed && !wasPressed)
        {
            // Button pressed - check for double-click
            var eventType = MouseEventType.ButtonDown;

            if (isDoubleClick || IsDoubleClick(termX, termY, button))
            {
                eventType = MouseEventType.DoubleClick;
            }

            TryEnqueueEvent(new MouseInputEvent(termX, termY, button, eventType));

            // Update double-click tracking
            _lastClickTime = DateTime.UtcNow;
            _lastClickX = termX;
            _lastClickY = termY;
            _lastClickButton = button;
        }
        else if (!isPressed && wasPressed)
        {
            // Button released
            TryEnqueueEvent(new MouseInputEvent(termX, termY, button, MouseEventType.ButtonUp));
        }
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private bool IsDoubleClick(int termX, int termY, MouseButton button)
    {
        if (button != _lastClickButton)
            return false;

        var elapsed = (DateTime.UtcNow - _lastClickTime).TotalMilliseconds;
        if (elapsed > _doubleClickIntervalMs)
            return false;

        int dx = Math.Abs(termX - _lastClickX);
        int dy = Math.Abs(termY - _lastClickY);
        return dx <= _doubleClickDistance && dy <= _doubleClickDistance;
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static MouseButton GetPressedButton(uint buttonState)
    {
        MouseButton result = MouseButton.None;

        if ((buttonState & FROM_LEFT_1ST_BUTTON_PRESSED) != 0)
            result |= MouseButton.Left;
        if ((buttonState & RIGHTMOST_BUTTON_PRESSED) != 0)
            result |= MouseButton.Right;
        if ((buttonState & FROM_LEFT_2ND_BUTTON_PRESSED) != 0)
            result |= MouseButton.Middle;

        return result;
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void TryEnqueueEvent(MouseInputEvent evt)
    {
        if (!_eventQueue.TryAdd(evt))
        {
            Interlocked.Increment(ref _eventsDropped);
        }
    }

    /// <summary>
    /// Event injection loop - processes queued events and injects them into the system.
    /// </summary>
    private void InjectionLoop()
    {
        while (_running)
        {
            try
            {
                if (_eventQueue.TryTake(out var evt, 50, _cts.Token))
                {
                    var latencyMs = (DateTime.UtcNow - evt.Timestamp).TotalMilliseconds;
                    _totalLatencyMs += latencyMs;

                    InjectEvent(evt);
                    Interlocked.Increment(ref _eventsInjected);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch
            {
                Thread.Sleep(1);
            }
        }
    }

    /// <summary>
    /// Injects a mouse event into the desktop using SendInput.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void InjectEvent(MouseInputEvent evt)
    {
        // Translate coordinates
        var (screenX, screenY) = _coordTranslator(evt.TerminalX, evt.TerminalY);

        // Clamp to screen bounds
        screenX = Math.Clamp(screenX, 0, _screenWidth - 1);
        screenY = Math.Clamp(screenY, 0, _screenHeight - 1);

        // Normalize to 0-65535 range for absolute coordinates
        int normalizedX = (int)((float)screenX / _screenWidth * 65535);
        int normalizedY = (int)((float)screenY / _screenHeight * 65535);

        switch (evt.EventType)
        {
            case MouseEventType.Move:
                InjectMouseMove(normalizedX, normalizedY);
                break;

            case MouseEventType.ButtonDown:
                InjectMouseButton(normalizedX, normalizedY, evt.Button, true, false);
                break;

            case MouseEventType.ButtonUp:
                InjectMouseButton(normalizedX, normalizedY, evt.Button, false, false);
                break;

            case MouseEventType.DoubleClick:
                // Inject down-up-down-up for double click
                InjectMouseButton(normalizedX, normalizedY, evt.Button, true, false);
                InjectMouseButton(normalizedX, normalizedY, evt.Button, false, false);
                InjectMouseButton(normalizedX, normalizedY, evt.Button, true, false);
                InjectMouseButton(normalizedX, normalizedY, evt.Button, false, false);
                break;

            case MouseEventType.Scroll:
                InjectMouseScroll(normalizedX, normalizedY, evt.ScrollDelta);
                break;
        }
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static void InjectMouseMove(int normalizedX, int normalizedY)
    {
        var input = new INPUT
        {
            type = INPUT_MOUSE,
            mi = new MOUSEINPUT
            {
                dx = normalizedX,
                dy = normalizedY,
                dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK
            }
        };

        SendInput(1, [input], INPUT_SIZE);
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static void InjectMouseButton(int normalizedX, int normalizedY, MouseButton button, bool down, bool doubleClick)
    {
        uint flags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK;

        flags |= button switch
        {
            MouseButton.Left => down ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP,
            MouseButton.Right => down ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP,
            MouseButton.Middle => down ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_MIDDLEUP,
            _ => 0
        };

        var input = new INPUT
        {
            type = INPUT_MOUSE,
            mi = new MOUSEINPUT
            {
                dx = normalizedX,
                dy = normalizedY,
                dwFlags = flags
            }
        };

        SendInput(1, [input], INPUT_SIZE);
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static void InjectMouseScroll(int normalizedX, int normalizedY, int delta)
    {
        var input = new INPUT
        {
            type = INPUT_MOUSE,
            mi = new MOUSEINPUT
            {
                dx = normalizedX,
                dy = normalizedY,
                mouseData = (uint)delta,
                dwFlags = MOUSEEVENTF_WHEEL | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK
            }
        };

        SendInput(1, [input], INPUT_SIZE);
    }

    /// <summary>
    /// Gets input bridge statistics.
    /// </summary>
    public InputStats GetStats()
    {
        long injected = Interlocked.Read(ref _eventsInjected);
        double avgLatency = injected > 0 ? _totalLatencyMs / injected : 0;

        return new InputStats(
            Interlocked.Read(ref _eventsProcessed),
            injected,
            Interlocked.Read(ref _eventsDropped),
            avgLatency);
    }

    /// <summary>
    /// Waits for a single object with timeout.
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static bool WaitForSingleObject(nint handle, uint timeoutMs)
    {
        return WaitForSingleObjectNative(handle, timeoutMs) == WAIT_OBJECT_0;
    }

    public void Dispose()
    {
        Stop();
        DisableMouse();
        _cts.Dispose();
        _eventQueue.Dispose();
    }

    #region Native Interop

    private const int STD_INPUT_HANDLE = -10;
    private static readonly nint INVALID_HANDLE_VALUE = new(-1);
    private const uint WAIT_OBJECT_0 = 0;

    private const uint ENABLE_MOUSE_INPUT = 0x0010;
    private const uint ENABLE_QUICK_EDIT_MODE = 0x0040;
    private const uint ENABLE_EXTENDED_FLAGS = 0x0080;

    private const ushort MOUSE_EVENT = 0x0002;
    private const uint MOUSE_MOVED = 0x0001;
    private const uint DOUBLE_CLICK = 0x0002;
    private const uint MOUSE_WHEELED = 0x0004;

    private const uint FROM_LEFT_1ST_BUTTON_PRESSED = 0x0001;
    private const uint RIGHTMOST_BUTTON_PRESSED = 0x0002;
    private const uint FROM_LEFT_2ND_BUTTON_PRESSED = 0x0004;

    private const uint INPUT_MOUSE = 0;
    private const uint MOUSEEVENTF_MOVE = 0x0001;
    private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    private const uint MOUSEEVENTF_LEFTUP = 0x0004;
    private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    private const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    private const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    private const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
    private const uint MOUSEEVENTF_WHEEL = 0x0800;
    private const uint MOUSEEVENTF_ABSOLUTE = 0x8000;
    private const uint MOUSEEVENTF_VIRTUALDESK = 0x4000;

    private static readonly int INPUT_SIZE = Marshal.SizeOf<INPUT>();

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern nint GetStdHandle(int nStdHandle);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetConsoleMode(nint hConsoleHandle, out uint lpMode);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetConsoleMode(nint hConsoleHandle, uint dwMode);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetNumberOfConsoleInputEvents(nint hConsoleInput, out uint lpNumberOfEvents);

    [DllImport("kernel32.dll", EntryPoint = "WaitForSingleObject", SetLastError = true)]
    private static extern uint WaitForSingleObjectNative(nint hHandle, uint dwMilliseconds);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ReadConsoleInput(
        nint hConsoleInput,
        [Out] INPUT_RECORD[] lpBuffer,
        uint nLength,
        out uint lpNumberOfEventsRead);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [StructLayout(LayoutKind.Sequential)]
    private struct COORD
    {
        public short X;
        public short Y;
    }

    [StructLayout(LayoutKind.Explicit, Size = 20)]
    private struct INPUT_RECORD
    {
        [FieldOffset(0)] public ushort EventType;
        [FieldOffset(4)] public MOUSE_EVENT_RECORD MouseEvent;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MOUSE_EVENT_RECORD
    {
        public COORD dwMousePosition;
        public uint dwButtonState;
        public uint dwControlKeyState;
        public uint dwEventFlags;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT
    {
        public uint type;
        public MOUSEINPUT mi;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public nint dwExtraInfo;
    }

    #endregion
}
