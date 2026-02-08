import { browser } from '$app/environment';

export type EmbedInitPayload = {
  balance?: number;
  betAmount?: number;
  rowCount?: number;
  riskLevel?: string;
  sessionId?: string;
  userId?: string;
  targetOrigin?: string;
};

export type EmbedContext = {
  sessionId?: string;
  userId?: string;
};

export type EmbedBridgeHandlers = {
  onInit?: (payload: EmbedInitPayload, origin: string) => void;
  onBalance?: (payload: { balance?: number }) => void;
  onConfig?: (payload: { betAmount?: number; rowCount?: number; riskLevel?: string }) => void;
  onReset?: () => void;
};

let targetOrigin = '*';
let embedEnabled = false;
let embedContext: EmbedContext = {};

const isEmbedMessage = (data: unknown): data is { type: string; payload?: unknown } => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  return typeof (data as { type?: unknown }).type === 'string';
};

export const isEmbedMode = (): boolean => {
  if (!browser) {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  const explicitEmbed = ['1', 'true', 'yes'].includes(params.get('embed') ?? '');
  try {
    return explicitEmbed || window.self !== window.top;
  } catch {
    return true;
  }
};

const ensureEmbedEnabled = () => {
  if (!embedEnabled) {
    embedEnabled = isEmbedMode();
  }
  return embedEnabled;
};

export const emitEmbedEvent = (type: string, payload?: unknown) => {
  if (!browser || !ensureEmbedEnabled()) {
    return;
  }
  window.parent?.postMessage({ type, payload }, targetOrigin);
};

export const setEmbedContext = (payload: EmbedInitPayload) => {
  embedContext = {
    sessionId: payload.sessionId,
    userId: payload.userId,
  };
};

export const getEmbedContext = () => embedContext;

export const emitEmbedEventWithContext = (type: string, payload?: Record<string, unknown>) => {
  if (!browser || !ensureEmbedEnabled()) {
    return;
  }
  const context = getEmbedContext();
  window.parent?.postMessage(
    {
      type,
      payload: payload ? { ...payload, ...context } : context,
    },
    targetOrigin,
  );
};

export const setupEmbedBridge = (handlers: EmbedBridgeHandlers = {}) => {
  if (!browser) {
    return () => undefined;
  }

  embedEnabled = isEmbedMode();
  if (!embedEnabled) {
    return () => undefined;
  }

  const handler = (event: MessageEvent) => {
    if (!isEmbedMessage(event.data)) {
      return;
    }

    const { type, payload } = event.data;

    switch (type) {
      case 'plinko:init': {
        const payloadData = (payload ?? {}) as EmbedInitPayload;
        if (payloadData.targetOrigin) {
          targetOrigin = payloadData.targetOrigin;
        } else if (event.origin) {
          targetOrigin = event.origin;
        }
        setEmbedContext(payloadData);
        handlers.onInit?.(payloadData, event.origin);
        break;
      }
      case 'plinko:set-balance': {
        handlers.onBalance?.((payload ?? {}) as { balance?: number });
        break;
      }
      case 'plinko:config': {
        handlers.onConfig?.((payload ?? {}) as {
          betAmount?: number;
          rowCount?: number;
          riskLevel?: string;
        });
        break;
      }
      case 'plinko:reset': {
        handlers.onReset?.();
        break;
      }
      default:
        break;
    }
  };

  window.addEventListener('message', handler);
  emitEmbedEvent('plinko:ready', {
    timestamp: Date.now(),
    pathname: window.location.pathname,
  });

  return () => {
    window.removeEventListener('message', handler);
  };
};
