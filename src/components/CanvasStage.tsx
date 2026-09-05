import React, { useRef, useState, useMemo } from 'react';
import { BoardType, PlacedComponent, CircuitWire } from '../types';
import { playWireSnap } from '../utils/audio';
import { evaluateCircuit } from '../utils/circuitAnalysis';
import { VentunoBoardSvg } from './VentunoBoardSvg';

interface CanvasStageProps {
  boardType: BoardType;
  components: PlacedComponent[];
  wires: CircuitWire[];
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
  onUpdateComponentProp: (id: string, key: string, value: any) => void;
  onDeleteComponent: (id: string) => void;
  onAddWire: (wire: CircuitWire) => void;
  onDeleteWire: (id: string) => void;
  activeWireColor: string;
  isSimulating: boolean;
  pinStates: Record<string, number | boolean>;
  ledMatrixState: boolean[];
  onCanvasClick: (x: number, y: number) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  boardType,
  components,
  wires,
  onUpdateComponentPosition,
  onUpdateComponentProp,
  onDeleteComponent,
  onAddWire,
  onDeleteWire,
  activeWireColor,
  isSimulating,
  pinStates,
  ledMatrixState,
  onCanvasClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [boardPos, setBoardPos] = useState({ x: 45, y: 40 });
  const [activePin, setActivePin] = useState<{ compId: string; pinId: string; pinName: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoverTooltip, setHoverTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [showPinoutCallouts, setShowPinoutCallouts] = useState(true);

  // Convert client coordinates to SVG coordinates
  const getSVGPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
  };

  // Dragging logic for board or components
  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'board' | 'component',
    id?: string
  ) => {
    if ((e.target as HTMLElement).closest('.terminal-pin-group')) return;
    e.stopPropagation();

    const targetEl = e.currentTarget as SVGElement;
    targetEl.setPointerCapture(e.pointerId);

    const startMouse = getSVGPoint(e.clientX, e.clientY);
    const startX = type === 'board' ? boardPos.x : (components.find(c => c.id === id)?.x || 0);
    const startY = type === 'board' ? boardPos.y : (components.find(c => c.id === id)?.y || 0);

    const onPointerMove = (moveEv: PointerEvent) => {
      const currentMouse = getSVGPoint(moveEv.clientX, moveEv.clientY);
      const newX = startX + (currentMouse.x - startMouse.x);
      const newY = startY + (currentMouse.y - startMouse.y);

      if (type === 'board') {
        setBoardPos({ x: newX, y: newY });
      } else if (id) {
        onUpdateComponentPosition(id, newX, newY);
      }
    };

    const onPointerUp = (upEv: PointerEvent) => {
      targetEl.removeEventListener('pointermove', onPointerMove);
      targetEl.removeEventListener('pointerup', onPointerUp);
      targetEl.removeEventListener('pointercancel', onPointerUp);
    };

    targetEl.addEventListener('pointermove', onPointerMove);
    targetEl.addEventListener('pointerup', onPointerUp);
    targetEl.addEventListener('pointercancel', onPointerUp);
  };

  // Calculate pin coordinates in SVG space with robust alias resolution
  const getPinCoordinates = (compId: string, pinId: string) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const selector = compId === 'board'
      ? `.board-node .terminal-pin-group[data-pin="${pinId}"]`
      : `#${compId} .terminal-pin-group[data-pin="${pinId}"]`;
    let pinEl = svgRef.current.querySelector(selector);

    // Fallback alias resolution for cross-board compatibility
    if (!pinEl && compId === 'board') {
      const aliases: Record<string, string[]> = {
        'TX': ['D1'],
        'D1': ['TX'],
        'RX': ['D0'],
        'D0': ['RX'],
        'GND': ['GND_D1', 'GND_P1', 'GND_P2', 'TERM_GND1', 'TERM_GND2'],
        'GND_D1': ['GND', 'TERM_GND1', 'GND_P1'],
        'GND_P1': ['GND', 'GND_D1', 'TERM_GND1'],
        '5V': ['TERM_VIN', 'RPI_5V_1'],
        '3V3': ['RPI_3V3', 'IOREF']
      };
      const candidateList = aliases[pinId] || [];
      for (const candidate of candidateList) {
        pinEl = svgRef.current.querySelector(`.board-node .terminal-pin-group[data-pin="${candidate}"]`);
        if (pinEl) break;
      }
    }

    if (!pinEl) {
      if (compId === 'board') {
        return { x: boardPos.x + 160, y: boardPos.y + 40 };
      }
      const comp = components.find(c => c.id === compId);
      if (comp) {
        return { x: comp.x + 40, y: comp.y + 40 };
      }
      return { x: 0, y: 0 };
    }

    const pinCircle = pinEl.querySelector('.terminal-pin') || pinEl;
    const rect = pinCircle.getBoundingClientRect();
    const pt = svgRef.current.createSVGPoint();
    pt.x = rect.left + rect.width / 2;
    pt.y = rect.top + rect.height / 2;
    const transformed = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  const handlePinClick = (e: React.MouseEvent, compId: string, pinId: string, pinName: string) => {
    e.stopPropagation();
    if (!activePin) {
      setActivePin({ compId, pinId, pinName });
      playWireSnap();
    } else if (activePin.compId === compId && activePin.pinId === pinId) {
      setActivePin(null);
    } else {
      // Connect wire
      const newWire: CircuitWire = {
        id: `wire_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fromCompId: activePin.compId,
        fromPinId: activePin.pinId,
        toCompId: compId,
        toPinId: pinId,
        color: activeWireColor
      };
      onAddWire(newWire);
      setActivePin(null);
      playWireSnap();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = getSVGPoint(e.clientX, e.clientY);
    setMousePos(pt);
  };

  // Evaluate which components are energized based on wiring and pin states
  const isD13Active = Boolean(pinStates['D13']);
  const isD11PWM = Boolean(pinStates['D11']);
  const isD2Active = Boolean(pinStates['D2']);

  // Complete circuit evaluation using network traversal
  const circuitState = useMemo(() => {
    return evaluateCircuit(
      components,
      wires,
      {
        ...pinStates,
        '5V': 1,
        '3V3': 1,
        'VIN': 1,
        'TERM_VIN': 1,
        'RPI_5V_1': 1,
        'RPI_5V_2': 1,
        'RPI_3V3': 1
      },
      isSimulating
    );
  }, [components, wires, pinStates, isSimulating]);

  return (
    <div 
      className="relative flex-1 h-full bg-[#05080c] overflow-hidden select-none cursor-default"
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).classList.contains('grid-bg')) {
          if (activePin) {
            setActivePin(null);
          } else {
            const pt = getSVGPoint(e.clientX, e.clientY);
            onCanvasClick(pt.x, pt.y);
          }
        }
      }}
    >
      {/* CAD Grid Background */}
      <div 
        className="grid-bg absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating Tooltip */}
      {hoverTooltip && (
        <div 
          className="fixed z-50 bg-[#0f172a] text-slate-100 text-[11px] font-mono border border-cyan-500/40 px-2 py-1 rounded shadow-xl pointer-events-none -translate-x-1/2 -translate-y-9"
          style={{ left: hoverTooltip.x, top: hoverTooltip.y }}
        >
          {hoverTooltip.text}
        </div>
      )}

      {/* Active Routing Banner */}
      {activePin && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#0f1622]/95 border border-cyan-500/50 text-cyan-300 text-xs font-mono px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Routing wire from <b>{activePin.pinName}</b> — Click another pin to connect (Esc to cancel)</span>
        </div>
      )}

      {/* Ventuno Q Real Pinout Legend Toggle */}
      {boardType === 'ventuno_q' && (
        <div className="absolute top-3 right-4 z-30 flex items-center gap-2 bg-[#0b1320]/90 border border-[#1e2c40] px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-sm text-xs font-mono">
          <span className="text-slate-400">Pinout Legend Callout:</span>
          <button
            onClick={() => setShowPinoutCallouts(!showPinoutCallouts)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              showPinoutCallouts 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showPinoutCallouts ? 'VISIBLE' : 'HIDDEN'}
          </button>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0"
        onMouseMove={handleMouseMove}
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9"/>
            <stop offset="60%" stopColor="#cbd5e1"/>
            <stop offset="100%" stopColor="#94a3b8"/>
          </linearGradient>

          <linearGradient id="usbcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b"/>
            <stop offset="35%" stopColor="#f8fafc"/>
            <stop offset="70%" stopColor="#cbd5e1"/>
            <stop offset="100%" stopColor="#475569"/>
          </linearGradient>

          <linearGradient id="qualcommGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f2937"/>
            <stop offset="100%" stopColor="#0b0f17"/>
          </linearGradient>

          <radialGradient id="ledRedDome" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fca5a5"/>
            <stop offset="40%" stopColor="#ef4444"/>
            <stop offset="90%" stopColor="#991b1b"/>
            <stop offset="100%" stopColor="#450a0a"/>
          </radialGradient>

          <radialGradient id="ledGreenDome" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#86efac"/>
            <stop offset="40%" stopColor="#10b981"/>
            <stop offset="90%" stopColor="#047857"/>
            <stop offset="100%" stopColor="#064e3b"/>
          </radialGradient>

          <radialGradient id="ledBlueDome" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#93c5fd"/>
            <stop offset="40%" stopColor="#3b82f6"/>
            <stop offset="90%" stopColor="#1d4ed8"/>
            <stop offset="100%" stopColor="#1e3a8a"/>
          </radialGradient>

          <radialGradient id="ledGlowRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 68, 68, 0.95)"/>
            <stop offset="40%" stopColor="rgba(239, 68, 68, 0.6)"/>
            <stop offset="100%" stopColor="rgba(239, 68, 68, 0)"/>
          </radialGradient>

          <radialGradient id="ledGlowGreen" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.95)"/>
            <stop offset="40%" stopColor="rgba(16, 185, 129, 0.6)"/>
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)"/>
          </radialGradient>

          <radialGradient id="ledGlowBlue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.95)"/>
            <stop offset="40%" stopColor="rgba(14, 165, 233, 0.6)"/>
            <stop offset="100%" stopColor="rgba(14, 165, 233, 0)"/>
          </radialGradient>

          <linearGradient id="resistorBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fefae0"/>
            <stop offset="40%" stopColor="#e9d8a6"/>
            <stop offset="80%" stopColor="#dda15e"/>
            <stop offset="100%" stopColor="#bc6c25"/>
          </linearGradient>

          <linearGradient id="ventunoPcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d5ce0"/>
            <stop offset="45%" stopColor="#1638a8"/>
            <stop offset="100%" stopColor="#0a1a5c"/>
          </linearGradient>

          <linearGradient id="headerShellBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a4352"/>
            <stop offset="12%" stopColor="#1a2028"/>
            <stop offset="100%" stopColor="#05070a"/>
          </linearGradient>

          <radialGradient id="pinMetal" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#d6dee8"/>
            <stop offset="100%" stopColor="#8a94a3"/>
          </radialGradient>

          <filter id="boardLiftShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.55"/>
          </filter>
        </defs>

        {/* LAYER 1: ARDUINO BOARDS */}
        {boardType === 'uno_q' ? (
          <g
            id="unoBoard"
            className="board-node cursor-grab active:cursor-grabbing"
            transform={`translate(${boardPos.x}, ${boardPos.y})`}
            onPointerDown={(e) => handlePointerDown(e, 'board')}
          >
            {/* PCB Outline */}
            <path
              filter="url(#boardLiftShadow)"
              d="M 16 0 L 460 0 Q 474 0 474 14 L 474 62 L 488 76 L 488 296 Q 488 310 474 310 L 16 310 Q 0 310 0 296 L 0 14 Q 0 0 16 0 Z"
              fill="#09475e"
              stroke="#04222d"
              strokeWidth="2.5"
            />

            {/* Mounting Holes with Gold Pad Ring */}
            <circle cx="24" cy="24" r="7.5" fill="#d4af37" stroke="#85641e" strokeWidth="1.8"/>
            <circle cx="24" cy="24" r="4.8" fill="#05080c"/>
            <circle cx="458" cy="24" r="7.5" fill="#d4af37" stroke="#85641e" strokeWidth="1.8"/>
            <circle cx="458" cy="24" r="4.8" fill="#05080c"/>
            <circle cx="458" cy="286" r="7.5" fill="#d4af37" stroke="#85641e" strokeWidth="1.8"/>
            <circle cx="458" cy="286" r="4.8" fill="#05080c"/>
            <circle cx="270" cy="290" r="6.5" fill="#d4af37" stroke="#85641e" strokeWidth="1.8"/>
            <circle cx="270" cy="290" r="4" fill="#05080c"/>

            {/* Wi-Fi Antenna Trace */}
            <path
              d="M 12 230 L 46 230 L 46 246 L 20 246 L 20 262 L 52 262 L 52 278 L 12 278 L 12 298 L 65 298"
              stroke="#00A2B0"
              strokeWidth="2.8"
              fill="none"
            />
            <text x="14" y="220" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="6.8" fontWeight="700">Wi-Fi® / BT Module</text>

            {/* RF Shield */}
            <g transform="translate(134, 202)">
              <rect x="0" y="0" width="86" height="78" rx="4" fill="url(#shieldGrad)" stroke="#64748b" strokeWidth="1.6"/>
              <circle cx="14" cy="15" r="5.5" fill="#eab308" stroke="#854d0e" strokeWidth="1"/>
              <circle cx="14" cy="15" r="2.2" fill="#0f172a"/>
              <rect x="8" y="30" width="70" height="40" rx="2" fill="#94a3b8" opacity="0.35"/>
              <text x="43" y="53" fill="#334155" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="800" textAnchor="middle">RF SHIELD</text>
            </g>

            {/* QUALCOMM® DRAGONWING™ QRB2210 PROCESSOR */}
            <g transform="translate(170, 80)">
              <rect x="0" y="0" width="88" height="84" rx="4" fill="url(#qualcommGrad)" stroke="#334155" strokeWidth="1.8"/>
              <circle cx="9" cy="9" r="2.8" fill="#475569"/>
              <text x="44" y="26" fill="#d4af37" fontFamily="Space Grotesk" fontSize="9" fontWeight="800" textAnchor="middle">Qualcomm®</text>
              <text x="44" y="40" fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="7.5" fontWeight="700" textAnchor="middle">QRB2210</text>
              <text x="44" y="53" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="600" textAnchor="middle">DRAGONWING™</text>
            </g>

            {/* QUALCOMM® PM4125 POWER MANAGEMENT */}
            <g transform="translate(266, 92)">
              <rect x="0" y="0" width="46" height="46" rx="4" fill="url(#qualcommGrad)" stroke="#334155" strokeWidth="1.6"/>
              <circle cx="7" cy="7" r="2.2" fill="#475569"/>
              <text x="23" y="20" fill="#d4af37" fontFamily="Space Grotesk" fontSize="6.5" fontWeight="800" textAnchor="middle">Qualcomm</text>
              <text x="23" y="31" fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="700" textAnchor="middle">PM4125</text>
            </g>

            {/* STM32U585 MCU */}
            <g transform="translate(280, 36)">
              <rect x="0" y="0" width="58" height="58" rx="3" fill="#0f172a" stroke="#00A2B0" strokeWidth="1.5"/>
              <circle cx="8" cy="8" r="2.2" fill="#0284c7"/>
              <text x="29" y="24" fill="#ffffff" fontFamily="Space Grotesk" fontSize="8" fontWeight="800" textAnchor="middle">STM32</text>
              <text x="29" y="36" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="7" fontWeight="700" textAnchor="middle">U585</text>
              <text x="29" y="47" fill="#64748b" fontFamily="JetBrains Mono" fontSize="5" fontWeight="600" textAnchor="middle">Cortex-M33</text>
            </g>

            {/* 8x13 (104 BLUE LED) MATRIX */}
            <g transform="translate(262, 118)">
              <rect x="-6" y="-6" width="134" height="88" rx="6" fill="#05212c" stroke="#007785" strokeWidth="1.2"/>
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
                    rx="0.8"
                    fill={isLit ? '#38bdf8' : '#15222e'}
                    stroke={isLit ? '#7dd3fc' : '#25394d'}
                    strokeWidth="0.6"
                    style={{
                      filter: isLit ? 'drop-shadow(0 0 5px #0284c7) drop-shadow(0 0 10px rgba(56,189,248,0.8))' : 'none'
                    }}
                  />
                );
              })}
            </g>

            {/* USB-C Port */}
            <g transform="translate(-18, 76)">
              <rect x="0" y="0" width="34" height="56" rx="6" fill="url(#usbcGrad)" stroke="#334155" strokeWidth="2"/>
              <rect x="9" y="9" width="18" height="38" rx="4" fill="#0f172a"/>
              <line x1="18" y1="14" x2="18" y2="42" stroke="#d4af37" strokeWidth="2.2"/>
              <text x="4" y="68" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="6" fontWeight="700">USB-C</text>
            </g>

            {/* Status LEDs (L and ON) */}
            <circle
              cx="74"
              cy="125"
              r="3.8"
              fill={isSimulating && isD13Active ? '#ef4444' : '#3a1414'}
              stroke="#552222"
              strokeWidth="1"
              style={{
                filter: isSimulating && isD13Active ? 'drop-shadow(0 0 8px #ef4444)' : 'none'
              }}
            />
            <text x="63" y="128" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="6.8" fontWeight="700">L</text>

            <circle cx="74" cy="142" r="3.8" fill={isSimulating ? '#10b981' : '#065f46'} stroke="#065f46" strokeWidth="1" style={{ filter: isSimulating ? 'drop-shadow(0 0 6px #10b981)' : 'none' }}/>
            <text x="50" y="145" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="6.8" fontWeight="700">ON</text>

            {/* TOP DIGITAL PIN HEADER (18 PINS) */}
            <g transform="translate(68, 6)">
              <rect x="0" y="0" width="288" height="22" fill="url(#headerShellBevel)" stroke="#000" rx="3"/>
              {[
                { pin: 'SCL', label: 'SCL', color: '#cbd5e1', x: 12, name: 'I2C SCL' },
                { pin: 'SDA', label: 'SDA', color: '#cbd5e1', x: 28, name: 'I2C SDA' },
                { pin: 'AREF', label: 'REF', color: '#cbd5e1', x: 44, name: 'Analog Reference' },
                { pin: 'GND_D1', label: 'GND', color: '#ef4444', x: 60, name: 'Digital Ground' },
                { pin: 'D13', label: '13', color: '#38bdf8', x: 76, name: 'Digital Pin 13 (Built-in LED)' },
                { pin: 'D12', label: '12', color: '#cbd5e1', x: 92, name: 'Digital Pin 12' },
                { pin: 'D11', label: '~11', color: '#38bdf8', x: 108, name: 'Digital PWM Pin ~11' },
                { pin: 'D10', label: '~10', color: '#38bdf8', x: 124, name: 'Digital PWM Pin ~10' },
                { pin: 'D9', label: '~9', color: '#38bdf8', x: 140, name: 'Digital PWM Pin ~9' },
                { pin: 'D8', label: '8', color: '#cbd5e1', x: 156, name: 'Digital Pin 8' },
                { pin: 'D7', label: '7', color: '#cbd5e1', x: 172, name: 'Digital Pin 7' },
                { pin: 'D6', label: '~6', color: '#38bdf8', x: 188, name: 'Digital PWM Pin ~6' },
                { pin: 'D5', label: '~5', color: '#38bdf8', x: 204, name: 'Digital PWM Pin ~5' },
                { pin: 'D4', label: '4', color: '#cbd5e1', x: 220, name: 'Digital Pin 4' },
                { pin: 'D3', label: '~3', color: '#38bdf8', x: 236, name: 'Digital PWM Pin ~3' },
                { pin: 'D2', label: '2', color: '#cbd5e1', x: 252, name: 'Digital Pin 2' },
                { pin: 'TX', label: 'TX', color: '#f59e0b', x: 268, name: 'Serial TX (Pin 1)' },
                { pin: 'RX', label: 'RX', color: '#f59e0b', x: 280, name: 'Serial RX (Pin 0)' },
              ].map((p) => {
                const isSelected = activePin?.compId === 'board' && activePin?.pinId === p.pin;
                return (
                  <g
                    key={p.pin}
                    className="terminal-pin-group cursor-crosshair group"
                    data-pin={p.pin}
                    data-name={p.name}
                    transform={`translate(${p.x}, 11)`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => handlePinClick(e, 'board', p.pin, p.name)}
                    onMouseEnter={(e) => setHoverTooltip({ text: p.name, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoverTooltip(null)}
                  >
                    <circle className="terminal-hitbox" r="9" fill="transparent"/>
                    <circle
                      className="terminal-pin transition-all"
                      r={isSelected ? '5.5' : '3.8'}
                      fill={isSelected ? '#38bdf8' : 'url(#pinMetal)'}
                      stroke={isSelected ? '#ffffff' : '#09111e'}
                      strokeWidth="1.5"
                    />
                    <text y="22" fill={p.color} fontFamily="JetBrains Mono" fontSize="6" fontWeight="bold" textAnchor="middle">
                      {p.label}
                    </text>
                  </g>
                );
              })}
              <text x="144" y="-4" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="7" fontWeight="800" textAnchor="middle">
                DIGITAL (PWM~)
              </text>
            </g>

            {/* BOTTOM POWER & ANALOG PIN HEADER */}
            <g transform="translate(270, 282)">
              <rect x="0" y="0" width="200" height="22" fill="url(#headerShellBevel)" stroke="#000" rx="3"/>
              {[
                { pin: 'IOREF', label: 'IOREF', color: '#cbd5e1', x: 12, name: 'IOREF Reference' },
                { pin: 'RESET_PIN', label: 'RST', color: '#cbd5e1', x: 26, name: 'Reset Pin' },
                { pin: '3V3', label: '3V3', color: '#f59e0b', x: 40, name: '3.3V Regulated Output' },
                { pin: '5V', label: '5V', color: '#ef4444', x: 54, name: '5V Regulated Output' },
                { pin: 'GND_P1', label: 'GND', color: '#ef4444', x: 68, name: 'Power Ground (GND)' },
                { pin: 'GND_P2', label: 'GND', color: '#ef4444', x: 82, name: 'Power Ground (GND)' },
                { pin: 'VIN', label: 'VIN', color: '#f59e0b', x: 96, name: 'VIN Power Input' },
                { pin: 'A0', label: 'A0', color: '#38bdf8', x: 118, name: 'Analog In A0' },
                { pin: 'A1', label: 'A1', color: '#38bdf8', x: 132, name: 'Analog In A1' },
                { pin: 'A2', label: 'A2', color: '#38bdf8', x: 146, name: 'Analog In A2' },
                { pin: 'A3', label: 'A3', color: '#38bdf8', x: 160, name: 'Analog In A3' },
                { pin: 'A4', label: 'A4', color: '#38bdf8', x: 174, name: 'Analog In A4 (SDA)' },
                { pin: 'A5', label: 'A5', color: '#38bdf8', x: 188, name: 'Analog In A5 (SCL)' },
              ].map((p) => {
                const isSelected = activePin?.compId === 'board' && activePin?.pinId === p.pin;
                return (
                  <g
                    key={p.pin}
                    className="terminal-pin-group cursor-crosshair group"
                    data-pin={p.pin}
                    data-name={p.name}
                    transform={`translate(${p.x}, 11)`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => handlePinClick(e, 'board', p.pin, p.name)}
                    onMouseEnter={(e) => setHoverTooltip({ text: p.name, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoverTooltip(null)}
                  >
                    <circle className="terminal-hitbox" r="9" fill="transparent"/>
                    <circle
                      className="terminal-pin transition-all"
                      r={isSelected ? '5.5' : '3.8'}
                      fill={isSelected ? '#38bdf8' : 'url(#pinMetal)'}
                      stroke={isSelected ? '#ffffff' : '#09111e'}
                      strokeWidth="1.5"
                    />
                    <text y="-7" fill={p.color} fontFamily="JetBrains Mono" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {p.label}
                    </text>
                  </g>
                );
              })}
              <text x="54" y="32" fill="#ef4444" fontFamily="JetBrains Mono" fontSize="7" fontWeight="800" textAnchor="middle">POWER</text>
              <text x="153" y="32" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="7" fontWeight="800" textAnchor="middle">ANALOG IN</text>
            </g>
          </g>
        ) : (
          /* REAL DETAILED SVG VIEW OF ARDUINO VENTUNO Q */
          <VentunoBoardSvg
            boardPos={boardPos}
            onPointerDown={(e) => handlePointerDown(e, 'board')}
            activePin={activePin}
            onPinClick={handlePinClick}
            setHoverTooltip={setHoverTooltip}
            isSimulating={isSimulating}
            pinStates={pinStates}
            ledMatrixState={ledMatrixState}
            showCalloutAnnotations={showPinoutCallouts}
          />
        )}

        {/* LAYER 2: PLACED COMPONENTS */}
        <g id="layerComponents">
          {components.map((comp) => {
            const ledEval = circuitState.energizedLeds[comp.id];
            const isLedPowered = Boolean(ledEval?.energized);
            const isDirectShort = Boolean(ledEval?.directShortWarning);
            const isBuzzerSounding = Boolean(circuitState.activeBuzzers[comp.id]?.active);
            const isResistorEnergized = Boolean(circuitState.energizedResistors[comp.id]);
            const isSensorPowered = Boolean(circuitState.activeSensors[comp.id]?.powered);
            const isServoPowered = Boolean(circuitState.activeServos[comp.id]?.powered);

            return (
              <g
                key={comp.id}
                id={comp.id}
                className="circuit-node cursor-grab active:cursor-grabbing group"
                transform={`translate(${comp.x}, ${comp.y})`}
                onPointerDown={(e) => handlePointerDown(e, 'component', comp.id)}
              >
                {/* 5mm LED */}
                {comp.type === 'led' && (
                  <>
                    {/* Photon Diffusion Glow */}
                    <circle
                      cx="40"
                      cy="30"
                      r={isDirectShort ? '38' : '32'}
                      fill={comp.properties.color === 'green' ? 'url(#ledGlowGreen)' : comp.properties.color === 'blue' ? 'url(#ledGlowBlue)' : 'url(#ledGlowRed)'}
                      opacity={isLedPowered ? 1 : 0}
                      className="transition-opacity duration-150 pointer-events-none"
                    />
                    <path d="M 28 42 L 28 72" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M 52 42 L 52 64 L 56 68 L 56 72" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
                    <ellipse cx="40" cy="42" rx="19" ry="5.5" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.2"/>
                    <path
                      d="M 22 42 L 22 22 A 18 18 0 0 1 58 22 L 58 42 Z"
                      fill={comp.properties.color === 'green' ? 'url(#ledGreenDome)' : comp.properties.color === 'blue' ? 'url(#ledBlueDome)' : 'url(#ledRedDome)'}
                      stroke={isDirectShort ? '#eab308' : '#7f1d1d'}
                      strokeWidth="1.2"
                    />
                    <ellipse cx="32" cy="18" rx="4" ry="9" fill="rgba(255,255,255,0.45)" transform="rotate(-22 32 18)"/>
                    <text x="40" y="86" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="7" fontWeight="700" textAnchor="middle">
                      5mm {comp.properties.color?.toUpperCase() || 'LED'}
                    </text>

                    {/* Direct short overcurrent warning badge */}
                    {isDirectShort && (
                      <g transform="translate(14, 90)">
                        <rect x="0" y="0" width="52" height="12" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8"/>
                        <text x="26" y="8.5" fill="#854d0e" fontFamily="JetBrains Mono" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                          ⚠️ NO RESISTOR
                        </text>
                      </g>
                    )}

                    {/* Anode (+) and Cathode (-) Pins */}
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="anode"
                      transform="translate(28, 72)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'anode', 'LED Anode (+)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'LED Anode (+)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="cathode"
                      transform="translate(56, 72)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'cathode', 'LED Cathode (-)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'LED Cathode (-)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                  </>
                )}

                {/* RESISTOR */}
                {comp.type === 'resistor' && (
                  <>
                    <line
                      x1="0"
                      y1="30"
                      x2="80"
                      y2="30"
                      stroke={isResistorEnergized ? '#f59e0b' : '#cbd5e1'}
                      strokeWidth={isResistorEnergized ? '3' : '2.5'}
                      strokeLinecap="round"
                    />
                    <rect
                      x="18"
                      y="18"
                      width="44"
                      height="24"
                      rx="8"
                      fill="url(#resistorBody)"
                      stroke={isResistorEnergized ? '#f59e0b' : '#9a7b56'}
                      strokeWidth={isResistorEnergized ? '1.8' : '1.2'}
                    />
                    <rect x="26" y="18" width="4.5" height="24" fill="#dc2626"/>
                    <rect x="34" y="18" width="4.5" height="24" fill="#dc2626"/>
                    <rect x="42" y="18" width="4.5" height="24" fill="#78350f"/>
                    <rect x="52" y="18" width="4.5" height="24" fill="#d4af37"/>
                    <text x="40" y="54" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="7.5" fontWeight="700" textAnchor="middle">
                      {comp.properties.label || '220Ω'}
                    </text>
                    {isResistorEnergized && (
                      <text x="40" y="64" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="6" fontWeight="bold" textAnchor="middle">
                        ⚡ CURRENT ACTIVE
                      </text>
                    )}
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="p1"
                      transform="translate(2, 30)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'p1', 'Resistor Lead 1');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Resistor Lead 1', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="p2"
                      transform="translate(78, 30)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'p2', 'Resistor Lead 2');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Resistor Lead 2', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                  </>
                )}

                {/* PIEZO BUZZER */}
                {comp.type === 'buzzer' && (
                  <>
                    {/* Acoustic Sound Wave Rings when active */}
                    {isBuzzerSounding && (
                      <circle cx="40" cy="38" r="38" fill="none" stroke="#38bdf8" strokeWidth="2" className="animate-ping opacity-75"/>
                    )}
                    <circle cx="40" cy="38" r="30" fill="#1e293b" stroke={isBuzzerSounding ? '#38bdf8' : '#475569'} strokeWidth="1.8"/>
                    <circle cx="40" cy="38" r="10" fill="#090d14" stroke="#000" strokeWidth="1.5"/>
                    <text x="40" y="20" fill="#ef4444" fontFamily="Space Grotesk" fontSize="11" fontWeight="800" textAnchor="middle">+</text>
                    <text x="40" y="78" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="7" fontWeight="700" textAnchor="middle">BUZZER</text>
                    {isBuzzerSounding && (
                      <text x="40" y="88" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="6" fontWeight="bold" textAnchor="middle">
                        🔊 587 Hz TONE
                      </text>
                    )}
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="pos"
                      transform="translate(22, 64)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'pos', 'Buzzer (+)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Buzzer Positive (+)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="neg"
                      transform="translate(58, 64)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'neg', 'Buzzer (-)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Buzzer Negative (-)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                  </>
                )}

                {/* IR SENSOR */}
                {comp.type === 'sensor' && (
                  <>
                    <rect x="4" y="4" width="72" height="84" rx="5" fill="#0284c7" stroke="#0369a1" strokeWidth="1.8"/>
                    <circle cx="28" cy="8" r="7.5" fill="#7dd3fc" stroke="#38bdf8" strokeWidth="1.2"/>
                    <circle cx="52" cy="8" r="7.5" fill={isSensorPowered ? '#4ade80' : '#1e1b4b'} stroke="#312e81" strokeWidth="1.2"/>
                    <rect x="22" y="32" width="36" height="22" rx="2" fill="#0f172a" stroke="#334155"/>
                    <text x="40" y="46" fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="6" fontWeight="700" textAnchor="middle">LM393</text>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="vcc"
                      transform="translate(18, 86)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'vcc', 'Sensor VCC (5V)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Sensor VCC (5V)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="gnd"
                      transform="translate(40, 86)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'gnd', 'Sensor GND');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Sensor GND', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="out"
                      transform="translate(62, 86)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'out', 'Sensor OUT (Pin 2)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Sensor OUT (Pin 2)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                  </>
                )}

                {/* PUSHBUTTON */}
                {comp.type === 'button' && (
                  <>
                    <rect x="10" y="10" width="60" height="60" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.6"/>
                    <circle
                      cx="40"
                      cy="40"
                      r={comp.properties.pressed ? '16' : '19'}
                      fill={comp.properties.pressed ? '#0284c7' : '#0f172a'}
                      stroke="#38bdf8"
                      strokeWidth="2"
                      className="cursor-pointer transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateComponentProp(comp.id, 'pressed', !comp.properties.pressed);
                      }}
                    />
                    <text x="40" y="78" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="700" textAnchor="middle">BUTTON</text>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="p1"
                      transform="translate(10, 40)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'p1', 'Button Terminal 1');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Button Terminal 1', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="p2"
                      transform="translate(70, 40)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'p2', 'Button Terminal 2');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Button Terminal 2', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                  </>
                )}

                {/* POTENTIOMETER */}
                {comp.type === 'potentiometer' && (
                  <>
                    <circle cx="40" cy="40" r="32" fill="#0f172a" stroke="#475569" strokeWidth="1.6"/>
                    <circle cx="40" cy="40" r="22" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2"/>
                    <line
                      x1="40"
                      y1="40"
                      x2={40 + 16 * Math.cos(((comp.properties.value || 512) / 1023) * Math.PI * 1.5 - Math.PI * 0.75)}
                      y2={40 + 16 * Math.sin(((comp.properties.value || 512) / 1023) * Math.PI * 1.5 - Math.PI * 0.75)}
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <text x="40" y="82" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="700" textAnchor="middle">10k POT</text>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="vcc"
                      transform="translate(18, 70)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'vcc', 'Pot 5V');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Pot 5V', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="wiper"
                      transform="translate(40, 70)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'wiper', 'Pot Wiper (A0)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Pot Wiper (A0)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="gnd"
                      transform="translate(62, 70)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'gnd', 'Pot GND');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Pot GND', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                  </>
                )}

                {/* MICRO SERVO MOTOR */}
                {comp.type === 'servo' && (
                  <>
                    <rect x="10" y="10" width="60" height="50" rx="4" fill="#1e3a8a" stroke={isServoPowered ? '#38bdf8' : '#1d4ed8'} strokeWidth="1.4"/>
                    <circle cx="50" cy="35" r="14" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2"/>
                    {/* Rotating Servo Arm */}
                    <g transform={`translate(50, 35) rotate(${comp.properties.angle || 90})`}>
                      <path d="M 0 -6 L 30 -3 L 30 3 L 0 6 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                      <circle cx="20" cy="0" r="2.5" fill="#475569"/>
                    </g>
                    <text x="40" y="72" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="700" textAnchor="middle">SG90 SERVO</text>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="pwm"
                      transform="translate(20, 58)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'pwm', 'Servo PWM (~9)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Servo PWM (~9)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="vcc"
                      transform="translate(40, 58)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'vcc', 'Servo 5V');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Servo 5V', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="gnd"
                      transform="translate(60, 58)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'gnd', 'Servo GND');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Servo GND', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                  </>
                )}

                {/* ULTRASONIC SENSOR HC-SR04 */}
                {comp.type === 'ultrasonic' && (
                  <>
                    <rect x="0" y="10" width="84" height="42" rx="4" fill="#00878F" stroke="#004d52" strokeWidth="1.5"/>
                    <circle cx="22" cy="31" r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5"/>
                    <circle cx="22" cy="31" r="6" fill="#475569"/>
                    <circle cx="62" cy="31" r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5"/>
                    <circle cx="62" cy="31" r="6" fill="#475569"/>
                    <text x="42" y="60" fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="6.5" fontWeight="700" textAnchor="middle">HC-SR04</text>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="vcc"
                      transform="translate(15, 52)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'vcc', 'Ultrasonic 5V');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Ultrasonic 5V', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="trig"
                      transform="translate(33, 52)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'trig', 'Ultrasonic Trig (D12)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Ultrasonic Trig (D12)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="echo"
                      transform="translate(51, 52)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'echo', 'Ultrasonic Echo (D10)');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Ultrasonic Echo (D10)', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                    <g
                      className="terminal-pin-group cursor-crosshair group"
                      data-pin="gnd"
                      transform="translate(69, 52)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(e, comp.id, 'gnd', 'Ultrasonic GND');
                      }}
                      onMouseEnter={(e) => setHoverTooltip({ text: 'Ultrasonic GND', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <circle className="terminal-hitbox" r="9" fill="transparent"/>
                      <circle className="terminal-pin transition-all" r="4" fill="url(#pinMetal)" stroke="#09111e" strokeWidth="1.5"/>
                    </g>
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* LAYER 3: WIRES (Rendered on top for clarity and easy disconnection) */}
        <g id="layerWires">
          {wires.map((wire) => {
            const start = getPinCoordinates(wire.fromCompId, wire.fromPinId);
            const end = getPinCoordinates(wire.toCompId, wire.toPinId);
            const dx = Math.abs(end.x - start.x) * 0.5;
            const dy = (end.y - start.y) * 0.5;
            const d = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y + dy}, ${end.x - dx} ${end.y - dy}, ${end.x} ${end.y}`;

            return (
              <g key={wire.id} className="cursor-pointer group">
                {/* Glow & wire path */}
                <path
                  d={d}
                  fill="none"
                  stroke={wire.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="transition-all hover:stroke-[6.5px] hover:filter-[drop-shadow(0_0_8px_currentColor)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWire(wire.id);
                  }}
                />
                {/* Terminal Connection Solder Beads */}
                <circle cx={start.x} cy={start.y} r="4.5" fill={wire.color} stroke="#ffffff" strokeWidth="1.2" className="pointer-events-none" />
                <circle cx={end.x} cy={end.y} r="4.5" fill={wire.color} stroke="#ffffff" strokeWidth="1.2" className="pointer-events-none" />
                <title>Click to disconnect wire</title>
              </g>
            );
          })}

          {/* GHOST WIRE (when actively routing) */}
          {activePin && (
            (() => {
              const start = getPinCoordinates(activePin.compId, activePin.pinId);
              const dx = Math.abs(mousePos.x - start.x) * 0.5;
              const dy = (mousePos.y - start.y) * 0.5;
              const d = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y + dy}, ${mousePos.x - dx} ${mousePos.y - dy}, ${mousePos.x} ${mousePos.y}`;
              return (
                <g className="pointer-events-none">
                  <path
                    d={d}
                    fill="none"
                    stroke={activeWireColor}
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                  <circle cx={start.x} cy={start.y} r="4.5" fill={activeWireColor} stroke="#ffffff" strokeWidth="1.2" />
                  <circle cx={mousePos.x} cy={mousePos.y} r="4" fill={activeWireColor} stroke="#ffffff" strokeWidth="1" />
                </g>
              );
            })()
          )}
        </g>
      </svg>
    </div>
  );
};
