import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Booking } from "@app/providers";

// Row actions on My Trips (issue #1) — the DOM target for the canon's
// `table.actInRow` composite: find the row where a column equals a value, then
// act on a control inside that row.

const state = vi.hoisted(() => ({
  bookings: [] as unknown[],
  release: 1,
  cancelBooking: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@app/providers", () => ({
  useBooking: () => ({
    bookings: state.bookings,
    addBooking: vi.fn(),
    cancelBooking: state.cancelBooking,
    pending: null,
    setPending: vi.fn(),
    loading: false,
  }),
  useRelease: () => ({
    release: state.release,
    bump: vi.fn(),
    dynId: (base: string) => `${base}_v${state.release}`,
    dynClass: (base: string) => `${base}-x${state.release}`,
    attrs: (base: string) =>
      state.release >= 4
        ? { "data-qa": `${base}-r${state.release}` }
        : state.release >= 3
          ? { "data-testid": undefined, id: undefined }
          : { "data-testid": base, id: `${base}_v${state.release}` },
    randomDelay: vi.fn(),
  }),
  useToast: () => ({ toasts: [], toast: state.toast, dismiss: vi.fn() }),
}));

import MyTripsPage from "@app/my-trips/page";

const cancelBooking = state.cancelBooking;
const toast = state.toast;
function setBookings(list: Booking[]) {
  state.bookings = list;
}
function setRelease(r: number) {
  state.release = r;
}

function trip(over: Partial<Booking> = {}): Booking {
  return {
    id: "BK-DEMO1",
    flightId: "FL-1001-0",
    from: "YUL - Montreal",
    to: "JFK - New York",
    date: "2026-05-01",
    passenger: "Demo User",
    price: 320,
    createdAt: "2026-04-01T12:00:00Z",
    seat: "12A",
    baggage: false,
    status: "active",
    ...over,
  };
}

/** Locate a row by the value of a column, the way `table.actInRow` would. */
function rowWhere(text: string) {
  const rows = screen.getAllByRole("row").filter((r) => within(r).queryAllByRole("cell").length > 0);
  const matches = rows.filter((r) =>
    within(r)
      .getAllByRole("cell")
      .some((c) => c.textContent?.trim() === text)
  );
  return { matches, one: matches[0] };
}

beforeEach(() => {
  cancelBooking.mockClear();
  toast.mockClear();
  setRelease(1);
  setBookings([
    trip(),
    trip({ id: "BK-DEMO2", from: "YYZ - Toronto", to: "LHR - London", date: "2026-06-14", price: 890 }),
    trip({ id: "BK-DEMO3", from: "GRU - Sao Paulo", to: "CDG - Paris", date: "2026-07-22", price: 1240 }),
    // Same route as BK-DEMO1 on purpose: mirrors the RegressAir duplication on
    // /results so that row-where by "To" is ambiguous and must be narrowed.
    trip({ id: "BK-DEMO4", date: "2026-09-08", price: 415 }),
  ]);
});

describe("<MyTripsPage> row actions", () => {
  it("U-11 renders a View and a Cancel control in every row", () => {
    render(<MyTripsPage />);
    expect(screen.getAllByRole("button", { name: "View" })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(4);
  });

  it("U-11a scoping to the row where Reference = BK-DEMO2 finds exactly one Cancel", () => {
    render(<MyTripsPage />);
    const { matches, one } = rowWhere("BK-DEMO2");
    expect(matches).toHaveLength(1);
    expect(within(one).getAllByRole("button", { name: "Cancel" })).toHaveLength(1);
  });

  it("U-11b row-where by a duplicated column stays ambiguous (matchCount 2)", () => {
    render(<MyTripsPage />);
    // Two trips share this destination — the canon's matchCount === 1 discipline
    // must reject this and force disambiguation by a second column.
    expect(rowWhere("JFK - New York").matches).toHaveLength(2);
  });

  it("U-11c Cancel opens a confirmation dialog naming that row's trip", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO2").one).getByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/BK-DEMO2/)).toBeInTheDocument();
    expect(cancelBooking).not.toHaveBeenCalled();
  });

  it("U-11d confirming the dialog cancels that row's booking", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO2").one).getByRole("button", { name: "Cancel" }));
    await user.click(await screen.findByTestId("confirm-modal-ok"));
    expect(cancelBooking).toHaveBeenCalledExactlyOnceWith("BK-DEMO2");
  });

  it("U-11d2 confirming raises a toast naming the cancelled trip", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO2").one).getByRole("button", { name: "Cancel" }));
    await user.click(await screen.findByTestId("confirm-modal-ok"));
    expect(toast).toHaveBeenCalledExactlyOnceWith("Trip BK-DEMO2 cancelled", "info");
  });

  it("U-11e dismissing the dialog cancels nothing", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO3").one).getByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Keep trip" }));
    expect(cancelBooking).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("U-11f a cancelled row shows its status and offers no Cancel", () => {
    setBookings([trip({ id: "BK-GONE", status: "cancelled" }), trip()]);
    render(<MyTripsPage />);
    const row = rowWhere("BK-GONE").one;
    expect(within(row).getByText("Cancelled")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(within(rowWhere("BK-DEMO1").one).getByRole("button", { name: "Cancel" })).toBeEnabled();
  });

  it("U-11g View opens a details dialog for that row only", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO3").one).getByRole("button", { name: "View" }));
    const dialog = await screen.findByRole("dialog", { name: "Trip BK-DEMO3" });
    expect(within(dialog).getByText(/GRU - Sao Paulo/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/BK-DEMO1/)).not.toBeInTheDocument();
  });

  it("U-11h action controls share a testid across rows but keep unique DOM ids", () => {
    render(<MyTripsPage />);
    // Shared hook => selecting by it alone is ambiguous by design, which is what
    // forces a real row-where instead of a lucky global match.
    const cancels = document.querySelectorAll('[data-testid="trip-cancel"]');
    expect(cancels).toHaveLength(4);
    const ids = Array.from(cancels).map((el) => el.id);
    expect(new Set(ids).size).toBe(4);
  });

  it("U-12 every row offers a checkbox, plus one select-all in the header", () => {
    render(<MyTripsPage />);
    expect(screen.getAllByTestId("trip-select")).toHaveLength(4);
    expect(screen.getByTestId("trips-select-all")).toBeInTheDocument();
  });

  it("U-12a Cancel selected is inert until something is selected", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    expect(screen.getByTestId("trips-cancel-selected")).toBeDisabled();

    await user.click(within(rowWhere("BK-DEMO2").one).getByRole("checkbox"));
    expect(screen.getByTestId("trips-cancel-selected")).toBeEnabled();
    expect(screen.getByTestId("trips-selection-count")).toHaveTextContent("1 selected");
  });

  it("U-12b select-all takes every selectable row on the page", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(screen.getByTestId("trips-select-all"));
    expect(screen.getByTestId("trips-selection-count")).toHaveTextContent("4 selected");
    await user.click(screen.getByTestId("trips-select-all"));
    expect(screen.getByTestId("trips-selection-count")).toHaveTextContent("0 selected");
  });

  it("U-12c a cancelled row cannot be selected — there is nothing left to cancel", () => {
    setBookings([trip({ id: "BK-GONE", status: "cancelled" }), trip()]);
    render(<MyTripsPage />);
    expect(within(rowWhere("BK-GONE").one).getByRole("checkbox")).toBeDisabled();
    expect(within(rowWhere("BK-DEMO1").one).getByRole("checkbox")).toBeEnabled();
  });

  it("U-12d select-all goes indeterminate on a partial selection", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO2").one).getByRole("checkbox"));
    expect((screen.getByTestId("trips-select-all") as HTMLInputElement).indeterminate).toBe(true);
    expect(screen.getByTestId("trips-select-all")).not.toBeChecked();
  });

  it("U-12e the selection survives re-sorting, because it is keyed by reference", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO2").one).getByRole("checkbox"));

    // Re-sort by price; BK-DEMO2 lands in a different row position.
    await user.click(document.querySelector('[data-sort-key="price"]') as Element);

    expect(screen.getByTestId("trips-selection-count")).toHaveTextContent("1 selected");
    expect(within(rowWhere("BK-DEMO2").one).getByRole("checkbox")).toBeChecked();
  });

  it("U-12f bulk cancel confirms, then cancels each selected reference once", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO2").one).getByRole("checkbox"));
    await user.click(within(rowWhere("BK-DEMO3").one).getByRole("checkbox"));
    await user.click(screen.getByTestId("trips-cancel-selected"));

    const dialog = await screen.findByTestId("bulk-cancel-modal");
    expect(within(dialog).getByTestId("bulk-cancel-list")).toHaveTextContent("BK-DEMO2");
    expect(within(dialog).getByTestId("bulk-cancel-list")).toHaveTextContent("BK-DEMO3");
    expect(cancelBooking).not.toHaveBeenCalled();

    await user.click(await screen.findByTestId("bulk-cancel-modal-ok"));
    expect(cancelBooking).toHaveBeenCalledTimes(2);
    expect(cancelBooking).toHaveBeenCalledWith("BK-DEMO2");
    expect(cancelBooking).toHaveBeenCalledWith("BK-DEMO3");
    expect(toast).toHaveBeenCalledExactlyOnceWith("2 trips cancelled", "info");
  });

  it("U-12g backing out of the bulk dialog cancels nothing and keeps the selection", async () => {
    const user = userEvent.setup();
    render(<MyTripsPage />);
    await user.click(within(rowWhere("BK-DEMO2").one).getByRole("checkbox"));
    await user.click(screen.getByTestId("trips-cancel-selected"));
    await user.click(await screen.findByRole("button", { name: "Keep them" }));

    expect(cancelBooking).not.toHaveBeenCalled();
    expect(screen.getByTestId("trips-selection-count")).toHaveTextContent("1 selected");
  });

  it("U-11i the controls rot with Simulate New Release", () => {
    const { unmount } = render(<MyTripsPage />);
    expect(document.querySelectorAll('[data-testid="trip-cancel"]')).toHaveLength(4);
    unmount();

    setRelease(4);
    render(<MyTripsPage />);
    // Instability is the feature: at r4 the testid is gone and data-qa took over.
    expect(document.querySelectorAll('[data-testid="trip-cancel"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-qa^="trip-cancel-r4"]')).toHaveLength(4);
    // ...but the accessible name survives, so row-where + role/name still works.
    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(4);
  });
});
