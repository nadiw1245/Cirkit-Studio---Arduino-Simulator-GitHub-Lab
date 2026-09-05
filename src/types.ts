export type BoardType = 'uno_q' | 'ventuno_q';

export type ComponentType = 
  | 'led' 
  | 'resistor' 
  | 'buzzer' 
  | 'sensor' 
  | 'button' 
  | 'potentiometer' 
  | 'servo' 
  | 'ultrasonic';

export interface PinDefinition {
  id: string;
  name: string;
  description: string;
  type: 'digital' | 'pwm' | 'analog' | 'power' | 'gnd' | 'i2c' | 'uart' | 'spi';
  defaultVoltage?: number;
}

export interface PlacedComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  properties: {
    color?: string; // for LED: red, green, blue, yellow
    resistance?: number; // for resistor: 220, 330, 1000, 10000
    angle?: number; // for servo: 0-180
    value?: number; // for pot: 0-1023
    distance?: number; // for ultrasonic / sensor: cm
    pressed?: boolean; // for pushbutton
    label?: string;
  };
}

export interface CircuitWire {
  id: string;
  fromPinId: string;
  fromCompId: string; // 'board' or component id
  toPinId: string;
  toCompId: string;   // 'board' or component id
  color: string;
}

export interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: 'cpp' | 'json' | 'markdown' | 'h';
  isEntry?: boolean;
}

export interface SerialLog {
  id: string;
  timestamp: string;
  text: string;
  level: 'info' | 'data' | 'warn' | 'error' | 'sys';
}

export interface WaveformPoint {
  time: number;
  d13: number;
  pwm11: number;
  d2: number;
  a0: number;
}

export interface DiagnosticIssue {
  id: string;
  severity: 'error' | 'warning' | 'tip';
  title: string;
  message: string;
  componentId?: string;
  solution?: string;
}

export interface ProjectBlueprint {
  id: string;
  title: string;
  description: string;
  badge: string;
  board: BoardType;
  sketch: string;
  components: Array<{
    id?: string;
    type: ComponentType;
    x: number;
    y: number;
    properties?: Record<string, any>;
    pins?: Record<string, { boardPin: string; wireColor: string }>;
  }>;
  wires?: Array<{
    fromCompId: string;
    fromPinId: string;
    toCompId: string;
    toPinId: string;
    color: string;
  }>;
}
