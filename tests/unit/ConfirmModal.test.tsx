import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmModal from "@app/components/ConfirmModal";

describe("<ConfirmModal>", () => {
  it("U-10 does not render when open=false", () => {
    render(<ConfirmModal open={false} title="T" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("U-10a renders with title and body when open", () => {
    render(
      <ConfirmModal open title="Proceed?" onConfirm={() => {}} onCancel={() => {}}>
        <p>Body text</p>
      </ConfirmModal>
    );
    expect(screen.getByRole("dialog", { name: "Proceed?" })).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("U-10b confirm button fires onConfirm", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmModal open title="T" onConfirm={onConfirm} onCancel={() => {}} />);
    await user.click(screen.getByTestId("confirm-modal-ok"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("U-10c backdrop click fires onCancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmModal open title="T" onConfirm={() => {}} onCancel={onCancel} />);
    await user.click(document.querySelector("[data-modal-backdrop]") as Element);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("U-10d delayMs shows loading state before body", async () => {
    render(
      <ConfirmModal open title="T" delayMs={50} onConfirm={() => {}} onCancel={() => {}}>
        <p>Body</p>
      </ConfirmModal>
    );
    expect(screen.getByText(/Loading details/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Body")).toBeInTheDocument());
  });
});
