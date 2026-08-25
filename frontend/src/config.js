// Central configuration for API and Socket.io endpoints
// Uses VITE_API_URL environment variable if present, defaulting to localhost:5000 for development

const rawBackendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Ensure no trailing slash
export const BACKEND_URL = rawBackendUrl.replace(/\/+$/, "");

export const API_BASE_URL = `${BACKEND_URL}/api`;

export const SOCKET_URL = BACKEND_URL;
