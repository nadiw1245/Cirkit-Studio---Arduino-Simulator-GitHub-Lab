import React, { useState } from 'react';
import { ComponentType } from '../types';
import { 
  Sparkles, 
  Search, 
  Layers, 
  Volume2, 
  Radio, 
  ToggleLeft, 
  Gauge, 
  RotateCw, 
  Radar, 
  Lightbulb,
  Zap
} from 'lucide-react';

interface ComponentDrawerProps {
  onSelectComponentToPlace: (type: ComponentType, extraProps?: Record<string, any>) => void;
  armedComponentType: ComponentType | null;
  activeWireColor: string;
  onSelectWireColor: (color: string) => void;
}

export const ComponentDrawer: React.FC<ComponentDrawerProps> = ({
  onSelectComponentToPlace,
  armedComponentType,
  activeWireColor,
  onSelectWireColor
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const wireColors = [
    { color: '#ef4444', label: '5V Power (Red)' },
    { color: '#1e293b', label: 'Ground (GND)' },
    { color: '#38bdf8', label: 'Digital Signal (Cyan)' },
    { color: '#10b981', label: 'PWM Output (Green)' },
    { color: '#eab308', label: 'Analog Wave (Yellow)' },
    { color: '#a855f7', label: 'Control / Bus (Purple)' },
    { color: '#f97316', label: 'UART / Clock (Orange)' }
  ];

  const catalog = [
    {
      type: 'led' as ComponentType,
      title: '5mm LED (Red)',
      desc: 'Diffused Epoxy Diode',
      icon: <Lightbulb className="w-5 h-5 text-rose-500" />,
      props: { color: 'red' },
      badge: 'Output'
    },
    {
      type: 'led' as ComponentType,
      title: '5mm LED (Green)',
      desc: 'High-Luminance Indicator',
      icon: <Lightbulb className="w-5 h-5 text-emerald-400" />,
      props: { color: 'green' },
      badge: 'Output'
    },
    {
      type: 'led' as ComponentType,
      title: '5mm LED (Blue)',
      desc: 'Photon Emission Element',
      icon: <Lightbulb className="w-5 h-5 text-cyan-400" />,
      props: { color: 'blue' },
      badge: 'Output'
    },
    {
      type: 'resistor' as ComponentType,
      title: '220Ω Resistor',
      desc: 'LED Current Limiter',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      props: { resistance: 220, label: '220Ω' },
      badge: 'Passive'
    },
    {
      type: 'resistor' as ComponentType,
      title: '10kΩ Resistor',
      desc: 'Pull-up / Pull-down',
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      props: { resistance: 10000, label: '10kΩ' },
      badge: 'Passive'
    },
    {
      type: 'buzzer' as ComponentType,
      title: 'Piezo Buzzer',
      desc: 'Hardware PWM Audio Synthesizer',
      icon: <Volume2 className="w-5 h-5 text-cyan-400" />,
      props: { label: 'Buzzer' },
      badge: 'Audio'
    },
    {
      type: 'sensor' as ComponentType,
      title: 'IR Obstacle Sensor',
      desc: 'LM393 Dual Comparator Radar',
      icon: <Radio className="w-5 h-5 text-blue-400" />,
      props: { distance: 15 },
      badge: 'Input'
    },
    {
      type: 'button' as ComponentType,
      title: 'Pushbutton Switch',
      desc: 'Tactile Momentary Contact',
      icon: <ToggleLeft className="w-5 h-5 text-teal-400" />,
      props: { pressed: false },
      badge: 'Input'
    },
    {
      type: 'potentiometer' as ComponentType,
      title: '10k Potentiometer',
      desc: 'Rotary Analog Voltage Divider',
      icon: <Gauge className="w-5 h-5 text-amber-400" />,
      props: { value: 512 },
      badge: 'Analog'
    },
    {
      type: 'servo' as ComponentType,
      title: 'SG90 Micro Servo',
      desc: '0° - 180° Angle Actuator',
      icon: <RotateCw className="w-5 h-5 text-purple-400" />,
      props: { angle: 90 },
      badge: 'Motor'
    },
    {
      type: 'ultrasonic' as ComponentType,
      title: 'HC-SR04 Ultrasonic',
      desc: 'Acoustic Distance Ranger',
      icon: <Radar className="w-5 h-5 text-emerald-400" />,
      props: { distance: 45 },
      badge: 'Sonar'
    }
  ];

  const filteredCatalog = catalog.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.badge.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-64 bg-[#090e15] border-r border-[#1e2c40] flex flex-col z-20 select-none h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1e2c40] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider text-slate-300">
            Components
          </span>
        </div>
        <span className="text-[10px] font-mono bg-[#15202f] text-slate-400 px-1.5 py-0.5 rounded border border-[#1e2c40]">
          {catalog.length} items
        </span>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-[#1e2c40]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
          <input
            type="text"
            placeholder="Search parts (LED, Servo...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f1622] border border-[#1e2c40] focus:border-cyan-500 rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-200 outline-none placeholder-slate-500"
          />
        </div>
      </div>

      {/* Arm Notice if selected */}
      {armedComponentType && (
        <div className="bg-cyan-950/40 border-b border-cyan-500/30 px-3 py-2 text-[11px] text-cyan-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            Click canvas to place {armedComponentType}
          </span>
        </div>
      )}

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredCatalog.map((item, idx) => {
          const isArmed = armedComponentType === item.type;
          return (
            <div
              key={idx}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: item.type,
                  props: item.props
                }));
              }}
              onClick={() => onSelectComponentToPlace(item.type, item.props)}
              className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                isArmed 
                  ? 'bg-[#15202f] border-cyan-500 shadow-[0_0_12px_rgba(56,189,248,0.25)]' 
                  : 'bg-[#0f1622] border-[#1e2c40] hover:border-[#2d415d] hover:bg-[#15202f] hover:translate-x-0.5'
              }`}
            >
              <div className="w-9 h-9 rounded-md bg-[#05080c] border border-[#1e2c40] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#05080c] text-slate-400 border border-[#1e2c40]">
                    {item.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate">
                  {item.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wire Color Palette */}
      <div className="p-3 border-t border-[#1e2c40] bg-[#05080c]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-['Space_Grotesk']">
            Jumper Wire Color
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            {wireColors.find(c => c.color === activeWireColor)?.label.split(' ')[0] || 'Active'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          {wireColors.map((w, i) => {
            const isSelected = activeWireColor === w.color;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectWireColor(w.color)}
                title={w.label}
                className={`w-6 h-6 rounded-full transition-transform border ${
                  isSelected 
                    ? 'border-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)] z-10' 
                    : 'border-transparent hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: w.color }}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
};
