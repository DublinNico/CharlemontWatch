# BUG-002 — S3 Photos Returning 403 Forbidden

| Field | Detail |
|---|---|
| **Status** | Fixed |
| **Severity** | Critical |
| **Area** | Backend / File Storage |

## Description
Photos attached to incident reports uploaded successfully to S3 but returned a 403 Forbidden error when rendered in the browser.

## Steps to Reproduce
1. Submit an incident report with a photo attached
2. Open the incident in the admin dashboard or public view
3. Observe the broken image / 403 error in the browser network tab

## Root Cause
The S3 bucket had no public read policy. Objects were uploaded successfully but the bucket blocked all public access by default, so direct URL access was forbidden.

## Fix Applied
- Disabled "Block all public access" on the S3 bucket in the AWS console
- Added a bucket policy granting `s3:GetObject` to `*` (public read)
- Removed pre-signed URL generation from the upload code — photos now use permanent public URLs

## Files Changed
- `backend/controllers/incidentController.js` — removed pre-signed URL logic
- AWS S3 bucket policy (configured via AWS console)
