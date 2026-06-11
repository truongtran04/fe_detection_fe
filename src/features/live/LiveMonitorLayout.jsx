import { AlertBanner } from './panels/AlertBanner.jsx';
import { StreamSidebar } from './panels/StreamSidebar.jsx';
import { VideoPlayer } from './panels/VideoPlayer.jsx';
import { AlertsHistory } from './panels/AlertsHistory.jsx';

export function LiveMonitorLayout(props) {
  return (
    <div className="space-y-6">
      <AlertBanner
        isAlertConfirmed={props.isAlertConfirmed}
        stats={props.stats}
        isMuted={props.isMuted}
        setIsMuted={props.setIsMuted}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
        <StreamSidebar {...props} />
        <VideoPlayer {...props} />
      </div>

      <AlertsHistory {...props} />
    </div>
  );
}
