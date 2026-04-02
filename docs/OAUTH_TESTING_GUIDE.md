# OAuth Testing Guide

**Purpose:** Test Google and Microsoft OAuth sign-in flows for CortexBuild Ultimate.

---

## Prerequisites

### Google OAuth (Configured ✅)

Your Google OAuth credentials are already configured:
- **Client ID:** `432002951446-j1jovc3kcialm3p1k2gvepqo6ol5dmse.apps.googleusercontent.com`
- **Callback:** `https://www.cortexbuildpro.com/api/auth/google/callback`

**Verify in Google Cloud Console:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Ensure "Authorized redirect URIs" includes:
   - `https://www.cortexbuildpro.com/api/auth/google/callback`

### Microsoft OAuth (Needs Configuration ⏳)

**To enable Microsoft sign-in:**

1. **Register Application in Azure Portal:**
   - Go to https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
   - Click "New registration"
   - Name: `CortexBuild Ultimate`
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `https://www.cortexbuildpro.com/api/auth/microsoft/callback` (Web platform)

2. **Get Credentials:**
   - Copy "Application (client) ID" → `MICROSOFT_CLIENT_ID`
   - Go to "Certificates & secrets" → "New client secret"
   - Copy the secret value (not the ID) → `MICROSOFT_CLIENT_SECRET`

3. **Add API Permissions:**
   - Go to "API permissions"
   - Add "Microsoft Graph" → "User.Read" permission

4. **Update Production Environment:**
   ```bash
   # SSH to VPS
   ssh root@72.62.132.43
   
   # Edit .env file
   nano /var/www/cortexbuild-ultimate/server/.env
   
   # Add:
   MICROSOFT_CLIENT_ID=your_client_id_here
   MICROSOFT_CLIENT_SECRET=your_secret_here
   
   # Restart API
   docker restart cortexbuild-api
   ```

---

## Testing OAuth Flows

### Test 1: Google Sign-In (New User)

**Steps:**
1. Open https://www.cortexbuildpro.com in incognito/private window
2. Click "Login" in top right
3. Click "Continue with Google" button
4. Select Google account (or enter credentials)
5. Grant permissions if prompted

**Expected Result:**
- Redirect to dashboard
- User account created with Google email
- JWT token stored in localStorage
- Welcome message shows Google email

**Verify:**
```javascript
// Open browser console on dashboard
console.log(localStorage.getItem('auth_token')); // Should show JWT
console.log(localStorage.getItem('user')); // Should show user data
```

---

### Test 2: Google Sign-In (Existing User)

**Steps:**
1. Create account with email/password first
2. Logout
3. Click "Continue with Google"
4. Use same Google email

**Expected Result:**
- Should recognize existing account by email
- Link Google account automatically
- Redirect to dashboard

---

### Test 3: Account Linking

**Steps:**
1. Login with email/password
2. Go to Settings → Security tab
3. Find "Connected Accounts" section
4. Click "Connect Google Account"
5. Complete Google authentication

**Expected Result:**
- Shows "Connected as your@email.com"
- "Unlink" button appears

**Test Unlink:**
1. Click "Unlink"
2. Confirm dialog
3. Should show "Connect Google Account" button again

---

### Test 4: Microsoft Sign-In (After Configuration)

**Steps:**
1. Open https://www.cortexbuildpro.com in incognito/private window
2. Click "Login"
3. Click "Continue with Microsoft" button
4. Select Microsoft account
5. Grant permissions

**Expected Result:**
- Redirect to dashboard
- User account created with Microsoft email
- JWT token stored

---

## Troubleshooting

### OAuth Returns to Login Page

**Possible causes:**
1. Redirect URI mismatch
2. Missing environment variables
3. Database connection issue

**Check API logs:**
```bash
ssh root@72.62.132.43 "docker logs --tail 100 cortexbuild-api"
```

**Look for:**
- `OAuth state mismatch` - CSRF protection triggered
- `Invalid callback URL` - Check Google/Azure console
- `Database error` - Check PostgreSQL connection

### "Google Account Already Linked" Error

**Cause:** Another user already linked this Google account

**Fix:**
1. Login as that user
2. Unlink Google account in Settings
3. Try again

### Token Not Stored

**Check:**
1. Browser console for errors
2. localStorage is not blocked
3. CORS settings allow credentials

---

## Monitoring OAuth Usage

### Check OAuth Sign-ins in Database

```bash
ssh root@72.62.132.43 "psql -h localhost -U cortexbuild -d cortexbuild -c 'SELECT provider, COUNT(*) FROM oauth_providers GROUP BY provider;'"
```

### Check Recent User Sign-ups

```bash
ssh root@72.62.132.43 "psql -h localhost -U cortexbuild -d cortexbuild -c 'SELECT email, created_at, avatar_url FROM users ORDER BY created_at DESC LIMIT 10;'"
```

### Monitor OAuth Errors

```bash
# Real-time log monitoring
ssh root@72.62.132.43 "docker logs -f cortexbuild-api 2>&1 | grep -i oauth"
```

---

## Success Criteria

- [ ] Google sign-in creates new user account
- [ ] Google sign-in works for existing user
- [ ] Account linking works in Settings
- [ ] Account unlinking works
- [ ] Microsoft sign-in works (after configuration)
- [ ] No errors in production logs
- [ ] OAuth providers table shows linked accounts

---

## Test Results Template

```markdown
### Test Session: YYYY-MM-DD

**Tester:** [Name]
**Browser:** [Chrome/Firefox/Safari]
**Environment:** Production

| Test | Result | Notes |
|------|--------|-------|
| Google Sign-Up (New) | ✅ Pass / ❌ Fail | |
| Google Sign-In (Existing) | ✅ Pass / ❌ Fail | |
| Account Linking | ✅ Pass / ❌ Fail | |
| Account Unlinking | ✅ Pass / ❌ Fail | |
| Microsoft Sign-In | ⏳ N/A / ✅ Pass | |

**Issues Found:**
- [List any issues]

**OAuth Accounts Created:**
- provider: google, count: X
- provider: microsoft, count: Y
```
