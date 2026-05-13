import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SeatMap from "@app/components/SeatMap";

describe("<SeatMap>", () => {
  it("U-09 renders 72 seats (12 rows x 6 cols)", () => {
    render(<SeatMap flightId="FL-1001-0" value={null} onChange={() => {}} />);
    expect(document.querySelectorAll("[data-seat-id]").length).toBe(72);
  });

  it("U-09b ignores clicks on taken seats", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SeatMap flightId="FL-1001-0" value={null} onChange={onChange} />);
    const taken = document.querySelector('[data-seat-status="taken"]') as Element;
    await user.click(taken);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("U-09c selects a free seat with its id", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SeatMap flightId="FL-1001-0" value={null} onChange={onChange} />);
    const free = document.querySelector('[data-seat-status="free"]') as Element;
    const id = free.getAttribute("data-seat-id");
    await user.click(free);
    expect(onChange).toHaveBeenCalledWith(id);
  });

  it("U-09d clicking the selected seat again deselects (onChange null)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SeatMap flightId="FL-1001-0" value="5C" onChange={onChange} />);
    const selected = document.querySelector('[data-seat-id="5C"]') as Element;
    await user.click(selected);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("U-09e seat generation is deterministic per flightId", () => {
    const { unmount } = render(<SeatMap flightId="FL-1001-0" value={null} onChange={() => {}} />);
    const ids1 = [...document.querySelectorAll('[data-seat-status="taken"]')].map((e) =>
      e.getAttribute("data-seat-id")
    );
    unmount();
    render(<SeatMap flightId="FL-1001-0" value={null} onChange={() => {}} />);
    const ids2 = [...document.querySelectorAll('[data-seat-status="taken"]')].map((e) =>
      e.getAttribute("data-seat-id")
    );
    expect(ids1).toEqual(ids2);
  });

  it("U-09f shows 'Selected: X' label when value is set", () => {
    render(<SeatMap flightId="FL-1001-0" value="7B" onChange={() => {}} />);
    expect(document.querySelector("[data-selected-seat='7B']")).toBeInTheDocument();
  });
});
