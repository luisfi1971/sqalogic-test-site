import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

// The target for the canon's `nativeDialog` slot, which was reserved with no
// way to prove it. A native dialog is categorically different from a modal in
// the page: it is not an element at all, so no selector reaches it, and it
// blocks script until answered. An engine either has a dialog channel or it
// does not — there is no partial credit, which is what makes this a clean row.

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

async function signIn() {
  await vibe.go(`${BASE_URL}/login`);
  const emailEl = await vibe.find('input[type="email"]');
  await emailEl.click();
  await emailEl.type(DEMO.email);
  const pwEl = await vibe.find('input[type="password"]');
  await pwEl.click();
  await pwEl.type(DEMO.password);
  await vibe.find({ role: "button", text: "Sign in" }).click();
  await vibe.waitUntil.url(`${BASE_URL}/search`);
}

/**
 * Arm the capture first, then fire the click *without awaiting it*.
 *
 * window.confirm blocks the page's script until it is answered, so the click
 * never "completes" while the dialog is up. Passing the click as a callback to
 * capture.dialog(fn) — the shape the API invites — deadlocks: the capture waits
 * for the callback, the callback waits for the dialog, the dialog waits for the
 * capture. Worth recording for the engine adapters.
 */
async function raiseLogoutDialog() {
  const pending = vibe.capture.dialog();
  const clicking = Promise.resolve(vibe.find('[data-testid="logout"]').click()).catch(() => {});
  const dialog = await pending;
  return { dialog, clicking };
}

beforeAll(async () => {
  ({ bro, vibe } = await launch());
});

afterAll(async () => {
  await bro?.stop();
});

beforeEach(async () => {
  await signIn();
  await vibe.find('[data-testid="logout"]').waitUntil("visible");
});

describe("E2E: native confirm on logout", () => {
  it("E-37 logging out raises a real confirm, not a DOM modal", async () => {
    const { dialog, clicking } = await raiseLogoutDialog();

    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toBe("Sign out of SQALOGIC Air?");

    await dialog.dismiss();
    await clicking;
  });

  it("E-38 while it is up, the page's script is blocked entirely", async () => {
    // The stronger form of "no selector reaches it": you cannot even ask.
    // evaluate() does not resolve while a native dialog is open, because the
    // page's script is suspended — which is why every DOM-based strategy fails
    // here rather than returning an empty result.
    const { dialog, clicking } = await raiseLogoutDialog();

    let answered = false;
    const probe = Promise.resolve(vibe.evaluate(`1 + 1`))
      .then(() => {
        answered = true;
      })
      .catch(() => {});

    // A negative claim needs a bounded wait — there is no state to watch for
    // "still hasn't happened".
    await new Promise((r) => setTimeout(r, 1500));
    expect(answered).toBe(false);

    await dialog.dismiss();
    await probe;
    expect(answered).toBe(true);
    await clicking;

    // And once it is gone, the page never held a dialog element at all — this
    // is the difference from every ConfirmModal on the site.
    const domDialogs = (await vibe.evaluate(
      `document.querySelectorAll('[role="dialog"], dialog').length`
    )) as number;
    expect(domDialogs).toBe(0);
  });

  it("E-39 dismissing keeps you signed in", async () => {
    const { dialog, clicking } = await raiseLogoutDialog();
    await dialog.dismiss();
    await clicking;

    const stillIn = (await vibe.evaluate(
      `document.querySelectorAll('[data-testid="logout"]').length === 1`
    )) as boolean;
    expect(stillIn).toBe(true);
  });

  it("E-40 accepting signs you out", async () => {
    const { dialog, clicking } = await raiseLogoutDialog();
    await dialog.accept();
    await clicking;

    // The header swaps Logout for Login once the session is gone.
    await vibe.find({ role: "link", text: "Login" }).waitUntil("visible");
    const loggedOut = (await vibe.evaluate(
      `document.querySelectorAll('[data-testid="logout"]').length === 0`
    )) as boolean;
    expect(loggedOut).toBe(true);
  });
});
