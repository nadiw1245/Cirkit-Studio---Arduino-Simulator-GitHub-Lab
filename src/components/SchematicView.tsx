import React from 'react';
import { BoardType, PlacedComponent, CircuitWire } from '../types';

interface SchematicViewProps {
  boardType: BoardType;
  components: PlacedComponent[];
  wires: CircuitWire[];
}

export const SchematicView: React.FC<SchematicViewProps> = ({
  boardType,
  components,
  wires
}) => {
  return (
    <div className="w-full h-full bg-[#0a0f18] p-6 overflow-auto font-mono select-none">
      <div className="max-w-4xl mx-auto bg-[#070b12] border border-[#1e2c40] rounded-xl p-8 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-[#1e2c40] pb-4 mb-6">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Schematic Diagram (IEEE Std 315)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Target: {boardType === 'uno_q' ? 'Arduino UNO Q (QRB2210 + STM32U5)' : 'Arduino Ventuno Q (QCS8275 + STM32H5)'}
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-mono">
            <div>SHEET 1 OF 1</div>
            <div>STATUS: COMPILED NETLIST</div>
          </div>
        </div>

        {/* Schematic Canvas representation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Controller Block */}
          <div className="col-span-1 bg-[#090e17] border-2 border-cyan-500/40 rounded-lg p-4 font-mono text-xs text-slate-300">
            <div className="text-center font-bold text-cyan-400 border-b border-cyan-500/30 pb-2 mb-3">
              U1: {boardType === 'uno_q' ? 'ATMEGA / STM32U5' : 'STM32H5F5'}
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between border-b border-slate-800/60 pb-0.5">
                <span className="text-emerald-400">5V (VCC)</span>
                <span className="text-slate-500">PIN 5V</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-0.5">
                <span className="text-slate-400">GND (DGND)</span>
                <span className="text-slate-500">PIN GND</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-0.5">
                <span className="text-cyan-400">GPIO_13 (LED)</span>
                <span className="text-slate-500">D13</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-0.5">
                <span className="text-cyan-400">TIM1_CH1 (PWM)</span>
                <span className="text-slate-500">~11</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-0.5">
                <span className="text-cyan-400">EXTI_2 (INT)</span>
                <span className="text-slate-500">D2</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-0.5">
                <span className="text-amber-400">ADC1_IN0</span>
                <span className="text-slate-500">A0</span>
              </div>
            </div>
          </div>

          {/* Connected Peripheral Network */}
          <div className="col-span-2 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['Space_Grotesk']">
              Connected Elements ({components.length})
            </div>

            {components.length === 0 ? (
              <div className="p-8 border border-dashed border-[#1e2c40] rounded-lg text-center text-xs text-slate-500">
                No external components placed. Drop components on the canvas to generate schematic nets.
              </div>
            ) : (
              <div className="space-y-2">
                {components.map((c, i) => {
                  return (
                    <div
                      key={c.id}
                      className="bg-[#0b121e] border border-[#1e2c40] rounded-lg p-3 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-800">
                          {c.type[0].toUpperCase()}{i + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-200">
                            {c.type.toUpperCase()}
                          </span>
                          <span className="text-slate-500 text-[10px] ml-2">
                            {c.properties.label || c.properties.color || `${c.type}_unit`}
                          </span>
                        </div>
                      </div>

                      {/* Schematic Net Connections */}
                      <div className="text-[11px] text-slate-400 font-mono">
                        {wires.filter(w => w.fromCompId === c.id || w.toCompId === c.id).length > 0 ? (
                          <span className="text-emerald-400">
                            Wired to: {wires
                              .filter(w => w.fromCompId === c.id || w.toCompId === c.id)
                              .map(w => w.fromCompId === 'board' ? w.fromPinId : w.toPinId)
                              .join(', ')}
                          </span>
                        ) : (
                          <span className="text-amber-500/80">Unconnected Net</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Netlist Table */}
        <div className="mt-8 border-t border-[#1e2c40] pt-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-['Space_Grotesk']">
            Circuit Netlist Wire Table ({wires.length} wires)
          </div>
          {wires.length === 0 ? (
            <div className="text-[11px] text-slate-500 font-mono">No nets routed. Click terminal pins to connect.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {wires.map((w, idx) => (
                <div key={w.id} className="bg-[#0d1522] border border-[#1e2c40] p-2 rounded text-[11px] font-mono flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="text-slate-300">NET_{idx + 1}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">
                    {w.fromPinId} ➔ {w.toPinId}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
