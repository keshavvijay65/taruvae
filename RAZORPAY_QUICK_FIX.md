# ⚡ Razorpay Quick Fix - Project Live करने के लिए

## 🔴 Problem: "Failed to create order"

यह error इसलिए आ रहा है क्योंकि **Razorpay Key Secret** `.env.local` file में नहीं है।

## ✅ Solution (2 मिनट में):

### Step 1: Razorpay Dashboard से Key Secret लें

1. **Razorpay Dashboard खोलें**: https://dashboard.razorpay.com/app/keys
2. **Live Mode** में जाएं (top right corner में toggle)
3. अपना **Key Secret** copy करें (Key ID के साथ दिखेगा)

### Step 2: `.env.local` File Update करें

Project root में `.env.local` file खोलें और यह update करें:

```env
# Razorpay Configuration - LIVE KEYS
RAZORPAY_KEY_ID=rzp_live_S0BsmqixJdw9sX
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET_HERE  # ⚠️ यहाँ अपना actual Key Secret paste करें

# Frontend (public) - Live Key ID
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_S0BsmqixJdw9sX
```

**Example:**
```env
RAZORPAY_KEY_SECRET=abc123xyz456789def012ghi345jkl678mno901pqr234stu567vwx890
```

### Step 3: Server Restart करें

```bash
# Server stop करें (Ctrl+C)
# फिर restart करें:
npm run dev
```

## ✅ Test करें:

1. Checkout page पर जाएं
2. "Online Payment (Razorpay)" select करें
3. Form fill करें और "Place Order" click करें
4. Razorpay payment modal open होना चाहिए

## 🔍 अगर अभी भी Error आए:

### Check करें:
1. ✅ `.env.local` file में Key Secret correctly paste हुआ है या नहीं
2. ✅ Server restart किया है या नहीं
3. ✅ Razorpay Dashboard में Live keys active हैं या नहीं
4. ✅ Browser console में error message check करें

### Server Logs Check करें:
Terminal में error message देखें - अब detailed error message दिखेगा जो exact problem बताएगा।

## 📞 Support:

- Razorpay Dashboard: https://dashboard.razorpay.com/
- Key Secret कहाँ मिलेगा: https://dashboard.razorpay.com/app/keys

---

**Note**: Key Secret को **NEVER** Git में commit न करें। यह सिर्फ `.env.local` में होना चाहिए।
