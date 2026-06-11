export const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json();
  return { res, data };
};

export const postJson = (url, body) =>
  fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
