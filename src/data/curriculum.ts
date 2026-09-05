import { CodeFile, ProjectBlueprint } from '../types';

export const INITIAL_FILES: CodeFile[] = [
  {
    id: 'sketch',
    name: 'sketch.ino',
    language: 'cpp',
    isEntry: true,
    content: `// ========================================================
// Cirkit Studio - Arduino UNO Q Dual-Core Driver
// Qualcomm® Dragonwing™ QRB2210 + STM32U585 Real-Time Engine
// ========================================================

const int ledPin = 13;      // Digital Pin 13 (Built-in LED)
const int buzzerPin = 11;   // PWM Pin ~11
const int sensorPin = 2;    // Digital Pin 2 (Interrupt)

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(sensorPin, INPUT);

  Serial.begin(115200);
  Serial.println("========================================");
  Serial.println("[SYSTEM] Arduino UNO Q Dual-Core Booted");
  Serial.println("[KERNEL] Cortex-M33 Co-Processor Linked");
  Serial.println("[RADAR] Ready for student simulation");
  Serial.println("========================================");
}

void loop() {
  // Read sensor input
  int obstacle = digitalRead(sensorPin);

  if (obstacle == HIGH) {
    // Normal blink pattern
    digitalWrite(ledPin, HIGH);
    Serial.println("[STATUS] Pin 13: HIGH | Status: Normal");
    delay(500);

    digitalWrite(ledPin, LOW);
    Serial.println("[STATUS] Pin 13: LOW  | Status: Normal");
    delay(500);
  } else {
    // Alert state when obstacle detected
    Serial.println("[ALERT] Obstacle Detected on Pin 2!");
    digitalWrite(ledPin, HIGH);
    analogWrite(buzzerPin, 150);
    delay(150);
    digitalWrite(ledPin, LOW);
    analogWrite(buzzerPin, 0);
    delay(150);
  }
}
`
  },
  {
    id: 'pinout',
    name: 'pinout.h',
    language: 'h',
    content: `// Arduino UNO Q Hardware Pin Mapping Reference
#ifndef PINOUT_H
#define PINOUT_H

#define UNO_Q_LED_BUILTIN   13
#define UNO_Q_PWM_TIMER     11
#define UNO_Q_IR_INTERRUPT  2
#define UNO_Q_ANALOG_POT    A0
#define UNO_Q_SERVO_PIN     9
#define UNO_Q_TRIG_PIN      12
#define UNO_Q_ECHO_PIN      10

// Qualcomm Dragonwing Inter-Processor Mailbox Channels
#define IPC_CHANNEL_SENSORS 0x01
#define IPC_CHANNEL_AI_INFER 0x02

#endif // PINOUT_H
`
  },
  {
    id: 'readme',
    name: 'README.md',
    language: 'markdown',
    content: `# 🚀 Arduino UNO Q / Ventuno Q Interactive Lab

> High-performance EDA simulation of next-generation Qualcomm® Dragonwing™ powered Arduino hardware.

### 🌟 Features
- Real-time C++ microcontroller emulation
- Interactive visual jumper wiring with continuity & net tracing
- On-board 8×13 (104 Blue LED) SMPS matrix display
- Web Audio piezo acoustic synthesizer
- AI Neural Copilot with instant circuit blueprints

### 📦 How to Test & Deploy
1. Wire components by clicking any terminal pin.
2. Hit **Start Simulation** to run firmware in real time.
3. Open the **GitHub Stargazer Studio** to export a star-worthy repository!
`
  }
];

export const PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
  {
    id: 'led_blink',
    title: 'Silent LED + 220Ω (Pin 13)',
    description: 'Current-protected 5mm LED circuit wired to digital pin 13 with 220Ω resistor.',
    badge: 'Beginner',
    board: 'uno_q',
    sketch: `// Cirkit Studio - 5mm LED Current Limiter Lab
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("[CIRKIT] LED Current-Limited Loop Active");
}

void loop() {
  digitalWrite(ledPin, HIGH);
  Serial.println("[CYCLE] LED Anode: 5.0V (Forward Bias)");
  delay(500);

  digitalWrite(ledPin, LOW);
  Serial.println("[CYCLE] LED Anode: 0.0V (Off)");
  delay(500);
}`,
    components: [
      {
        id: 'resistor_0',
        type: 'resistor',
        x: 210,
        y: 390,
        properties: { resistance: 220, label: '220Ω' }
      },
      {
        id: 'led_0',
        type: 'led',
        x: 370,
        y: 390,
        properties: { color: 'red' }
      }
    ],
    wires: [
      { fromCompId: 'board', fromPinId: 'D13', toCompId: 'resistor_0', toPinId: 'p1', color: '#ef4444' },
      { fromCompId: 'resistor_0', fromPinId: 'p2', toCompId: 'led_0', toPinId: 'anode', color: '#38bdf8' },
      { fromCompId: 'led_0', fromPinId: 'cathode', toCompId: 'board', toPinId: 'GND_D1', color: '#1e293b' }
    ]
  },
  {
    id: 'buzzer_alarm',
    title: 'Piezo PWM Tone Alarm (~11)',
    description: 'Acoustic audio wave generation using hardware PWM timer on pin ~11.',
    badge: 'Audio',
    board: 'uno_q',
    sketch: `// Cirkit Studio - Piezo Acoustic Synthesizer
const int buzzerPin = 11;

void setup() {
  pinMode(buzzerPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("[AUDIO] Piezo PWM Synthesizer Booted");
}

void loop() {
  // Beep pulse
  analogWrite(buzzerPin, 180);
  Serial.println("[FREQ] Tone Emitted: 587 Hz (PWM 70%)");
  delay(350);

  analogWrite(buzzerPin, 0);
  Serial.println("[FREQ] Silence Interval");
  delay(350);
}`,
    components: [
      {
        id: 'buzzer_0',
        type: 'buzzer',
        x: 300,
        y: 390,
        properties: { label: 'Buzzer' },
        pins: {
          pos: { boardPin: 'D11', wireColor: '#10b981' },
          neg: { boardPin: 'GND_D1', wireColor: '#1e293b' }
        }
      }
    ],
    wires: [
      { fromCompId: 'board', fromPinId: 'D11', toCompId: 'buzzer_0', toPinId: 'pos', color: '#10b981' },
      { fromCompId: 'buzzer_0', fromPinId: 'neg', toCompId: 'board', toPinId: 'GND_D1', color: '#1e293b' }
    ]
  },
  {
    id: 'ir_sensor',
    title: 'IR Proximity Radar (Pin 2)',
    description: 'Active infrared obstacle detector with hardware interrupt line.',
    badge: 'Sensors',
    board: 'uno_q',
    sketch: `// Cirkit Studio - IR Optical Proximity Interrupter
const int sensorPin = 2;
const int alertLed = 13;

void setup() {
  pinMode(sensorPin, INPUT);
  pinMode(alertLed, OUTPUT);
  Serial.begin(115200);
  Serial.println("[RADAR] Optical Barrier Monitoring...");
}

void loop() {
  int state = digitalRead(sensorPin);
  digitalWrite(alertLed, state);
  Serial.println(state == HIGH ? "[RADAR] Status: Beam Unbroken" : "[RADAR] ALERT: Obstacle Detected!");
  delay(300);
}`,
    components: [
      {
        id: 'sensor_0',
        type: 'sensor',
        x: 290,
        y: 390,
        properties: { distance: 15 },
        pins: {
          vcc: { boardPin: '5V', wireColor: '#ef4444' },
          gnd: { boardPin: 'GND_P1', wireColor: '#1e293b' },
          out: { boardPin: 'D2', wireColor: '#38bdf8' }
        }
      }
    ],
    wires: [
      { fromCompId: 'board', fromPinId: '5V', toCompId: 'sensor_0', toPinId: 'vcc', color: '#ef4444' },
      { fromCompId: 'board', fromPinId: 'GND_P1', toCompId: 'sensor_0', toPinId: 'gnd', color: '#1e293b' },
      { fromCompId: 'sensor_0', fromPinId: 'out', toCompId: 'board', toPinId: 'D2', color: '#38bdf8' }
    ]
  },
  {
    id: 'servo_sweep',
    title: 'Micro Servo 180° Sweep (~9)',
    description: 'Precision angle actuator driven by PWM pulse timing on pin ~9.',
    badge: 'Actuators',
    board: 'uno_q',
    sketch: `// Cirkit Studio - Micro Servo Sweep Control
const int servoPin = 9;

void setup() {
  pinMode(servoPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("[SERVO] Motor Calibration Routine Initialized");
}

void loop() {
  // Rotate 0 deg -> 180 deg
  for (int pos = 0; pos <= 180; pos += 45) {
    analogWrite(servoPin, map(pos, 0, 180, 50, 250));
    Serial.print("[SERVO] Angle: ");
    Serial.print(pos);
    Serial.println(" deg");
    delay(400);
  }
}`,
    components: [
      {
        id: 'servo_0',
        type: 'servo',
        x: 320,
        y: 390,
        properties: { angle: 45 },
        pins: {
          vcc: { boardPin: '5V', wireColor: '#ef4444' },
          gnd: { boardPin: 'GND_P1', wireColor: '#1e293b' },
          pwm: { boardPin: 'D9', wireColor: '#10b981' }
        }
      }
    ],
    wires: [
      { fromCompId: 'board', fromPinId: '5V', toCompId: 'servo_0', toPinId: 'vcc', color: '#ef4444' },
      { fromCompId: 'board', fromPinId: 'GND_P1', toCompId: 'servo_0', toPinId: 'gnd', color: '#1e293b' },
      { fromCompId: 'servo_0', fromPinId: 'pwm', toCompId: 'board', toPinId: 'D9', color: '#10b981' }
    ]
  },
  {
    id: 'matrix_wave',
    title: '104-LED Matrix AI Animator',
    description: 'Full-frame dual-core buffer streaming animations onto the 8×13 matrix.',
    badge: 'Display',
    board: 'uno_q',
    sketch: `// Cirkit Studio - Arduino UNO Q 8x13 LED Matrix Streamer
#include <Arduino_LED_Matrix.h>

Arduino_LED_Matrix matrix;

void setup() {
  matrix.begin();
  Serial.begin(115200);
  Serial.println("[MATRIX] 104 Surface SMD Blue LEDs Enabled");
  Serial.println("[AI] Qualcomm Frame Renderer Running @ 30 FPS");
}

void loop() {
  Serial.println("[RENDER] Refreshing Sinusoidal Wave Buffer...");
  delay(350);
}`,
    components: []
  }
];

export function generateGitHubReadme(repoName = 'arduino-q-simulator', username = 'nadiw'): string {
  return `# ⚡ ${repoName}

[![GitHub stars](https://img.shields.io/github/stars/${username}/${repoName}?style=for-the-badge&logo=github&color=38bdf8)](https://github.com/${username}/${repoName}/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Arduino: UNO Q](https://img.shields.io/badge/Arduino-UNO%20Q%20%7C%20Ventuno-00878F?style=for-the-badge&logo=arduino)](https://arduino.cc)
[![Qualcomm Dragonwing](https://img.shields.io/badge/Qualcomm-QRB2210%20%2B%20STM32-3253DC?style=for-the-badge&logo=qualcomm)](https://qualcomm.com)

> **The next-generation interactive EDA circuit simulator & dual-core embedded lab for students.**  
> Simulate **Arduino UNO Q** and **Arduino Ventuno Q** with real-time wiring, multi-file C++ code editing, acoustic piezo synthesis, and an AI neural copilot!

---

## 🌟 Why Star This Project?
If this simulator helps your embedded systems classes, robotics projects, or STEM curriculum, please give it a **⭐ Star on GitHub**! It motivates continuous feature development.

- 🖥️ **Pixel-Perfect EDA Canvas**: Realistic 4-layer PCB silkscreen, gold-plated vias, and RF shields.
- 🔌 **Full Electronic Net Tracing**: Real continuity analysis, reverse polarity warnings, and resistor voltage drop protection.
- 🗂️ **Multi-File C++ Studio**: Write \`.ino\`, \`.h\`, and \`.cpp\` files with live syntax validation and instant file exports.
- 🤖 **Qualcomm Dragonwing AI Copilot**: One-click circuit auto-routing and intelligent troubleshooting.
- 🔊 **Web Audio Synthesizer**: Realistic square-wave audio for piezo buzzers and ultrasonic pulses.
- 📊 **Dual Logic Analyzer**: Live waveform viewer for PWM and digital pin timings.

---

## 🚀 Quickstart

### Run with Node.js & Vite
\`\`\`bash
# Clone repository
git clone https://github.com/${username}/${repoName}.git
cd ${repoName}

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the simulator in your browser.

---

## 🔌 Supported Hardware & Components
| Component | Description | Simulation Model |
|-----------|-------------|------------------|
| **Arduino UNO Q** | Qualcomm® QRB2210 + STM32U585 | Dual-Core SoC + Cortex-M33 + 8×13 LED Matrix |
| **Arduino VENTUNO Q** | Qualcomm® QCS8275 + STM32H5F5 | High-End Edge AI MPU + PCIe M.2 + 2.5Gb ETH |
| **5mm Diffused LED** | Red, Green, Blue, Amber | Photorealistic photon diffusion glow filter |
| **Metal Film Resistors** | 220Ω, 330Ω, 1kΩ, 10kΩ | Standard 4-band EIA color calculation |
| **Piezo Buzzer** | 587 Hz - 4 kHz resonant audio | Web Audio API square-wave oscillator |
| **IR Proximity Sensor** | LM393 Dual Comparator | Distance knob with digital interrupt output |
| **SG90 Micro Servo** | 0° to 180° Angle Actuator | 50Hz PWM pulse width modulation |
| **HC-SR04 Ultrasonic** | 2cm - 400cm Echo Radar | Trigger / Echo pulse delay calculator |

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/${username}/${repoName}/issues).

## 📄 License
This project is licensed under the [MIT License](LICENSE).
`;
}
