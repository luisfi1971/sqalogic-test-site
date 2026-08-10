# Test controls

Two knobs the site exposes to automation, both selected **per request** and both
**off by default**. A request with no `variant=` and no `delay=` behaves exactly
as this site always has — including the global "Simulate New Release" counter,
which is untouched by everything on this page.

| Knob | Query parameter | Cookie (opt-in) | Default |
| --- | --- | --- | --- |
| Breakage variant | `?variant=<name>` | `sqa_variant` | `none` |
| Injected jitter | `?delay=<spec>` | `sqa_delay` | current random behaviour |

A launcher listing every variant as a real link lives at **`/practice`**.

---

## 1. Breakage variants

### URL form

```
https://<host>/search?variant=<name>
https://<host>/search?variant=<name>&sticky=1     # also mirror into a cookie
```

`<name>` is one of:

| Name | What changes on `/search` |
| --- | --- |
| `none` | Nothing. Explicit baseline. Also what an unknown name resolves to. |
| `id-rotation` | Every `id` and `data-testid` on the search form gains the suffix `r2b9`: `search-submit` → `search-submit-r2b9`, `search-from` → `search-from-r2b9`, `search-to` → `search-to-r2b9`, `search-form` → `search-form-r2b9`, and the passenger counter's `id` gains `_r2b9`. Roles, labels and visible text are untouched. |
| `text-change` | The submit control reads **Find Flights** and the page heading reads **Flight search**. Nothing else moves. |
| `type-change` | The submit control is rendered as the *opposite* element type from whatever the current release renders — real `<button>` ↔ `<div role="button">`. Its role (`button`) and accessible name are identical either way, so only a tag-name-based locator breaks. |
| `moved-container` | The **To** field keeps its label, role and accessible name but gains two ancestors: `form > section[data-section="route-details"] > fieldset > div`. Structural / XPath locators anchored on the old chain break. |
| `sibling-reorder` | **From** and **To** swap places in the DOM (and on screen). Ordinal binding — "the second combobox in the form" — now selects the wrong field. |
| `element-removed` | The submit control is not rendered at all. With this variant the search form cannot be submitted from the page; that is the point. |

The resolved name is echoed on the page wrapper as `data-variant="<name>"`, in the
HTML and in the RSC payload, so a run can assert which variant it actually got
rather than assuming.

### Why per-request, and why not a rewriting proxy

- **No server-side state.** The variant is read from the request (query string,
  then cookie) inside the `/search` Server Component and passed down as a prop.
  Nothing is stored between requests, so two concurrent runs with different
  variants cannot see each other's — verified with interleaved concurrent
  requests, 12 each, zero cross-talk.
- **It survives client-side navigation.** `/search` is a Server Component, so the
  variant is part of the RSC flight payload (`content-type: text/x-component`,
  carrying `{"variant":"…"}`), not only the initial HTML document. An HTML
  rewriting proxy mutates the document and misses `?_rsc=` responses entirely,
  which is why a client-side navigation used to serve an unmutated tree.
- **Unknown values never throw.** `?variant=whatever` resolves to `none`.

### Stickiness (`&sticky=1`)

By default nothing is persisted — the variant applies to the request that asked
for it and leaves no residue. Add `&sticky=1` and the value is mirrored into the
`sqa_variant` cookie (path `/`, SameSite=Lax, session lifetime) so it survives
navigations that drop the query string:

```
/search?variant=moved-container&sticky=1   # set
/search                                    # still moved-container
/search?variant=text-change                # query always outranks the cookie
/search?variant=none&sticky=1              # clear
```

The cookie lives in a browser profile, so separate browser contexts still cannot
collide. Two runs sharing one profile can — use the query parameter for those.

### Scope

Variants currently affect **`/search`** only. To bring another page in: make its
`page.tsx` a Server Component, resolve the variant with `parseVariant` from
`app/lib/testControls.ts` exactly as `app/search/page.tsx` does, and hand it to
the client component as a prop. Resolving it in a client component instead would
put it back outside the RSC payload, which is the bug this design exists to
avoid.

### Relationship to "Simulate New Release"

Unchanged and untouched. The global `release` counter in Supabase and the amber
header button still rotate ids, deepen wrappers and flip the submit element on
their own schedule for every visitor. Variants sit *on top* of whatever the
current release renders — that is why `type-change` is defined as a flip rather
than an absolute state.

One overlap worth knowing: on **even** release numbers the baseline submit label
is already `Find Flights`, so `text-change` produces no delta on that one string.
It always changes the heading to `Flight search`, so the variant is observable in
every release.

---

## 2. Determinism switch

`randomDelay()` injects jitter before the search submit navigates. It is good for
demoing flakiness and useless for measuring a pass rate, so it can be pinned:

```
/search?delay=off        # resolve immediately
/search?delay=250        # always wait exactly 250 ms (0–10000, capped)
/search?delay=seed:42    # same distribution as today, from a seeded PRNG
/search                  # unchanged: Math.random(), scaled by the release counter
/search?delay=off&sticky=1   # mirror into the sqa_delay cookie
```

- Omitting `delay` reproduces the historical behaviour byte for byte, including
  the "no delay below release 2" rule.
- `off` and a fixed value apply regardless of the release number.
- `seed:<n>` only affects the *value* of the jitter, not whether it happens: at
  release 1 there is still no delay, exactly as today.
- Measured on a production build: `?delay=1500` → 1547 ms to reach `/results`;
  `?delay=off` → 22 ms.

The mode is read from `window.location.search` at the moment `randomDelay()` is
called, then from the `sqa_delay` cookie. Nothing is cached, so two tabs on two
different `?delay=` values behave differently.

---

## 3. Practice pages

Self-contained pages under `/practice`, linked from the header and the home page,
covering automation archetypes the booking flow does not exercise.

| Route | Archetype | Notable hooks |
| --- | --- | --- |
| `/practice/table` | Data table — 137 rows, sortable columns, text filter, page-size selector, pagination | `[data-testid="reservations-table"]`, `[data-testid="table-filter"]`, `[data-sort-key]`, `th[aria-sort]`, `[data-testid="table-page-indicator"]` |
| `/practice/wizard` | 4-step wizard carrying state, per-step validation, free back-navigation, review step | `[data-testid="wizard-panel"][data-step]`, `[data-testid="wizard-errors"]`, `[data-review]`, `[data-testid="wizard-reference"]` |
| `/practice/upload` | File upload with a validation failure path (wrong extension, over 2 MB, nothing attached) | `[data-testid="upload-input"]`, `[data-testid="upload-error"]`, `[data-testid="upload-attached"]`, `[data-testid="upload-ok"]` |
| `/practice/autocomplete` | Async typeahead, ~300 ms debounce, arrow keys / Enter / Escape, `role=combobox` + `aria-activedescendant` | `[data-testid="autocomplete-input"]`, `#ac-listbox [role="option"]`, `[data-testid="autocomplete-loading"]` |
| `/practice/feed` | Infinite scroll — 200 items, 20 at a time, IntersectionObserver; rows do not exist in the DOM until scrolled | `[data-testid="deal-feed"]`, `[data-deal-id]`, `[data-testid="feed-count"]`, `[data-testid="feed-end"]` |
| `/practice/iframe` | Form inside a same-origin iframe at `/embed/support`; the parent picks up the ticket reference via `postMessage` | `#support-frame`, inside the frame `[data-testid="support-form"]`, in the parent `[data-testid="parent-ticket-ref"]` |

All fixtures are pure functions of a fixed seed (`app/practice/data.ts`) — no
`Math.random()`, no `Date.now()` — so rows are identical on every render and in
every run.

### The one deliberately unlabelled control

`/practice/table` has a single icon-only button that toggles row density:

```html
<button type="button" data-control="density"><span aria-hidden="true">≡</span></button>
```

It has no `aria-label`, no `title`, and its only content is `aria-hidden`, so its
computed accessible name is **empty**. This is intentional and it is the only one
on the site: a real, legitimately hard locator case, present once so it can be
tested on purpose rather than tripped over. Every other control on every page has
a sane role and accessible name.

---

## Quick reference

```
/search?variant=none|id-rotation|text-change|type-change|moved-container|sibling-reorder|element-removed
/search?variant=<name>&sticky=1
/search?delay=off|<ms>|seed:<n>
/search?delay=<spec>&sticky=1
/practice
```
