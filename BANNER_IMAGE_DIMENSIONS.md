# 📐 Blog Banner Image Dimensions

## 🎯 **Current Banner Display Size:**

### **Blog Banner Container:**
- **Width:** Full width (100vw - viewport width)
- **Height:** 
  - Mobile: Minimum 500px (can be up to viewport height)
  - Tablet: Minimum 600px (can be up to viewport height)
  - Desktop: Minimum 700px (can be up to viewport height)
  - Maximum: `calc(100vh - 73px)` (viewport height minus header)

### **Common Viewport Sizes:**
- **Mobile (375px width):** 500px - 667px height
- **Tablet (768px width):** 600px - 1024px height
- **Desktop (1920px width):** 700px - 1080px height

---

## ✅ **Recommended Image Upload Size:**

### **For Best Quality:**
- **Width:** 1920px to 2560px
- **Height:** 1080px to 1440px
- **Aspect Ratio:** 16:9 (Landscape) - Best
- **File Size:** < 2 MB (compressed)
- **Format:** JPG/WebP

### **Optimal Dimensions:**
```
Recommended: 1920×1080px (Full HD)
Alternative: 2560×1440px (2K)
Minimum: 1200×675px (HD)
```

---

## 📊 **Why These Dimensions?**

### **1. Full Coverage:**
- Banner uses `object-cover` which crops to fill
- Larger images ensure no pixelation
- Works on all screen sizes

### **2. Aspect Ratio 16:9:**
- Matches most modern displays
- Looks good on all devices
- Standard for web banners

### **3. File Size:**
- 1920×1080px JPG: ~500 KB - 1.5 MB (compressed)
- 2560×1440px JPG: ~800 KB - 2 MB (compressed)
- Within 5 MB limit ✅

---

## 🎨 **Image Positioning:**

### **Current Settings:**
- `object-cover` - Fills entire banner
- `object-center` - Centers the image
- Important content should be in center area

### **Important Areas:**
- **Top Center:** Person's head (visible)
- **Center:** Main subject (person cooking)
- **Bottom Center:** Product bottles (visible)

---

## 💡 **Quick Reference:**

| Property | Value |
|----------|-------|
| **Recommended Width** | 1920px |
| **Recommended Height** | 1080px |
| **Aspect Ratio** | 16:9 |
| **File Size** | < 2 MB |
| **Format** | JPG/WebP |
| **Max Limit** | 5 MB |

---

## ✅ **Summary:**

**Best Size for Blog Banner:**
- **1920×1080px** (Full HD)
- **16:9 Aspect Ratio**
- **< 2 MB file size**
- **JPG format**

This ensures:
- ✅ No pixelation on large screens
- ✅ Fast loading
- ✅ Proper coverage on all devices
- ✅ Good quality display

