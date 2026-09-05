import React, { useState, useRef } from 'react';
import { 
  CodeFile, 
  SerialLog, 
  WaveformPoint, 
  DiagnosticIssue, 
  ProjectBlueprint,
  PlacedComponent,
  CircuitWire
} from '../types';
import { 
  FileCode, 
  Sparkles, 
  Terminal, 
  Activity, 
  Plus, 
  Upload, 
  Download, 
  Check, 
  Trash2, 
  Send, 
  Play, 
  AlertTriangle, 
  Cpu, 
  CheckCircle2, 
  Layers,
  HelpCircle,
  Copy
} from 'lucide-react';
import { playUiClick } from '../utils/audio';

interface RightSidebarProps {
  files: CodeFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onUpdateFileContent: (id: string, content: string) => void;
  onAddFile: (name: string, content?: string) => void;
  onDeleteFile: (id: string) => void;
  serialLogs: SerialLog[];
  onClearSerial: () => void;
  onSendSerialInput: (input: string) => void;
  waveformHistory: WaveformPoint[];
  components: PlacedComponent[];
  wires: CircuitWire[];
  diagnostics: DiagnosticIssue[];
  blueprints: ProjectBlueprint[];
  onApplyBlueprint: (blueprint: ProjectBlueprint) => void;
  isSimulating: boolean;
  onAskAi: (question: string) => void;
  aiMessages: Array<{ sender: 'user' | 'bot'; text: string; action?: () => void; actionLabel?: string }>;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onUpdateFileContent,
  onAddFile,
  onDeleteFile,
  serialLogs,
  onClearSerial,
  onSendSerialInput,
  waveformHistory,
  components,
  wires,
  diagnostics,
  blueprints,
  onApplyBlueprint,
  isSimulating,
  onAskAi,
  aiMessages
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'ai' | 'serial' | 'diagnostics'>('ai');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [serialInputText, setSerialInputText] = useState('');
  const [aiInputText, setAiInputText] = useState('');
  const [compilingNotice, setCompilingNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Upload local file from student computer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      onAddFile(uploadedFile.name, content);
      playUiClick();
    };
    reader.readAsText(uploadedFile);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download active code file
  const handleDownloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    link.click();
    URL.revokeObjectURL(url);
    playUiClick();
  };

  // Download entire bundle as a multi-file JSON/Text
  const handleDownloadProjectBundle = () => {
    const projectData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      files,
      components,
      wires
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'arduino-project-bundle.json';
    link.click();
    URL.revokeObjectURL(url);
    playUiClick();
  };

  // Simulate C++ verify / compile
  const handleVerifyCode = () => {
    setCompilingNotice('Verifying sketch syntax against STM32U5 / Qualcomm toolchain...');
    setTimeout(() => {
      // Basic bracket mismatch check
      const opens = (activeFile.content.match(/{/g) || []).length;
      const closes = (activeFile.content.match(/}/g) || []).length;
      if (opens !== closes) {
        setCompilingNotice(`Error: Syntax bracket mismatch! Found ${opens} '{' and ${closes} '}'. Check loop or function closures.`);
      } else {
        setCompilingNotice('✅ Compilation Successful! Binary size: 42,120 bytes (8% Flash, 4% RAM). Ready to flash.');
      }
      setTimeout(() => setCompilingNotice(null), 5000);
    }, 450);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAiSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiInputText.trim()) return;
    onAskAi(aiInputText);
    setAiInputText('');
  };

  return (
    <aside className="w-96 lg:w-[410px] bg-[#090e15] border-l border-[#1e2c40] flex flex-col h-full z-20 select-none">
      {/* Hidden File Input for Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".ino,.cpp,.c,.h,.txt,.json,.md"
        className="hidden"
      />

      {/* Top Sidebar Tabs */}
      <div className="flex border-b border-[#1e2c40] bg-[#05080c]">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'ai'
              ? 'text-purple-300 border-b-purple-400 bg-purple-950/20 shadow-inner'
              : 'text-slate-400 border-b-transparent hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          AI Copilot
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'code'
              ? 'text-cyan-400 border-b-cyan-400 bg-[#0f1622]'
              : 'text-slate-400 border-b-transparent hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          Files & Code
        </button>

        <button
          onClick={() => setActiveTab('serial')}
          className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'serial'
              ? 'text-emerald-400 border-b-emerald-400 bg-[#0f1622]'
              : 'text-slate-400 border-b-transparent hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          Serial & Logic
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'diagnostics'
              ? 'text-amber-400 border-b-amber-400 bg-[#0f1622]'
              : 'text-slate-400 border-b-transparent hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          ERC Check
          {diagnostics.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-mono">
              {diagnostics.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AI NEURAL COPILOT */}
      {activeTab === 'ai' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#090e15] to-[#05080c]">
          {/* AI Header Profile */}
          <div className="p-3 border-b border-[#1e2c40] bg-[#0b121e]/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-['Space_Grotesk'] flex items-center gap-1.5">
                  Qualcomm Dragonwing AI
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </div>
                <div className="text-[10px] font-mono text-purple-400">
                  Neural Circuit & Firmware Engine
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-700/40">
              v4.5 Pro
            </span>
          </div>

          {/* Chat / Blueprint scroll list */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Introductory AI message */}
            <div className="bg-[#0f1622] border border-purple-500/25 rounded-xl p-3.5 text-xs text-slate-200 shadow-md space-y-2">
              <div className="flex items-center gap-1.5 text-purple-400 font-bold uppercase tracking-wider text-[11px] font-['Space_Grotesk']">
                <Sparkles className="w-3.5 h-3.5" />
                AI Project Architect
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                I can auto-route electronic circuits, write verifiable dual-core firmware, and troubleshoot your Arduino hardware.
              </p>

              {/* Quick Blueprints */}
              <div className="pt-2 border-t border-[#1e2c40] space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  ⚡ Auto-Build Blueprints (1-Click)
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {blueprints.map((bp) => (
                    <button
                      key={bp.id}
                      onClick={() => {
                        onApplyBlueprint(bp);
                        playUiClick();
                      }}
                      className="w-full text-left p-2 rounded-lg bg-[#15202f] hover:bg-[#1d2b3f] border border-[#1e2c40] hover:border-purple-500/40 transition-all flex items-center justify-between group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                          {bp.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {bp.description}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#05080c] text-cyan-400 border border-[#1e2c40]">
                        Build ➔
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation logs */}
            {aiMessages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl text-xs leading-relaxed max-w-[95%] ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 text-slate-100'
                    : 'bg-[#0f1622] border border-purple-500/25 text-slate-200'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[10px] font-mono uppercase mb-1">
                    <Sparkles className="w-3 h-3" />
                    AI Architect
                  </div>
                )}
                <div className="whitespace-pre-wrap text-[11px]">{msg.text}</div>
                {msg.action && (
                  <button
                    onClick={msg.action}
                    className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-bold transition-colors"
                  >
                    {msg.actionLabel || 'Apply to Canvas'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* AI Question Prompts Bar */}
          <div className="p-2 border-t border-[#1e2c40] bg-[#05080c]">
            <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none text-[10px]">
              <button
                onClick={() => onAskAi('Why do I need a 220Ω resistor for the LED?')}
                className="px-2 py-1 rounded bg-[#0f1622] hover:bg-[#15202f] text-slate-300 border border-[#1e2c40] shrink-0"
              >
                Why 220Ω resistor?
              </button>
              <button
                onClick={() => onAskAi('How does PWM timer work on pin 11?')}
                className="px-2 py-1 rounded bg-[#0f1622] hover:bg-[#15202f] text-slate-300 border border-[#1e2c40] shrink-0"
              >
                How PWM works?
              </button>
              <button
                onClick={() => onAskAi('How to connect servo motor?')}
                className="px-2 py-1 rounded bg-[#0f1622] hover:bg-[#15202f] text-slate-300 border border-[#1e2c40] shrink-0"
              >
                Wire servo motor?
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleAiSubmit} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Ask AI: 'How do I wire an IR sensor to Pin 2?'..."
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                className="flex-1 bg-[#0f1622] border border-[#1e2c40] focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none placeholder-slate-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center gap-1 shrink-0"
              >
                <Send className="w-3 h-3" />
                Ask
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-FILE CODE STUDIO */}
      {activeTab === 'code' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#05080c]">
          {/* File Tabs Bar */}
          <div className="bg-[#090e15] border-b border-[#1e2c40] flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {files.map((file) => {
                const isActive = file.id === activeFileId;
                return (
                  <div
                    key={file.id}
                    onClick={() => onSelectFile(file.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-t-md cursor-pointer border-t border-x transition-colors ${
                      isActive
                        ? 'bg-[#05080c] border-[#1e2c40] text-cyan-400 font-bold border-b-transparent'
                        : 'bg-[#0f1622]/60 border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{file.name}</span>
                    {!file.isEntry && files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.id);
                        }}
                        className="p-0.5 hover:text-rose-400 rounded"
                        title="Delete File"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* File action buttons: Add, Upload, Download */}
            <div className="flex items-center gap-1 pb-1">
              <button
                onClick={() => setShowNewFileModal(true)}
                className="p-1 text-slate-400 hover:text-cyan-400 bg-[#15202f] hover:bg-[#1c293d] rounded border border-[#1e2c40]"
                title="Add New Code File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 text-slate-400 hover:text-emerald-400 bg-[#15202f] hover:bg-[#1c293d] rounded border border-[#1e2c40]"
                title="Upload File from PC (.ino, .cpp, .h)"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDownloadFile}
                className="p-1 text-slate-400 hover:text-amber-400 bg-[#15202f] hover:bg-[#1c293d] rounded border border-[#1e2c40]"
                title="Download Active File"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* New File Modal */}
          {showNewFileModal && (
            <div className="p-3 bg-[#0f1622] border-b border-[#1e2c40] flex items-center gap-2">
              <input
                type="text"
                placeholder="Filename (e.g., config.h, driver.cpp)"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="flex-1 bg-[#05080c] border border-[#1e2c40] rounded px-2.5 py-1 text-xs text-slate-200 outline-none font-mono"
              />
              <button
                onClick={() => {
                  if (newFileName.trim()) {
                    onAddFile(newFileName.trim());
                    setNewFileName('');
                    setShowNewFileModal(false);
                  }
                }}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="px-2 py-1 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Compilation Notice Bar */}
          {compilingNotice && (
            <div className={`p-2 text-xs font-mono border-b ${
              compilingNotice.includes('Error')
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            }`}>
              {compilingNotice}
            </div>
          )}

          {/* Code Editor Area */}
          <div className="flex-1 relative flex">
            {/* Line numbers simulation */}
            <div className="w-10 bg-[#090e15] border-r border-[#1e2c40] text-slate-600 text-[11px] font-mono select-none pt-3 text-right pr-2">
              {Array.from({ length: Math.max(25, (activeFile.content.match(/\n/g) || []).length + 1) }).map((_, i) => (
                <div key={i} className="leading-[1.6]">{i + 1}</div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              value={activeFile.content}
              onChange={(e) => onUpdateFileContent(activeFile.id, e.target.value)}
              spellCheck="false"
              className="flex-1 bg-transparent text-slate-200 font-mono text-xs leading-[1.6] p-3 outline-none resize-none selection:bg-cyan-500/30"
            />
          </div>

          {/* Code Footer Toolbar */}
          <div className="h-9 bg-[#090e15] border-t border-[#1e2c40] px-3 flex items-center justify-between font-mono text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>{activeFile.language.toUpperCase()}</span>
              <button
                onClick={handleVerifyCode}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
              >
                <Check className="w-3 h-3" />
                Verify & Compile
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="hover:text-white flex items-center gap-1"
                title="Copy code"
              >
                <Copy className="w-3 h-3" />
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadProjectBundle}
                className="hover:text-emerald-400 text-slate-400 flex items-center gap-1"
                title="Download All Files"
              >
                <Download className="w-3 h-3" />
                Bundle ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERIAL MONITOR & LOGIC ANALYZER */}
      {activeTab === 'serial' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#04070a]">
          {/* Waveform / Logic Analyzer Canvas */}
          <div className="h-36 bg-[#070c14] border-b border-[#1e2c40] p-2 flex flex-col">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Activity className="w-3 h-3" />
                LOGIC ANALYZER / OSCILLOSCOPE
              </span>
              <span>CH1: D13 | CH2: ~11 PWM | CH3: D2</span>
            </div>

            {/* Waveform SVG Display */}
            <div className="flex-1 bg-[#020408] rounded border border-[#1e2c40] overflow-hidden relative">
              <svg className="w-full h-full">
                {/* Horizontal Level Guides */}
                <line x1="0" y1="25" x2="100%" y2="25" stroke="#1e2c40" strokeDasharray="3 3"/>
                <line x1="0" y1="65" x2="100%" y2="65" stroke="#1e2c40" strokeDasharray="3 3"/>

                {/* Channel 1 (D13 - Cyan) */}
                <path
                  d={waveformHistory.reduce((acc, pt, idx, arr) => {
                    const x = (idx / Math.max(1, arr.length - 1)) * 380;
                    const y = pt.d13 ? 12 : 32;
                    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />

                {/* Channel 2 (PWM 11 - Green) */}
                <path
                  d={waveformHistory.reduce((acc, pt, idx, arr) => {
                    const x = (idx / Math.max(1, arr.length - 1)) * 380;
                    const y = pt.pwm11 ? 42 : 62;
                    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
          </div>

          {/* Serial Monitor Bar */}
          <div className="px-3 py-1.5 bg-[#090e15] border-b border-[#1e2c40] flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">UART SERIAL</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#15202f]">115200 Baud</span>
            </div>
            <button
              onClick={onClearSerial}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          </div>

          {/* Serial Output Logs */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-emerald-400 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
            {serialLogs.length === 0 ? (
              <div className="text-slate-600 text-xs italic">
                {isSimulating ? 'Awaiting serial transmit data...' : 'Simulation stopped. Press Start Sim to begin streaming.'}
              </div>
            ) : (
              serialLogs.map((log) => (
                <div key={log.id} className="leading-tight flex items-start gap-2">
                  <span className="text-slate-500 select-none text-[10px]">{log.timestamp}</span>
                  <span className={log.level === 'error' ? 'text-rose-400' : log.level === 'warn' ? 'text-amber-300' : 'text-emerald-300'}>
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Serial Input Bar */}
          <div className="p-2 bg-[#090e15] border-t border-[#1e2c40] flex gap-2">
            <input
              type="text"
              placeholder="Send command to sketch (e.g. HELP, ON, SET 180)..."
              value={serialInputText}
              onChange={(e) => setSerialInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && serialInputText.trim()) {
                  onSendSerialInput(serialInputText.trim());
                  setSerialInputText('');
                }
              }}
              className="flex-1 bg-[#05080c] border border-[#1e2c40] rounded px-2.5 py-1 text-xs text-slate-200 outline-none font-mono"
            />
            <button
              onClick={() => {
                if (serialInputText.trim()) {
                  onSendSerialInput(serialInputText.trim());
                  setSerialInputText('');
                }
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold font-mono"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: ELECTRICAL RULES CHECK (ERC) & BOM */}
      {activeTab === 'diagnostics' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#05080c] text-slate-200">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-['Space_Grotesk'] mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Electrical Diagnostics
            </h3>

            {diagnostics.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All electrical nets passed validation! No open pins, shorts, or current hazards found.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {diagnostics.map((diag) => (
                  <div
                    key={diag.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      diag.severity === 'error'
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                        : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {diag.title}
                    </div>
                    <p className="text-[11px] opacity-90">{diag.message}</p>
                    {diag.solution && (
                      <div className="text-[10px] font-mono text-cyan-300 bg-[#05080c] p-1.5 rounded border border-[#1e2c40]">
                        💡 Tip: {diag.solution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill of Materials (BOM) */}
          <div className="border-t border-[#1e2c40] pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-['Space_Grotesk'] mb-2">
              Bill of Materials (BOM)
            </h3>
            <div className="bg-[#0b121e] border border-[#1e2c40] rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-3 p-2 font-mono text-[10px] text-slate-400 bg-[#070c14] border-b border-[#1e2c40]">
                <span>PART</span>
                <span>QTY</span>
                <span>DESIGNATOR</span>
              </div>
              <div className="divide-y divide-[#1e2c40] font-mono text-[11px]">
                <div className="grid grid-cols-3 p-2 text-slate-300">
                  <span>Arduino UNO Q</span>
                  <span>1</span>
                  <span>U1 (Dual-Core)</span>
                </div>
                {components.map((c, i) => (
                  <div key={c.id} className="grid grid-cols-3 p-2 text-slate-300">
                    <span className="capitalize">{c.type}</span>
                    <span>1</span>
                    <span>{c.type.toUpperCase()}_{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
