# 🚀 Hostinger Deployment Guide - Taruvae Website

## 📋 Prerequisites - Kya Kya Chahiye

### 1. **Hostinger Account Details:**
   - ✅ Hostinger hosting account (Shared Hosting या VPS)
   - ✅ Domain name (जैसे: taruvae.com)
   - ✅ FTP/cPanel access credentials
   - ✅ Email: Hostinger से मिले login details

### 2. **Project Files:**
   - ✅ Complete project folder (यह folder)
   - ✅ Firebase configuration (already in code)

### 3. **Information Needed:**
   - ✅ Domain name
   - ✅ Hostinger cPanel/FTP username
   - ✅ Hostinger cPanel/FTP password
   - ✅ Hosting plan type (Shared/VPS)

---

## 🔧 Step-by-Step Deployment Process

### **Step 1: Build Project Locally**

```bash
# Terminal में project folder में जाएं
cd C:\Users\LENOVO\OneDrive\Desktop\Taruvae

# Dependencies install करें (अगर नहीं हैं)
npm install

# Production build बनाएं
npm run build
```

यह `out` folder बनाएगा जिसमें सभी static files होंगी।

---

### **Step 2: Hostinger cPanel में जाएं**

1. Hostinger website login करें
2. **hPanel** या **cPanel** open करें
3. **File Manager** में जाएं
4. `public_html` folder में जाएं (या domain का root folder)

---

### **Step 3: Files Upload करें**

**Option A: File Manager से (Easy)**
1. `out` folder की सभी files select करें
2. Zip बनाएं
3. cPanel File Manager में upload करें
4. Extract करें
5. सभी files को `public_html` में move करें

**Option B: FTP से (Faster)**
1. FTP client (FileZilla) install करें
2. Hostinger FTP credentials use करें
3. `out` folder की सभी files को `public_html` में upload करें

---

### **Step 4: .htaccess File Setup**

`public_html` folder में `.htaccess` file बनाएं:

```apache
# Enable Rewrite Engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Handle Next.js routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ /$1.html [L]

  # Remove .html extension
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}\.html -f
  RewriteRule ^(.*)\.html$ /$1 [L,R=301]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache Control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

### **Step 5: Domain Configuration**

1. Domain को hosting से link करें (अगर नहीं है)
2. DNS settings check करें
3. SSL certificate enable करें (Let's Encrypt - Free)

---

### **Step 6: Firebase Configuration Check**

Firebase already configured है, लेकिन verify करें:
- Firebase Realtime Database rules check करें
- Firebase Authentication settings verify करें

---

## 📁 Files Structure After Deployment

```
public_html/
├── index.html
├── _next/
│   ├── static/
│   └── ...
├── images/
├── contact/
├── products/
├── .htaccess
└── ... (all other files from out folder)
```

---

## ✅ Post-Deployment Checklist

- [ ] Website opens correctly
- [ ] All pages load properly
- [ ] Images display correctly
- [ ] Firebase connection works
- [ ] Login/Register works
- [ ] Orders functionality works
- [ ] Admin panel accessible
- [ ] Mobile responsive check
- [ ] SSL certificate active (HTTPS)

---

## 🔄 Updates Kaise Kare (Future)

जब भी changes करने हों:

1. Local में changes करें
2. `npm run build` run करें
3. `out` folder की files को फिर से upload करें
4. Old files replace करें

---

## 🆘 Common Issues & Solutions

### Issue 1: 404 Errors on Pages
**Solution:** `.htaccess` file check करें और proper routing setup करें

### Issue 2: Images Not Loading
**Solution:** Image paths check करें, `public` folder properly upload हुआ है या नहीं

### Issue 3: Firebase Not Working
**Solution:** Firebase config verify करें, domain को Firebase authorized domains में add करें

### Issue 4: Slow Loading
**Solution:** Images optimize करें, compression enable करें

---

## 📞 Support

अगर कोई issue हो:
1. Browser console check करें (F12)
2. Hostinger error logs check करें
3. Firebase console check करें

---

## 🎯 Quick Commands

```bash
# Build
npm run build

# Check build locally
cd out
npx serve

# Test production build
npm run build && npm run start
```

---

**Note:** यह static export है, इसलिए server-side features (API routes) काम नहीं करेंगे। सभी data Firebase से directly load होगा, जो perfect है!

