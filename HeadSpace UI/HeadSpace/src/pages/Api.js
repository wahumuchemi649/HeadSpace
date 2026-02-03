export const Api_Base = import.meta.env.VITE_API_BASE || 'https://headspace-r8nf.onrender.com';
export const WS_BASE = Api_Base.replace(/^http(s)?/, "ws$1");