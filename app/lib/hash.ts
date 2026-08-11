/**
 * SHA-256 — and the reason it is not one line of WebCrypto.
 *
 * ## The defect, measured 2026-08-11
 *
 * This file was:
 *
 *     const digest = await crypto.subtle.digest("SHA-256", buf);
 *
 * `crypto.subtle` exists ONLY in a secure context. `http://localhost:5859` is
 * one by definition; `http://192.168.2.74:5859` — the same app, reached by the
 * LAN address — is not. So on the LAN origin `crypto.subtle` is `undefined`,
 * this function threw, `login()` rejected, the login page's `onSubmit` never
 * reached `setError`, and the form did nothing at all: no navigation, no error
 * text, no console message a user would look for.
 *
 * Measured, both origins, same browser, same credentials:
 *
 *     http://localhost:5859/login    → /search, header shows "Logout"
 *     http://192.168.2.74:5859/login → stays on /login, no error rendered
 *
 * That is worse than a broken login: it is a login that fails as a no-op. Every
 * flow behind it (my-trips, the booking grid) then renders its logged-out empty
 * state, which reads as "no data" rather than "never signed in".
 *
 * The LAN address is not incidental. This app is a target for automation
 * engines, and one of them (an iOS simulator driving Appium) cannot reach the
 * host's `localhost` at all — the LAN address is the only name that serves all
 * the engines at once. An app that only works when reached by one of its names
 * is broken for the use it exists for.
 *
 * ## Why a local implementation and not a package
 *
 * FIPS 180-4 SHA-256 is sixty lines and has one right answer, verified below
 * against the known digest of the empty string and of "abc". A dependency for
 * this would be a supply-chain surface on a practice app whose whole point is
 * being trivially reproducible.
 *
 * `crypto.subtle` is still preferred when it exists: it is the platform's
 * implementation, and on the origin most people browse it is what runs. This is
 * a fallback, not a replacement — the digests are identical either way, which
 * is what lets the same seeded password row satisfy both paths.
 */

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** FIPS 180-4 SHA-256 over bytes → 32 bytes. */
export function sha256Bytes(input: Uint8Array): Uint8Array {
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  // Padding: 0x80, then zeros, then the 64-bit big-endian bit length.
  const bitLen = input.length * 8;
  const padded = new Uint8Array(Math.ceil((input.length + 9) / 64) * 64);
  padded.set(input);
  padded[input.length] = 0x80;
  const view = new DataView(padded.buffer);
  // Length fits in 32 bits for any string this app hashes; the high word stays 0.
  view.setUint32(padded.length - 4, bitLen >>> 0, false);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => ((x >>> n) | (x << (32 - n))) >>> 0;

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i += 1) {
      const a = w[i - 15] as number;
      const b = w[i - 2] as number;
      const s0 = (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) >>> 0;
      const s1 = (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10)) >>> 0;
      w[i] = (((w[i - 16] as number) + s0 + (w[i - 7] as number) + s1) >>> 0) as number;
    }
    let [a, b, c, d, e, f, g, hh] = h as [
      number, number, number, number, number, number, number, number,
    ];
    for (let i = 0; i < 64; i += 1) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (hh + S1 + ch + (K[i] as number) + (w[i] as number)) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    const next = [a, b, c, d, e, f, g, hh];
    for (let i = 0; i < 8; i += 1) h[i] = (((h[i] as number) + (next[i] as number)) >>> 0) as number;
  }

  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  for (let i = 0; i < 8; i += 1) ov.setUint32(i * 4, h[i] as number, false);
  return out;
}

const hex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  /*
   * The platform first, WHEN it is there. `globalThis.crypto` itself is absent
   * in some server runtimes and `crypto.subtle` is absent on every insecure
   * origin — so both have to be checked, and neither check may throw.
   */
  const subtle = globalThis.crypto?.subtle;
  if (subtle) return hex(new Uint8Array(await subtle.digest("SHA-256", buf)));
  return hex(sha256Bytes(buf));
}
