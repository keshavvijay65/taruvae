# 🚀 Hostinger Deployment - Quick Guide

## ✅ Step 1: Files Ready Check
- ✅ Build complete (`out` folder ready)
- ✅ `.htaccess` file copied to `out` folder
- ✅ All static files generated

---

## 📤 Step 2: Hostinger पर Upload करें

### **Method 1: File Manager (Easiest - Recommended)**

1. **Hostinger Login करें:**
   - https://www.hostinger.in/login
   - अपने credentials से login करें

2. **hPanel/cPanel खोलें:**
   - Dashboard से **hPanel** या **cPanel** open करें

3. **File Manager में जाएं:**
   - **Files** section में **File Manager** click करें
   - `public_html` folder में जाएं (या आपका domain root folder)

4. **Old Files Delete करें (अगर हैं):**
   - `public_html` में पुरानी files select करें
   - Delete करें (सिर्फ files, folders नहीं)

5. **New Files Upload करें:**
   - **Upload** button click करें
   - `out` folder की **सभी files और folders** select करें
   - Upload करें
   - **Important:** सभी files और folders upload करें (including `_next`, `images`, etc.)

---

### **Method 2: FTP (Faster for Large Files)**

1. **FTP Client Install करें:**
   - FileZilla download करें: https://filezilla-project.org/
   - Install करें

2. **FTP Connection Setup:**
   - **Host:** ftp.yourdomain.com (या Hostinger दिया हुआ FTP host)
   - **Username:** Hostinger FTP username
   - **Password:** Hostinger FTP password
   - **Port:** 21
   - Connect करें

3. **Files Upload:**
   - Left side: Local `out` folder
   - Right side: Remote `public_html` folder
   - `out` folder की सभी files को `public_html` में drag & drop करें

---

## ⚙️ Step 3: .htaccess File Verify करें

1. File Manager में `public_html` folder में जाएं
2. `.htaccess` file check करें (यह hidden हो सकती है)
3. अगर नहीं है, तो:
   - File Manager में **Show Hidden Files** enable करें
   - या manually create करें और content paste करें

---

## 🔒 Step 4: SSL Certificate Enable करें

1. hPanel में **SSL** section में जाएं
2. **Let's Encrypt SSL** enable करें (Free)
3. Domain के लिए SSL activate करें
4. Wait करें (2-5 minutes)

---

## ✅ Step 5: Website Test करें

1. Browser में अपना domain open करें
2. Check करें:
   - ✅ Home page load हो रहा है
   - ✅ All pages काम कर रहे हैं
   - ✅ Images display हो रहे हैं
   - ✅ Login/Register काम कर रहा है
   - ✅ Mobile responsive है

---

## 📁 Upload करने वाली Files Structure

```
public_html/
├── .htaccess          ← Important!
├── index.html
├── 404.html
├── _next/             ← Important! (सभी JS/CSS files)
│   └── static/
├── images/            ← Important! (सभी images)
├── account/
├── admin/
├── products/
├── cart/
├── checkout/
├── contact/
├── faq/
├── login/
├── orders/
├── privacy/
├── shipping/
├── terms/
└── ... (सभी folders)
```

**⚠️ Important:** 
- `_next` folder जरूर upload करें (यह JavaScript/CSS files contain करता है)
- `images` folder जरूर upload करें
- सभी folders और files upload करें

---

## 🔄 Future Updates कैसे करें

जब भी changes करने हों:

1. Local में code change करें
2. Terminal में:
   ```bash
   npm run build
   ```
3. `out` folder की files को फिर से upload करें
4. Old files replace करें

---

## 🆘 Common Issues & Solutions

### Issue 1: 404 Error on Pages
**Solution:** 
- `.htaccess` file check करें
- File Manager में "Show Hidden Files" enable करें
- `.htaccess` file `public_html` में होनी चाहिए

### Issue 2: Website Blank/White Screen
**Solution:**
- Browser console check करें (F12)
- `_next` folder properly upload हुआ है या नहीं check करें
- All files upload हुई हैं या नहीं verify करें

### Issue 3: Images Not Loading
**Solution:**
- `images` folder properly upload हुआ है या नहीं check करें
- Image paths verify करें

### Issue 4: Firebase Not Working
**Solution:**
- Firebase Console में जाएं
- **Authentication > Settings > Authorized domains**
- अपना domain add करें (जैसे: yourdomain.com)

---

## 📞 Support

अगर कोई issue हो:
1. Browser Console check करें (F12 → Console tab)
2. Hostinger Error Logs check करें (hPanel → Error Logs)
3. Firebase Console check करें

---

## ✅ Final Checklist

- [ ] `out` folder की सभी files upload हुई हैं
- [ ] `.htaccess` file `public_html` में है
- [ ] `_next` folder upload हुआ है
- [ ] `images` folder upload हुआ है
- [ ] SSL certificate enabled है
- [ ] Website properly load हो रहा है
- [ ] All pages काम कर रहे हैं
- [ ] Mobile responsive है

---

**🎉 Done! Website live हो गया है!**

