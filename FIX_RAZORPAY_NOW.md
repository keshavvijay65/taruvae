# 🔴 URGENT: Razorpay Key Secret Add करें - Step by Step

## Problem:
`.env.local` file में अभी भी `RAZORPAY_KEY_SECRET=your_key_secret_here` है (placeholder)

## ✅ Solution (5 मिनट):

### Step 1: Razorpay Dashboard से Key Secret लें

1. **Browser में खोलें**: https://dashboard.razorpay.com/app/keys
2. **Login करें** अपने Razorpay account से
3. **Top Right में "Live Mode" toggle करें** (Test Mode नहीं!)
4. **"Generate Key" button click करें** (अगर पहले से generate नहीं है)
5. **Key Secret copy करें** - यह Key ID के नीचे दिखेगा
   - Format: `abc123xyz456789...` (लंबी string होगी)
   - ⚠️ **IMPORTANT**: Key Secret सिर्फ एक बार दिखता है, copy करके safe रखें

### Step 2: `.env.local` File Edit करें

1. **VS Code या Notepad में खोलें**: `C:\Users\LENOVO\Downloads\taruvae-main\taruvae-main\.env.local`
2. **Line 4 को replace करें**:
   
   **पहले (Current):**
   ```
   RAZORPAY_KEY_SECRET=your_key_secret_here
   ```
   
   **बाद में (Your actual key):**
   ```
   RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET_PASTE_HERE
   ```
   
   **Example:**
   ```
   RAZORPAY_KEY_SECRET=abc123xyz456789def012ghi345jkl678mno901pqr234stu567vwx890
   ```

3. **File Save करें** (Ctrl+S)

### Step 3: Server Hard Restart करें

**⚠️ IMPORTANT**: Environment variables load करने के लिए server को completely restart करना होगा:

1. **Terminal में जाएं** जहाँ `npm run dev` चल रहा है
2. **Ctrl+C दबाएं** (server stop होगा)
3. **Wait करें** 2-3 seconds
4. **फिर restart करें**:
   ```bash
   npm run dev
   ```

### Step 4: Verify करें

Server restart के बाद terminal में check करें:
- कोई error नहीं आनी चाहिए
- Server successfully start होना चाहिए

### Step 5: Test करें

1. Browser में checkout page खोलें
2. Form fill करें
3. "Online Payment (Razorpay)" select करें
4. "Place Order" click करें
5. **अब Razorpay payment modal open होना चाहिए!** ✅

## 🔍 अगर अभी भी Error आए:

### Check करें:

1. ✅ `.env.local` file में Key Secret correctly paste हुआ है?
   - No spaces before/after `=`
   - No quotes around the value
   - Correct format: `RAZORPAY_KEY_SECRET=actual_key_here`

2. ✅ Server restart किया है?
   - Ctrl+C से stop किया?
   - फिर `npm run dev` से restart किया?

3. ✅ Razorpay Dashboard में Live Mode में है?
   - Test Mode नहीं, Live Mode होना चाहिए

4. ✅ Key Secret correct है?
   - Razorpay Dashboard से copy किया?
   - पूरी string paste की है?

### Debug करने के लिए:

Terminal में server logs check करें - अगर Key Secret correctly load हुआ है तो कोई error नहीं आएगी।

---

**Note**: Key Secret को **NEVER** share करें या Git में commit न करें!
