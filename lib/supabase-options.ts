import { WebSocket as WsSocket } from "ws";

// @types/ws event objects (ws.WebSocket.Event) and DOM Event objects are
// structurally incompatible: ws.Event.target is `ws.WebSocket` while
// DOM Event.target is `EventTarget | null`. This wrapper implements the
// WebSocketLike interface with DOM-typed event handlers and delegates all
// behavior to the underlying ws.WebSocket. The internal event casts are
// safe because Supabase's realtime client only reads properties (data,
// code, reason, type) that ws events and DOM events share at runtime.
// Needed on Node < 22, which lacks a native WebSocket global.
class NodeWebSocket {
  readonly CONNECTING = 0 as const;
  readonly OPEN = 1 as const;
  readonly CLOSING = 2 as const;
  readonly CLOSED = 3 as const;

  onopen: ((this: unknown, ev: Event) => unknown) | null = null;
  onmessage: ((this: unknown, ev: MessageEvent) => unknown) | null = null;
  onclose: ((this: unknown, ev: CloseEvent) => unknown) | null = null;
  onerror: ((this: unknown, ev: Event) => unknown) | null = null;

  private _ws: WsSocket;

  constructor(address: string | URL, protocols?: string | string[]) {
    this._ws = new WsSocket(address, protocols);
    this._ws.onopen = (e) =>
      this.onopen?.call(this, e as unknown as Event);
    this._ws.onmessage = (e) =>
      this.onmessage?.call(this, e as unknown as MessageEvent);
    this._ws.onclose = (e) =>
      this.onclose?.call(this, e as unknown as CloseEvent);
    this._ws.onerror = (e) =>
      this.onerror?.call(this, e as unknown as Event);
  }

  get readyState(): number {
    return this._ws.readyState;
  }
  get url(): string {
    return this._ws.url;
  }
  get protocol(): string {
    return this._ws.protocol;
  }
  get binaryType(): string {
    return this._ws.binaryType;
  }
  set binaryType(value: string) {
    this._ws.binaryType = value as WsSocket["binaryType"];
  }

  close(code?: number, reason?: string): void {
    this._ws.close(code, reason);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    this._ws.send(data);
  }

  addEventListener(type: string, listener: EventListener): void {
    this._ws.addListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this._ws.removeListener(type, listener);
  }
}

export const supabaseServerOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: NodeWebSocket },
};
