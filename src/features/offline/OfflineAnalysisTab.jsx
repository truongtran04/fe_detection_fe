import { useOfflineAnalysis } from './hooks/useOfflineAnalysis.js';
import { OfflineAnalysisLayout } from './OfflineAnalysisLayout.jsx';

export function OfflineAnalysisTab(props) {
  const state = useOfflineAnalysis(props);
  return <OfflineAnalysisLayout {...state} />;
}

export default OfflineAnalysisTab;
