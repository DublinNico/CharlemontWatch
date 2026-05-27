# TC-WB-003 — generateShortId Statement Coverage

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-WB-003 |
| **Technique** | White-Box — Statement Coverage |
| **Component** | `backend/utils/idUtils.js` — `generateShortId` function |
| **Objective** | Execute every statement in generateShortId and verify the output contract |

---

## Source Code Under Test

```js
// utils/idUtils.js
const crypto = require('crypto');

const generateShortId = () =>
  'CW-' + crypto.randomBytes(3).toString('hex').toUpperCase();

module.exports = { generateShortId };
```

---

## Statement Map

| Statement | Description |
|-----------|-------------|
| S1 | `crypto.randomBytes(3)` — generate 3 cryptographically random bytes |
| S2 | `.toString('hex')` — encode bytes as a 6-character lowercase hex string |
| S3 | `.toUpperCase()` — convert to uppercase |
| S4 | `'CW-' + ...` — prepend the prefix |
| S5 | `return` the concatenated result |

All 5 statements execute on every call — there are no branches to skip any statement.

---

## Test Cases

### TC-WB-003-A: Return type is string (S1–S5)
| | |
|---|---|
| **Input** | Call `generateShortId()` |
| **Expected** | Result is of type `string` |
| **Automated test** | UT-001-A |
| **Result** | PASS |

### TC-WB-003-B: Prefix is exactly "CW-" (S4)
| | |
|---|---|
| **Input** | Call `generateShortId()` |
| **Expected** | First 3 characters are `CW-` |
| **Automated test** | UT-001-C |
| **Result** | PASS |

### TC-WB-003-C: Suffix is 6 uppercase hex characters (S2, S3)
| | |
|---|---|
| **Input** | Call `generateShortId()` |
| **Expected** | Characters 4–9 match `[0-9A-F]{6}` |
| **Automated test** | UT-001-B |
| **Result** | PASS |

### TC-WB-003-D: Total length is always 9 (S4, S5)
| | |
|---|---|
| **Input** | Call `generateShortId()` 20 times |
| **Expected** | Every result has `.length === 9` |
| **Automated test** | UT-001-D |
| **Result** | PASS |

### TC-WB-003-E: Output is unique across repeated calls (S1)
| | |
|---|---|
| **Input** | Call `generateShortId()` 500 times |
| **Expected** | All 500 results are distinct (collision probability ≈ 1 in 16M) |
| **Automated test** | UT-002 |
| **Result** | PASS |

---

## Coverage Achieved

| Metric | Result |
|--------|--------|
| Statement coverage | 100% (5/5 statements) |
| Branch coverage | 100% (no branches) |
| Function coverage | 100% |
