# TC-WB-005 — createIncident typeData Branch Coverage

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-WB-005 |
| **Technique** | White-Box — Branch Coverage |
| **Component** | `backend/controllers/incidentController.js` — `createIncident` — typeData block |
| **Objective** | Ensure every `if/else if` branch for type-specific field parsing is exercised |

---

## Source Code Under Test

```js
const typeData = {};

if (incidentType === 'graffiti') {                  // Branch 1
  typeData.surfaceType = req.body.surfaceType;
  typeData.estimatedArea = req.body.estimatedArea;
  typeData.isProfane = req.body.isProfane === 'true';
} else if (incidentType === 'antisocial') {          // Branch 2
  typeData.antisocialType = req.body.antisocialType;
} else if (incidentType === 'safetyhazard') {        // Branch 3
  typeData.hazardType = req.body.hazardType;
  typeData.riskLevel = req.body.riskLevel;
  typeData.causedInjury = req.body.causedInjury === 'true';
} else if (incidentType === 'maintenance') {         // Branch 4
  typeData.issueType = req.body.issueType;
  typeData.priority = req.body.priority;
  typeData.customIssueDescription = req.body.customIssueDescription;
  typeData.workCategory = req.body.workCategory;
}
// Implicit else: no typeData populated (Branch 5 — caught by schema enum validation)
```

> **Note:** `estimatedPeopleInvolved` and `reportedToGarda`/`reportedToTuath` were removed from the antisocial branch on 31/05/26. The "Already reported to Garda" checkbox and estimated people count no longer exist in the form or schema.

---

## Branch Map

| Branch | incidentType value | Fields populated |
|--------|-------------------|-----------------|
| B1 | `graffiti` | surfaceType, estimatedArea, isProfane |
| B2 | `antisocial` | antisocialType |
| B3 | `safetyhazard` | hazardType, riskLevel, causedInjury |
| B4 | `maintenance` | issueType, priority, customIssueDescription, workCategory |
| B5 (implicit else) | invalid value | typeData stays `{}`; schema rejects |

---

## Test Cases

### TC-WB-005-A: graffiti branch (B1)
| | |
|---|---|
| **Input** | `incidentType: "graffiti"`, `surfaceType: "brick"`, `estimatedArea: 5`, `isProfane: "true"` |
| **Expected** | HTTP 201; incident saved with `surfaceType: "brick"`, `estimatedArea: 5`, `isProfane: true` |
| **Result** | PASS |

### TC-WB-005-B: antisocial branch (B2)
| | |
|---|---|
| **Input** | `incidentType: "antisocial"`, `antisocialType: "Noise / Disturbance"` |
| **Expected** | HTTP 201; incident saved with `antisocialType: "Noise / Disturbance"` |
| **Result** | PASS |

### TC-WB-005-C: safetyhazard branch (B3)
| | |
|---|---|
| **Input** | `incidentType: "safetyhazard"`, `hazardType: "trip"`, `riskLevel: "HIGH"`, `causedInjury: "true"` |
| **Expected** | HTTP 201; `causedInjury: true` stored |
| **Result** | PASS |

### TC-WB-005-D: maintenance branch (B4)
| | |
|---|---|
| **Input** | `incidentType: "maintenance"`, `issueType: "plumbing"`, `priority: "HIGH"`, `workCategory: "plumbing"` |
| **Expected** | HTTP 201; all maintenance fields stored |
| **Result** | PASS |

### TC-WB-005-E: maintenance branch with "other" issueType and customIssueDescription (B4 edge case)
| | |
|---|---|
| **Input** | `incidentType: "maintenance"`, `issueType: "other"`, `customIssueDescription: "Broken handrail on 3rd floor"` |
| **Expected** | HTTP 201; `customIssueDescription` stored; `issueType: "other"` |
| **Result** | PASS |

### TC-WB-005-F: Boolean coercion — isProfane "true" string → true (B1 edge case)
| | |
|---|---|
| **Input** | `isProfane: "true"` (string from form data) |
| **Expected** | Stored as `isProfane: true` (boolean) |
| **Result** | PASS |

### TC-WB-005-G: Boolean coercion — isProfane "false" string → false (B1 edge case)
| | |
|---|---|
| **Input** | `isProfane: "false"` |
| **Expected** | Stored as `isProfane: false` (boolean) |
| **Result** | PASS |

---

## Notes
The boolean fields (`isProfane`, `causedInjury`) are sent as strings from `multipart/form-data` and converted with `=== 'true'`. Any value other than the literal string `"true"` evaluates to `false`, including `"True"`, `"1"`, or `"yes"`.
