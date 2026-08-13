#include <Arduino.h>
#include <Servo.h>

// =======================
// CONFIGURABLE CONSTANTS
// =======================
const int PAN_PIN = 9;       // Servo pin for pan
const int TILT_PIN = 10;     // Servo pin for tilt
const int SHOOT_PIN = 8;     // Optional shooting actuator pin

const float PAN_RANGE = 90.0;    // degrees, max pan offset for dx = ±1
const float TILT_RANGE = 45.0;   // degrees, max tilt offset for dy = ±1
const int SERVO_CENTER = 90;     // neutral servo position
const int SHOOT_PULSE_MS = 100;  // duration of shooting signal

const bool SIMULATION_MODE = true; // true = print actions instead of moving servos

// =======================
// GLOBAL VARIABLES
// =======================
Servo panServo;
Servo tiltServo;
unsigned long lastSerialCheck = 0;
const long SERIAL_CHECK_INTERVAL = 5; // ms

float currentPan = 0;  // in degrees relative to center
float currentTilt = 0; // in degrees relative to center

// =======================
// HELPER FUNCTIONS
// =======================

void moveServos(float panDeg, float tiltDeg) {
  currentPan = constrain(panDeg, -PAN_RANGE, PAN_RANGE);
  currentTilt = constrain(tiltDeg, -TILT_RANGE, TILT_RANGE);

  int panPos = SERVO_CENTER + round(currentPan);
  int tiltPos = SERVO_CENTER + round(currentTilt);

  if (SIMULATION_MODE) {
    Serial.print("[SIM] Moving servos -> Pan: ");
    Serial.print(panPos);
    Serial.print(", Tilt: ");
    Serial.println(tiltPos);
  } else {
    panServo.write(panPos);
    tiltServo.write(tiltPos);
  }
}

void shoot() {
  if (SIMULATION_MODE) {
    Serial.println("[SIM] Shooting!");
  } else {
    digitalWrite(SHOOT_PIN, HIGH);
    delay(SHOOT_PULSE_MS);
    digitalWrite(SHOOT_PIN, LOW);
  }
}

void scan() {
  if (SIMULATION_MODE) {
    Serial.println("[SIM] Scanning...");
  } else {
    // implement your scanning routine (e.g., oscillating pan)
  }
}

void stopAll() {
  if (SIMULATION_MODE) {
    Serial.println("[SIM] STOP received. Motors and actuators idle.");
  } else {
    panServo.write(SERVO_CENTER);
    tiltServo.write(SERVO_CENTER);
    digitalWrite(SHOOT_PIN, LOW);
  }
}

// =======================
// SETUP
// =======================
void setup() {
  Serial.begin(9600);
  delay(2000); // allow Serial to initialize

  if (!SIMULATION_MODE) {
    panServo.attach(PAN_PIN);
    tiltServo.attach(TILT_PIN);
    pinMode(SHOOT_PIN, OUTPUT);
    digitalWrite(SHOOT_PIN, LOW);

    panServo.write(SERVO_CENTER);
    tiltServo.write(SERVO_CENTER);
  }

  Serial.println("Robot ready. Waiting for commands...");
}

// =======================
// MAIN LOOP
// =======================
void loop() {
  // check for new serial input
  if (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();

    if (line.length() == 0) return;

    // SCAN command
    if (line.equalsIgnoreCase("SCAN")) {
      scan();
      return;
    }

    // STOP command
    if (line.equalsIgnoreCase("STOP")) {
      stopAll();
      return;
    }

    // Parse M or S commands
    char cmdType = line.charAt(0);
    if (cmdType == 'M' || cmdType == 'S') {
      // Expected format: M,dx,dy,acc
      int firstComma = line.indexOf(',');
      int secondComma = line.indexOf(',', firstComma + 1);
      int thirdComma = line.indexOf(',', secondComma + 1);

      if (firstComma < 0 || secondComma < 0 || thirdComma < 0) {
        Serial.println("[WARN] Invalid command format: " + line);
        return;
      }

      float dx = line.substring(firstComma + 1, secondComma).toFloat();
      float dy = line.substring(secondComma + 1, thirdComma).toFloat();
      float acc = line.substring(thirdComma + 1).toFloat();

      // Map dx/dy [-1..1] to servo range
      float panTarget = dx * PAN_RANGE;
      float tiltTarget = dy * TILT_RANGE;

      moveServos(panTarget, tiltTarget);

      if (cmdType == 'S') {
        shoot();
      }
    } else {
      Serial.println("[WARN] Unknown command: " + line);
    }
  }
}
