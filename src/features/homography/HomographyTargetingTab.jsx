import { useHomographyTargeting } from './hooks/useHomographyTargeting.js';
import { HomographyTargetingLayout } from './HomographyTargetingLayout.jsx';

export function HomographyTargetingTab(props) {
  const state = useHomographyTargeting(props);
  return <HomographyTargetingLayout {...state} />;
}

export default HomographyTargetingTab;
