# ⚡ Cirkit Studio — Arduino UNO & Ventuno Q Circuit Simulator

[![React 19](https://img.shields.io/badge/React-19.0-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

An interactive, browser-based electronics laboratory designed for students, makers, and embedded developers. Simulate next-generation **Arduino UNO Q** and **Arduino Ventuno Q** microcontrollers with authentic hardware rendering, real-time circuit graph analysis, interactive components, and an integrated code editor.

---

## ✨ Features

- 🔬 **Authentic Microcontroller Boards**:
  - **Arduino UNO Q**: Complete with ATmega microcontroller, crystal oscillator, USB Type-B port, reset button, and full 14-pin digital header + 6-pin analog header.
  - **Arduino Ventuno Q**: Next-generation edge board featuring the STM32 high-speed dual-core processor, USB-C interface, 8×12 programmable LED Matrix, Qwiic/I2C JST port, SWD debug header, and dual status LEDs.
- ⚡ **Real-Time Circuit Graph Traversal Engine**:
  - Simulates genuine electrical connectivity using bidirectional graph pathfinding.
  - Detects closed current loops between energized output pins (`D13`, `D11`, `5V`, `3V3`) and Ground (`GND`).
  - Identifies direct shorts and missing current-limiting resistors (`⚠️ NO RESISTOR` overcurrent warning badge).
  - Models forward bias for LEDs, voltage drops, and active current states through resistors.
- 🧩 **Interactive Component Library**:
  - **5mm LEDs**: Vivid photon diffusion glow in Red, Green, and Blue.
  - **Metal Film Resistors**: Visual current flow indicator with selectable resistance ratings (220Ω, 1kΩ, 10kΩ).
  - **Piezo Buzzer**: Generates acoustic wave animations and authentic pitch-accurate audio via the Web Audio API.
  - **LM393 IR Obstacle Sensor**: Power and digital detection indicator LEDs with obstacle range testing.
  - **SG90 Micro Servo**: Animated rotating servo horn responding to PWM signals.
  - **10kΩ Potentiometer**: Interactive rotary dial updating live analog readings.
  - **Tactile Pushbuttons & HC-SR04 Ultrasonic Sensors**.
- 💻 **Integrated Multi-File Code Editor & Terminal**:
  - Write C++/Arduino sketches with syntax highlighting.
  - Virtual Serial Monitor with selectable baud rates (9600, 115200) and live serial telemetry.
  - Compiles and runs student sketches against simulated board GPIO states.
- 📚 **Built-in Curriculum Lab Blueprints**:
  - **Lab 1: LED Blink**: Digital output, current-limiting resistors, and GPIO timing.
  - **Lab 2: Piezo Buzzer Alarm**: PWM modulation, tone generation, and sound wave synthesis.
  - **Lab 3: IR Obstacle Detection**: Digital sensor inputs, obstacle proximity triggers, and status indicator LEDs.
  - **Lab 4: SG90 Servo Sweep**: Microcontroller PWM angle positioning from 0° to 180°.
- 🎨 **Student-First UX**:
  - Interactive wiring tool with color-coded jumper wires (Red, Black, Yellow, Green, Blue).
  - Terminal connection solder beads with single-click wire removal.
  - Schematic preview drawer and GitHub showcase export module.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0 or newer recommended)
- `npm` or `bun`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/cirkit-studio.git
   cd cirkit-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to start experimenting.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | Component-driven UI architecture and responsive state management |
| **TypeScript 5.8** | Type-safe circuit graph modeling and component definitions |
| **Vite 6** | Instant HMR development server and fast optimized production bundling |
| **Tailwind CSS v4** | Modern dark-mode lab design with crisp contrast and typographic hierarchy |
| **Motion** | Fluid hardware drawer transitions and state change animations |
| **Lucide React** | Consistent iconography across lab navigation and toolbar controls |
| **Web Audio API** | Hardware-accurate piezo buzzer acoustic synthesis |

---

## 📁 Project Structure

```
├── public/                # Static assets, schematics, and favicon
├── src/
│   ├── components/
│   │   ├── CanvasStage.tsx          # Main SVG interactive canvas & wiring plane
│   │   ├── ComponentDrawer.tsx      # Sidebar component drawer (LEDs, resistors, sensors)
│   │   ├── Navbar.tsx               # Top lab toolbar (board switcher, run/stop, labs)
│   │   ├── RightSidebar.tsx         # Multi-tab panel (Code Editor, Serial, Curriculum, AI)
│   │   ├── SchematicView.tsx        # Electronics schematic diagram generator
│   │   ├── VentunoBoardSvg.tsx      # High-fidelity Arduino Ventuno Q vector board
│   │   └── GitHubShowcaseModal.tsx  # GitHub repository showcase & star generator
│   ├── data/
│   │   └── curriculum.ts            # Pre-configured student labs and wiring blueprints
│   ├── utils/
│   │   ├── audio.ts                 # Web Audio synthesizer for buzzer frequencies
│   │   └── circuitAnalysis.ts       # Graph network electrical connectivity & Ohm's solver
│   ├── types.ts                     # Core TypeScript interfaces for components, pins & wires
│   ├── App.tsx                      # Primary application orchestrator & simulation loop
│   ├── main.tsx                     # React root bootstrap
│   └── index.css                    # Tailwind CSS v4 design rules
├── package.json
└── tsconfig.json
```

---

## 🔌 How Circuit Simulation Works

Cirkit Studio evaluates circuits using a bidirectional electrical graph:

1. **Network Extraction**: Each placed component and board pin is represented as a node connected via wires.
2. **Pathfinding & Polarity**: The engine traces closed loops from voltage supply pins (`5V`, `3V3`, or active HIGH digital pins) through resistors and components to ground pins (`GND`).
3. **Safety & Short Circuit Detection**:
   - LEDs connected across `5V` and `GND` without a series resistor trigger a prominent `⚠️ NO RESISTOR` warning.
   - Reversed polarities (anode to GND, cathode to VCC) prevent conduction, teaching students real diode physics.
4. **Interactive Response**: Buzzers generate authentic sound waves and play tones, LEDs emit color-accurate photon glows, and sensors trigger interrupt logic.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/cirkit-studio/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⭐️ Show Your Support

If this simulator helped you learn Arduino, teach electronics, or build circuits, please give this repository a **Star** ⭐️! It helps more students and makers discover the project.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
