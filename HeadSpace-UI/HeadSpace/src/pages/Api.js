const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  return url.replace(/\/$/, '');
};

export const Api_Base = getBaseUrl() + '/';
export const WS_BASE = getBaseUrl().replace(/^http(s)?/, 'ws$1');