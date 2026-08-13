## **1. Arduino Implementation**

The Arduino acts as the actuator for your robotic system. It receives simple textual commands from the Python script
over Bluetooth (or serial) and controls pan/tilt servos (and potentially a shooting mechanism).

### **Expected Arduino setup:**

* **Hardware:**

    * 2 servo motors for pan and tilt (angles controlled in degrees or mapped units)
    * Optional actuator for shooting (relay, solenoid, motor, etc.)
    * Bluetooth module (e.g., HC-05/HC-06) connected to Arduino serial pins
* **Software:**

    * Serial reading loop that parses lines terminated by `\n`
    * Command types:

        * `"M,dx,dy,acc"` → Move/track command

            * `dx` and `dy` are normalized offsets in `[-1,1]`, multiplied by pan/tilt range to get absolute angles
            * `acc` may be used for speed/priority scaling
        * `"S,dx,dy,acc"` → Shoot command

            * Optionally triggers a shooting mechanism and simultaneously moves pan/tilt
        * `"SCAN"` → No target detected; perform idle scanning pattern or remain static
        * `"STOP"` → Safe shutdown; motors stop, actuators off
* **Flow Example:**

    1. Arduino waits for serial input.
    2. Parses each line to determine command type.
    3. Converts `dx/dy` into servo angles based on configured ranges.
    4. Moves servos smoothly.
    5. Fires actuator if `S` command received.
    6. Loops continuously until `"STOP"` is received or power off.

---

## **2. Python Variables Explanation**

### **Bluetooth / Serial**

| Variable       | Type                                | Description                                           |
|----------------|-------------------------------------|-------------------------------------------------------|
| `bt_available` | `bool`                              | True if `pyserial` imported successfully              |
| `bt`           | `serial.Serial` / `"TEST"` / `None` | Active connection to Arduino or test mode             |
| `last_signal`  | `str`                               | Last command sent; used to avoid flooding the Arduino |

**Functions:**

* `connect_bluetooth(port, baud, timeout)` → Opens serial connection to Arduino
* `get_bt_connection()` → Returns serial object or `"TEST"` if simulation mode

---

### **Face Detection**

| Variable                  | Type                    | Description                              |
|---------------------------|-------------------------|------------------------------------------|
| `modelFile`, `configFile` | `str`                   | Paths to DNN model files (Caffe)         |
| `net`                     | `cv2.dnn_Net`           | Loaded DNN network for face detection    |
| `use_dnn`                 | `bool`                  | True if DNN model is successfully loaded |
| `face_cascade`            | `cv2.CascadeClassifier` | Haar cascade fallback detector           |

**Function:**

* `detect_faces(frame, conf_threshold)` → Returns list of `(x1, y1, x2, y2, confidence)` for faces

---

### **Target Selection**

| Variable               | Type    | Description                                                             |
|------------------------|---------|-------------------------------------------------------------------------|
| `_shoot_radius_norm`   | `float` | Normalized radius (0–1) around center; if target inside, may auto-shoot |
| `_shoot_acc_threshold` | `float` | Minimum confidence to auto-shoot                                        |
| `_PAN_RANGE`           | `float` | Full pan range corresponding to dx = ±1                                 |
| `_TILT_RANGE`          | `float` | Full tilt range corresponding to dy = ±1                                |

**Function:**

* `compute_best_target(detections, frame_w, frame_h)` → Chooses best target

    * Returns: `(has_target:bool, dx:float, dy:float, acc:float)`
    * `dx/dy` are normalized offsets from center `[-1,1]`
    * `acc` is confidence (0–1) or fallback on normalized area

---

### **Simulation (TEST mode)**

| Variable                | Type    | Description                                      |
|-------------------------|---------|--------------------------------------------------|
| `_sim_pan`, `_sim_tilt` | `float` | Current simulated pan/tilt angle                 |
| `_sim_recoil`           | `float` | Tilt offset due to recoil (decays over time)     |
| `_sim_last_time`        | `float` | Last timestamp used for time-based interpolation |

**Function:**

* `simulate_robot(has_target, dx, dy, acc, _shoot)` → Updates pan/tilt simulation and prints logs

---

### **Signals / Shutdown**

| Variable | Type   | Description                                   |
|----------|--------|-----------------------------------------------|
| `_stop`  | `bool` | Flag used by signal handler to exit main loop |

**Functions:**

* `_signal_handler(sig, frame)` → Sets `_stop = True` on Ctrl+C or SIGTERM

---

### **Other**

| Variable           | Type               | Description                              |
|--------------------|--------------------|------------------------------------------|
| `cap`              | `cv2.VideoCapture` | Camera capture object                    |
| `overlay`          | `np.array`         | Used to draw translucent deadzone circle |
| `center_px`        | `tuple(int,int)`   | Pixel coordinates of image center        |
| `_shoot_radius_px` | `int`              | Radius in pixels for the deadzone circle |
| `target_px`        | `tuple(int,int)`   | Pixel coordinates of best target         |

---

## **3. Command Protocol**

| Command    | Example                 | Meaning                                 |
|------------|-------------------------|-----------------------------------------|
| Move/Track | `M,0.123,-0.456,0.85\n` | Pan/tilt toward target without shooting |
| Shoot      | `S,0.123,-0.456,0.85\n` | Shoot at target while moving servos     |
| Scan       | `SCAN\n`                | No target; Arduino may idle/scan        |
| Stop       | `STOP\n`                | Safe shutdown; stop motors/actuators    |

* `dx` / `dy` are normalized offsets from camera center
* `acc` is confidence; may be used for servo speed or shooting decision

---

This setup allows your Python code to **detect faces**, **compute the best target**, **decide whether to shoot**, and
either **simulate** the robot in TEST mode or **send commands to Arduino**.
