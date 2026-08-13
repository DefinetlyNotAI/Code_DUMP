## Project Overview

NIRT ShooterRobot is a face-tracking robotic shooter system with Python (computer vision) and Arduino (servo control) components. It detects faces using OpenCV DNN or Haar cascade, then sends commands to an Arduino via serial/Bluetooth to control pan/tilt servos and a shooting mechanism.

## Common Commands

### Python (Control Script)
```bash
pip install -r requirements.txt          # Install pyserial, opencv-python
python script.py                         # Run face-tracking (press 'q' or Ctrl+C to exit)
```

### Arduino
1. Open `robo_code/robo_code.ino` in Arduino IDE
2. Set `SIMULATION_MODE = false` for real hardware (default: true for testing)
3. Select board type and port
4. Upload to Arduino
5. Connect Bluetooth module (HC-05/HC-06) to serial pins

## Architecture

### Project Structure
```
NIRT ShooterRobot/
├── script.py                # Main Python control script
├── requirements.txt         # Dependencies (pyserial, opencv-python)
├── docs.md                  # Protocol documentation
├── model/
│   ├── deploy.prototxt                  # Caffe SSD architecture
│   └── res10_300x300_ssd_iter_140000.caffemodel  # Pre-trained weights
└── robo_code/
    └── robo_code.ino        # Arduino firmware
```

### System Flow
```
Camera → OpenCV (Face Detection) → Target Selection → Serial Command → Arduino (Servo Control)
```

### Python Components (script.py)
| Function                                 | Description                                        |
|------------------------------------------|----------------------------------------------------|
| `connect_bluetooth(port, baud, timeout)` | Opens serial connection (default: COM5, 9600 baud) |
| `detect_faces(frame, conf_threshold)`    | Returns list of (x1, y1, x2, y2, confidence)       |
| `compute_best_target(detections, w, h)`  | Returns normalized offsets and accuracy            |
| `simulate_robot(...)`                    | TEST mode simulation without hardware              |
| `_signal_handler(sig, frame)`            | Graceful shutdown on Ctrl+C                        |

## Serial Communication Protocol

**Connection:** 9600 baud, default port COM5

| Command         | Example                 | Meaning                   |
|-----------------|-------------------------|---------------------------|
| `M,dx,dy,acc\n` | `M,0.123,-0.456,0.85\n` | Move/track (no shoot)     |
| `S,dx,dy,acc\n` | `S,0.123,-0.456,0.85\n` | Shoot while moving        |
| `SCAN\n`        | `SCAN\n`                | No target - idle/scanning |
| `STOP\n`        | `STOP\n`                | Safe shutdown             |

**Parameters:**

- `dx`, `dy`: Normalized offsets from frame center (range: -1 to 1)
- `acc`: Detection confidence (range: 0 to 1)

## Configuration Constants

| Variable               | Value | Purpose                             |
|------------------------|-------|-------------------------------------|
| `_shoot_radius_norm`   | 0.08  | Dead zone radius (8% of half-frame) |
| `_shoot_acc_threshold` | 0.60  | Minimum confidence for auto-shoot   |
| `_PAN_RANGE`           | 90.0  | Pan angle range (degrees)           |
| `_TILT_RANGE`          | 45.0  | Tilt angle range (degrees)          |

## Face Detection Pipeline

1. Capture frame from camera (index 0, DirectShow on Windows)
2. Resize to 300x300 for DNN input
3. Forward pass through Caffe SSD network
4. Filter detections by confidence (default threshold: 0.5)
5. Falls back to Haar cascade if DNN unavailable

## Auto-Shoot Logic

- Target must be within `_shoot_radius_norm` (8%) of frame center
- Detection confidence must exceed `_shoot_acc_threshold` (0.60)
- Visual indicator: "AUTO-SHOOT" displayed in red when triggered

## Testing

- Set `SIMULATION_MODE = true` in Arduino code for testing without hardware
- TEST mode in Python simulates pan/tilt/recoil behavior