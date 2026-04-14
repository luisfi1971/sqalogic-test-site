"use client";

import { useEffect, useRef } from "react";

export default function ShadowInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || host.shadowRoot) return;
    const root = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host { display: block; }
      .wrap { display: flex; flex-direction: column; gap: 4px; }
      label { font-size: 12px; font-weight: 500; color: #334155; }
      input {
        width: 100%; padding: 8px 12px; font-size: 14px;
        border: 1px solid #cbd5e1; border-radius: 6px;
        outline: none; background: white;
      }
      input:focus { border-color: #2f80ed; box-shadow: 0 0 0 2px rgba(47,128,237,.25); }
    `;

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const lbl = document.createElement("label");
    lbl.textContent = label;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder || "";
    input.value = value;
    input.setAttribute("data-shadow-field", label.toLowerCase());
    input.addEventListener("input", (e) => {
      onChange((e.target as HTMLInputElement).value);
    });
    inputRef.current = input;

    wrap.appendChild(lbl);
    wrap.appendChild(input);
    root.appendChild(style);
    root.appendChild(wrap);
  }, [label, placeholder]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return <div ref={hostRef} data-shadow-host={label.toLowerCase()} />;
}
