# TC-WB-001 — authenticate Middleware Branch Coverage

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-WB-001 |
| **Technique** | White-Box — Branch Coverage |
| **Component** | `backend/middleware/auth.js` — `authenticate` function |
| **Objective** | Execute every branch in the authenticate function to achieve 100% branch coverage |

---

## Source Code Under Test

```js
// middleware/auth.js
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];   // Branch 1: header present/absent

  if (!token) {                                              // Branch 2: true / false
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();                                                  // Branch 3: verify succeeds
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' }); // Branch 4: verify throws
  }
};
```

---

## Branch Map

| Branch ID | Condition | Path |
|-----------|-----------|------|
| B1-TRUE  | `!token` is true (no header / no Bearer value) | Returns 401 "No token provided" |
| B1-FALSE | `!token` is false (token string extracted) | Continues to `jwt.verify` |
| B2-TRY   | `jwt.verify` succeeds | Sets `req.user`, calls `next()` |
| B2-CATCH | `jwt.verify` throws (bad/expired token) | Returns 401 "Invalid token" |

---

## Test Cases

### TC-WB-001-A: No Authorization header (B1-TRUE)
| | |
|---|---|
| **Input** | `req.headers = {}` |
| **Expected** | `res.status(401)`, `res.json({ error: 'No token provided' })`, `next` not called |
| **Branch covered** | B1-TRUE |
| **Automated test** | UT-005 |
| **Result** | PASS |

### TC-WB-001-B: Valid JWT (B1-FALSE → B2-TRY)
| | |
|---|---|
| **Input** | `Authorization: Bearer <valid-signed-token>` |
| **Expected** | `next()` called; `req.user` populated with decoded payload |
| **Branch covered** | B1-FALSE, B2-TRY |
| **Automated tests** | UT-006-A, UT-006-B |
| **Result** | PASS |

### TC-WB-001-C: Invalid/tampered JWT (B1-FALSE → B2-CATCH)
| | |
|---|---|
| **Input** | `Authorization: Bearer invalid.token.here` |
| **Expected** | `res.status(401)`, `res.json({ error: 'Invalid token' })`, `next` not called |
| **Branch covered** | B1-FALSE, B2-CATCH |
| **Automated test** | UT-007-A |
| **Result** | PASS |

### TC-WB-001-D: Expired JWT (B1-FALSE → B2-CATCH)
| | |
|---|---|
| **Input** | `Authorization: Bearer <token signed with expiresIn: '-1s'>` |
| **Expected** | `res.status(401)`; `next` not called |
| **Branch covered** | B1-FALSE, B2-CATCH (TokenExpiredError) |
| **Automated test** | UT-007-B |
| **Result** | PASS |

---

## Coverage Achieved

| Metric | Result |
|--------|--------|
| Statement coverage | 100% |
| Branch coverage | 100% (4/4 branches) |
| Function coverage | 100% |
