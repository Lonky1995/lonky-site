import assert from "node:assert/strict";
import test from "node:test";
import { parseSourceJson } from "@/lib/crypto-breadth/fetch";

test("normalizes only non-finite numeric literals emitted by the upstream Python JSON encoder", () => {
  const payload = parseSourceJson(
    '{"missing": NaN, "positiveInfinity": Infinity, "negativeInfinity": -Infinity, "label": "NaN"}',
  );

  assert.deepEqual(payload, {
    missing: null,
    positiveInfinity: null,
    negativeInfinity: null,
    label: "NaN",
  });
});

test("keeps malformed JSON rejected when it has no recoverable non-finite literal", () => {
  assert.throws(() => parseSourceJson('{"missing": }'));
});
