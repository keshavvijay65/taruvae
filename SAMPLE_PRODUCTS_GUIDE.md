# Sample Products Guide - Deals & Combo (2-2 Samples)

## 📦 Sample Products Created

### ✅ DEALS (2 Samples)

#### 1. Premium Ghee Special Offer
```
Product ID: 64
Name: Premium Ghee Special Offer
Price: ₹1,300
Original Price: ₹1,600
Discount: 18%
Size: 1 KG
Category: ghee
Rating: 4.9 ⭐
Reviews: 145
Description: Premium Desi Cow Bilona Ghee at special discounted price. Made from A2 milk using traditional Bilona method.
Features: A2 Milk, Bilona Method, 18% Discount
Benefits: Save ₹300, Pure & Natural, Rich in Nutrients
```

#### 2. Spice Starter Kit Deal
```
Product ID: 65
Name: Spice Starter Kit Deal
Price: ₹850
Original Price: ₹1,100
Discount: 22%
Size: Set of 5 Spices
Category: superfoods
Rating: 4.7 ⭐
Reviews: 112
Description: Essential spices pack: Hing (25gm), Garam Masala (100gm), Jeeravan (100gm), Turmeric (50gm), Jeera (100gm). Perfect for kitchen essentials.
Features: 5 Essential Spices, 22% Discount, Kitchen Essentials
Benefits: Save ₹250, Complete Kit, Premium Quality
```

---

### ✅ COMBO (2 Samples)

#### 1. Complete Cooking Essentials Combo
```
Product ID: 66
Name: Complete Cooking Essentials Combo
Price: ₹2,500
Original Price: ₹3,200
Discount: 21%
Size: Oil + Ghee + Spices
Category: combo
Rating: 4.8 ⭐
Reviews: 156
Description: Everything you need for daily cooking: Peanut Oil (500ml), Premium Ghee (500gm), Garam Masala (100gm), Hing (25gm), Jeera (100gm). Complete kitchen essentials in one pack.
Features: 5 Products, Complete Kitchen, 21% Savings
Benefits: Save ₹700, One Stop Shop, Premium Quality
```

#### 2. Healthy Morning Combo Pack
```
Product ID: 67
Name: Healthy Morning Combo Pack
Price: ₹1,800
Original Price: ₹2,300
Discount: 21%
Size: Ghee + Coffee + Spices
Category: combo
Rating: 4.7 ⭐
Reviews: 134
Description: Start your day right with this wellness combo: Premium Ghee (500gm), 100% Arabica Coffee Powder (100gm), Turmeric Powder (50gm), Black Pepper (50gm). Perfect for healthy mornings.
Features: 4 Products, Morning Essentials, 21% Savings
Benefits: Save ₹500, Healthy Start, Energy Boost
```

---

## 🖥️ ADMIN SIDE - How to View/Edit

### Step 1: Access Admin Panel
1. Go to `/admin/products`
2. Login with admin credentials

### Step 2: View Products
- All products will be listed in a table
- You'll see columns: Name, Category, Price, Stock, Actions

### Step 3: Find Sample Products
Look for these products in the list:
- **Premium Ghee Special Offer** (ID: 64) - Category: ghee
- **Spice Starter Kit Deal** (ID: 65) - Category: superfoods
- **Complete Cooking Essentials Combo** (ID: 66) - Category: combo
- **Healthy Morning Combo Pack** (ID: 67) - Category: combo

### Step 4: Edit Product (Example)
1. Click **"Edit"** button next to any product
2. You'll see a form with all fields:
   ```
   Product Name: Premium Ghee Special Offer
   Price: 1300
   Original Price: 1600
   Discount: 18
   Category: ghee (dropdown)
   Size/Weight: 1 KG
   Description: [Full description]
   Features: [Array of features]
   Benefits: [Array of benefits]
   Rating: 4.9
   Stock: 100
   Image: [Image URL]
   ```

### Step 5: Add Similar Products
To add more deals or combos:
1. Click **"Add New Product"** button
2. Fill the form:
   - **For DEALS**: Set `originalPrice` and `discount >= 15%`
   - **For COMBO**: Set `category: 'combo'` and mention combo contents in description
3. Click **"Save Product"**

---

## 👤 USER SIDE - How Products Appear

### 1. Products Page (`/products`)

#### View All Products
- Go to `/products`
- All products are displayed in a grid
- Sample products will appear with:
  - Product image
  - Product name
  - Price (with original price strikethrough if discount)
  - Discount badge (if discount >= 15%)
  - Rating stars
  - "Add to Cart" button

#### Filter by DEALS
1. Click **"Deals"** filter button (top filter bar)
2. You'll see:
   - ✅ Premium Ghee Special Offer (₹1,300, was ₹1,600, 18% off)
   - ✅ Spice Starter Kit Deal (₹850, was ₹1,100, 22% off)
3. Both products show discount badge and strikethrough original price

#### Filter by COMBO
1. Click **"Combo"** filter button (top filter bar)
2. You'll see:
   - ✅ Complete Cooking Essentials Combo (₹2,500, was ₹3,200, 21% off)
   - ✅ Healthy Morning Combo Pack (₹1,800, was ₹2,300, 21% off)
3. Both products show combo badge and detailed description

### 2. Product Detail Page

#### When User Clicks on a Product:
- **Product Name**: Large heading
- **Price**: 
  - Current price in green/bold
  - Original price with strikethrough (if discount)
  - Discount percentage badge
- **Description**: Full product description
- **Features**: Bullet points list
- **Benefits**: Bullet points list
- **Size/Weight**: Displayed clearly
- **Rating**: Stars with review count
- **Add to Cart** button
- **Buy Now** button

#### Example: Premium Ghee Special Offer Detail
```
Premium Ghee Special Offer
⭐⭐⭐⭐⭐ 4.9 (145 reviews)

₹1,300  ₹1,600  [18% OFF Badge]

Size: 1 KG

Description:
Premium Desi Cow Bilona Ghee at special discounted price. 
Made from A2 milk using traditional Bilona method.

Features:
• A2 Milk
• Bilona Method
• 18% Discount

Benefits:
• Save ₹300
• Pure & Natural
• Rich in Nutrients

[Add to Cart] [Buy Now]
```

#### Example: Complete Cooking Essentials Combo Detail
```
Complete Cooking Essentials Combo
⭐⭐⭐⭐⭐ 4.8 (156 reviews)

₹2,500  ₹3,200  [21% OFF Badge]

Size: Oil + Ghee + Spices

Description:
Everything you need for daily cooking: 
Peanut Oil (500ml), Premium Ghee (500gm), 
Garam Masala (100gm), Hing (25gm), Jeera (100gm). 
Complete kitchen essentials in one pack.

Features:
• 5 Products
• Complete Kitchen
• 21% Savings

Benefits:
• Save ₹700
• One Stop Shop
• Premium Quality

[Add to Cart] [Buy Now]
```

---

## 🎯 Key Differences: DEALS vs COMBO

### DEALS:
- ✅ Any category product with discount >= 15%
- ✅ Can be from any category (oil, ghee, superfoods, etc.)
- ✅ Shows discount badge
- ✅ Original price strikethrough
- ✅ Filter: Click "Deals" button

### COMBO:
- ✅ Must have `category: 'combo'`
- ✅ Multiple products bundled together
- ✅ Description mentions what's included
- ✅ Usually has good discount
- ✅ Filter: Click "Combo" button

---

## 📱 Visual Appearance

### Product Card (Grid View):
```
┌─────────────────────────┐
│   [Product Image]       │
│                         │
│  Product Name           │
│  ⭐⭐⭐⭐⭐ 4.9 (145)   │
│                         │
│  ₹1,300  ₹1,600        │
│  [18% OFF]              │
│                         │
│  Size: 1 KG             │
│                         │
│  [Add to Cart]          │
└─────────────────────────┘
```

### Product Detail Page:
```
┌─────────────────────────────────────┐
│  [Large Product Image]              │
│                                     │
│  Product Name                       │
│  ⭐⭐⭐⭐⭐ 4.9 (145 reviews)        │
│                                     │
│  ₹1,300  ₹1,600  [18% OFF Badge]  │
│                                     │
│  Size: 1 KG                         │
│                                     │
│  Description:                       │
│  Full product description here...   │
│                                     │
│  Features:                          │
│  • Feature 1                        │
│  • Feature 2                        │
│                                     │
│  Benefits:                          │
│  • Benefit 1                        │
│  • Benefit 2                        │
│                                     │
│  [Add to Cart]  [Buy Now]           │
└─────────────────────────────────────┘
```

---

## ✅ Testing Checklist

### Admin Side:
- [ ] Products visible in admin panel
- [ ] Can edit products
- [ ] Can see all fields (price, originalPrice, discount, category)
- [ ] Can add new deals/combo products

### User Side:
- [ ] Products visible on `/products` page
- [ ] "Deals" filter shows 2 deals products
- [ ] "Combo" filter shows 2 combo products
- [ ] Discount badges visible on deals
- [ ] Original price strikethrough visible
- [ ] Product detail page shows all information
- [ ] Can add to cart
- [ ] Can buy now

---

## 🔧 Troubleshooting

### Problem: Deals filter में products show नहीं हो रहे
**Solution**: 
- Check `discount >= 15%` है या नहीं
- Check `originalPrice` field filled है
- Verify: `discount = ((originalPrice - price) / originalPrice) * 100`

### Problem: Combo filter में products show नहीं हो रहे
**Solution**:
- Check `category` field में exactly `combo` है (lowercase)
- No spaces, no uppercase

### Problem: Discount badge show नहीं हो रहा
**Solution**:
- Check `originalPrice` और `discount` fields filled हैं
- Minimum 15% discount required

---

## 📝 Notes

1. **Sample products already added** to default products list
2. **Test करने के लिए**: Admin panel में products load करें
3. **User side**: `/products` page पर जाकर filters test करें
4. **Deals**: Automatically filter होते हैं (discount >= 15%)
5. **Combo**: Category-based filter (`category === 'combo'`)

---

**Happy Testing! 🎉**

