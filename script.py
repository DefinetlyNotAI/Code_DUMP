import time
import os
import math
import cv2
import signal

try:
    # noinspection PyUnusedImports
    import serial

    bt_available = True
except ImportError:
    bt_available = False


# --- Bluetooth connection ---
def connect_bluetooth(port='COM5', baud=9600, timeout=1):
    try:
        bluetooth = serial.Serial(port, baud, timeout=timeout)
        time.sleep(2)  # allow Arduino reset
        return bluetooth
    except Exception:
        return None


def get_bt_connection():
    if not bt_available:
        print("pyserial not installed or unavailable.")
        return None
    bluetooth = connect_bluetooth()
    if bluetooth is None:
        choice = input("Bluetooth not detected. Enter Test Mode? (y/n): ").lower()
        if choice == 'y':
            print("Running in TEST MODE.")
            return "TEST"
        else:
            print("Exiting...")
            exit()
    return bluetooth


bt = get_bt_connection()

# --- DNN face detector ---
modelFile = "model/res10_300x300_ssd_iter_140000.caffemodel"
configFile = "model/deploy.prototxt"

net = None
use_dnn = False
if os.path.exists(modelFile) and os.path.exists(configFile):
    try:
        net = cv2.dnn.readNetFromCaffe(configFile, modelFile)
        use_dnn = True
        print("Loaded DNN face detector.")
    except Exception as e:
        print("Failed to load DNN model, falling back to Haar cascade:", e)
else:
    print("DNN model files not found. Falling back to Haar cascade.")

# prepare Haar cascade fallback (should be present with OpenCV)
haar_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
if os.path.exists(haar_path):
    face_cascade = cv2.CascadeClassifier(haar_path)
else:
    face_cascade = None
    print("Warning: Haar cascade not found. Face detection will be disabled.")


def detect_faces(_frame, conf_threshold=0.5):
    """
    Returns list of (_x1,_y1,_x2,_y2,confidence) tuples.
    Uses DNN if loaded, otherwise Haar cascade if available.
    """
    _h, _w = _frame.shape[:2]
    boxes = []

    if use_dnn and net is not None:
        blob = cv2.dnn.blobFromImage(cv2.resize(_frame, (300, 300)), 1.0,
                                     (300, 300), (104.0, 177.0, 123.0))
        net.setInput(blob)
        _detections = net.forward()
        for i in range(_detections.shape[2]):
            _confidence = float(_detections[0, 0, i, 2])
            if _confidence > conf_threshold:
                box = _detections[0, 0, i, 3:7] * [_w, _h, _w, _h]
                (_x1, _y1, _x2, _y2) = box.astype("int")
                boxes.append((max(0, _x1), max(0, _y1), min(_w - 1, _x2), min(_h - 1, _y2), _confidence))
        return boxes

    if face_cascade is not None:
        gray = cv2.cvtColor(_frame, cv2.COLOR_BGR2GRAY)
        detected = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        for (x, y, fw, fh) in detected:
            boxes.append((x, y, x + fw, y + fh, 1.0))
        return boxes

    # no detector available
    return []


# --- Camera setup ---
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
if not cap.isOpened():
    print("Cannot open camera")
    exit()


# --- New/modified helpers: choose the best detection and encode commands ---
def compute_best_target(_detections, frame_w, frame_h):
    """
    Choose the best detection and return normalized offsets and accuracy.
    Returns (has_target:bool, _dx:float, _dy:float, _acc:float)
    _dx,_dy are in range [-1,1] where (0,0) is frame center.
    _acc is in [0,1] (confidence or relative box size fallback).
    """
    if not _detections:
        return False, 0.0, 0.0, 0.0

    # pick by highest confidence if available, else by largest area
    best = None
    best_score = -1.0
    for (_x1, _y1, _x2, _y2, conf) in _detections:
        area = (_x2 - _x1) * (_y2 - _y1)
        score = conf if conf is not None else float(area)
        # prefer confidence primarily
        if conf is not None:
            score = conf + area / (frame_w * frame_h) * 0.01
        if score > best_score:
            best_score = score
            best = (_x1, _y1, _x2, _y2, conf)

    _x1, _y1, _x2, _y2, conf = best
    cx = (_x1 + _x2) / 2.0
    cy = (_y1 + _y2) / 2.0

    # normalize relative to center: -1..1
    _dx = (cx - frame_w / 2.0) / (frame_w / 2.0)
    _dy = (cy - frame_h / 2.0) / (frame_h / 2.0)

    # accuracy: use confidence if available else normalized area
    if conf is None:
        area = (_x2 - _x1) * (_y2 - _y1)
        _acc = min(1.0, area / (frame_w * frame_h))
    else:
        _acc = float(conf)

    return True, float(_dx), float(_dy), float(_acc)


# --- New: shoot deadzone configuration (normalized; relative to half-frame: dx/dy in -1..1) ---
_shoot_radius_norm = 0.08  # small circle: ~8% of half-frame (tunable)
_shoot_acc_threshold = 0.60  # require reasonable confidence to auto-shoot

# --- Modified simulation constants & state (new) ---
_PAN_RANGE = 90.0     # degrees (or arbitrary units) for dx = ±1 -> pan target ±_PAN_RANGE
_TILT_RANGE = 45.0    # degrees for dy = ±1 -> tilt target ±_TILT_RANGE
_RECOIL_IMPULSE = 3.0  # small tilt change when shooting
_RECOIL_DECAY = 3.0    # per-second decay of recoil back to zero

_sim_pan = 0.0
_sim_tilt = 0.0
_sim_recoil = 0.0
_sim_last_time = time.time()


def simulate_robot(_has_target, _dx=0.0, _dy=0.0, _acc=0.0, _shoot=False):
    """
    In TEST mode simulate camera/body movement toward absolute targets.
    _dx,_dy are normalized (-1..1). Map to absolute target angles and smoothly interpolate.
    Use a transient recoil that decays to avoid accumulating offsets.
    """
    global _sim_pan, _sim_tilt, _sim_recoil, _sim_last_time
    now = time.time()
    dt = max(1e-6, now - _sim_last_time)
    _sim_last_time = now

    # decay recoil each frame
    if abs(_sim_recoil) > 1e-3:
        decay = _RECOIL_DECAY * dt
        if _sim_recoil > 0:
            _sim_recoil = max(0.0, _sim_recoil - decay)
        else:
            _sim_recoil = min(0.0, _sim_recoil + decay)

    if _has_target:
        if _shoot:
            # transient recoil impulse (does not permanently shift target)
            _sim_recoil += -_RECOIL_IMPULSE
            print(f"[SIM] SHOOT! acc={_acc:.3f} at offset dx={_dx:.3f}, dy={_dy:.3f}")
        # map normalized coords to absolute target angles (absolute target, not incremental)
        target_pan = _dx * _PAN_RANGE
        target_tilt = _dy * _TILT_RANGE

        # include recoil on tilt when present
        effective_tilt = target_tilt + _sim_recoil

        # smoothing factor: time-aware, depends on accuracy to be snappier when confident
        # alpha in (0..1), larger -> faster approach to target
        smooth_gain = 5.0  # larger -> faster tracking
        alpha = 1.0 - pow(0.5, dt * smooth_gain * (_acc + 0.1))  # time-consistent smoothing

        _sim_pan += (target_pan - _sim_pan) * alpha
        _sim_tilt += (effective_tilt - _sim_tilt) * alpha

        print(f"[SIM] Target found: dx={_dx:.3f}, dy={_dy:.3f}, acc={_acc:.3f} -> "
              f"pan={_sim_pan:.2f}, tilt={_sim_tilt:.2f} (recoil={_sim_recoil:.2f})")
    else:
        # simple scanning when no target: oscillate pan slowly around 0
        scan_speed = 20.0  # degrees/s
        _sim_pan += scan_speed * dt
        if _sim_pan > 180.0:
            _sim_pan -= 360.0
        # slowly return tilt toward zero (no hard jumps)
        _sim_tilt += (0.0 - _sim_tilt) * min(1.0, dt * 0.5)
        print(f"[SIM] Scanning... pan={_sim_pan:.2f}, tilt={_sim_tilt:.2f}, recoil={_sim_recoil:.2f}")


last_signal = None  # to prevent flooding Arduino

# --- New: graceful shutdown via signal / keyboard interrupt ---
_stop = False


def _signal_handler(_sig, _frame):
    """
    Set the stop flag on SIGINT so main loop exits gracefully.
    """
    global _stop
    _stop = True


# register handler for Ctrl+C
signal.signal(signal.SIGINT, _signal_handler)

try:
    while True:
        # allow signal handler to break the loop
        if _stop:
            print("Received interrupt, shutting down...")
            break

        ret, frame = cap.read()
        if not ret:
            continue

        # use unified detection function
        detections = detect_faces(frame, conf_threshold=0.5)

        face_detected = False
        for (x1, y1, x2, y2, confidence) in detections:
            face_detected = True
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{confidence * 100:.1f}%", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # --- New: draw small center circle (shoot deadzone) and target marker ---
        h, w = frame.shape[:2]
        center_px = (int(w / 2), int(h / 2))
        _shoot_radius_px = max(3, int(min(w, h) / 2.0 * _shoot_radius_norm))
        # small translucent circle: draw filled with low opacity via overlay
        overlay = frame.copy()
        cv2.circle(overlay, center_px, _shoot_radius_px, (0, 0, 255), -1)  # red fill
        cv2.addWeighted(overlay, 0.15, frame, 0.85, 0, frame)
        # draw outline
        cv2.circle(frame, center_px, _shoot_radius_px, (0, 0, 255), 1)

        # Show feed (will show target markers later)
        # cv2.imshow("Robot Vision", frame)

        # --- New: compute best target and prepare command (with shoot decision) ---
        has_target, dx, dy, acc = compute_best_target(detections, w, h)

        _inside_deadzone = False
        if has_target:
            dist = math.hypot(dx, dy)  # distance in normalized -1..1 units
            _inside_deadzone = (dist < _shoot_radius_norm and acc >= _shoot_acc_threshold)
            # draw target center marker
            target_px = (int((dx * (w / 2.0)) + w / 2.0), int((dy * (h / 2.0)) + h / 2.0))
            color = (0, 255, 255) if not _inside_deadzone else (0, 0, 255)
            cv2.circle(frame, target_px, 4, color, -1)
            if _inside_deadzone:
                cv2.putText(frame, "AUTO-SHOOT", (center_px[0] - 30, center_px[1] - _shoot_radius_px - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

        # Decide command: S for shoot, M for move, SCAN for none
        if has_target and _inside_deadzone:
            cmd = f"S,{dx:.4f},{dy:.4f},{acc:.4f}\n"
        elif has_target:
            cmd = f"M,{dx:.4f},{dy:.4f},{acc:.4f}\n"
        else:
            cmd = "SCAN\n"

        # Show feed (final)
        cv2.imshow("Robot Vision", frame)

        # send to TEST or real Bluetooth, avoiding flooding: only send on meaningful change
        if bt == "TEST":
            # simulate movement/shoot using the computed offsets
            simulate_robot(has_target, dx, dy, acc, _shoot=_inside_deadzone)
        elif bt is not None:
            # only send when command changed significantly
            send_now = False
            if last_signal is None:
                send_now = True
            else:
                # compare strings; for floats allow small tolerance by parsing
                try:
                    if cmd == "SCAN\n" or last_signal == "SCAN\n":
                        send_now = cmd != last_signal
                    else:
                        _, sx, sy, sa = cmd.strip().split(',')
                        if last_signal.strip() == "SCAN":
                            send_now = True
                        else:
                            _, lx, ly, la = last_signal.strip().split(',')
                            # consider significant change when any axis differs by >0.01 or acc by >0.02
                            if (abs(float(sx) - float(lx)) > 0.01 or
                                    abs(float(sy) - float(ly)) > 0.01 or abs(float(sa) - float(la)) > 0.02):
                                send_now = True
                except Exception:
                    send_now = (cmd != last_signal)

            if send_now:
                try:
                    bt.write(cmd.encode())
                    last_signal = cmd
                    print("Command sent:", cmd.strip())
                except Exception as e:
                    print("Failed to send command over Bluetooth:", e)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    # fallback in case signal didn't trigger; ensure graceful exit
    print("KeyboardInterrupt received, exiting...")

finally:
    cap.release()
    cv2.destroyAllWindows()
    if bt != "TEST" and bt is not None:
        bt.close()
