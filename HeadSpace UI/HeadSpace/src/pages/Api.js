// Use relative URLs in production, absolute in development
export const Api_Base = import.meta.env.MODE === 'production' 
  ? ''  // Empty string means same domain
  : 'http://localhost:8000';

export const WS_BASE = import.meta.env.MODE === 'production'
  ? 'wss://' + window.location.host
  : 'ws://localhost:8000';