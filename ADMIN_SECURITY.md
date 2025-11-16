# Admin Portal Security Guide

## ✅ Security Features Implemented

### 1. **JWT-Based Authentication**
- Sessions are stored as signed JWT tokens
- Works seamlessly in serverless environments (Vercel, Netlify, etc.)
- 7-day expiration
- Signed with `AUTH_SECRET` environment variable

### 2. **Password Security**
- Supports bcrypt password hashing
- Backward compatible with plain text for development
- Environment-based credential management

### 3. **Secure Cookie Settings**
- `httpOnly: true` - Prevents JavaScript access to cookies
- `secure: true` (production) - Only transmitted over HTTPS
- `sameSite: 'lax'` - CSRF protection
- `path: '/'` - Application-wide scope

### 4. **Route Protection**
- Middleware protects all `/admin/*` routes
- Automatic redirect to login for unauthenticated users
- All API endpoints validate JWT tokens

## 🔐 Production Deployment Checklist

### Required Environment Variables

```bash
# CRITICAL: Use a strong random string (minimum 32 characters)
AUTH_SECRET=your-very-strong-random-secret-at-least-32-characters-long

# Admin credentials
ADMIN_USERNAME=your-admin-email@domain.com

# Option 1: Plain password (NOT RECOMMENDED for production)
ADMIN_PASSWORD=YourSecureP@ssw0rd123!

# Option 2: Bcrypt hashed password (RECOMMENDED)
ADMIN_PASSWORD_HASH=$2a$10$YourBcryptHashHere
```

### How to Generate Bcrypt Hash

**Option 1: Online Tool**
1. Visit: https://bcrypt-generator.com/
2. Enter your password
3. Use 10 rounds
4. Copy the hash

**Option 2: Node.js Script**
```javascript
const bcrypt = require('bcrypt');
const password = 'YourSecurePassword';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

**Option 3: Command Line**
```bash
npm install -g bcrypt-cli
bcrypt-cli hash YourSecurePassword 10
```

### Deployment Steps

#### For Vercel:
1. Go to your project → Settings → Environment Variables
2. Add the following variables:
   - `AUTH_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH` (recommended) or `ADMIN_PASSWORD`
3. Redeploy your application

#### For Netlify:
1. Go to Site settings → Build & deploy → Environment
2. Add the same environment variables
3. Trigger a new deployment

## 🛡️ Security Best Practices

### DO:
- ✅ Use a strong `AUTH_SECRET` (32+ random characters)
- ✅ Use `ADMIN_PASSWORD_HASH` instead of plain password in production
- ✅ Change default credentials immediately
- ✅ Use HTTPS in production (automatic with Vercel/Netlify)
- ✅ Keep `AUTH_SECRET` confidential - never commit to git
- ✅ Rotate credentials periodically
- ✅ Monitor admin login attempts

### DON'T:
- ❌ Use default credentials (`admin@example.com` / `Admin123!`)
- ❌ Commit `.env.local` or `.env.production` to git
- ❌ Share `AUTH_SECRET` publicly
- ❌ Use weak passwords
- ❌ Disable HTTPS in production

## 🔄 Password Rotation

To change the admin password:

1. Generate new bcrypt hash for your new password
2. Update `ADMIN_PASSWORD_HASH` in your deployment platform
3. Redeploy the application
4. All existing sessions will remain valid until expiration (7 days)

To invalidate existing sessions immediately, change `AUTH_SECRET` (forces all users to re-login).

## 🚨 Security Considerations

### Current Limitations:
1. **Single Admin User**: Only one admin credential supported
2. **No Session Blacklist**: Logout only removes client-side cookie
3. **No Rate Limiting**: No built-in brute force protection
4. **No 2FA**: Two-factor authentication not implemented

### Recommended Improvements for Production:
1. **Database-backed Admin Users**: Store multiple admin users in Supabase
2. **Session Blacklist**: Use Redis or database to track invalidated tokens
3. **Rate Limiting**: Implement rate limiting on login endpoint
4. **Audit Logging**: Log all admin actions
5. **2FA**: Add two-factor authentication
6. **Password Reset**: Implement secure password reset flow

## 🧪 Testing

### Test Login:
```bash
curl -X POST http://localhost:3000/api/secure-portal/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@example.com","password":"Admin123!"}'
```

### Test Authentication:
```bash
curl http://localhost:3000/api/secure-portal/me \
  --cookie "adminSession=YOUR_JWT_TOKEN_HERE"
```

## 📚 Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Bcrypt vs PBKDF2](https://security.stackexchange.com/questions/4781/do-any-security-experts-recommend-bcrypt-for-password-storage)
