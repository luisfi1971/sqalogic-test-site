"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { feedPage, type FeedItem } from "../data";

const PAGE = 20;
const LOAD_MS = 400;

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>(() => feedPage(0, PAGE).items);
  const [total] = useState(() => feedPage(0, 1).total);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setTimeout(() => {
      setItems((prev) => {
        if (prev.length >= total) return prev;
        return [...prev, ...feedPage(prev.length, PAGE).items];
      });
      setLoading(false);
      loadingRef.current = false;
    }, LOAD_MS);
  }, [total]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "120px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  const done = items.length >= total;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Last-minute deals</h1>
      <p className="mt-2 text-sm text-slate-600">
        {total} deals, {PAGE} at a time. Nothing below the fold exists in the DOM until
        you scroll to it.
      </p>

      <p className="mt-3 text-xs text-slate-500" aria-live="polite" data-testid="feed-count">
        {items.length} of {total} deals loaded
      </p>

      <ul className="mt-4 space-y-3" data-testid="deal-feed">
        {items.map((d) => (
          <li
            key={d.id}
            className="card flex flex-wrap items-center justify-between gap-4"
            data-deal-id={d.id}
          >
            <div>
              <div className="font-semibold">{d.title}</div>
              <div className="text-sm text-slate-600">{d.route}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500">{d.seats} seats left</div>
              <div className="text-xl font-bold">${d.price}</div>
            </div>
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} className="h-10" data-testid="feed-sentinel" aria-hidden="true" />

      {loading && (
        <p className="py-4 text-center text-sm text-slate-500" data-testid="feed-loading">
          Loading more deals…
        </p>
      )}

      {done && (
        <p className="py-6 text-center text-sm font-medium text-slate-500" data-testid="feed-end">
          That&apos;s every deal — {total} of {total}.
        </p>
      )}

      {!done && !loading && (
        <div className="py-4 text-center">
          <button type="button" className="btn-ghost" onClick={loadMore}>
            Load more deals
          </button>
        </div>
      )}
    </div>
  );
}
