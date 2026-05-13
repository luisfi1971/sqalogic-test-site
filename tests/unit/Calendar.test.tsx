import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Calendar from "@app/components/Calendar";

function setup(initial = "") {
  const onChange = vi.fn();
  const utils = render(<Calendar value={initial} onChange={onChange} />);
  return { onChange, ...utils };
}

describe("<Calendar>", () => {
  it("U-06 shows placeholder when no value", () => {
    setup();
    expect(screen.getByRole("button", { name: /date/i })).toHaveTextContent("Pick a date");
  });

  it("U-06b renders selected date in short format", () => {
    setup("2026-05-15");
    expect(screen.getByRole("button", { name: /date/i })).toHaveTextContent("May 15, 2026");
  });

  it("U-06c opens dialog on click and shows days", async () => {
    const user = userEvent.setup();
    setup("2026-05-15");
    await user.click(screen.getByRole("button", { name: /date/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("May 2026")).toBeInTheDocument();
  });

  it("U-06d calls onChange with ISO when a day is picked", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("2026-05-15");
    await user.click(screen.getByRole("button", { name: /date/i }));
    const dialog = await screen.findByRole("dialog");
    const day20 = within(dialog).getByRole("button", { name: "20" });
    await user.click(day20);
    expect(onChange).toHaveBeenCalledWith("2026-05-20");
  });

  it("U-07 navigates December -> January (year rollover)", async () => {
    const user = userEvent.setup();
    setup("2026-12-10");
    await user.click(screen.getByRole("button", { name: /date/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /next month/i }));
    expect(within(dialog).getByText("January 2027")).toBeInTheDocument();
  });

  it("U-07b leap year February has 29 days in 2028", async () => {
    const user = userEvent.setup();
    setup("2028-02-01");
    await user.click(screen.getByRole("button", { name: /date/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "29" })).toBeInTheDocument();
  });

  it("U-07c non-leap year February 2027 has 28 days", async () => {
    const user = userEvent.setup();
    setup("2027-02-01");
    await user.click(screen.getByRole("button", { name: /date/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "29" })).not.toBeInTheDocument();
  });

  it("U-06e ignores malformed ISO input", () => {
    setup("not-a-date");
    expect(screen.getByRole("button", { name: /date/i })).toHaveTextContent("Pick a date");
  });
});
