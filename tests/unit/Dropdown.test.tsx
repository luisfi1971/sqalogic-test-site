import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dropdown from "@app/components/Dropdown";

const OPTIONS = ["YUL - Montreal", "JFK - New York", "LHR - London", "GRU - Sao Paulo"];

describe("<Dropdown>", () => {
  it("U-08 opens on click and shows all options", async () => {
    const user = userEvent.setup();
    render(<Dropdown value="" options={OPTIONS} onChange={() => {}} />);
    await user.click(screen.getByRole("button"));
    OPTIONS.forEach((o) => expect(screen.getByRole("option", { name: o })).toBeInTheDocument());
  });

  it("U-08b opens on Enter key", async () => {
    const user = userEvent.setup();
    render(<Dropdown value="" options={OPTIONS} onChange={() => {}} />);
    const trigger = screen.getByRole("button");
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("U-08c filters by query (case-insensitive)", async () => {
    const user = userEvent.setup();
    render(<Dropdown value="" options={OPTIONS} onChange={() => {}} />);
    await user.click(screen.getByRole("button"));
    await user.type(screen.getByPlaceholderText("Filter…"), "london");
    expect(screen.getByRole("option", { name: "LHR - London" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "JFK - New York" })).not.toBeInTheDocument();
  });

  it("U-08d shows 'No matches' when filter empty", async () => {
    const user = userEvent.setup();
    render(<Dropdown value="" options={OPTIONS} onChange={() => {}} />);
    await user.click(screen.getByRole("button"));
    await user.type(screen.getByPlaceholderText("Filter…"), "zzz");
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("U-08e calls onChange and closes on selection", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Dropdown value="" options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("option", { name: "JFK - New York" }));
    expect(onChange).toHaveBeenCalledWith("JFK - New York");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("U-08f shows placeholder when no value", () => {
    render(<Dropdown value="" options={OPTIONS} onChange={() => {}} placeholder="Choose airport" />);
    expect(screen.getByText("Choose airport")).toBeInTheDocument();
  });
});
