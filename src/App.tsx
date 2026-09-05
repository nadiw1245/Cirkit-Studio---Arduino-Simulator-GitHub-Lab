import React, { useState, useEffect, useRef } from 'react';
import { 
  BoardType, 
  ComponentType, 
  PlacedComponent, 
  CircuitWire, 
  CodeFile, 
  SerialLog, 
  WaveformPoint, 
  DiagnosticIssue, 
  ProjectBlueprint 
} from './types';
import { INITIAL_FILES, PROJECT_BLUEPRINTS } from './data/curriculum';
import { playPiezoTone, playUiClick, playWireSnap } from './utils/audio';
import { Navbar } from './components/Navbar';
import { ComponentDrawer } from './components/ComponentDrawer';
import { CanvasStage } from './components/CanvasStage';
import { SchematicView } from './components/SchematicView';
import { RightSidebar } from './components/RightSidebar';
import { GitHubShowcaseModal } from './components/GitHubShowcaseModal';

export default function App() {
  // Navigation & View Mode
  const [boardType, setBoardType] = useState<BoardType>('uno_q');
  const [viewMode, setViewMode] = useState<'circuit' | 'schematic'>('circuit');
  const [isSimulating, setIsSimulating] = useState(false);

  // Components on Canvas
  const [components, setComponents] = useState<PlacedComponent[]>([]);
  const [wires, setWires] = useState<CircuitWire[]>([]);
  const [activeWireColor, setActiveWireColor] = useState('#ef4444');
  const [armedComponentType, setArmedComponentType] = useState<{
    type: ComponentType;
    props?: Record<string, any>;
  } | null>(null);

  // Multi-File Code Editor
  const [files, setFiles] = useState<CodeFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('sketch');

  // Serial Console & Logic Waveform
  const [serialLogs, setSerialLogs] = useState<SerialLog[]>([]);
  const [waveformHistory, setWaveformHistory] = useState<WaveformPoint[]>([]);

  // Simulation Runtime Pin States
  const [pinStates, setPinStates] = useState<Record<string, number | boolean>>({
    '5V': 1,
    '3V3': 1,
    'GND_D1': 0,
    'GND_P1': 0,
    'GND_P2': 0,
    'D13': 0,
    'D11': 0,
    'D2': 1,
    'A0': 512
  });

  // 104 LED Matrix State (8x13)
  const [ledMatrixState, setLedMatrixState] = useState<boolean[]>(
    new Array(104).fill(false)
  );

  // GitHub Star Booster Hub
  const [gitHubStars, setGitHubStars] = useState(148);
  const [hasStarred, setHasStarred] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // AI Copilot Chat Messages
  const [aiMessages, setAiMessages] = useState<
    Array<{ sender: 'user' | 'bot'; text: string; action?: () => void; actionLabel?: string }>
  >([]);

  // Pre-load default LED Blink starter circuit on first render
  useEffect(() => {
    applyBlueprint(PROJECT_BLUEPRINTS[0], false);
  }, []);

  // Simulation Engine Loop
  useEffect(() => {
    if (!isSimulating) {
      setPinStates(prev => ({ ...prev, D13: 0, D11: 0 }));
      setLedMatrixState(new Array(104).fill(false));
      return;
    }

    appendSerial('Booting Qualcomm Dragonwing QRB2210 SoC...', 'sys');
    appendSerial('Zephyr Real-Time Kernel active on STM32U585 @ 160MHz', 'sys');
    appendSerial('User sketch loaded: setup() complete. Starting loop().', 'info');

    let toggleState = false;
    let frame = 0;

    const interval = setInterval(() => {
      toggleState = !toggleState;
      frame++;

      // Update Pin 13 (Digital Output for Blink)
      const d13Val = toggleState ? 1 : 0;
      
      // Update Pin 11 (PWM audio if buzzer is connected)
      const pwm11Val = toggleState ? 1 : 0;

      // Update Pin 2 (IR obstacle or digital read)
      const sensorComp = components.find(c => c.type === 'sensor');
      const d2Val = sensorComp ? (toggleState ? 1 : 0) : 1;

      setPinStates(prev => ({
        ...prev,
        D13: d13Val,
        D11: pwm11Val,
        D2: d2Val
      }));

      // Check if buzzer is properly wired to Pin 11 and GND
      const buzzerConnectedToD11 = wires.some(
        w => (w.fromPinId === 'D11' && w.toPinId === 'pos') || (w.toPinId === 'D11' && w.fromPinId === 'pos')
      );
      const buzzerConnectedToGnd = wires.some(
        w => (w.fromPinId.includes('GND') && w.toPinId === 'neg') || (w.toPinId.includes('GND') && w.fromPinId === 'neg')
      );

      if (buzzerConnectedToD11 && buzzerConnectedToGnd && toggleState) {
        playPiezoTone(587, 80);
      }

      // 8x13 LED Matrix Pattern Generation
      setLedMatrixState(() => {
        const next = new Array(104).fill(false);
        for (let i = 0; i < 104; i++) {
          const row = Math.floor(i / 13);
          const col = i % 13;
          // Animated wave pattern
          const active = ((col + frame) % 4 === 0) || ((row + frame) % 3 === 0);
          next[i] = toggleState && active;
        }
        return next;
      });

      // Append serial output
      appendSerial(
        toggleState 
          ? 'digitalWrite(13, HIGH); // Output 5.0V forward bias' 
          : 'digitalWrite(13, LOW);  // Output 0.0V (grounded)',
        'data'
      );

      // Append logic analyzer waveform point
      setWaveformHistory(prev => {
        const newPoint: WaveformPoint = {
          time: Date.now(),
          d13: d13Val,
          pwm11: pwm11Val,
          d2: d2Val,
          a0: 512
        };
        const updated = [...prev, newPoint];
        return updated.slice(-35); // keep last 35 samples
      });

    }, 450);

    return () => clearInterval(interval);
  }, [isSimulating, components, wires]);

  // Serial Logger Helper
  const appendSerial = (text: string, level: SerialLog['level'] = 'data') => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const newLog: SerialLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: `[${time}]`,
      text,
      level
    };
    setSerialLogs(prev => [...prev.slice(-60), newLog]);
  };

  // Component Drag & Drop / Arming
  const handleSelectComponentToPlace = (type: ComponentType, props?: Record<string, any>) => {
    if (armedComponentType?.type === type) {
      setArmedComponentType(null);
    } else {
      setArmedComponentType({ type, props });
      playUiClick();
    }
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (!armedComponentType) return;

    const newComp: PlacedComponent = {
      id: `comp_${armedComponentType.type}_${Date.now()}`,
      type: armedComponentType.type,
      x: Math.max(20, x - 40),
      y: Math.max(20, y - 40),
      properties: armedComponentType.props || {}
    };

    setComponents(prev => [...prev, newComp]);
    setArmedComponentType(null);
    playWireSnap();
  };

  const handleUpdateComponentPosition = (id: string, x: number, y: number) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, x, y } : c));
  };

  const handleUpdateComponentProp = (id: string, key: string, value: any) => {
    setComponents(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, properties: { ...c.properties, [key]: value } };
      }
      return c;
    }));
  };

  const handleDeleteComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.fromCompId !== id && w.toCompId !== id));
  };

  const handleAddWire = (wire: CircuitWire) => {
    setWires(prev => [...prev, wire]);
  };

  const handleDeleteWire = (id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
    playUiClick(300);
  };

  const handleClearCanvas = () => {
    setComponents([]);
    setWires([]);
    setSerialLogs([]);
    appendSerial('Canvas cleared: all components and nets removed.', 'info');
    playUiClick(250);
  };

  // Apply Blueprint circuit preset
  const applyBlueprint = (bp: ProjectBlueprint, notify = true) => {
    // Clear old items
    setComponents([]);
    setWires([]);

    // Create placed components
    const newComps: PlacedComponent[] = [];
    const newWires: CircuitWire[] = [];

    bp.components.forEach((cSpec, idx) => {
      const compId = `bp_comp_${cSpec.type}_${idx}`;
      newComps.push({
        id: compId,
        type: cSpec.type,
        x: cSpec.x,
        y: cSpec.y,
        properties: cSpec.properties || {}
      });

      // Auto route wires
      Object.entries(cSpec.pins).forEach(([pinKey, route]) => {
        newWires.push({
          id: `wire_${Date.now()}_${Math.random()}`,
          fromCompId: 'board',
          fromPinId: route.boardPin,
          toCompId: compId,
          toPinId: pinKey,
          color: route.wireColor
        });
      });
    });

    setComponents(newComps);
    setWires(newWires);

    // Update main sketch file
    setFiles(prev => prev.map(f => f.id === 'sketch' ? { ...f, content: bp.sketch } : f));

    if (notify) {
      appendSerial(`Blueprint Loaded: ${bp.title}`, 'info');
      setAiMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `⚡ Successfully auto-built the **${bp.title}** project! The schematic netlist and C++ driver code have been loaded. Click **Start Sim** to execute in real-time.`
        }
      ]);
    }
  };

  // Electrical Rules Check (ERC) Diagnostics
  const computeDiagnostics = (): DiagnosticIssue[] => {
    const issues: DiagnosticIssue[] = [];

    // Check 1: LED without current limiter resistor
    const ledComps = components.filter(c => c.type === 'led');
    ledComps.forEach((led) => {
      const isDirectlyTo5V = wires.some(
        w => ((w.fromCompId === led.id && w.toPinId === '5V') || (w.toCompId === led.id && w.fromPinId === '5V'))
      );
      if (isDirectlyTo5V) {
        issues.push({
          id: `led_no_resistor_${led.id}`,
          severity: 'error',
          title: 'Excessive Forward Bias Current',
          message: 'LED is wired directly to 5V power without a 220Ω series current-limiting resistor. In physical hardware, this creates thermal runaway and blows the LED diode.',
          solution: 'Wire D13 -> 220Ω Resistor -> LED Anode -> GND.'
        });
      }
    });

    // Check 2: Direct 5V to Ground Short
    const directShort = wires.some(
      w => (w.fromPinId === '5V' && w.toPinId.includes('GND')) || (w.toPinId === '5V' && w.fromPinId.includes('GND'))
    );
    if (directShort) {
      issues.push({
        id: 'direct_short_circuit',
        severity: 'error',
        title: 'CRITICAL SHORT CIRCUIT',
        message: '5V Regulated supply is connected directly to Ground (GND). This will trigger PTC thermal shutdown on the Qualcomm PMIC.',
        solution: 'Immediately disconnect the shorted jumper wire.'
      });
    }

    // Check 3: Missing ground return on active peripherals
    components.forEach((comp) => {
      const compWires = wires.filter(w => w.fromCompId === comp.id || w.toCompId === comp.id);
      if (compWires.length === 1 && (comp.type === 'led' || comp.type === 'buzzer' || comp.type === 'sensor')) {
        issues.push({
          id: `open_circuit_${comp.id}`,
          severity: 'warning',
          title: `Incomplete Circuit (${comp.type.toUpperCase()})`,
          message: `${comp.type} has an active pin connection but lacks a return path to GND. Current cannot circulate.`,
          solution: 'Connect cathode / negative pin to board GND.'
        });
      }
    });

    return issues;
  };

  const diagnostics = computeDiagnostics();

  // Multi-File Code Studio handlers
  const handleAddFile = (name: string, content = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    let lang: CodeFile['language'] = 'cpp';
    if (ext === 'json') lang = 'json';
    if (ext === 'md') lang = 'markdown';
    if (ext === 'h') lang = 'h';

    const newFile: CodeFile = {
      id: `file_${Date.now()}`,
      name,
      language: lang,
      content: content || `// ${name}\n#ifndef ${name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}\n#define ${name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}\n\n// Add student code here\n\n#endif\n`
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    appendSerial(`Created new code file: ${name}`, 'info');
  };

  const handleDeleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) {
      setActiveFileId(files[0]?.id || 'sketch');
    }
  };

  const handleUpdateFileContent = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
  };

  // AI Copilot Question Answering
  const handleAskAi = (question: string) => {
    setAiMessages(prev => [...prev, { sender: 'user', text: question }]);

    const q = question.toLowerCase();
    setTimeout(() => {
      let reply = '';
      let action: (() => void) | undefined = undefined;
      let actionLabel: string | undefined = undefined;

      if (q.includes('220') || q.includes('resistor')) {
        reply = `**Why use a 220Ω Resistor?**\n\nBy Ohm's Law ($V = I \\times R$):\n- An Arduino pin outputs 5.0V.\n- A red LED has a forward voltage drop of approx 2.0V.\n- The remaining 3.0V falls across the resistor: $I = 3.0V / 220\\Omega \\approx 13.6\\text{ mA}$.\nThis is safe for both the STM32 GPIO pin (rated up to 20mA) and prevents the LED from burning out!`;
      } else if (q.includes('pwm') || q.includes('11') || q.includes('pulse')) {
        reply = `**How PWM (Pulse-Width Modulation) Works:**\n\nPin ~11 on the Arduino UNO Q uses STM32 hardware Timer 1 (TIM1) running at ~490Hz.\n- \`analogWrite(11, 128)\` produces a 50% duty cycle (averaging 2.5V).\n- \`analogWrite(11, 255)\` is 100% (5V constant).\nPiezo buzzers vibrate at this switching rate to produce clear audio tones!`;
      } else if (q.includes('servo') || q.includes('motor')) {
        reply = `**Wiring the SG90 Micro Servo:**\n- **Red Wire** ➔ 5V\n- **Brown/Black Wire** ➔ GND\n- **Orange/Yellow Wire** ➔ PWM Pin ~9\n\nWould you like me to auto-wire the Servo project for you?`;
        action = () => applyBlueprint(PROJECT_BLUEPRINTS.find(b => b.id === 'servo_sweep')!);
        actionLabel = 'Auto-Build Servo Circuit';
      } else if (q.includes('qualcomm') || q.includes('qrb2210') || q.includes('stm32')) {
        reply = `**Arduino UNO Q Dual-Core Architecture:**\n- **Qualcomm® Dragonwing™ QRB2210**: 64-bit Quad-Core ARM Cortex-A53 running embedded Linux and Edge AI neural inference.\n- **STM32U585**: Ultra-low-power ARM Cortex-M33 real-time microcontroller managing microsecond GPIOs, PWM, ADC, and interrupts.\nThey communicate via high-speed shared IPC mailbox memory!`;
      } else if (q.includes('sensor') || q.includes('ir')) {
        reply = `**Wiring the IR Proximity Sensor:**\n- **VCC** ➔ 5V\n- **GND** ➔ GND\n- **OUT** ➔ Digital Pin 2 (External Interrupt EXTI2)\nWhen an obstacle reflects IR light, the comparator pulls Pin 2 LOW.`;
        action = () => applyBlueprint(PROJECT_BLUEPRINTS.find(b => b.id === 'ir_sensor')!);
        actionLabel = 'Auto-Build IR Radar Circuit';
      } else {
        reply = `I have analyzed your request for **Arduino UNO Q**. In this simulator you can drag components, click terminal pins with color-coded jumper wires, and write full multi-file C++ code. Try one of the Auto-Build blueprints above to see verified working circuits!`;
      }

      setAiMessages(prev => [...prev, { sender: 'bot', text: reply, action, actionLabel }]);
    }, 400);
  };

  // GitHub Star Action
  const handleStarRepo = () => {
    if (!hasStarred) {
      setHasStarred(true);
      setGitHubStars(prev => prev + 1);
      playUiClick(650);
    } else {
      setHasStarred(false);
      setGitHubStars(prev => prev - 1);
      playUiClick(350);
    }
  };

  // Share Project URL Hash
  const handleShareProject = () => {
    try {
      const stateObj = {
        board: boardType,
        files: files.map(f => ({ name: f.name, content: f.content })),
        compsCount: components.length
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(stateObj))));
      window.location.hash = `project=${encoded.slice(0, 40)}`;
      navigator.clipboard.writeText(window.location.href);
      appendSerial('Project share URL copied to clipboard!', 'info');
    } catch {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#05080c] font-sans text-slate-100 antialiased">
      {/* Top Navigation */}
      <Navbar
        activeBoard={boardType}
        onBoardChange={(b) => {
          setBoardType(b);
          appendSerial(`Switched active board target to ${b === 'uno_q' ? 'Arduino UNO Q' : 'Arduino VENTUNO Q'}`, 'info');
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSimulating={isSimulating}
        onToggleSimulation={() => {
          setIsSimulating(prev => !prev);
          playUiClick(isSimulating ? 350 : 580);
        }}
        onClearCanvas={handleClearCanvas}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onShareProject={handleShareProject}
        gitHubStars={gitHubStars}
        hasStarred={hasStarred}
        onStarRepo={handleStarRepo}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Component Drawer */}
        <ComponentDrawer
          onSelectComponentToPlace={handleSelectComponentToPlace}
          armedComponentType={armedComponentType?.type || null}
          activeWireColor={activeWireColor}
          onSelectWireColor={setActiveWireColor}
        />

        {/* Center Stage: Circuit CAD or Schematic View */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {viewMode === 'circuit' ? (
            <CanvasStage
              boardType={boardType}
              components={components}
              wires={wires}
              onUpdateComponentPosition={handleUpdateComponentPosition}
              onUpdateComponentProp={handleUpdateComponentProp}
              onDeleteComponent={handleDeleteComponent}
              onAddWire={handleAddWire}
              onDeleteWire={handleDeleteWire}
              activeWireColor={activeWireColor}
              isSimulating={isSimulating}
              pinStates={pinStates}
              ledMatrixState={ledMatrixState}
              onCanvasClick={handleCanvasClick}
            />
          ) : (
            <SchematicView
              boardType={boardType}
              components={components}
              wires={wires}
            />
          )}

          {/* Bottom Status Bar */}
          <footer className="h-7 bg-[#090e15] border-t border-[#1e2c40] flex items-center justify-between px-4 text-[11px] font-mono text-slate-400 select-none z-30">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-600'}`} />
              <span>
                {isSimulating 
                  ? 'Simulation Running — Qualcomm QRB2210 + STM32U5 Active @ 160MHz' 
                  : 'Ready — Click any pin to route jumper wires, or ask AI Copilot to build.'}
              </span>
            </div>
            <div className="flex items-center gap-4 hidden sm:flex">
              <span>Nets: {wires.length}</span>
              <span>Parts: {components.length + 1}</span>
              <span className="text-cyan-400 font-bold">{boardType === 'uno_q' ? 'UNO Q' : 'VENTUNO Q'}</span>
            </div>
          </footer>
        </div>

        {/* Right Sidebar: AI Copilot, Code Studio, Serial Monitor, ERC */}
        <RightSidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={setActiveFileId}
          onUpdateFileContent={handleUpdateFileContent}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          serialLogs={serialLogs}
          onClearSerial={() => setSerialLogs([])}
          onSendSerialInput={(cmd) => {
            appendSerial(`> ${cmd}`, 'info');
            if (cmd.toLowerCase().includes('help')) {
              appendSerial('Available Commands: ON, OFF, BLINK, STATUS, SENSORS, SPEED [ms]', 'data');
            } else if (cmd.toLowerCase() === 'on') {
              setPinStates(prev => ({ ...prev, D13: 1 }));
              appendSerial('Pin 13 forced HIGH.', 'data');
            } else if (cmd.toLowerCase() === 'off') {
              setPinStates(prev => ({ ...prev, D13: 0 }));
              appendSerial('Pin 13 forced LOW.', 'data');
            } else {
              appendSerial(`Acknowledged: "${cmd}" received by UART driver.`, 'data');
            }
          }}
          waveformHistory={waveformHistory}
          components={components}
          wires={wires}
          diagnostics={diagnostics}
          blueprints={PROJECT_BLUEPRINTS}
          onApplyBlueprint={(bp) => applyBlueprint(bp, true)}
          isSimulating={isSimulating}
          onAskAi={handleAskAi}
          aiMessages={aiMessages}
        />
      </div>

      {/* GitHub Stargazer Hub Modal */}
      <GitHubShowcaseModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        gitHubStars={gitHubStars}
        hasStarred={hasStarred}
        onStarRepo={handleStarRepo}
        onShareLink={handleShareProject}
      />
    </div>
  );
}
