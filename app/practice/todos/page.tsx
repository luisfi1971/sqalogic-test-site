"use client";

import { useEffect, useState } from "react";

type Todo = { id: number; title: string; done: boolean };
type Filter = "all" | "active" | "completed";

function filterFromHash(hash: string): Filter {
  if (hash === "#/active") return "active";
  if (hash === "#/completed") return "completed";
  return "all";
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const sync = () => setFilter(filterFromHash(window.location.hash));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const add = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const title = draft.trim();
    if (!title) return;
    setTodos((t) => [...t, { id: Date.now() + t.length, title, done: false }]);
    setDraft("");
  };

  const left = todos.filter((t) => !t.done).length;
  const shown = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );
  const link = (h: string, label: string, f: Filter) => (
    <a
      href={h}
      className={filter === f ? "font-semibold underline" : "hover:underline"}
      aria-current={filter === f ? "page" : undefined}
    >
      {label}
    </a>
  );

  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">
        A single-page task list. Filters are hash links; nothing reloads. The list and
        footer appear only once an item exists.
      </p>
      <section className="mx-auto max-w-md rounded border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 p-4">
          <h1 className="text-3xl font-light text-rose-400">todos</h1>
          <input
            className="input mt-3"
            placeholder="What needs to be done?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={add}
            autoFocus
          />
        </header>
        {todos.length > 0 && (
          <>
            <section>
              <ul>
                {shown.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() =>
                        setTodos((all) =>
                          all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x))
                        )
                      }
                    />
                    <label className={t.done ? "text-slate-400 line-through" : ""}>
                      {t.title}
                    </label>
                  </li>
                ))}
              </ul>
            </section>
            <footer className="flex items-center justify-between p-3 text-sm">
              <span>
                <strong>{left}</strong> {left === 1 ? "item" : "items"} left
              </span>
              <nav className="flex gap-3" aria-label="Filters">
                {link("#/", "All", "all")}
                {link("#/active", "Active", "active")}
                {link("#/completed", "Completed", "completed")}
              </nav>
              {todos.some((t) => t.done) && (
                <button
                  className="text-slate-600 hover:underline"
                  onClick={() => setTodos((all) => all.filter((t) => !t.done))}
                >
                  Clear completed
                </button>
              )}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
