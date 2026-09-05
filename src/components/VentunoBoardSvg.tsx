import React from 'react';
import { CircuitWire } from '../types';

interface VentunoBoardSvgProps {
  boardPos: { x: number; y: number };
  onPointerDown: (e: React.PointerEvent) => void;
  activePin: { compId: string; pinId: string; pinName: string } | null;
  onPinClick: (e: React.MouseEvent, compId: string, pinId: string, pinName: string) => void;
  setHoverTooltip: (tooltip: { text: string; x: number; y: number } | null) => void;
  isSimulating: boolean;
  pinStates: Record<string, number | boolean>;
  ledMatrixState: boolean[];
  showCalloutAnnotations?: boolean;
}

export const VentunoBoardSvg: React.FC<VentunoBoardSvgProps> = ({
  boardPos,
  onPointerDown,
  activePin,
  onPinClick,
  setHoverTooltip,
  isSimulating,
  pinStates,
  ledMatrixState,
  showCalloutAnnotations = true
}) => {
  const isD13Active = Boolean(pinStates['D13']);
  const isD11PWM = Boolean(pinStates['D11']);

  // UNO Digital Header Pin Definitions
  const digitalPins = [
    { pin: 'SCL', label: 'SCL', x: 26, name: 'I2C SCL (STM32 PB8)' },
    { pin: 'SDA', label: 'SDA', x: 40, name: 'I2C SDA (STM32 PB9)' },
    { pin: 'AREF', label: 'REF', x: 54, name: 'Analog Reference' },
    { pin: 'GND_D1', label: 'GND', x: 68, name: 'Digital Ground' },
    { pin: 'D13', label: '13', x: 82, name: 'Digital 13 (Built-in LED / SPI SCK)' },
    { pin: 'D12', label: '12', x: 96, name: 'Digital 12 (SPI MISO)' },
    { pin: 'D11', label: '~11', x: 110, name: 'PWM 11 (SPI MOSI / TIM1_CH1)' },
    { pin: 'D10', label: '~10', x: 124, name: 'PWM 10 (SPI SS / TIM1_CH2)' },
    { pin: 'D9', label: '~9', x: 138, name: 'PWM 9 (TIM1_CH3)' },
    { pin: 'D8', label: '8', x: 152, name: 'Digital 8 (GPIO)' },
    { pin: 'D7', label: '7', x: 172, name: 'Digital 7 (GPIO)' },
    { pin: 'D6', label: '~6', x: 186, name: 'PWM 6 (TIM16_CH1)' },
    { pin: 'D5', label: '~5', x: 200, name: 'PWM 5 (TIM15_CH1)' },
    { pin: 'D4', label: '4', x: 214, name: 'Digital 4 (GPIO)' },
    { pin: 'D3', label: '~3', x: 228, name: 'PWM 3 (EXTI3 / TIM2_CH2)' },
    { pin: 'D2', label: '2', x: 242, name: 'Digital 2 (EXTI2 Interrupt)' },
    { pin: 'D1', label: 'TX', x: 256, name: 'UART TX (STM32 USART1_TX)' },
    { pin: 'D0', label: 'RX', x: 270, name: 'UART RX (STM32 USART1_RX)' }
  ];

  // UNO Power & Analog Header Pin Definitions
  const powerAnalogPins = [
    { pin: 'IOREF', label: 'IOREF', color: '#cbd5e1', x: 14, name: 'IOREF Voltage Reference (3.3V / 5.0V)' },
    { pin: 'RESET_PIN', label: 'RST', color: '#cbd5e1', x: 28, name: 'System Reset' },
    { pin: '3V3', label: '3V3', color: '#f59e0b', x: 42, name: '3.3V Regulated Output (Qualcomm PMIC)' },
    { pin: '5V', label: '5V', color: '#ef4444', x: 56, name: '5.0V Regulated Supply' },
    { pin: 'GND_P1', label: 'GND', color: '#ef4444', x: 70, name: 'Power Ground (GND)' },
    { pin: 'GND_P2', label: 'GND', color: '#ef4444', x: 84, name: 'Power Ground (GND)' },
    { pin: 'VIN', label: 'VIN', color: '#f59e0b', x: 98, name: 'VIN DC Voltage In (7V - 24V)' },
    { pin: 'A0', label: 'A0', color: '#38bdf8', x: 120, name: 'Analog In A0 (ADC1_IN0 / 14-bit)' },
    { pin: 'A1', label: 'A1', color: '#38bdf8', x: 134, name: 'Analog In A1 (ADC1_IN1)' },
    { pin: 'A2', label: 'A2', color: '#38bdf8', x: 148, name: 'Analog In A2 (ADC1_IN2)' },
    { pin: 'A3', label: 'A3', color: '#38bdf8', x: 162, name: 'Analog In A3 (ADC1_IN3)' },
    { pin: 'A4', label: 'A4', color: '#38bdf8', x: 176, name: 'Analog In A4 (I2C1_SDA)' },
    { pin: 'A5', label: 'A5', color: '#38bdf8', x: 190, name: 'Analog In A5 (I2C1_SCL)' }
  ];

  // Industrial Screw Terminal Block Pins
  const screwTerminalPins = [
    { pin: 'TERM_VIN', label: '+VIN', x: 12, name: '+12V to +24V DC Industrial Power Input', color: '#ef4444' },
    { pin: 'TERM_GND1', label: 'GND', x: 30, name: 'Power Return Ground (GND)', color: '#64748b' },
    { pin: 'TERM_CAN_H', label: 'CAN_H', x: 48, name: 'CAN-FD High Differential Line', color: '#f59e0b' },
    { pin: 'TERM_CAN_L', label: 'CAN_L', x: 66, name: 'CAN-FD Low Differential Line', color: '#f59e0b' },
    { pin: 'TERM_GND2', label: 'GND', x: 84, name: 'CAN Shield Ground (GND)', color: '#64748b' }
  ];

  // 8-Pin SWD / JTAG Header (Top Left)
  const jtagPins = [
    { pin: 'SWDIO', label: 'DIO', x: 10, y: 8, name: 'SWD Data I/O' },
    { pin: 'SWCLK', label: 'CLK', x: 24, y: 8, name: 'SWD Clock' },
    { pin: 'SWO', label: 'SWO', x: 38, y: 8, name: 'SWO Trace Output' },
    { pin: 'JT_RST', label: 'RST', x: 52, y: 8, name: 'JTAG Reset' },
    { pin: 'JT_VCC', label: 'VCC', x: 10, y: 20, name: 'Target VCC 3.3V' },
    { pin: 'JT_GND', label: 'GND', x: 24, y: 20, name: 'JTAG Ground' },
    { pin: 'JT_TDI', label: 'TDI', x: 38, y: 20, name: 'JTAG TDI' },
    { pin: 'JT_TDO', label: 'TDO', x: 52, y: 20, name: 'JTAG TDO' },
  ];

  // Raspberry Pi HAT Compatible 40-Pin GPIO Header (Left Vertical Header)
  const rpiGpioPins = [
    { pin: 'RPI_3V3', label: '3V3', x: 6, y: 12, name: 'RPi 3.3V Power' },
    { pin: 'RPI_5V_1', label: '5V', x: 18, y: 12, name: 'RPi 5V Power' },
    { pin: 'GPIO_2', label: 'GP2', x: 6, y: 26, name: 'GPIO 2 (I2C SDA)' },
    { pin: 'RPI_5V_2', label: '5V', x: 18, y: 26, name: 'RPi 5V Power' },
    { pin: 'GPIO_3', label: 'GP3', x: 6, y: 40, name: 'GPIO 3 (I2C SCL)' },
    { pin: 'RPI_GND_1', label: 'GND', x: 18, y: 40, name: 'RPi Ground' },
    { pin: 'GPIO_4', label: 'GP4', x: 6, y: 54, name: 'GPIO 4 (GPCLK0)' },
    { pin: 'GPIO_14', label: 'G14', x: 18, y: 54, name: 'GPIO 14 (UART TX)' },
    { pin: 'RPI_GND_2', label: 'GND', x: 6, y: 68, name: 'RPi Ground' },
    { pin: 'GPIO_15', label: 'G15', x: 18, y: 68, name: 'GPIO 15 (UART RX)' },
    { pin: 'GPIO_17', label: 'G17', x: 6, y: 82, name: 'GPIO 17' },
    { pin: 'GPIO_18', label: 'G18', x: 18, y: 82, name: 'GPIO 18 (PCM CLK)' },
    { pin: 'GPIO_27', label: 'G27', x: 6, y: 96, name: 'GPIO 27' },
    { pin: 'RPI_GND_3', label: 'GND', x: 18, y: 96, name: 'RPi Ground' },
    { pin: 'GPIO_22', label: 'G22', x: 6, y: 110, name: 'GPIO 22' },
    { pin: 'GPIO_23', label: 'G23', x: 18, y: 110, name: 'GPIO 23' },
    { pin: 'RPI_3V3_2', label: '3V3', x: 6, y: 124, name: 'RPi 3.3V' },
    { pin: 'GPIO_24', label: 'G24', x: 18, y: 124, name: 'GPIO 24' },
    { pin: 'GPIO_10', label: 'G10', x: 6, y: 138, name: 'GPIO 10 (SPI MOSI)' },
    { pin: 'RPI_GND_4', label: 'GND', x: 18, y: 138, name: 'RPi Ground' },
    { pin: 'GPIO_9', label: 'GP9', x: 6, y: 152, name: 'GPIO 9 (SPI MISO)' },
    { pin: 'GPIO_25', label: 'G25', x: 18, y: 152, name: 'GPIO 25' },
    { pin: 'GPIO_11', label: 'G11', x: 6, y: 166, name: 'GPIO 11 (SPI SCLK)' },
    { pin: 'GPIO_8', label: 'GP8', x: 18, y: 166, name: 'GPIO 8 (SPI CE0)' },
    { pin: 'RPI_GND_5', label: 'GND', x: 6, y: 180, name: 'RPi Ground' },
    { pin: 'GPIO_7', label: 'GP7', x: 18, y: 180, name: 'GPIO 7 (SPI CE1)' },
  ];

  return (
    <g
      id="ventunoBoard"
      className="board-node cursor-grab active:cursor-grabbing"
      transform={`translate(${boardPos.x}, ${boardPos.y})`}
      onPointerDown={onPointerDown}
    >
      <defs>
        {/* Authentic Arduino Teal PCB Multi-stop Gradient */}
        <linearGradient id="ventunoRealPcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#009ba2" />
          <stop offset="25%" stopColor="#008a90" />
          <stop offset="65%" stopColor="#00777d" />
          <stop offset="100%" stopColor="#005d62" />
        </linearGradient>

        {/* Silver Heat Spreader Gradient for Qualcomm IQ-8275 */}
        <linearGradient id="socHeatSpreader" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="25%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="75%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* RJ45 Metal Shield Gradient */}
        <linearGradient id="rj45ShieldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="30%" stopColor="#e2e8f0" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        {/* Screw Terminal Gradient */}
        <linearGradient id="screwTerminalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a2b" />
          <stop offset="40%" stopColor="#0f261a" />
          <stop offset="100%" stopColor="#05120c" />
        </linearGradient>

        {/* FPC White Connector Gradient */}
        <linearGradient id="fpcWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Drop shadow for PCB */}
        <filter id="ventunoLiftShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#000000" floodOpacity="0.65" />
        </filter>
      </defs>

      {/* ======================================================== */}
      {/* 1. MAIN PCB SUBSTRATE (Arduino Teal #00878F)             */}
      {/* ======================================================== */}
      <rect
        filter="url(#ventunoLiftShadow)"
        x="0"
        y="0"
        width="820"
        height="540"
        rx="16"
        fill="url(#ventunoRealPcbGrad)"
        stroke="#00474b"
        strokeWidth="3"
      />

      {/* Ground Copper Flood Inner Border */}
      <rect
        x="8"
        y="8"
        width="804"
        height="524"
        rx="12"
        fill="none"
        stroke="#00b4bd"
        strokeWidth="1.2"
        opacity="0.35"
      />

      {/* 4 Corner Mounting Holes with Plated Gold Annular Rings */}
      {[
        { cx: 24, cy: 24 },
        { cx: 796, cy: 24 },
        { cx: 24, cy: 516 },
        { cx: 796, cy: 516 },
        { cx: 320, cy: 24 },
        { cx: 580, cy: 24 }
      ].map((h, i) => (
        <g key={i}>
          <circle cx={h.cx} cy={h.cy} r="11" fill="#d4af37" stroke="#927014" strokeWidth="1.8" />
          {/* Ground vias surrounding mounting hole */}
          {Array.from({ length: 8 }).map((_, v) => {
            const angle = (v * Math.PI) / 4;
            const vx = h.cx + Math.cos(angle) * 8.2;
            const vy = h.cy + Math.sin(angle) * 8.2;
            return <circle key={v} cx={vx} cy={vy} r="1.1" fill="#05080c" />;
          })}
          <circle cx={h.cx} cy={h.cy} r="6.5" fill="#05080c" />
        </g>
      ))}

      {/* High-Speed Differential Serpentine Routing Traces (MIPI, PCIe, USB 3.0) */}
      <g stroke="#00b4bd" strokeWidth="1.1" fill="none" opacity="0.3">
        {/* MIPI traces from SoC to Right Edge */}
        <path d="M 640 220 C 660 220, 670 210, 690 210 L 750 210" />
        <path d="M 640 224 C 660 224, 670 214, 690 214 L 750 214" />
        <path d="M 640 330 C 660 330, 670 340, 690 340 L 750 340" />
        <path d="M 640 334 C 660 334, 670 344, 690 344 L 750 344" />
        {/* PCIe traces to M.2 Slot */}
        <path d="M 440 260 C 400 260, 380 270, 340 270" />
        <path d="M 440 264 C 400 264, 380 274, 340 274" />
        <path d="M 440 268 C 400 268, 380 278, 340 278" />
      </g>

      {/* Gold Test Points */}
      {[
        { x: 38, y: 130, label: 'TP1' },
        { x: 38, y: 145, label: 'TP2' },
        { x: 280, y: 430, label: 'TP3' },
        { x: 420, y: 430, label: 'TP4' },
        { x: 740, y: 90, label: 'TP5' },
        { x: 740, y: 430, label: 'TP6' }
      ].map((tp, idx) => (
        <g key={idx}>
          <circle cx={tp.x} cy={tp.y} r="2.8" fill="#d4af37" stroke="#927014" strokeWidth="0.8" />
          <text x={tp.x + 5} y={tp.y + 2} fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="5" opacity="0.6">
            {tp.label}
          </text>
        </g>
      ))}

      {/* ======================================================== */}
      {/* 2. ARDUINO VENTUNO Q OFFICIAL BRANDING & SILKSCREEN       */}
      {/* ======================================================== */}
      <g transform="translate(480, 50)">
        {/* Official Arduino Infinity Symbol */}
        <path
          d="M 12 18 C 12 12, 18 8, 24 8 C 31 8, 37 13, 44 18 C 51 23, 57 28, 64 28 C 70 28, 76 24, 76 18 C 76 12, 70 8, 64 8 C 57 8, 51 13, 44 18 C 37 23, 31 28, 24 28 C 18 28, 12 24, 12 18 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <text x="24" y="21" fill="#ffffff" fontFamily="Space Grotesk" fontSize="11" fontWeight="900" textAnchor="middle">-</text>
        <text x="64" y="21" fill="#ffffff" fontFamily="Space Grotesk" fontSize="11" fontWeight="900" textAnchor="middle">+</text>
        
        <text x="88" y="16" fill="#ffffff" fontFamily="Space Grotesk" fontSize="16" fontWeight="900" letterSpacing="0.8">
          ARDUINO
        </text>
        <text x="88" y="32" fill="#38bdf8" fontFamily="Space Grotesk" fontSize="17" fontWeight="900" letterSpacing="1.5">
          VENTUNO Q
        </text>
        <text x="88" y="44" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="600" opacity="0.85">
          QUALCOMM® DRAGONWING™ IQ-8275 + STM32H5
        </text>
      </g>

      {/* ======================================================== */}
      {/* 3. 8-PIN JTAG / SWD HEADER (TOP-LEFT)                     */}
      {/* ======================================================== */}
      <g transform="translate(68, 48)">
        <rect x="-6" y="-6" width="76" height="40" rx="3" fill="url(#headerShellBevel)" stroke="#000" strokeWidth="1.2" />
        <text x="32" y="-9" fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="6" fontWeight="700" textAnchor="middle">
          8-PIN SWD/JTAG
        </text>
        {jtagPins.map((p) => {
          const isSelected = activePin?.compId === 'board' && activePin?.pinId === p.pin;
          return (
            <g
              key={p.pin}
              className="terminal-pin-group cursor-crosshair group"
              data-pin={p.pin}
              transform={`translate(${p.x}, ${p.y})`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(e, 'board', p.pin, `JTAG ${p.name}`);
              }}
              onMouseEnter={(e) => setHoverTooltip({ text: `JTAG: ${p.name}`, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoverTooltip(null)}
            >
              <circle className="terminal-hitbox" r="8" fill="transparent" />
              <circle
                className="terminal-pin transition-all"
                r={isSelected ? '4.8' : '3'}
                fill={isSelected ? '#38bdf8' : 'url(#pinMetal)'}
                stroke={isSelected ? '#ffffff' : '#05080c'}
                strokeWidth="1.2"
              />
              <text y="-5" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="4.5" textAnchor="middle">
                {p.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* ======================================================== */}
      {/* 4. ARDUINO UNO COMPATIBLE SHIELD HEADERS                 */}
      {/* ======================================================== */}
      {/* Top Digital Header */}
      <g transform="translate(180, 48)">
        <rect x="-6" y="-6" width="300" height="24" rx="3" fill="url(#headerShellBevel)" stroke="#000" strokeWidth="1.2" />
        <text x="144" y="-9" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="middle">
          DIGITAL (UNO SHIELD COMPATIBLE)
        </text>
        {digitalPins.map((p) => {
          const isSelected = activePin?.compId === 'board' && activePin?.pinId === p.pin;
          return (
            <g
              key={p.pin}
              className="terminal-pin-group cursor-crosshair group"
              data-pin={p.pin}
              transform={`translate(${p.x}, 6)`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(e, 'board', p.pin, p.name);
              }}
              onMouseEnter={(e) => setHoverTooltip({ text: p.name, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoverTooltip(null)}
            >
              <circle className="terminal-hitbox" r="8" fill="transparent" />
              <circle
                className="terminal-pin transition-all"
                r={isSelected ? '5.2' : '3.6'}
                fill={isSelected ? '#38bdf8' : 'url(#pinMetal)'}
                stroke={isSelected ? '#ffffff' : '#09111e'}
                strokeWidth="1.4"
              />
              <text y="14" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.2" fontWeight="bold" textAnchor="middle">
                {p.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* ======================================================== */}
      {/* 5. 104-LED MATRIX (8x13) - REAL EMBEDDED DISPLAY          */}
      {/* ======================================================== */}
      <g transform="translate(54, 115)">
        <rect x="-8" y="-8" width="138" height="92" rx="6" fill="#042633" stroke="#00979c" strokeWidth="1.5" />
        <text x="61" y="-12" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="middle">
          104-LED MATRIX (8×13)
        </text>
        {Array.from({ length: 104 }).map((_, idx) => {
          const row = Math.floor(idx / 13);
          const col = idx % 13;
          const isLit = isSimulating && (ledMatrixState[idx] ?? false);
          return (
            <rect
              key={idx}
              x={col * 9.5}
              y={row * 9.5}
              width="6.8"
              height="6.8"
              rx="0.9"
              fill={isLit ? '#38bdf8' : '#0b1d28'}
              stroke={isLit ? '#7dd3fc' : '#1e384d'}
              strokeWidth="0.7"
              style={{
                filter: isLit
                  ? 'drop-shadow(0 0 5px #0284c7) drop-shadow(0 0 10px rgba(56,189,248,0.85))'
                  : 'none'
              }}
            />
          );
        })}
      </g>

      {/* ======================================================== */}
      {/* 6. M.2 KEY-E / KEY-M EXPANSION SLOTS (NVMe PCIe Gen4)     */}
      {/* ======================================================== */}
      <g transform="translate(54, 226)">
        {/* Slot 1: M.2 NVMe SSD Connector */}
        <rect x="0" y="0" width="138" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
        {/* Gold edge fingers inside connector */}
        {Array.from({ length: 26 }).map((_, i) => (
          <line key={i} x1={8 + i * 4.8} y1="3" x2={8 + i * 4.8} y2="15" stroke="#d4af37" strokeWidth="1.8" />
        ))}
        {/* Key Notch */}
        <rect x="52" y="1" width="6" height="16" fill="#0f172a" />
        <text x="70" y="32" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.8" fontWeight="700">
          M.2 KEY-M NVMe (PCIe Gen4)
        </text>

        {/* M.2 Standoff Mount Post */}
        <circle cx="160" cy="9" r="6" fill="#d4af37" stroke="#85641e" strokeWidth="1.2" />
        <circle cx="160" cy="9" r="3.2" fill="#1e293b" />

        {/* Slot 2: M.2 Wireless / AI Accelerator */}
        <g transform="translate(0, 44)">
          <rect x="0" y="0" width="138" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {Array.from({ length: 26 }).map((_, i) => (
            <line key={i} x1={8 + i * 4.8} y1="3" x2={8 + i * 4.8} y2="15" stroke="#d4af37" strokeWidth="1.8" />
          ))}
          <rect x="76" y="1" width="6" height="16" fill="#0f172a" />
          <text x="70" y="32" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.8" fontWeight="700">
            M.2 KEY-E (Wi-Fi 6E / BT 5.3)
          </text>
          <circle cx="160" cy="9" r="6" fill="#d4af37" stroke="#85641e" strokeWidth="1.2" />
          <circle cx="160" cy="9" r="3.2" fill="#1e293b" />
        </g>
      </g>

      {/* ======================================================== */}
      {/* 7. UNO POWER & ANALOG IN HEADER (LOWER LEFT)             */}
      {/* ======================================================== */}
      <g transform="translate(54, 340)">
        <rect x="-6" y="-6" width="220" height="24" rx="3" fill="url(#headerShellBevel)" stroke="#000" strokeWidth="1.2" />
        <text x="56" y="-9" fill="#ef4444" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="middle">
          POWER
        </text>
        <text x="160" y="-9" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="middle">
          ANALOG IN
        </text>
        {powerAnalogPins.map((p) => {
          const isSelected = activePin?.compId === 'board' && activePin?.pinId === p.pin;
          return (
            <g
              key={p.pin}
              className="terminal-pin-group cursor-crosshair group"
              data-pin={p.pin}
              transform={`translate(${p.x}, 6)`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(e, 'board', p.pin, p.name);
              }}
              onMouseEnter={(e) => setHoverTooltip({ text: p.name, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoverTooltip(null)}
            >
              <circle className="terminal-hitbox" r="8" fill="transparent" />
              <circle
                className="terminal-pin transition-all"
                r={isSelected ? '5.2' : '3.6'}
                fill={isSelected ? '#38bdf8' : 'url(#pinMetal)'}
                stroke={isSelected ? '#ffffff' : '#09111e'}
                strokeWidth="1.4"
              />
              <text y="14" fill={p.color} fontFamily="JetBrains Mono" fontSize="5.2" fontWeight="bold" textAnchor="middle">
                {p.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* ======================================================== */}
      {/* 8. DUAL VERTICAL EXPANSION HEADERS (CENTER OF BOARD)     */}
      {/* ======================================================== */}
      {/* Header 1: 40-Pin Raspberry Pi HAT Compatible Header */}
      <g transform="translate(296, 110)">
        <rect x="-4" y="-4" width="34" height="210" rx="3" fill="url(#headerShellBevel)" stroke="#000" strokeWidth="1.2" />
        <text x="13" y="-8" fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="5.8" fontWeight="700" textAnchor="middle">
          40-PIN GPIO
        </text>
        {rpiGpioPins.map((p) => {
          const isSelected = activePin?.compId === 'board' && activePin?.pinId === p.pin;
          return (
            <g
              key={p.pin}
              className="terminal-pin-group cursor-crosshair group"
              data-pin={p.pin}
              transform={`translate(${p.x}, ${p.y})`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(e, 'board', p.pin, p.name);
              }}
              onMouseEnter={(e) => setHoverTooltip({ text: p.name, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoverTooltip(null)}
            >
              <circle className="terminal-hitbox" r="6" fill="transparent" />
              <circle
                className="terminal-pin"
                r={isSelected ? '4' : '2.6'}
                fill={isSelected ? '#38bdf8' : 'url(#pinMetal)'}
                stroke="#09111e"
                strokeWidth="0.8"
              />
            </g>
          );
        })}
      </g>

      {/* Header 2: JOMEGA Industrial Expansion Header */}
      <g transform="translate(340, 110)">
        <rect x="-4" y="-4" width="22" height="210" rx="3" fill="url(#headerShellBevel)" stroke="#000" strokeWidth="1.2" />
        <text x="7" y="-8" fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="5.8" fontWeight="700" textAnchor="middle">
          JOMEGA
        </text>
        {Array.from({ length: 15 }).map((_, i) => (
          <circle key={i} cx="7" cy={12 + i * 13} r="2.6" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="0.8" />
        ))}
      </g>

      {/* ======================================================== */}
      {/* 9. QUALCOMM® DRAGONWING™ IQ-8275 PROCESSOR (CENTER-RIGHT) */}
      {/* ======================================================== */}
      <g transform="translate(470, 150)">
        {/* BGA Substrate */}
        <rect x="-6" y="-6" width="138" height="138" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
        
        {/* Brushed Silver Heat Spreader */}
        <rect x="0" y="0" width="126" height="126" rx="6" fill="url(#socHeatSpreader)" stroke="#475569" strokeWidth="1.5" />
        
        {/* Chamfered Pin 1 Indicator */}
        <polygon points="0,16 16,0 0,0" fill="#94a3b8" />
        <circle cx="20" cy="20" r="3.5" fill="#334155" />

        {/* Center Laser Engraving */}
        <text x="63" y="44" fill="#0f172a" fontFamily="Space Grotesk" fontSize="13" fontWeight="900" textAnchor="middle">
          Qualcomm®
        </text>
        <text x="63" y="62" fill="#0284c7" fontFamily="Space Grotesk" fontSize="11" fontWeight="800" textAnchor="middle">
          DRAGONWING™
        </text>
        <text x="63" y="78" fill="#0f172a" fontFamily="JetBrains Mono" fontSize="10" fontWeight="900" letterSpacing="0.8" textAnchor="middle">
          IQ-8275
        </text>
        
        {/* Gold Laser Alignment Crosshair */}
        <line x1="20" y1="88" x2="106" y2="88" stroke="#d4af37" strokeWidth="1.5" />
        <line x1="63" y1="84" x2="63" y2="92" stroke="#d4af37" strokeWidth="1.8" />

        <text x="63" y="103" fill="#334155" fontFamily="JetBrains Mono" fontSize="6" fontWeight="700" textAnchor="middle">
          HEXAGON™ NPU 40 TOPS
        </text>
        <text x="63" y="114" fill="#64748b" fontFamily="JetBrains Mono" fontSize="5.5" fontWeight="600" textAnchor="middle">
          ARM CORTEX OCTA-CORE
        </text>

        {/* Surrounding High-Frequency Decoupling Capacitors */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={-14} y={12 + i * 14} width="5" height="9" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={135} y={12 + i * 14} width="5" height="9" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
        ))}
      </g>

      {/* ======================================================== */}
      {/* 10. 16GB LPDDR5 RAM ARRAY (ADJACENT TO SOC)               */}
      {/* ======================================================== */}
      <g transform="translate(412, 160)">
        {Array.from({ length: 4 }).map((_, i) => (
          <g key={i} transform={`translate(0, ${i * 28})`}>
            <rect x="0" y="0" width="46" height="22" rx="2" fill="#090e17" stroke="#334155" strokeWidth="1" />
            <circle cx="5" cy="5" r="1.5" fill="#e2e8f0" />
            <text x="23" y="11" fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="5" fontWeight="700" textAnchor="middle">
              LPDDR5
            </text>
            <text x="23" y="18" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="4.5" fontWeight="600" textAnchor="middle">
              6400 MT/s
            </text>
          </g>
        ))}
      </g>

      {/* ======================================================== */}
      {/* 11. STM32H5F5 MICROCONTROLLER (CORTEX-M33 250MHz)        */}
      {/* ======================================================== */}
      <g transform="translate(630, 180)">
        <rect x="0" y="0" width="60" height="60" rx="3" fill="#0f172a" stroke="#00b4bd" strokeWidth="1.6" />
        <circle cx="8" cy="8" r="2.2" fill="#0284c7" />
        <text x="30" y="24" fill="#ffffff" fontFamily="Space Grotesk" fontSize="8" fontWeight="800" textAnchor="middle">
          STM32
        </text>
        <text x="30" y="36" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="7.5" fontWeight="700" textAnchor="middle">
          H5F5
        </text>
        <text x="30" y="47" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="5" fontWeight="600" textAnchor="middle">
          M33 @ 250MHz
        </text>
        {/* Crystal Oscillator in Metal Can */}
        <rect x="15" y="66" width="30" height="16" rx="3" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        <text x="30" y="77" fill="#334155" fontFamily="JetBrains Mono" fontSize="5.5" fontWeight="800" textAnchor="middle">
          24.000
        </text>
      </g>

      {/* 64GB eMMC Flash Memory */}
      <g transform="translate(630, 290)">
        <rect x="0" y="0" width="60" height="42" rx="3" fill="#090e17" stroke="#334155" strokeWidth="1.2" />
        <circle cx="7" cy="7" r="1.8" fill="#e2e8f0" />
        <text x="30" y="20" fill="#e2e8f0" fontFamily="Space Grotesk" fontSize="6.5" fontWeight="800" textAnchor="middle">
          64GB eMMC
        </text>
        <text x="30" y="32" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5" textAnchor="middle">
          UFS 3.1
        </text>
      </g>

      {/* ======================================================== */}
      {/* 12. POWER STAGE / INDUCTORS & PMIC (TOP-RIGHT)           */}
      {/* ======================================================== */}
      <g transform="translate(480, 94)">
        {/* 3 High-Current Inductors */}
        {[
          { x: 0, label: 'R22' },
          { x: 38, label: '1R0' },
          { x: 76, label: '2R2' }
        ].map((ind, i) => (
          <g key={i} transform={`translate(${ind.x}, 0)`}>
            <rect x="0" y="0" width="32" height="30" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="16" cy="15" r="11" fill="#475569" />
            <text x="16" y="18" fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="middle">
              {ind.label}
            </text>
          </g>
        ))}
      </g>

      {/* ======================================================== */}
      {/* 13. TACTILE BUTTONS & SYSTEM STATUS LEDS                 */}
      {/* ======================================================== */}
      {/* Reset Button */}
      <g transform="translate(390, 80)">
        <rect x="0" y="0" width="22" height="22" rx="3" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        <circle cx="11" cy="11" r="7" fill="#0f172a" />
        <text x="11" y="-5" fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="6" fontWeight="700" textAnchor="middle">
          RESET
        </text>
      </g>

      {/* User Button */}
      <g transform="translate(425, 80)">
        <rect x="0" y="0" width="22" height="22" rx="3" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        <circle cx="11" cy="11" r="7" fill="#0284c7" />
        <text x="11" y="-5" fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="6" fontWeight="700" textAnchor="middle">
          USER
        </text>
      </g>

      {/* Power LED (Green) */}
      <g transform="translate(460, 84)">
        <circle
          cx="6"
          cy="6"
          r="4.2"
          fill={isSimulating ? '#10b981' : '#064e3b'}
          stroke="#065f46"
          strokeWidth="1"
          style={{ filter: isSimulating ? 'drop-shadow(0 0 7px #10b981)' : 'none' }}
        />
        <text x="16" y="9" fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="5.5" fontWeight="700">
          PWR
        </text>
      </g>

      {/* Built-in Pin 13 LED (L - Amber) */}
      <g transform="translate(460, 104)">
        <circle
          cx="6"
          cy="6"
          r="4.2"
          fill={isSimulating && isD13Active ? '#f59e0b' : '#78350f'}
          stroke="#92400e"
          strokeWidth="1"
          style={{ filter: isSimulating && isD13Active ? 'drop-shadow(0 0 8px #f59e0b)' : 'none' }}
        />
        <text x="16" y="9" fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="5.5" fontWeight="700">
          L (D13)
        </text>
      </g>

      {/* ======================================================== */}
      {/* 14. RIGHT EDGE CONNECTORS (THREE WHITE FPC CONNECTORS)    */}
      {/* ======================================================== */}
      {/* Top Right: MIPI CSI 0 (Camera 0) */}
      <g transform="translate(770, 95)">
        <rect x="0" y="0" width="45" height="52" rx="4" fill="url(#fpcWhiteGrad)" stroke="#64748b" strokeWidth="1.4" />
        <rect x="0" y="10" width="10" height="32" fill="#0f172a" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="12" y1={14 + i * 2.2} x2="35" y2={14 + i * 2.2} stroke="#d4af37" strokeWidth="1.2" />
        ))}
        <text x="-8" y="28" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="end">
          MIPI CSI 0
        </text>
        <text x="-8" y="38" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="5" textAnchor="end">
          4-Lane Camera
        </text>
      </g>

      {/* Middle Right: MIPI CSI 1 (Camera 1) */}
      <g transform="translate(770, 205)">
        <rect x="0" y="0" width="45" height="52" rx="4" fill="url(#fpcWhiteGrad)" stroke="#64748b" strokeWidth="1.4" />
        <rect x="0" y="10" width="10" height="32" fill="#0f172a" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="12" y1={14 + i * 2.2} x2="35" y2={14 + i * 2.2} stroke="#d4af37" strokeWidth="1.2" />
        ))}
        <text x="-8" y="28" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="end">
          MIPI CSI 1
        </text>
        <text x="-8" y="38" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="5" textAnchor="end">
          4-Lane Camera
        </text>
      </g>

      {/* Bottom Right: MIPI DSI (Display) */}
      <g transform="translate(770, 315)">
        <rect x="0" y="0" width="45" height="52" rx="4" fill="url(#fpcWhiteGrad)" stroke="#64748b" strokeWidth="1.4" />
        <rect x="0" y="10" width="10" height="32" fill="#0f172a" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="12" y1={14 + i * 2.2} x2="35" y2={14 + i * 2.2} stroke="#d4af37" strokeWidth="1.2" />
        ))}
        <text x="-8" y="28" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="end">
          MIPI DSI
        </text>
        <text x="-8" y="38" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="5" textAnchor="end">
          4-Lane Display
        </text>
      </g>

      {/* ======================================================== */}
      {/* 15. BOTTOM EDGE CONNECTORS (FROM LEFT TO RIGHT)          */}
      {/* ======================================================== */}
      {/* Connector 1: 2.5Gb RJ45 Ethernet Connector */}
      <g transform="translate(45, 450)">
        <rect x="0" y="0" width="82" height="74" rx="4" fill="url(#rj45ShieldGrad)" stroke="#475569" strokeWidth="2" />
        {/* Metal Top Cavity */}
        <rect x="12" y="12" width="58" height="50" rx="3" fill="#0f172a" />
        {/* Internal RJ45 8-Pin Contacts */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={20 + i * 6} y1="18" x2={20 + i * 6} y2="44" stroke="#d4af37" strokeWidth="1.8" />
        ))}
        {/* Ethernet Status LEDs */}
        <circle cx="20" cy="55" r="3.2" fill={isSimulating ? '#10b981' : '#065f46'} style={{ filter: isSimulating ? 'drop-shadow(0 0 5px #10b981)' : 'none' }} />
        <circle cx="62" cy="55" r="3.2" fill={isSimulating ? '#f59e0b' : '#78350f'} style={{ filter: isSimulating ? 'drop-shadow(0 0 5px #f59e0b)' : 'none' }} />
        
        {/* Text Annotation Callout */}
        <text x="41" y="86" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="middle">
          2.5Gb ETHERNET
        </text>
      </g>

      {/* Connector 2: Dual Stacked USB 3.2 Gen 1 Type-A */}
      <g transform="translate(150, 456)">
        <rect x="0" y="0" width="62" height="68" rx="4" fill="url(#rj45ShieldGrad)" stroke="#475569" strokeWidth="2" />
        {/* Upper USB 3.0 Slot */}
        <rect x="8" y="10" width="46" height="20" rx="2" fill="#0f172a" />
        <rect x="12" y="14" width="38" height="6" fill="#0284c7" />
        {/* Lower USB 3.0 Slot */}
        <rect x="8" y="38" width="46" height="20" rx="2" fill="#0f172a" />
        <rect x="12" y="42" width="38" height="6" fill="#0284c7" />

        <text x="31" y="80" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="6.2" fontWeight="800" textAnchor="middle">
          2x USB 3.2 Gen 1
        </text>
      </g>

      {/* Connector 3: USB-C Port 1 (DP Alt Mode / Power / OTG) */}
      <g transform="translate(236, 470)">
        <rect x="0" y="0" width="34" height="54" rx="6" fill="url(#rj45ShieldGrad)" stroke="#475569" strokeWidth="2" />
        <rect x="9" y="8" width="16" height="38" rx="4" fill="#0f172a" />
        <line x1="17" y1="12" x2="17" y2="42" stroke="#d4af37" strokeWidth="2" />
        <text x="17" y="66" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="5.5" fontWeight="800" textAnchor="middle">
          USB-C 1
        </text>
        <text x="17" y="74" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="4.8" textAnchor="middle">
          DP / POWER
        </text>
      </g>

      {/* Connector 4: USB-C Port 2 (Host / Debug) */}
      <g transform="translate(288, 470)">
        <rect x="0" y="0" width="34" height="54" rx="6" fill="url(#rj45ShieldGrad)" stroke="#475569" strokeWidth="2" />
        <rect x="9" y="8" width="16" height="38" rx="4" fill="#0f172a" />
        <line x1="17" y1="12" x2="17" y2="42" stroke="#d4af37" strokeWidth="2" />
        <text x="17" y="66" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="5.5" fontWeight="800" textAnchor="middle">
          USB-C 2
        </text>
        <text x="17" y="74" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="4.8" textAnchor="middle">
          HOST / DEBUG
        </text>
      </g>

      {/* Connector 5: 5-Pin Industrial Screw Terminal Block (Power + CAN-FD) */}
      <g transform="translate(346, 468)">
        <rect x="0" y="0" width="96" height="56" rx="4" fill="url(#screwTerminalGrad)" stroke="#064e3b" strokeWidth="2" />
        {/* Terminal wire holes & screws */}
        {screwTerminalPins.map((tp) => {
          const isSelected = activePin?.compId === 'board' && activePin?.pinId === tp.pin;
          return (
            <g
              key={tp.pin}
              className="terminal-pin-group cursor-crosshair group"
              data-pin={tp.pin}
              transform={`translate(${tp.x}, 14)`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(e, 'board', tp.pin, tp.name);
              }}
              onMouseEnter={(e) => setHoverTooltip({ text: tp.name, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoverTooltip(null)}
            >
              {/* Slotted Screw Head */}
              <circle cx="0" cy="0" r="7" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#334155" strokeWidth="1.6" />
              
              {/* Lower wire receptacle / clickable pin terminal */}
              <circle className="terminal-hitbox" cy="22" r="8" fill="transparent" />
              <circle
                className="terminal-pin"
                cy="22"
                r={isSelected ? '5.2' : '3.6'}
                fill={isSelected ? '#38bdf8' : 'url(#pinMetal)'}
                stroke={isSelected ? '#ffffff' : '#05080c'}
                strokeWidth="1.4"
              />
              <text y="36" fill={tp.color} fontFamily="JetBrains Mono" fontSize="5.2" fontWeight="bold" textAnchor="middle">
                {tp.label}
              </text>
            </g>
          );
        })}
        <text x="48" y="70" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="5.8" fontWeight="800" textAnchor="middle">
          +12V to +24V DC / CAN-FD
        </text>
      </g>

      {/* Connector 6: DC Power Barrel Jack */}
      <g transform="translate(465, 460)">
        <rect x="0" y="0" width="56" height="64" rx="4" fill="#090e17" stroke="#1e293b" strokeWidth="2" />
        <rect x="12" y="10" width="32" height="44" rx="3" fill="#000000" />
        {/* Center Conductor Pin */}
        <circle cx="28" cy="32" r="5" fill="#d4af37" stroke="#85641e" strokeWidth="1.5" />
        <circle cx="28" cy="32" r="2.2" fill="#000000" />
        
        <text x="28" y="76" fill="#ef4444" fontFamily="JetBrains Mono" fontSize="5.8" fontWeight="800" textAnchor="middle">
          DC BARREL
        </text>
        <text x="28" y="84" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="4.8" textAnchor="middle">
          +12V - +24V IN
        </text>
      </g>

      {/* ======================================================== */}
      {/* 16. OFFICIAL PINOUT COLOR LEGEND (AS SEEN IN SCHEMATIC)   */}
      {/* ======================================================== */}
      {showCalloutAnnotations && (
        <g transform="translate(545, 466)">
          <rect x="-6" y="-6" width="260" height="62" rx="4" fill="#070d14" stroke="#1e2c40" strokeWidth="1.2" opacity="0.95" />
          <text x="6" y="8" fill="#f8fafc" fontFamily="Space Grotesk" fontSize="7" fontWeight="800">
            PINOUT LEGEND (VENTUNO Q):
          </text>
          
          <g transform="translate(6, 18)">
            <rect x="0" y="0" width="8" height="8" rx="1.5" fill="#ef4444" />
            <text x="12" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">Power</text>

            <rect x="46" y="0" width="8" height="8" rx="1.5" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
            <text x="58" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">Ground</text>

            <rect x="96" y="0" width="8" height="8" rx="1.5" fill="#f97316" />
            <text x="108" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">Digital</text>

            <rect x="146" y="0" width="8" height="8" rx="1.5" fill="#10b981" />
            <text x="158" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">PWM</text>

            <rect x="194" y="0" width="8" height="8" rx="1.5" fill="#38bdf8" />
            <text x="206" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">Analog</text>
          </g>

          <g transform="translate(6, 34)">
            <rect x="0" y="0" width="8" height="8" rx="1.5" fill="#0284c7" />
            <text x="12" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">I2C</text>

            <rect x="46" y="0" width="8" height="8" rx="1.5" fill="#06b6d4" />
            <text x="58" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">SPI</text>

            <rect x="96" y="0" width="8" height="8" rx="1.5" fill="#a855f7" />
            <text x="108" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">UART</text>

            <rect x="146" y="0" width="8" height="8" rx="1.5" fill="#f59e0b" />
            <text x="158" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">CAN-FD</text>

            <rect x="194" y="0" width="8" height="8" rx="1.5" fill="#64748b" />
            <text x="206" y="7" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="5.5">Internal</text>
          </g>
        </g>
      )}
    </g>
  );
};
