# TC-WB-002 — adminOnly Middleware Branch Coverage

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-WB-002 |
| **Technique** | White-Box — Branch Coverage |
| **Component** | `backend/middleware/auth.js` — `adminOnly` function |
| **Objective** | Execute every branch in adminOnly to achieve 100% branch coverage |

---

## Source Code Under Test

```js
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {    // Branch 1: true (not admin) / false (is admin)
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

---

## Branch Map

| Branch ID | Condition | Path |
|-----------|-----------|------|
| B1-TRUE  | `req.user?.role !== 'admin'` — any non-admin role or undefined user | Returns 403 |
| B1-FALSE | `req.user?.role === 'admin'` | Calls `next()` |

---

## Test Cases

### TC-WB-002-A: User has role "admin" (B1-FALSE)
| | |
|---|---|
| **Input** | `req.user = { role: 'admin' }` |
| **Expected** | `next()` called; no response sent |
| **Branch covered** | B1-FALSE |
| **Automated test** | UT-008 |
| **Result** | PASS |

### TC-WB-002-B: User has role "resident" (B1-TRUE)
| | |
|---|---|
| **Input** | `req.user = { role: 'resident' }` |
| **Expected** | `res.status(403)`, `{ error: 'Admin access required' }`, `next` not called |
| **Branch covered** | B1-TRUE |
| **Automated test** | UT-009-A |
| **Result** | PASS |

### TC-WB-002-C: User has an unknown custom role (B1-TRUE)
| | |
|---|---|
| **Input** | `req.user = { role: 'superuser' }` |
| **Expected** | `res.status(403)` |
| **Branch covered** | B1-TRUE |
| **Automated test** | UT-009-B |
| **Result** | PASS |

### TC-WB-002-D: req.user is undefined — optional chaining evaluates to undefined (B1-TRUE)
| | |
|---|---|
| **Input** | `req.user = undefined` |
| **Expected** | `req.user?.role` is `undefined`; `undefined !== 'admin'` is `true`; returns 403 |
| **Branch covered** | B1-TRUE (undefined path via optional chaining) |
| **Automated test** | UT-010 |
| **Result** | PASS |

---

## Coverage Achieved

| Metric | Result |
|--------|--------|
| Statement coverage | 100% |
| Branch coverage | 100% (2/2 branches) |
| Function coverage | 100% |
