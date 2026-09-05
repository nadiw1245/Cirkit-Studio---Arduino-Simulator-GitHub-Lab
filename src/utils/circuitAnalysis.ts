import { PlacedComponent, CircuitWire } from '../types';

export interface CircuitEvaluationResult {
  energizedLeds: Record<string, { energized: boolean; color: string; throughResistor: boolean; directShortWarning?: boolean }>;
  activeBuzzers: Record<string, { active: boolean; frequency: number }>;
  activeSensors: Record<string, { powered: boolean; triggered: boolean }>;
  activeServos: Record<string, { powered: boolean; angle: number }>;
  energizedResistors: Record<string, boolean>;
  netDiagnostics: string[];
}

/**
 * Checks whether a board pin is Ground.
 */
export const isGroundPin = (pinId: string): boolean => {
  const normalized = pinId.toUpperCase();
  return (
    normalized.includes('GND') ||
    normalized === 'TERM_GND1' ||
    normalized === 'TERM_GND2' ||
    normalized === 'RPI_GND_1' ||
    normalized === 'RPI_GND_2' ||
    normalized === 'RPI_GND_3' ||
    normalized === 'RPI_GND_4' ||
    normalized === 'RPI_GND_5' ||
    normalized === 'JT_GND'
  );
};

/**
 * Checks whether a board pin is a constant Power source (5V, 3.3V, VIN).
 */
export const isConstantPowerPin = (pinId: string): boolean => {
  const normalized = pinId.toUpperCase();
  return (
    normalized === '5V' ||
    normalized === '3V3' ||
    normalized === '3.3V' ||
    normalized === 'VIN' ||
    normalized === 'TERM_VIN' ||
    normalized === 'RPI_5V_1' ||
    normalized === 'RPI_5V_2' ||
    normalized === 'RPI_3V3' ||
    normalized === 'RPI_3V3_2' ||
    normalized === 'JT_VCC'
  );
};

/**
 * Traces electrical connectivity from a given component pin through wires and passives (resistors, closed buttons).
 * Returns the set of reached board pins and components.
 */
export const traceElectricalNet = (
  startCompId: string,
  startPinId: string,
  components: PlacedComponent[],
  wires: CircuitWire[]
): {
  boardPins: string[];
  componentsTraversed: { compId: string; pinId: string }[];
  containsResistor: boolean;
} => {
  const visited = new Set<string>();
  const queue: { compId: string; pinId: string }[] = [{ compId: startCompId, pinId: startPinId }];
  const boardPins: string[] = [];
  const componentsTraversed: { compId: string; pinId: string }[] = [];
  let containsResistor = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.compId}:${current.pinId}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (current.compId === 'board') {
      boardPins.push(current.pinId);
      continue;
    }

    componentsTraversed.push(current);

    // If current component is a passive that conducts electricity through its body:
    const compObj = components.find(c => c.id === current.compId);
    if (compObj) {
      if (compObj.type === 'resistor') {
        containsResistor = true;
        // Resistor conducts between p1 and p2
        const otherPin = current.pinId === 'p1' ? 'p2' : 'p1';
        const otherKey = `${compObj.id}:${otherPin}`;
        if (!visited.has(otherKey)) {
          queue.push({ compId: compObj.id, pinId: otherPin });
        }
      } else if (compObj.type === 'button') {
        // Conducts between p1 and p2 only when pressed
        if (compObj.properties.pressed) {
          const otherPin = current.pinId === 'p1' ? 'p2' : 'p1';
          const otherKey = `${compObj.id}:${otherPin}`;
          if (!visited.has(otherKey)) {
            queue.push({ compId: compObj.id, pinId: otherPin });
          }
        }
      }
    }

    // Traverse all wires attached to current pin
    for (const wire of wires) {
      if (wire.fromCompId === current.compId && wire.fromPinId === current.pinId) {
        queue.push({ compId: wire.toCompId, pinId: wire.toPinId });
      } else if (wire.toCompId === current.compId && wire.toPinId === current.pinId) {
        queue.push({ compId: wire.fromCompId, pinId: wire.fromPinId });
      }
    }
  }

  return { boardPins, componentsTraversed, containsResistor };
};

/**
 * Determines whether a collection of board pins has an active positive voltage.
 */
export const hasPositiveVoltage = (
  boardPins: string[],
  pinStates: Record<string, number | boolean>
): boolean => {
  for (const pin of boardPins) {
    if (isConstantPowerPin(pin)) return true;
    
    // Check digital state (e.g. D13, D11, D2, TX, etc.)
    const state = pinStates[pin];
    if (state === 1 || state === true) return true;
    if (typeof state === 'number' && state > 0) return true;
  }
  return false;
};

/**
 * Determines whether a collection of board pins has a Ground connection.
 */
export const hasGroundConnection = (boardPins: string[]): boolean => {
  return boardPins.some(pin => isGroundPin(pin));
};

/**
 * Full Circuit Evaluator
 */
export const evaluateCircuit = (
  components: PlacedComponent[],
  wires: CircuitWire[],
  pinStates: Record<string, number | boolean>,
  isSimulating: boolean
): CircuitEvaluationResult => {
  const result: CircuitEvaluationResult = {
    energizedLeds: {},
    activeBuzzers: {},
    activeSensors: {},
    activeServos: {},
    energizedResistors: {},
    netDiagnostics: []
  };

  if (!isSimulating) {
    return result;
  }

  // Evaluate each placed component
  for (const comp of components) {
    if (comp.type === 'led') {
      const anodeTrace = traceElectricalNet(comp.id, 'anode', components, wires);
      const cathodeTrace = traceElectricalNet(comp.id, 'cathode', components, wires);

      const anodeHasPower = hasPositiveVoltage(anodeTrace.boardPins, pinStates);
      const cathodeHasGnd = hasGroundConnection(cathodeTrace.boardPins);

      const isEnergized = anodeHasPower && cathodeHasGnd;
      const throughResistor = anodeTrace.containsResistor || cathodeTrace.containsResistor;

      result.energizedLeds[comp.id] = {
        energized: isEnergized,
        color: comp.properties.color || 'red',
        throughResistor,
        directShortWarning: isEnergized && !throughResistor
      };

      if (isEnergized && throughResistor) {
        // Mark the connected resistor(s) as conducting
        const allResistors = [
          ...anodeTrace.componentsTraversed.filter(c => components.find(x => x.id === c.compId)?.type === 'resistor'),
          ...cathodeTrace.componentsTraversed.filter(c => components.find(x => x.id === c.compId)?.type === 'resistor')
        ];
        allResistors.forEach(r => {
          result.energizedResistors[r.compId] = true;
        });
      }
    } else if (comp.type === 'buzzer') {
      const posTrace = traceElectricalNet(comp.id, 'pos', components, wires);
      const negTrace = traceElectricalNet(comp.id, 'neg', components, wires);

      const posHasPower = hasPositiveVoltage(posTrace.boardPins, pinStates);
      const negHasGnd = hasGroundConnection(negTrace.boardPins);

      const isActive = posHasPower && negHasGnd;
      result.activeBuzzers[comp.id] = {
        active: isActive,
        frequency: 587
      };

      if (isActive && (posTrace.containsResistor || negTrace.containsResistor)) {
        const allResistors = [
          ...posTrace.componentsTraversed.filter(c => components.find(x => x.id === c.compId)?.type === 'resistor'),
          ...negTrace.componentsTraversed.filter(c => components.find(x => x.id === c.compId)?.type === 'resistor')
        ];
        allResistors.forEach(r => {
          result.energizedResistors[r.compId] = true;
        });
      }
    } else if (comp.type === 'sensor') {
      const vccTrace = traceElectricalNet(comp.id, 'vcc', components, wires);
      const gndTrace = traceElectricalNet(comp.id, 'gnd', components, wires);
      const isPowered = hasPositiveVoltage(vccTrace.boardPins, pinStates) && hasGroundConnection(gndTrace.boardPins);

      result.activeSensors[comp.id] = {
        powered: isPowered,
        triggered: isPowered && Boolean(pinStates['D2'])
      };
    } else if (comp.type === 'servo') {
      const vccTrace = traceElectricalNet(comp.id, 'vcc', components, wires);
      const gndTrace = traceElectricalNet(comp.id, 'gnd', components, wires);
      const pwmTrace = traceElectricalNet(comp.id, 'pwm', components, wires);

      const isPowered = hasPositiveVoltage(vccTrace.boardPins, pinStates) && hasGroundConnection(gndTrace.boardPins);
      const hasSignal = pwmTrace.boardPins.some(p => p.includes('9') || p.includes('10') || p.includes('11') || p.includes('PWM'));

      result.activeServos[comp.id] = {
        powered: isPowered,
        angle: isPowered && hasSignal ? (comp.properties.angle || 90) : 0
      };
    }
  }

  return result;
};
