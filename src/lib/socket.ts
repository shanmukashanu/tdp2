import { io, type Socket } from 'socket.io-client';
import API from '@/lib/api.js';
import { api as apiHelpers } from '@/lib/api';

let socket: Socket | null = null;
let lastToken: string | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  const tokens = apiHelpers.getStoredTokens();
  const token = tokens?.accessToken;
  if (!token) {
    throw new Error('Unauthorized');
  }

  if (socket && socket.connected && lastToken === token) return socket;

  const baseUrl = String(API.defaults.baseURL || apiHelpers.API_BASE || '').replace(/\/+$/, '');

  socket = io(baseUrl, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  });

  lastToken = token;

  socket.io.on('reconnect_attempt', () => {
    try {
      const t = apiHelpers.getStoredTokens()?.accessToken;
      if (t) {
        socket!.auth = { token: t } as any;
        lastToken = t;
      }
    } catch {
      // ignore
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
