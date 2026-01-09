'use client';

import React, { useMemo } from 'react';
import { message as antdMessage } from 'antd';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';

const DEFAULT_DURATIONS = { success: 3, info: 3, warning: 4, error: 5, loading: 0 };
const onceRegistry = new Map();

function isPlainObject(v) {
  if (!v || typeof v !== 'object') return false;
  if (Array.isArray(v)) return false;
  return Object.getPrototypeOf(v) === Object.prototype;
}

function normalizeError(err, fallback) {
  if (!err) return fallback ?? 'Terjadi kesalahan.';
  if (typeof err === 'string' || typeof err === 'number') return String(err);
  if (err instanceof Error) return err.message || fallback || 'Terjadi kesalahan.';
  const msg = err?.message || err?.error || err?.data?.message || err?.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  try {
    return JSON.stringify(err);
  } catch {
    return fallback ?? 'Terjadi kesalahan.';
  }
}

function normalizeContent(content) {
  if (content == null) return null;

  if (content instanceof Error) {
    const msg = normalizeError(content, 'Terjadi kesalahan.');
    return (
      <AppTypography.Text
        size={13}
        weight={600}
        className='text-slate-800'
      >
        {msg}
      </AppTypography.Text>
    );
  }

  if (typeof content === 'string' || typeof content === 'number') {
    return (
      <AppTypography.Text
        size={13}
        weight={600}
        className='text-slate-800'
      >
        {String(content)}
      </AppTypography.Text>
    );
  }

  if (isPlainObject(content) && (content.title || content.description)) {
    return (
      <div className='min-w-0'>
        {content.title ? (
          <AppTypography.Text
            size={13}
            weight={700}
            className='text-slate-900 block'
          >
            {String(content.title)}
          </AppTypography.Text>
        ) : null}
        {content.description ? (
          <AppTypography.Text
            size={12}
            weight={600}
            tone='secondary'
            className='block mt-0.5'
          >
            {String(content.description)}
          </AppTypography.Text>
        ) : null}
      </div>
    );
  }

  return content;
}

function withFontStyle(style) {
  const base = { fontFamily };
  if (!style) return base;
  return { ...base, ...style };
}

function toOpenConfig(type, a, b, c) {
  if (isPlainObject(a)) {
    const cfg = { ...a };
    if (type && !cfg.type) cfg.type = type;
    return cfg;
  }

  const cfg = { type, content: a };

  if (typeof b === 'number') cfg.duration = b;
  else if (typeof b === 'function') cfg.onClose = b;
  else if (isPlainObject(b)) Object.assign(cfg, b);

  if (typeof c === 'function') cfg.onClose = c;
  else if (isPlainObject(c)) Object.assign(cfg, c);

  return cfg;
}

function openInternal(api, config) {
  if (!config) return;

  const merged = {
    ...config,
    content: normalizeContent(config.content),
    style: withFontStyle(config.style),
  };

  if (merged.duration == null && merged.type && DEFAULT_DURATIONS[merged.type] != null) {
    merged.duration = DEFAULT_DURATIONS[merged.type];
  }

  if (merged.dedupeKey && merged.key == null) merged.key = merged.dedupeKey;

  return api.open(merged);
}

function makeShortcut(api, type) {
  return (a, b, c) => openInternal(api, toOpenConfig(type, a, b, c));
}

function stateToConfig(type, state) {
  if (isPlainObject(state)) return { type, ...state };
  if (state == null) return { type };
  return { type, content: state };
}

function createApi(api) {
  const wrapped = {
    open: (config) => openInternal(api, config),

    success: makeShortcut(api, 'success'),
    info: makeShortcut(api, 'info'),
    warning: makeShortcut(api, 'warning'),
    error: makeShortcut(api, 'error'),
    loading: makeShortcut(api, 'loading'),

    destroy: (key) => api.destroy(key),
    config: (cfg) => antdMessage.config(cfg),

    errorFrom: (err, fallbackOrConfig, maybeConfig) => {
      const fallback = typeof fallbackOrConfig === 'string' ? fallbackOrConfig : undefined;
      const cfg = isPlainObject(fallbackOrConfig) ? fallbackOrConfig : isPlainObject(maybeConfig) ? maybeConfig : {};
      return wrapped.error({ ...cfg, content: normalizeError(err, fallback) });
    },

    once: (typeOrConfig, maybeContent, maybeCfg) => {
      const cfg = isPlainObject(typeOrConfig) ? { ...typeOrConfig } : toOpenConfig(typeOrConfig, maybeContent, maybeCfg);

      const key = cfg.onceKey || cfg.dedupeKey || cfg.key || (typeof cfg.content === 'string' || typeof cfg.content === 'number' ? String(cfg.content) : undefined);

      const ttl = typeof cfg.onceTtlMs === 'number' ? cfg.onceTtlMs : 1500;

      if (!key) return openInternal(api, cfg);

      const now = Date.now();
      const last = onceRegistry.get(String(key)) || 0;
      if (now - last < ttl) return;
      onceRegistry.set(String(key), now);

      return openInternal(api, cfg);
    },

    promise: async (promise, states) => {
      const key = states?.key ?? states?.dedupeKey ?? 'app-message-promise';
      const loadingCfg = stateToConfig('loading', states?.loading ?? { content: 'Memproses...', duration: 0 });
      if (loadingCfg.duration == null) loadingCfg.duration = 0;
      openInternal(api, { ...loadingCfg, key });

      try {
        const result = await promise;
        const successCfg = stateToConfig('success', states?.success ?? { content: 'Berhasil.' });
        openInternal(api, { ...successCfg, key });
        return result;
      } catch (err) {
        const errorCfg = stateToConfig('error', states?.error ?? { content: 'Gagal.' });
        const fallback = typeof errorCfg.content === 'string' ? errorCfg.content : undefined;
        openInternal(api, { ...errorCfg, key, content: normalizeError(err, fallback) });
        throw err;
      }
    },
  };

  return wrapped;
}

export function useAppMessage(options) {
  const [api, contextHolder] = antdMessage.useMessage(options);
  const wrapped = useMemo(() => createApi(api), [api]);
  return { message: wrapped, contextHolder };
}

export function AppMessageStyles() {
  return (
    <style
      jsx
      global
    >{`
      .ant-message,
      .ant-message-notice,
      .ant-message-notice-content,
      .ant-message-notice-content * {
        font-family: ${fontFamily} !important;
      }
    `}</style>
  );
}

const AppMessage = createApi(antdMessage);
export default AppMessage;
