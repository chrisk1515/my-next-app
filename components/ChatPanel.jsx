'use client';

import React, { useCallback, useMemo, useState } from 'react';

function formatErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'Request failed';
}

export default function ChatPanel({ onClose }) {
  const [prompt, setPrompt] = useState('How can I use this sky to teach wayfinding?');
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);

  const canSend = useMemo(() => prompt.trim().length > 0 && status !== 'loading', [prompt, status]);

  const sendPrompt = useCallback(async () => {
    if (!canSend) return;
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Request failed (${res.status})`);
      }

      setReply(body.reply || 'No reply returned.');
      setStatus('ready');
    } catch (err) {
      setError(formatErrorMessage(err));
      setStatus('error');
    }
  }, [canSend, prompt]);

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        width: 360,
        maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(15,23,42,0.97)',
        border: '1px solid rgba(96,165,250,0.6)',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 18px 40px rgba(2,6,23,0.85)',
        zIndex: 20
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8
        }}
      >
        <div>
          <div style={{ fontWeight: 800 }}>Ask ChatGPT</div>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
            Use this helper to ask teaching questions without leaving the simulator.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: '1px solid rgba(148,163,184,0.8)',
            background: 'rgba(15,23,42,0.95)',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            color: '#e5e7eb'
          }}
        >
          Close
        </button>
      </div>

      <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: 4 }}>Question</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.6)',
          background: 'rgba(15,23,42,0.9)',
          color: '#e5e7eb',
          padding: 10,
          resize: 'vertical',
          minHeight: 90,
          fontSize: '0.92rem'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
          {status === 'loading'
            ? 'Contacting ChatGPT…'
            : status === 'error'
            ? 'Issue sending request'
            : 'Uses your OPENAI_API_KEY server-side only.'}
        </div>
        <button
          type="button"
          disabled={!canSend}
          onClick={sendPrompt}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid rgba(96,165,250,0.8)',
            background: canSend ? 'rgba(37,99,235,0.92)' : 'rgba(15,23,42,0.8)',
            color: canSend ? '#e5e7eb' : '#9ca3af',
            cursor: canSend ? 'pointer' : 'not-allowed',
            fontWeight: 700
          }}
        >
          {status === 'loading' ? 'Sending…' : 'Send to ChatGPT'}
        </button>
      </div>

      {(reply || error) && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: 'rgba(30,41,59,0.9)',
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.5)',
            color: '#e5e7eb',
            minHeight: 60
          }}
        >
          {error ? (
            <div style={{ color: '#fca5a5' }}>Error: {error}</div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{reply}</div>
          )}
        </div>
      )}
    </div>
  );
}
