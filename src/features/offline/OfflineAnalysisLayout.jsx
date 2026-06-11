import { SubTabSwitcher } from './panels/SubTabSwitcher.jsx';
import { ImageAnalysisPanel } from './panels/ImageAnalysisPanel.jsx';
import { VideoAnalysisPanel } from './panels/VideoAnalysisPanel.jsx';

export function OfflineAnalysisLayout(props) {
  return (
    <div className="glass-panel rounded-3xl p-6 space-y-6">
      <SubTabSwitcher activeSubTab={props.activeSubTab} setActiveSubTab={props.setActiveSubTab} />
      {props.activeSubTab === 'image' && <ImageAnalysisPanel {...props} />}
      {props.activeSubTab === 'video' && <VideoAnalysisPanel {...props} />}
    </div>
  );
}
