import assert from "node:assert/strict";
import test from "node:test";

import {
  assertReadOnlyCapability,
  READ_ONLY_AI_CAPABILITIES,
} from "./read-only-guarantee";

test("allows every declared informational AI capability", () => {
  for (const capability of READ_ONLY_AI_CAPABILITIES) {
    assert.doesNotThrow(() => assertReadOnlyCapability(capability));
  }
});

test("rejects unknown and write-like AI capabilities", () => {
  for (const capability of ["complete-task", "send-message", "schedule-event", "delete-note"]) {
    assert.throws(
      () => assertReadOnlyCapability(capability),
      new RegExp(`blocked AI capability "${capability}"`),
    );
  }
});
