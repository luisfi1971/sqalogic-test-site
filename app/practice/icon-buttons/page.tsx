/**
 * ICON-FONT BUTTONS — a stable test-bed page for a control whose accessible
 * name carries a Private Use Area glyph (2026-10-30, SQALOGIC TestHub
 * DECISION 2). An icon font draws its glyph with CSS generated content
 * (`::before { content: "\e001" }`), and the browser's accessible name
 * INCLUDES it: «<U+E001> Save draft». A person reads «Save draft». Unicode
 * defines Private Use code points as carrying no meaning, so a tool must name
 * the control as a person reads it and still find exactly one control on
 * every engine — and never the longer twin «Save draft as template». «Print»
 * carries the glyph LITERALLY in its DOM text (U+E003), beside «Print preview».
 *
 * The glyph is drawn without loading any font file: the code point renders as
 * a box or nothing, and the accessible name is the same either way.
 */
export default function IconButtonsPage() {
  return (
    <div>
      <style>{`
        .ico::before { margin-right: 0.25rem; }
        .ico-save::before { content: "\\e001"; }
        .ico-login::after { content: "\\f090"; margin-left: 0.25rem; }
        .ico-mid::before { content: "\\e002"; }
      `}</style>
      <h1 className="text-2xl font-semibold">Icon-font buttons</h1>
      <div className="mt-4 flex gap-2" data-testid="icon-buttons">
        <button type="button" className="rounded border px-3 py-1">
          <span className="ico ico-save" aria-hidden="false" />
          Save draft
        </button>
        <button type="button" className="rounded border px-3 py-1">
          Save draft as template
        </button>
        <button type="button" className="rounded border px-3 py-1">
          <i className="ico-login">Login</i>
        </button>
        <button type="button" className="rounded border px-3 py-1">
          Sign <span className="ico-mid" /> in
        </button>
        <button type="button" className="rounded border px-3 py-1">
          Login help
        </button>
        {/* A Private Use glyph written LITERALLY into the DOM text (not CSS
            generated content): an XPath string value holds it, so an engine
            that cannot strip it resolves by role and filters by the name. */}
        <button type="button" className="rounded border px-3 py-1">
          {'\uE003'} Print
        </button>
        <button type="button" className="rounded border px-3 py-1">
          Print preview
        </button>
      </div>
    </div>
  );
}
