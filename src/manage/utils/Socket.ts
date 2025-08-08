import io, { Socket } from 'socket.io-client';
import eventHub from './EventHub';

function safeEmit(event: string, ...args: any[]) {
  try {
    eventHub.emit(event, ...args);
  } catch (error) {
    console.error(`Error emitting event '${event}':`, error);
  }
}

const origin = process.env.WS_BASE_URL || '';
const path = '/v1/qbot/chat/conn/';
let initSocket = 1;

class SocketManager {
  private socket: Socket | null = null;
  private connected = false;
  // Store listeners registered before socket initialization so they can be attached later
  private pendingListeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    // Don't initialize socket immediately - wait for tokens
    this.waitForTokensAndConnect();
  }

  private waitForTokensAndConnect() {
    const checkTokens = () => {
      const tokenArr = (window as any).webimToken || [];
      const mainToken = tokenArr.filter((item: any) => {
        return item.type !== 4;
      })[0]?.token;

      if (mainToken) {
        console.log('🎯 Token found, initializing WebSocket connection...');
        this.initializeSocket();
      } else {
        console.log('⏳ Waiting for tokens...');
        setTimeout(checkTokens, 100);
      }
    };
    
    checkTokens();
  }

  private initializeSocket() {
    const tokenArr = (window as any).webimToken || [];
    const mainToken = tokenArr.filter((item: any) => {
      return item.type !== 4;
    })[0]?.token;
    
    console.log('🔧 Initializing WebSocket with token:', mainToken ? 'Token available' : 'No token');
    
    this.socket = io(origin, {
      path: path,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: async (cb) => {
        try {
          const currentTokenArr = (window as any).webimToken || [];
          const currentMainToken = currentTokenArr.filter((item: any) => {
            return item.type !== 4;
          })[0]?.token;
          
          console.log('🔧 WebSocket auth callback, token:', currentMainToken ? 'Available' : 'Not available');
          
          if (initSocket === 1) {
            const token = currentMainToken || '';
            cb({ token: token });
            initSocket++;
          } else {
            const token = currentMainToken || '';
            cb({ token: token });
            initSocket++;
          }
        } catch (e) {
          console.error('🔧 WebSocket auth error:', e);
          cb({ token: '' });
        }
      }
    });

    this.setupEventListeners();

    // Attach any listeners that were registered before the socket was ready
    this.attachPendingListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected successfully!');
      this.connected = true;
      safeEmit('connect');
    });

    this.socket.on('connect_error', (error) => {
      console.log('❌ WebSocket connection error:', error);
      safeEmit('connectError');
      this.socket?.connect();
    });

    this.socket.on('error', (error) => {
      console.error('【Socket Error】----->', error);
      console.error('【Socket Error Details】:', JSON.stringify(error, null, 2));
      if (error && error.error) {
        console.error('【Server Error Message】:', error.error.message || error.error);
      }
      if (error && error.payload && error.payload.error) {
        console.error('【Payload Error Message】:', error.payload.error.message || '服务出错了！');
      }
      try {
        safeEmit('error', error);
      } catch (e) {
        console.error('Error emitting error event:', e);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      try {
        safeEmit('disconnect', reason);
      } catch (e) {
        console.error('Error emitting disconnect event:', e);
      }
    });

    this.socket.io.on('error', (error) => {
      try {
        safeEmit('SocketError', error);
      } catch (e) {
        console.error('Error emitting SocketError event:', e);
      }
    });

    this.socket.io.on('reconnect', (attemptNumber) => {
      try {
        safeEmit('reconnect', `Reconnected to server after ${attemptNumber} attempts`);
      } catch (e) {
        console.error('Error emitting reconnect event:', e);
      }
    });

    this.socket.io.on('reconnect_attempt', (attemptNumber) => {
      try {
        safeEmit('reconnectAttempt', `Attempt number ${attemptNumber} to reconnect to server`);
      } catch (e) {
        console.error('Error emitting reconnectAttempt event:', e);
      }
    });

    this.socket.io.on('reconnect_error', (error) => {
      try {
        safeEmit('reconnectError', error);
      } catch (e) {
        console.error('Error emitting reconnectError event:', e);
      }
    });

    this.socket.io.on('reconnect_failed', () => {
      safeEmit('reconnectFailed');
    });
  }

  emit(eventName: string, params: any) {
    console.log('⚡ socketManager.emit called:', eventName, params);
    console.log('⚡ Socket status:', { socket: !!this.socket, connected: this.connected });
    
    if (this.socket && this.connected) {
      // Wrap in payload object to match original Vue implementation
      const data = {
        payload: params
      };
      console.log('⚡ Emitting socket event (wrapped):', eventName, data);
      this.socket.emit(eventName, data);
      console.log('⚡ Socket event emitted successfully');
    } else {
      console.log('⚡ Cannot emit - socket not connected:', { socket: !!this.socket, connected: this.connected });
    }
  }

  on(eventName: string, cb: (data: any) => void) {
    // Always record listener
    if (!this.pendingListeners.has(eventName)) {
      this.pendingListeners.set(eventName, []);
    }
    this.pendingListeners.get(eventName)!.push(cb);

    // If socket already exists, attach immediately
    if (this.socket) {
      const dataCB = (data: any) => {
        console.log('⚡ Socket.on called:', eventName, data);
        // Normalize payload shape: support {payload: {...}} and raw {...}
        const normalized = (data && Object.prototype.hasOwnProperty.call(data, 'payload')) ? data.payload : data;
        cb(normalized);
      };
      this.socket.on(eventName, dataCB);
      console.log('⚡ Added listener for event (immediate attach):', eventName);
    } else {
      console.log('⚡ Listener recorded for later attach (socket not initialized):', eventName);
    }
  }

  isConnected() {
    return this.connected;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  private attachPendingListeners() {
    if (!this.socket) return;
    // Attach all stored listeners to the newly created socket
    this.pendingListeners.forEach((listeners, eventName) => {
      listeners.forEach((cb) => {
        const dataCB = (data: any) => {
          console.log('⚡ Socket.on called:', eventName, data);
          const normalized = (data && Object.prototype.hasOwnProperty.call(data, 'payload')) ? data.payload : data;
          cb(normalized);
        };
        this.socket!.on(eventName, dataCB);
        console.log('⚡ Attached pending listener for event:', eventName);
      });
    });
  }
}

export const socketManager = new SocketManager();
export default socketManager;