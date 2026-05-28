# BUG-003 — S3 Photo URLs Had Wrong Region

| Field | Detail |
|---|---|
| **Status** | Fixed |
| **Severity** | High |
| **Area** | Backend / File Storage |

## Description
Photos uploaded before a region correction were stored in MongoDB with `eu-west-1` in the URL, but the actual S3 bucket was in `eu-north-1`. These photos were permanently inaccessible via their stored URL.

## Steps to Reproduce
1. Open any incident with a photo created before the region fix
2. Observe the image fails to load
3. Inspect the URL — contains `eu-west-1` instead of `eu-north-1`

## Root Cause
The `AWS_REGION` environment variable was initially set to `eu-west-1` but the S3 bucket was created in `eu-north-1`. The controller builds photo URLs from this env variable at upload time, so all early uploads stored the wrong region in their URL.

## Fix Applied
- Corrected `AWS_REGION` in `.env` to `eu-north-1`
- Ran a one-off MongoDB update script to rewrite the stored URLs on existing photo documents from `eu-west-1` to `eu-north-1`

## Files Changed
- `.env` — corrected `AWS_REGION`
- MongoDB — existing photo URL strings updated directly via script
