---

# Arduino Sensor Serial Reader

A fun and simple project that allows you to use an Arduino to read sensor data from selected pins and send the results over the serial connection.

## Requirements

To get started, you’ll need the following hardware:

- **Arduino Nano**
- **LDR** (Light Dependent Resistor, 2-pin model)
- **Resistor** (10kΩ, preferred)
- **Thermistor** (LM35 model for temperature)

## Setup

### Circuit Assembly

Here’s how to set up the circuitry:

- LM35 (Temperature Sensor)
  - **VCC**: Connect to **5V** on the Arduino Nano.
  - **GND**: Connect to **GND** on the Arduino Nano.
  - **Output (Analog Signal)**: Connect to **A0** on the Arduino Nano.
- LDR (Light Dependent Resistor)
  - One leg of the LDR: Connect to **A1** on the Arduino Nano.
  - The other leg of the LDR: Connect to **5V** on the Arduino Nano through a **10kΩ pull-down resistor** to **GND**. This configuration ensures the LDR provides a readable voltage level at **A1**.

![Circuit Diagram](https://cdn.hack.pet/slackcdn/66a98bc1bb42abdd407a4204a5e91a3e.png)

### Receiver Side

The Arduino code sends data over the serial connection every second (note: not the most precise, but functional). The communication uses a **BAUD RATE** of **115200**.

> [!Important]
>  Ensure you're familiar with uploading code to the Arduino Nano using the Arduino IDE. If you face issues during upload, please note:
>
> - When using a **CH341** chip for serial communication, you must upload the code with the **Old Bootloader**.
> - The driver version must be **3.7.2022.1**. You can download the correct version from [this link](https://cdn.sparkfun.com/assets/learn_tutorials/8/4/4/CH341SER.EXE).

## Usage

Once uploaded, the Arduino Nano will send a string containing two float values over the serial connection. The first value represents the temperature from the LM35, and the second is the reading from the LDR. The data is in a **JSON-like** format, structured as follows:
 `[int, float]` where the `int` is temperature (In Celsius) and `float` is LDR

You can easily parse this string into an array for further use in your application.

------

