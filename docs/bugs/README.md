# Bug Reports — CharlemontWatch

All bugs discovered during development and testing.

| ID | Title | Severity | Status | Area |
|---|---|---|---|---|
| [BUG-001](BUG-001-mongodb-dns-connection.md) | MongoDB DNS Connection Failure | Critical | Fixed | Backend / Database |
| [BUG-002](BUG-002-s3-photos-403.md) | S3 Photos Returning 403 Forbidden | Critical | Fixed | Backend / Storage |
| [BUG-003](BUG-003-s3-region-mismatch.md) | S3 Photo URLs Had Wrong Region | High | Fixed | Backend / Storage |
| [BUG-004](BUG-004-incident-cards-not-clickable.md) | Incident Cards Not Clickable | Medium | Fixed | Frontend / Navigation |
| [BUG-005](BUG-005-track-report-objectid-uppercase.md) | Track Report Uppercasing ObjectIds | High | Fixed | Frontend / Lookup |
| [BUG-006](BUG-006-status-badge-crash.md) | StatusBadge Crash on PENDING_REVIEW / REJECTED | Critical | Fixed | Frontend / UI |
| [BUG-007](BUG-007-approve-incident-shortid.md) | "Failed to Approve" — shortId vs ObjectId Mismatch | Critical | Fixed | Backend / Admin |
| [BUG-008](BUG-008-cors-500-error.md) | CORS Returning 500 Instead of 403 | Medium | Fixed | Backend / Security |
| [BUG-009](BUG-009-trackreport-masking-network-errors.md) | Track Report Masking Network Errors as "Not Found" | Low | Fixed | Frontend / Errors |
| [BUG-010](BUG-010-jest-test-status-default.md) | Jest Test Failing After Status Default Change | Low | Fixed | Tests |
| [BUG-011](BUG-011-admin-header-dropdown.md) | Admin Header Dropdown Not Responding | Medium | Fixed | Frontend / Navigation |
| [BUG-012](BUG-012-magic-bytes-multiupload-bypass.md) | Magic-Byte Validation Only Checked First File in Multi-Upload | High | Fixed | Backend / Security |
| [BUG-013](BUG-013-reportedtogarda-field-mismatch.md) | Anti-Social Incident Data Silently Dropped (Field Name Mismatch) | High | Fixed | Backend / Data |
| [BUG-014](BUG-014-copy-id-optimistic-ui.md) | Copy ID Button Showed Success Before Clipboard Write Resolved | Low | Fixed | Frontend / UX |
| [BUG-015](BUG-015-error-message-leaked-to-client.md) | Internal Error Message Leaked to Client in 500 Responses | Medium | Fixed | Backend / Security |
| [BUG-016](BUG-016-validation-error-returns-500.md) | Mongoose ValidationError Returned as 500 Instead of 400 | Medium | Fixed | Backend / API |
| [BUG-017](BUG-017-vitest-glob-picked-up-e2e-specs.md) | Vitest Picked Up Playwright E2E Spec Files | Low | Fixed | Frontend / Test Infrastructure |
| [BUG-018](BUG-018-incidentController-error-message-leak.md) | Internal Error Message Leaked to Client in incidentController 500 Responses | Medium | Fixed | Backend / Security |
