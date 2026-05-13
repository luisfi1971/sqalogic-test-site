import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tooltip from "@app/components/Tooltip";

describe("<Tooltip>", () => {
  it("U-12 is hidden by default", () => {
    render(<Tooltip content="Hint"><button>Hover me</button></Tooltip>);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("U-12a appears on hover and disappears on unhover", async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Hint"><button>Hover me</button></Tooltip>);
    await user.hover(screen.getByText("Hover me"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Hint");
    await user.unhover(screen.getByText("Hover me"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("U-12b appears on keyboard focus", async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Hint"><button>Target</button></Tooltip>);
    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });
});
