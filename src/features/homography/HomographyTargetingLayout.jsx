import { SetupRow } from './panels/SetupRow.jsx';
import { CalibrationRow } from './panels/CalibrationRow.jsx';
import { SimulationRow } from './panels/SimulationRow.jsx';
import { TheoryPanel } from './panels/TheoryPanel.jsx';

export function HomographyTargetingLayout(props) {
  return (
    <div className="space-y-6 text-left">
      <SetupRow {...props} />
      <CalibrationRow {...props} />
      <SimulationRow {...props} />
      <TheoryPanel />
    </div>
  );
}
