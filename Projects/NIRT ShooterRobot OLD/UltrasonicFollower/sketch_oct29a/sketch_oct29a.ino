#include <Servo.h>

Servo motor;

#define MOTOR_PIN 9
#define TRIGGER_PIN 7
#define ECHO_PIN 6

#define MAX_DISTANCE 250  //rand chose dist
#define TARGET_DISTANCE 20  //if less than 20cm then detect

int angle = 90;  //start
int direction = 1;  //choose left or right based on polarity of the sign
int lastTargetAngle = 90;  //old pos

bool tracking = false;  //is tracking? flag

void setup() {
  motor.attach(MOTOR_PIN);
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.begin(9600);
  motor.write(angle);
  delay(300);
}

float ultrasonic() {
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 15000);

  if (duration == 0) return -1;

  float distance = duration * 0.0343 / 2.0;

  if (distance > MAX_DISTANCE) return -1;

  return distance;
}

bool detectTarget() {
  float distance = ultrasonic();

  if (distance > 0 && distance <= TARGET_DISTANCE) {
    Serial.print("Target: ");
    Serial.print(distance);
    Serial.println(" cm");
    return true;
  }

  return false;
}

void moveTo(int targetAngle, int waitTime) {
  angle = constrain(targetAngle, 0, 180);
  motor.write(angle);
  delay(waitTime);
}

bool checkAngle(int targetAngle) {
  moveTo(targetAngle, 55);  //55ms dlay

  if (detectTarget()) {
    lastTargetAngle = angle;
    tracking = true;
    Serial.println("target reacquired!");
    return true;
  }

  return false;
}

bool recoverTarget() {
  Serial.println("Target lost. Searching nearby...");

  int center = lastTargetAngle;

  // see 10 degrees right
  if (checkAngle(center + 10))
    return true;

  // see 10 degrees left
  if (checkAngle(center - 10))
    return true;

  // return to old pos (couldnt find)
  moveTo(center, 55);  // 55ms delay

  tracking = false;
  Serial.println("Target lost. Resuming scan.");

  return false;
}

void loop() {
  if (tracking) {
    moveTo(lastTargetAngle, 25);  // delay 25ms

    if (detectTarget()) {
      Serial.println("Tracking target");
      return;
    }

    recoverTarget();
    return;
  }

  // Fast scanning
  moveTo(angle + direction * 3, 12);  // 12ms wait time, and 3 step movement

  if (detectTarget()) {
    tracking = true;
    lastTargetAngle = angle;
    Serial.println("Target acquired!");
    return;
  }

  // Reverse at boundaries
  if (angle >= 180) {
    direction = -1;
  } else if (angle <= 0) {
    direction = 1;
  }
}