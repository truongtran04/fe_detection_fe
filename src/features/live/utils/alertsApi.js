export const logAlert = async (level, message) => {
  try {
    await fetch('/api/alerts/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message })
    });
  } catch {
  }
};

export const fetchAlertsHistory = async () => {
  const res = await fetch('/api/alerts/history');
  if (res.ok) return res.json();
  return [];
};

export const clearAlertsHistory = () =>
  fetch('/api/alerts/clear', { method: 'POST' });
