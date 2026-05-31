# BUG-001 — MongoDB DNS Connection Failure

| Field | Detail |
|---|---|
| **Date** | 27/05/26 |
| **Status** | Fixed |
| **Severity** | Critical |
| **Area** | Backend / Database |

## Description
The backend server failed to connect to MongoDB Atlas on startup with the error `querySrv ENOTFOUND`.

## Steps to Reproduce
1. Start the backend with `npm run dev`
2. Observe the console error: `querySrv ENOTFOUND _mongodb._tcp.<cluster>.mongodb.net`

## Root Cause
The MongoDB connection string used the `mongodb+srv://` SRV format, which requires a DNS SRV lookup. The development environment could not resolve the SRV record due to a local DNS restriction.

## Fix Applied
Switched from the SRV connection string to a direct host connection string in the `.env` file:
```env
# Before
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# After
MONGODB_URI=mongodb://user:pass@host1:27017,host2:27017/dbname?authSource=admin
```

## Files Changed
- `.env`
