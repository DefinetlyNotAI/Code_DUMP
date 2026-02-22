const int lm35Pin = A0;  // LM35 temperature sensor on A0
const int ldrPin = A1;   // LDR sensor on A1

void setup() {
    Serial.begin(115200);  // Start serial communication
}

void loop() {
    // Read temperature from LM35 (in Celsius)
    int tempRaw = analogRead(lm35Pin);
    float temperature = (tempRaw * 5.0 / 1024.0) * 100.0;
    
    // Read light intensity from LDR
    int ldrValue = analogRead(ldrPin);
    
    // Send data as a JSON-like string
    Serial.print("[");
    Serial.print(temperature, 2);
    Serial.print(", ");
    Serial.print(ldrValue);
    Serial.println("]");
    
    delay(1000);  // Send data every second
}
