// WebSocket connection manager for chat

export interface WebSocketMessage {
  type: 'message' | 'ping';
  message?: string;
  agentType?: string;
  apiKey?: string;
  model?: string;
  imageUrl?: string;
}

export interface WebSocketResponse {
  type: 'connected' | 'ack' | 'start' | 'chunk' | 'done' | 'error' | 'pong';
  content?: string;
  messageId?: string;
  error?: string;
  done?: boolean;
  message?: string;
}

export type WebSocketCallback = (response: WebSocketResponse) => void;
export type WebSocketErrorCallback = (error: Error) => void;

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private conversationId: string;
  private onMessage: WebSocketCallback;
  private onError: WebSocketErrorCallback;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: number | null = null;
  private isConnecting = false;
  private isManualClose = false;

  constructor(
    conversationId: string,
    onMessage: WebSocketCallback,
    onError: WebSocketErrorCallback
  ) {
    this.conversationId = conversationId;
    this.onMessage = onMessage;
    this.onError = onError;
  }

  connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.isManualClose = false;

    return new Promise((resolve, reject) => {
      try {
        // Use relative URL for WebSocket (will be proxied by Vite)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/api/chat/${this.conversationId}/ws`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log(`WebSocket connected for conversation ${this.conversationId}`);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketResponse = JSON.parse(event.data);
            this.onMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.onError(new Error('Failed to parse message'));
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.onError(new Error('WebSocket connection error'));
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket closed for conversation ${this.conversationId}`, event.code, event.reason);
          this.isConnecting = false;
          this.stopPing();

          // Auto-reconnect if not manually closed
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
              this.connect().catch((err) => {
                console.error('Reconnection failed:', err);
              });
            }, delay);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.onError(new Error('Max reconnection attempts reached'));
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.onError(new Error('WebSocket is not connected'));
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.onError(new Error('Failed to send message'));
    }
  }

  sendChatMessage(
    message: string,
    agentType: string,
    model?: string,
    apiKey?: string,
    imageUrl?: string
  ): void {
    this.send({
      type: 'message',
      message,
      agentType,
      model,
      apiKey,
      imageUrl,
    });
  }

  disconnect(): void {
    this.isManualClose = true;
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

