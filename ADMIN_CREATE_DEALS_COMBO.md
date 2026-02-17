# Admin Guide: Combo और Deal Products कैसे बनाएं

## 📋 Overview

यह guide आपको step-by-step बताएगा कि Admin Panel से **Deal** और **Combo** products कैसे create करें।

---

## 🎯 Step 1: Admin Panel खोलें

1. Browser में जाएं: `/admin/products`
2. Admin credentials से **Login** करें
3. Products page खुल जाएगा

---

## 💰 DEAL Product कैसे बनाएं

### Step-by-Step:

#### **Step 1: Add Product Button Click करें**
- Page के top पर **"+ Add Product"** button दिखेगा
- उस पर click करें

#### **Step 2: Form Fill करें**

**Required Fields (जरूरी):**

1. **Product Name** ⭐
   ```
   Example: "Premium Ghee Special Offer"
   ```
   - Deal का clear name दें
   - "Special Offer", "Deal", "Discount" जैसे words use करें

2. **Category** ⭐
   ```
   Dropdown से select करें:
   - oil
   - ghee
   - superfoods
   - combo (अगर combo deal है)
   ```
   - Deal किस category का है, वो select करें

3. **Price (₹)** ⭐
   ```
   Example: 1300
   ```
   - **Current selling price** डालें (discount के बाद)

**Important Fields for DEALS:**

4. **Original Price (₹)** 💡
   ```
   Example: 1600
   ```
   - **Original price** डालें (discount से पहले)
   - यह **बहुत जरूरी है** deals के लिए!
   - अगर यह नहीं डालेंगे तो deal show नहीं होगा

5. **Discount (%)** 💡
   ```
   Example: 18
   ```
   - **Discount percentage** डालें
   - **कम से कम 15%** होना चाहिए (deals filter के लिए)
   - या system automatically calculate करेगा अगर originalPrice डाला है

6. **Size/Weight**
   ```
   Example: "1 KG" या "Set of 5 Spices"
   ```
   - Product का size mention करें

7. **Description**
   ```
   Example: "Premium Desi Cow Bilona Ghee at special discounted price. 
   Made from A2 milk using traditional Bilona method."
   ```
   - Product की details लिखें
   - Discount mention करें

8. **Features** (Optional)
   ```
   Example: 
   - "A2 Milk"
   - "Bilona Method"
   - "18% Discount"
   ```
   - Key features list करें
   - Comma से separate करें

9. **Benefits** (Optional)
   ```
   Example:
   - "Save ₹300"
   - "Pure & Natural"
   - "Rich in Nutrients"
   ```
   - Benefits mention करें
   - Comma से separate करें

10. **Image URL**
    ```
    Example: "/images/products/GHEE.png"
    ```
    - Product image का path डालें

11. **Rating** (Optional)
    ```
    Example: 4.9
    ```
    - Product rating (1-5)

12. **Stock** (Optional)
    ```
    Example: 100
    ```
    - Available stock quantity

#### **Step 3: Save करें**
- Form के bottom पर **"Save Product"** button click करें
- Product save हो जाएगा और Firebase में store होगा

---

## 🎁 COMBO Product कैसे बनाएं

### Step-by-Step:

#### **Step 1: Add Product Button Click करें**
- Page के top पर **"+ Add Product"** button click करें

#### **Step 2: Form Fill करें**

**Required Fields (जरूरी):**

1. **Product Name** ⭐
   ```
   Example: "Complete Cooking Essentials Combo"
   ```
   - Combo का clear name दें
   - "Combo", "Pack", "Bundle" जैसे words use करें

2. **Category** ⭐ **बहुत जरूरी!**
   ```
   Dropdown से EXACTLY यह select करें:
   - combo
   ```
   - **बिल्कुल "combo"** select करें (lowercase में)
   - अगर यह नहीं करेंगे तो combo filter में show नहीं होगा!

3. **Price (₹)** ⭐
   ```
   Example: 2500
   ```
   - **Combo का total price** डालें (discount के बाद)

**Important Fields for COMBO:**

4. **Original Price (₹)** 💡
   ```
   Example: 3200
   ```
   - **Individual products का total price** डालें
   - Example: अगर combo में 3 products हैं जिनका individual total ₹3200 है
   - यह **बहुत जरूरी है** discount show करने के लिए

5. **Discount (%)** 💡
   ```
   Example: 21
   ```
   - **Discount percentage** डालें
   - Usually combo में 20%+ discount होता है

6. **Size/Weight**
   ```
   Example: "Oil + Ghee + Spices"
   या "Set of 5 Products"
   ```
   - Combo में क्या-क्या है, mention करें
   - Example: "Peanut Oil (500ml) + Ghee (500gm) + 3 Spices"

7. **Description** 💡 **बहुत जरूरी!**
   ```
   Example: "Everything you need for daily cooking: 
   Peanut Oil (500ml), Premium Ghee (500gm), 
   Garam Masala (100gm), Hing (25gm), Jeera (100gm). 
   Complete kitchen essentials in one pack."
   ```
   - **Combo में क्या-क्या included है, detail में लिखें**
   - हर product का name और size mention करें
   - यह users के लिए बहुत important है

8. **Features** (Recommended)
   ```
   Example:
   - "5 Products"
   - "Complete Kitchen"
   - "21% Savings"
   ```
   - Combo की key features
   - Kitne products हैं, mention करें

9. **Benefits** (Recommended)
   ```
   Example:
   - "Save ₹700"
   - "One Stop Shop"
   - "Premium Quality"
   ```
   - Combo के benefits
   - कितना save होगा, mention करें

10. **Image URL**
    ```
    Example: "/images/all/products image available soon.png"
    ```
    - Combo का image path
    - अगर combo image नहीं है तो placeholder use करें

11. **Rating** (Optional)
    ```
    Example: 4.8
    ```

12. **Stock** (Optional)
    ```
    Example: 50
    ```

#### **Step 3: Save करें**
- **"Save Product"** button click करें
- Combo product save हो जाएगा

---

## ✅ Checklist - Deal बनाते समय

- [ ] Product Name में "Deal" या "Offer" mention है
- [ ] **Original Price** filled है (बहुत जरूरी!)
- [ ] **Discount >= 15%** है
- [ ] Price < Original Price है
- [ ] Description में discount mention है
- [ ] Features में discount percentage mention है

---

## ✅ Checklist - Combo बनाते समय

- [ ] Product Name में "Combo" या "Pack" mention है
- [ ] **Category = "combo"** है (exactly lowercase में!)
- [ ] **Original Price** filled है (individual products का total)
- [ ] **Discount >= 15%** है (usually 20%+)
- [ ] **Description में सभी included products mention हैं**
- [ ] Size field में combo contents mention हैं
- [ ] Features में kitne products हैं, mention है
- [ ] Benefits में savings amount mention है

---

## 📝 Examples

### Example 1: Deal Product

```
Product Name: Premium Ghee Special Offer
Category: ghee
Price: 1300
Original Price: 1600
Discount: 18
Size: 1 KG
Description: Premium Desi Cow Bilona Ghee at special discounted price. 
Made from A2 milk using traditional Bilona method.
Features: A2 Milk, Bilona Method, 18% Discount
Benefits: Save ₹300, Pure & Natural, Rich in Nutrients
Image: /images/products/GHEE.png
Rating: 4.9
Stock: 100
```

### Example 2: Combo Product

```
Product Name: Complete Cooking Essentials Combo
Category: combo (बिल्कुल यही!)
Price: 2500
Original Price: 3200
Discount: 21
Size: Oil + Ghee + Spices
Description: Everything you need for daily cooking: 
Peanut Oil (500ml), Premium Ghee (500gm), 
Garam Masala (100gm), Hing (25gm), Jeera (100gm). 
Complete kitchen essentials in one pack.
Features: 5 Products, Complete Kitchen, 21% Savings
Benefits: Save ₹700, One Stop Shop, Premium Quality
Image: /images/all/products image available soon.png
Rating: 4.8
Stock: 50
```

---

## 🎯 Important Tips

### Deals के लिए:
1. ✅ **Original Price जरूर fill करें** - बिना इसके deal show नहीं होगा
2. ✅ **Discount >= 15%** रखें - deals filter के लिए minimum requirement
3. ✅ Clear description में discount mention करें
4. ✅ Benefits में savings amount mention करें

### Combo के लिए:
1. ✅ **Category = "combo"** (exactly lowercase, no spaces!)
2. ✅ **Description में सभी products detail में mention करें**
3. ✅ Original Price में individual products का total डालें
4. ✅ Size field में combo contents mention करें
5. ✅ Features में product count mention करें

---

## 🔧 Troubleshooting

### Problem: Deal filter में product show नहीं हो रहा
**Solution:**
- Check करें `originalPrice` filled है
- Check करें `discount >= 15%` है
- Calculate: `discount = ((originalPrice - price) / originalPrice) * 100`

### Problem: Combo filter में product show नहीं हो रहा
**Solution:**
- Check करें `category` field में exactly `combo` है (lowercase)
- No spaces, no uppercase
- Case-sensitive है!

### Problem: Discount calculate नहीं हो रहा
**Solution:**
- `originalPrice` और `price` दोनों fill करें
- System automatically calculate करेगा
- या manually `discount` field में percentage डालें

---

## 🚀 Quick Steps Summary

### Deal बनाने के लिए:
1. "+ Add Product" click करें
2. Name, Category, Price fill करें
3. **Original Price** fill करें (जरूरी!)
4. **Discount >= 15%** डालें
5. Description, Features, Benefits fill करें
6. "Save Product" click करें

### Combo बनाने के लिए:
1. "+ Add Product" click करें
2. Name fill करें
3. **Category = "combo"** select करें (जरूरी!)
4. Price और **Original Price** fill करें
5. **Description में सभी products detail में mention करें** (जरूरी!)
6. Size में combo contents mention करें
7. Features और Benefits fill करें
8. "Save Product" click करें

---

## 📞 Need Help?

अगर कोई problem हो:
1. Browser console check करें (F12)
2. Form fields double-check करें
3. Category exact match check करें (case-sensitive)
4. Original Price और Discount fields verify करें

---

**Happy Creating! 🎉**

