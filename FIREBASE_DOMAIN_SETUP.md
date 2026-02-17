# 🔥 Firebase Domain Setup Guide - Hostinger के लिए

## 📋 Step 1: Firebase Authentication में Domain Add करें

### **Method 1: Authentication Settings से**

1. **Firebase Console में जाएं:**
   - https://console.firebase.google.com/
   - अपने project `taruvae2024` को select करें

2. **Authentication Section:**
   - Left sidebar में **"Authentication"** click करें
   - **"Settings"** tab पर जाएं (gear icon)
   - **"Authorized domains"** section scroll करें

3. **Domain Add करें:**
   - **"Add domain"** button click करें
   - अपना domain enter करें (जैसे: `yourdomain.com` या `www.yourdomain.com`)
   - **"Add"** click करें

4. **Important Domains:**
   - ✅ `yourdomain.com` (without www)
   - ✅ `www.yourdomain.com` (with www)
   - ✅ `localhost` (development के लिए - already होगा)

---

## 📋 Step 2: Firebase Realtime Database Rules Update करें

1. **Realtime Database में जाएं:**
   - Left sidebar में **"Realtime Database"** click करें
   - **"Rules"** tab पर जाएं

2. **Rules Check करें:**
   - Current rules verify करें
   - Domain-specific rules की जरूरत नहीं है (Firebase automatically handle करता है)

---

## 📋 Step 3: Firebase Hosting (Optional - अगर use कर रहे हैं)

अगर आप Firebase Hosting use नहीं कर रहे (Hostinger use कर रहे हैं), तो यह step skip करें।

---

## ✅ Authorized Domains List

Firebase में ये domains automatically authorized होते हैं:
- ✅ `localhost` (local development)
- ✅ `*.firebaseapp.com` (Firebase hosting)
- ✅ `*.web.app` (Firebase hosting)

**आपको manually add करना होगा:**
- ✅ `yourdomain.com` (आपका main domain)
- ✅ `www.yourdomain.com` (www version)

---

## 🔍 Step-by-Step Screenshots Guide

### **Step 1: Authentication Settings**
```
Firebase Console
  → Authentication (left sidebar)
    → Settings tab (gear icon)
      → Authorized domains section
        → Add domain button
```

### **Step 2: Domain Enter करें**
```
Add domain dialog:
  ┌─────────────────────────┐
  │ Domain:                 │
  │ [yourdomain.com      ]  │
  │                         │
  │  [Cancel]  [Add]       │
  └─────────────────────────┘
```

---

## ⚠️ Important Notes

1. **Domain Format:**
   - ✅ Correct: `yourdomain.com`
   - ✅ Correct: `www.yourdomain.com`
   - ❌ Wrong: `https://yourdomain.com` (https:// मत डालें)
   - ❌ Wrong: `yourdomain.com/` (trailing slash मत डालें)

2. **Both Versions Add करें:**
   - `yourdomain.com` (without www)
   - `www.yourdomain.com` (with www)
   
   यह important है क्योंकि users कभी www के साथ, कभी बिना www के access कर सकते हैं।

3. **SSL Certificate:**
   - Hostinger पर SSL enable करें (Let's Encrypt - Free)
   - Firebase HTTPS के साथ काम करता है

4. **Verification:**
   - Domain add करने के बाद, Firebase automatically verify करता है
   - कुछ minutes लग सकते हैं

---

## 🧪 Testing

Domain add करने के बाद:

1. **Website Test करें:**
   - अपने domain पर website open करें
   - Login/Register try करें
   - Browser console check करें (F12)

2. **Firebase Console Check करें:**
   - Authentication → Users
   - Realtime Database → Data
   - सब कुछ properly work कर रहा है या नहीं verify करें

---

## 🆘 Common Issues

### Issue 1: "Domain not authorized" Error
**Solution:**
- Firebase Console में domain properly add हुआ है या नहीं check करें
- Both versions add करें (with और without www)
- कुछ minutes wait करें (verification time)

### Issue 2: Login/Register Not Working
**Solution:**
- Browser console check करें (F12 → Console)
- Firebase config verify करें
- Domain authorized domains list में है या नहीं check करें

### Issue 3: CORS Errors
**Solution:**
- Domain properly authorized है या नहीं verify करें
- Firebase Realtime Database rules check करें

---

## 📝 Quick Checklist

- [ ] Firebase Console में Authentication → Settings खोला
- [ ] Authorized domains section में गया
- [ ] `yourdomain.com` add किया
- [ ] `www.yourdomain.com` add किया
- [ ] Domain verification complete हुआ
- [ ] Website पर test किया
- [ ] Login/Register properly काम कर रहा है

---

## 🎯 Example

अगर आपका domain है: `taruvae.com`

तो add करें:
1. `taruvae.com`
2. `www.taruvae.com`

**Note:** `https://` या trailing `/` मत डालें, सिर्फ domain name।

---

**✅ Done! अब आपका domain Firebase में authorized है!**


