// Central place for build/version info surfaced in the admin system status table.
// __NODE_VERSION__ is injected by Vite at build time (see vite.config.js define).
export const FRONTEND_VERSION = '1.0.0';
export const NODE_VERSION = __NODE_VERSION__ || 'unknown';
