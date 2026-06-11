import { useApp } from './app/hooks/useApp.js';
import { AppLayout } from './app/AppLayout.jsx';
import './App.css';

export default function App() {
  const appState = useApp();
  return <AppLayout {...appState} />;
}
