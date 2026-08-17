"use client";

import { useEffect, useState } from "react";

// TEMPORARY — diagnosing a real-device-only bug (intro-gate isn't
// interactive on iOS Safari/Chrome despite working in every emulated test).
// Surfaces any JS error directly on the page since the reporter has no easy
// way to attach a remote Web Inspector. Remove once the root cause is found.
export function DebugErrorOverlay() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const push = (text: string) => setMessages((prev) => [...prev, text]);

    const onError = (event: ErrorEvent) => {
      push(`Error: ${event.message} (${event.filename}:${event.lineno}:${event.colno})`);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      push(`Unhandled rejection: ${String(event.reason?.stack || event.reason)}`);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    push(`Debug overlay mounted. UA: ${navigator.userAgent}`);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        maxHeight: "40vh",
        overflowY: "auto",
        background: "rgba(200,0,0,0.95)",
        color: "white",
        fontSize: "11px",
        fontFamily: "monospace",
        padding: "8px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {messages.map((m, i) => (
        <div key={i} style={{ marginBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 6 }}>
          {m}
        </div>
      ))}
    </div>
  );
}
