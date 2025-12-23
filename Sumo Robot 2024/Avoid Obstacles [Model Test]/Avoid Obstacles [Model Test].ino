void setup() {
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
}

void loop() {
  analogWrite(5, 150);  // 50% speed
  analogWrite(6, 150);  // 50% speed
}
