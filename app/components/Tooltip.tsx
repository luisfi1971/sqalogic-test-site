"use client";

import { ReactNode, useState } from "react";

export default function Tooltip({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          data-testid="custom-tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-30 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow"
        >
          {content}
        </span>
      )}
    </span>
  );
}
