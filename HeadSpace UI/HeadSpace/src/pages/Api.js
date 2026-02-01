const Api_Base = import.meta.env.VITE_API_BASE
const WS_BASE = Api_Base.replace(/^http/, "ws");
export  default {Api_Base, WS_BASE}