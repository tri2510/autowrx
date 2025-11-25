# Security Fixes Summary

## Date: November 5, 2025

This document summarizes the security configuration fixes applied to resolve CORS and CSP issues.

---

## Issue #1: CORS Blocking External Requests ✅ FIXED

### Problem
```
error: 139.59.98.13 - GET /assets/index-8VsKHaTw.css 500 - 0.491 ms - message: Not allowed by CORS
```

### Root Cause
- CORS configuration was **hardcoded** in `backend/src/config/config.js`
- Only allowed `localhost` and `127.0.0.1`
- Did not use the `CORS_ORIGINS` environment variable

### Solution
Updated `backend/src/config/config.js` to:
- Parse `CORS_ORIGINS` environment variable
- Support comma-separated regex patterns
- Automatically add both `http://` and `https://` prefixes

### Configuration Required
Update your `.env` file with:
```bash
# Include your server IP
CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,139\.59\.98\.13:\d+

# Or with domain names
CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,yourdomain\.com,.*\.yourdomain\.com
```

### Files Modified
- ✅ `backend/src/config/config.js` (lines 113-143)
- ✅ `backend/src/docs/environment-variables.md` (added examples)
- 📄 `CORS_CONFIGURATION.md` (new documentation)

---

## Issue #2: CSP Blocking Monaco Editor CDN ✅ FIXED

### Problem
```
Refused to load the script 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js' 
because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
```

### Root Cause
- Content Security Policy only allowed scripts from same origin (`'self'`)
- External CDN (`cdn.jsdelivr.net`) was blocked
- Monaco Editor could not load its resources

### Solution
Updated `backend/src/app.js` production CSP to allow `cdn.jsdelivr.net`:

```javascript
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"]
scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"]
styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://cdn.jsdelivr.net"]
connectSrc: ["'self'", "https://cdn.jsdelivr.net"]
fontSrc: ["'self'", "https:", "data:", "https://cdn.jsdelivr.net"]
workerSrc: ["'self'", "blob:", "https://cdn.jsdelivr.net"]
```

### Files Modified
- ✅ `backend/src/app.js` (lines 68-77)
- 📄 `CSP_CONFIGURATION.md` (new documentation)

---

## How to Apply These Fixes

### 1. Update Environment Variables
Edit `backend/.env`:
```bash
# Add your production domain/IP to CORS_ORIGINS
CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,139\.59\.98\.13:\d+
```

### 2. Restart Backend Server
The code changes are already in place, but you need to restart:

```bash
# Option 1: NPM/Yarn
cd backend
npm restart

# Option 2: PM2
pm2 restart autowrx

# Option 3: Docker
docker-compose restart backend
```

### 3. Verify Fixes

#### Check CORS
1. Open browser DevTools → Network tab
2. Load your application from your production IP/domain
3. Verify CSS/JS files load without 500 errors
4. Check backend logs - should NOT see "CORS blocked origin" messages

#### Check CSP
1. Open browser DevTools → Console tab
2. Load a page that uses Monaco Editor
3. Verify NO "Refused to load the script" errors
4. Monaco Editor should load and function correctly

---

## Testing Checklist

- [ ] Update `CORS_ORIGINS` in `.env` with your domain/IP
- [ ] Restart backend server
- [ ] Test from production domain - CSS/JS loads correctly
- [ ] Test Monaco Editor - loads without CSP errors
- [ ] Check browser console - no CORS or CSP errors
- [ ] Check backend logs - no "CORS blocked" messages

---

## Additional Documentation

For detailed information, see:
- **CORS Configuration**: `CORS_CONFIGURATION.md`
- **CSP Configuration**: `CSP_CONFIGURATION.md`
- **Environment Variables**: `backend/src/docs/environment-variables.md`

---

## Security Notes

### CORS
- Only add trusted domains to `CORS_ORIGINS`
- Use specific patterns, not wildcards like `.*`
- Escape special characters in regex patterns (`.` → `\.`)

### CSP
- We allow `'unsafe-inline'` and `'unsafe-eval'` due to framework requirements
- Only add CDN sources you actually use and trust
- Test thoroughly after any CSP changes

### Production Checklist
- [ ] Use HTTPS for all external resources
- [ ] Keep CDN sources to minimum required
- [ ] Regularly audit allowed origins and CSP sources
- [ ] Monitor browser console for violations

---

## If Issues Persist

1. **CORS still blocking**:
   - Check exact origin in error log
   - Verify regex pattern in `CORS_ORIGINS`
   - Confirm backend was restarted
   - Check `backend/src/config/config.js` lines 120-132

2. **CSP still blocking**:
   - Check exact URL being blocked
   - Verify domain is in appropriate CSP directive
   - Confirm backend was restarted
   - Check `backend/src/app.js` lines 68-77

3. **Both issues present**:
   - Verify `.env` file is in `backend/` directory
   - Check file permissions on `.env`
   - Ensure environment variables are being loaded
   - Check `dotenv` configuration in `backend/src/config/config.js`

---

## Contact
If you continue to experience issues, check:
1. Backend logs for specific error messages
2. Browser DevTools Console for client-side errors
3. Network tab to see which requests are failing
4. Response headers to verify CORS headers are set

