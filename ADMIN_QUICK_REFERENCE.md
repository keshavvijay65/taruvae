# Admin Quick Reference - Deal & Combo बनाना

## 🎯 Quick Steps

### 💰 DEAL बनाना (2 मिनट में)

```
1. Admin Panel खोलें → /admin/products
2. "+ Add Product" click करें
3. ये fields fill करें:

   ✅ Product Name: "Premium Ghee Special Offer"
   ✅ Category: ghee (dropdown से)
   ✅ Price: 1300
   ✅ Original Price: 1600 ⭐ (जरूरी!)
   ✅ Discount: 18 ⭐ (>= 15% होना चाहिए)
   ✅ Size: "1 KG"
   ✅ Description: "Premium Ghee at discounted price..."
   ✅ Features: "A2 Milk, Bilona Method, 18% Discount"
   ✅ Benefits: "Save ₹300, Pure & Natural"
   ✅ Image: "/images/products/GHEE.png"
   
4. "Save Product" click करें
```

---

### 🎁 COMBO बनाना (3 मिनट में)

```
1. Admin Panel खोलें → /admin/products
2. "+ Add Product" click करें
3. ये fields fill करें:

   ✅ Product Name: "Complete Cooking Essentials Combo"
   ✅ Category: combo ⭐⭐ (बिल्कुल यही select करें!)
   ✅ Price: 2500
   ✅ Original Price: 3200 ⭐ (individual products का total)
   ✅ Discount: 21 ⭐ (>= 15% होना चाहिए)
   ✅ Size: "Oil + Ghee + Spices"
   ✅ Description: "Everything you need: Peanut Oil (500ml), 
                    Ghee (500gm), Garam Masala (100gm), 
                    Hing (25gm), Jeera (100gm)..." ⭐⭐
                    (सभी products detail में mention करें!)
   ✅ Features: "5 Products, Complete Kitchen, 21% Savings"
   ✅ Benefits: "Save ₹700, One Stop Shop"
   ✅ Image: "/images/all/products image available soon.png"
   
4. "Save Product" click करें
```

---

## ⚠️ Common Mistakes (बचें!)

### Deal में:
❌ **Original Price** भूल जाना → Deal show नहीं होगा
❌ **Discount < 15%** → Deals filter में show नहीं होगा
❌ Price > Original Price → Logic error

### Combo में:
❌ **Category में "combo" नहीं select करना** → Combo filter में show नहीं होगा
❌ **Description में products mention नहीं करना** → Users को पता नहीं चलेगा combo में क्या है
❌ Category में uppercase "COMBO" → Case-sensitive है, काम नहीं करेगा

---

## ✅ Success Checklist

### Deal के लिए:
- [ ] Original Price filled है
- [ ] Discount >= 15% है
- [ ] Price < Original Price है
- [ ] Description में discount mention है

### Combo के लिए:
- [ ] Category = "combo" है (lowercase)
- [ ] Description में सभी products mention हैं
- [ ] Original Price में individual total है
- [ ] Size में combo contents mention हैं

---

## 📊 Form Fields Map

```
┌─────────────────────────────────────┐
│  Product Name *                     │ ← Deal/Combo का name
├─────────────────────────────────────┤
│  Category *                          │ ← ghee/combo select करें
├─────────────────────────────────────┤
│  Price (₹) *                         │ ← Current price
├─────────────────────────────────────┤
│  Original Price (₹)                 │ ← ⭐ Deal के लिए जरूरी!
├─────────────────────────────────────┤
│  Discount (%)                       │ ← ⭐ >= 15% होना चाहिए
├─────────────────────────────────────┤
│  Size/Weight                         │ ← Product size या combo contents
├─────────────────────────────────────┤
│  Description                         │ ← ⭐⭐ Combo में products detail
├─────────────────────────────────────┤
│  Features                            │ ← Comma separated list
├─────────────────────────────────────┤
│  Benefits                            │ ← Comma separated list
├─────────────────────────────────────┤
│  Image URL                           │ ← Image path
├─────────────────────────────────────┤
│  Rating                              │ ← 1-5 rating
├─────────────────────────────────────┤
│  Stock                               │ ← Available quantity
└─────────────────────────────────────┘
```

---

## 🎯 Examples

### Deal Example:
```
Name: Premium Ghee Special Offer
Category: ghee
Price: 1300
Original Price: 1600 ✅
Discount: 18 ✅
Size: 1 KG
Description: Premium Ghee at discounted price...
```

### Combo Example:
```
Name: Complete Cooking Essentials Combo
Category: combo ✅✅
Price: 2500
Original Price: 3200 ✅
Discount: 21 ✅
Size: Oil + Ghee + Spices
Description: Peanut Oil (500ml), Ghee (500gm), 
             Garam Masala (100gm), Hing (25gm), 
             Jeera (100gm)... ✅✅
```

---

## 🚀 Test करें

1. Product save करने के बाद
2. `/products` page पर जाएं
3. "Deals" filter click करें → Deal show होना चाहिए
4. "Combo" filter click करें → Combo show होना चाहिए

---

**Quick और Easy! 🎉**

