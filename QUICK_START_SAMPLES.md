# Quick Start - Deals & Combo Samples

## ✅ Ready to Use Samples

### 🎯 DEALS (2 Products)

1. **Premium Ghee Special Offer**
   - Price: ₹1,300 (was ₹1,600)
   - Discount: 18%
   - Category: ghee
   - ID: 64

2. **Spice Starter Kit Deal**
   - Price: ₹850 (was ₹1,100)
   - Discount: 22%
   - Category: superfoods
   - ID: 65

### 🎁 COMBO (2 Products)

1. **Complete Cooking Essentials Combo**
   - Price: ₹2,500 (was ₹3,200)
   - Discount: 21%
   - Category: combo
   - Contains: Oil + Ghee + 3 Spices
   - ID: 66

2. **Healthy Morning Combo Pack**
   - Price: ₹1,800 (was ₹2,300)
   - Discount: 21%
   - Category: combo
   - Contains: Ghee + Coffee + 2 Spices
   - ID: 67

---

## 🚀 How to Test

### Admin Side:
1. Go to `/admin/products`
2. Login
3. You'll see all 4 sample products in the list
4. Click "Edit" to see all fields

### User Side:
1. Go to `/products`
2. Click **"Deals"** filter → See 2 deals products
3. Click **"Combo"** filter → See 2 combo products
4. Click any product to see full details

---

## 📋 Product Fields Explained

### For DEALS:
```javascript
{
  name: "Product Name",
  price: 1300,              // Current selling price
  originalPrice: 1600,       // Original price (required!)
  discount: 18,              // Percentage (>= 15%)
  category: "ghee",         // Any category
  // ... other fields
}
```

### For COMBO:
```javascript
{
  name: "Combo Name",
  price: 2500,               // Combo price
  originalPrice: 3200,       // Total of individual items
  discount: 21,              // Percentage
  category: "combo",        // Must be "combo"!
  description: "Contains: Item1, Item2, Item3...",
  // ... other fields
}
```

---

## ✨ Key Points

- ✅ **Deals**: Any product with `discount >= 15%` automatically shows in Deals filter
- ✅ **Combo**: Must have `category: 'combo'` to show in Combo filter
- ✅ **Original Price**: Required for discount calculation
- ✅ **Description**: Should mention what's included (especially for combos)

---

**All samples are ready! Test them now! 🎉**

