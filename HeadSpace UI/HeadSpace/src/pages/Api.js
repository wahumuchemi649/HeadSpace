// Api.js
export const Api_Base = import.meta.env.VITE_API_BASE;
export const WS_BASE = Api_Base.replace(/^http/, "ws");