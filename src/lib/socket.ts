import { io, type Socket } from 'socket.io-client';
import { api } from '@/lib/api';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  const tokens = api.getStoredTokens();
  const token = tokens?.accessToken;
  if (!token) {
    throw new Error('Unauthorized');
  }

  if (socket && socket.connected) return socket;

  socket = io(api.API_BASE, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
