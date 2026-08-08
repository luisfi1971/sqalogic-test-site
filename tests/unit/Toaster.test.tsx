import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const state = vi.hoisted(() => ({
  toasts: [] as unknown[],
  dismiss: vi.fn(),
}));

vi.mock("@app/providers", () => ({
  useToast: () => ({ toasts: state.toasts, toast: vi.fn(), dismiss: state.dismiss }),
}));

import Toaster from "@app/components/Toaster";

beforeEach(() => {
  state.dismiss.mockClear();
  state.toasts = [];
});

describe("<Toaster>", () => {
  it("U-22 renders nothing while there are no toasts", () => {
    const { container } = render(<Toaster />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("toast-region")).not.toBeInTheDocument();
  });

  it("U-22a a toast is announced as a status so role-based waits can find it", () => {
    state.toasts = [{ id: 1, message: "Booking BK-XYZ confirmed", kind: "success" }];
    render(<Toaster />);
    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Booking BK-XYZ confirmed");
    expect(toast).toHaveAttribute("data-testid", "toast");
    expect(toast).toHaveAttribute("data-toast-kind", "success");
  });

  it("U-22b the region is a polite live region", () => {
    state.toasts = [{ id: 1, message: "hi", kind: "info" }];
    render(<Toaster />);
    expect(screen.getByTestId("toast-region")).toHaveAttribute("aria-live", "polite");
  });

  it("U-22c several toasts stack, each addressable on its own", () => {
    state.toasts = [
      { id: 1, message: "Booking BK-1 confirmed", kind: "success" },
      { id: 2, message: "Trip BK-2 cancelled", kind: "info" },
    ];
    render(<Toaster />);
    expect(screen.getAllByTestId("toast")).toHaveLength(2);
    expect(screen.getByText("Trip BK-2 cancelled")).toBeInTheDocument();
  });

  it("U-22d the dismiss control closes that toast by id", async () => {
    state.toasts = [
      { id: 7, message: "first", kind: "info" },
      { id: 9, message: "second", kind: "info" },
    ];
    const user = userEvent.setup();
    render(<Toaster />);
    await user.click(screen.getAllByRole("button", { name: "Dismiss notification" })[1]);
    expect(state.dismiss).toHaveBeenCalledExactlyOnceWith(9);
  });

  it("U-22e an unknown kind still renders rather than blanking the toast", () => {
    state.toasts = [{ id: 1, message: "odd", kind: "wat" }];
    render(<Toaster />);
    expect(screen.getByTestId("toast")).toHaveTextContent("odd");
  });
});
