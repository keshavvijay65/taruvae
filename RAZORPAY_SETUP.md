# Razorpay Integration Setup Guide

## 📋 जरूरी Information

Razorpay integrate करने के लिए आपको ये चीजें चाहिए:

### 1. Razorpay Account
- Razorpay account बनाएं: https://razorpay.com/
- Dashboard login करें: https://dashboard.razorpay.com/

### 2. Razorpay Keys (जरूरी!)

**Test Mode के लिए:**
- Dashboard में जाएं: **Settings** → **API Keys**
- **Test Mode** में **Generate Key** करें
- आपको मिलेंगे:
  - **Key ID**: `rzp_test_xxxxxxxxxxxxx`
  - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxx`

**Production Mode के लिए:**
- Account activate होने के बाद
- **Live Mode** में **Generate Key** करें
  - **Key ID**: `rzp_live_xxxxxxxxxxxxx`
  - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxx`

## 🔧 Setup Steps

### Step 1: Environment Variables Setup

Project root में `.env.local` file बनाएं (अगर नहीं है):

```env
# Razorpay Configuration - LIVE KEYS
# ⚠️ IMPORTANT: Key Secret को Razorpay Dashboard से लें: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_live_S0BsmqixJdw9sX
RAZORPAY_KEY_SECRET=your_key_secret_here

# Frontend के लिए (public) - Live Key ID
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_S0BsmqixJdw9sX
```

**⚠️ Important:**
- `.env.local` file को **NEVER commit** करें Git में
- Production में Live keys use करें
- Test mode में Test keys use करें

### Step 2: Code में Update करें

#### File: `src/app/api/razorpay/create-order/route.ts`
- Line 8-9: Environment variables automatically use हो रहे हैं
- अगर `.env.local` में keys add की हैं, तो कुछ change नहीं करना

#### File: `src/app/api/razorpay/verify-payment/route.ts`
- Line 10: Environment variable automatically use हो रहा है

#### File: `src/app/checkout/page.tsx`
- Line 67: `RAZORPAY_KEY_ID` environment variable से automatically load हो रहा है

### Step 3: Test करें

1. **Development server start करें:**
   ```bash
   npm run dev
   ```

2. **Checkout page पर जाएं:**
   - Cart में products add करें
   - Checkout page पर जाएं
   - **"Online Payment"** option select करें
   - Form fill करें और **"Place Order"** click करें

3. **Razorpay Checkout:**
   - Razorpay payment modal open होगा
   - Test card details use करें:
     - **Card Number**: `4111 1111 1111 1111`
     - **CVV**: Any 3 digits (e.g., `123`)
     - **Expiry**: Any future date (e.g., `12/25`)
     - **Name**: Any name

4. **Payment Success:**
   - Payment successful होने के बाद order place होगा
   - Order confirmation page दिखेगा

## 🔒 Security Notes

1. **Never expose Key Secret:**
   - Key Secret सिर्फ server-side (API routes) में use करें
   - Frontend में Key ID ही use करें

2. **Environment Variables:**
   - `.env.local` file को `.gitignore` में add करें
   - Production में proper environment variables set करें

3. **HTTPS:**
   - Production में HTTPS use करें (Razorpay requirement)

## 📝 Payment Methods Supported

Razorpay के through ये payment methods available हैं:
- ✅ Credit/Debit Cards (Visa, Mastercard, RuPay, etc.)
- ✅ UPI (Google Pay, PhonePe, Paytm, BHIM, etc.)
- ✅ Net Banking
- ✅ Wallets (Paytm, Freecharge, etc.)

## 🐛 Troubleshooting

### Error: "Razorpay is not loaded"
- Browser console check करें
- Razorpay script load हो रहा है या नहीं देखें
- Internet connection check करें

### Error: "Failed to create order"
- `.env.local` file में keys correctly set हैं या नहीं check करें
- Server logs check करें
- Razorpay dashboard में API keys active हैं या नहीं check करें

### Payment not verifying
- Key Secret correctly set है या नहीं check करें
- Server logs में error देखें

## 📞 Support

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Dashboard: https://dashboard.razorpay.com/
- Test Cards: https://razorpay.com/docs/payments/test-cards/

---

**Note:** Test mode में payments actual में process नहीं होतीं। Production में live keys use करने से पहले Razorpay account activate करें।

