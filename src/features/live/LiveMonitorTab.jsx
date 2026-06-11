import { useLiveMonitor } from './hooks/useLiveMonitor.js';
import { LiveMonitorLayout } from './LiveMonitorLayout.jsx';

export function LiveMonitorTab(props) {
  const state = useLiveMonitor(props);
  return <LiveMonitorLayout {...state} />;
}

export default LiveMonitorTab;
