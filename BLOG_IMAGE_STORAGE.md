# 📍 Blog Images Storage Location

## ✅ **Same Location as Product Images!**

### **Storage Location:**
**Firebase Realtime Database**

### **Path Structure:**

```
Firebase Realtime Database:
└── blogPosts (array)
    └── [0]
        ├── id: "1"
        ├── title: "Blog Post Title"
        ├── slug: "blog-post-slug"
        ├── content: "..."
        └── image: "data:image/jpeg;base64,..." ← यहाँ है!
```

### **Comparison:**

| Item | Storage Location | Image Format |
|------|-----------------|--------------|
| **Products** | `products` → `image` field | Base64 string |
| **Blog Posts** | `blogPosts` → `image` field | Base64 string |
| **Both** | Firebase Realtime Database | Same format! |

---

## 🔍 **How to Check Blog Images:**

### **Firebase Console में:**
1. https://console.firebase.google.com/ पर जाएं
2. Project: `taruveda-naturals-fd588`
3. **Realtime Database** → `blogPosts` folder
4. किसी blog post पर click करें
5. `image` field में base64 string दिखेगी

### **Browser LocalStorage में:**
- Key: `taruvae-blog-posts` (if used as backup)
- Same format as products

---

## 💾 **Storage Details:**

### **Format:**
- Base64 encoded string (data URL)
- Example: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...`

### **Size:**
- Same 1 GB free tier limit
- Blog images + Product images = Total storage
- Both share the same Firebase database

### **Access:**
- Same Firebase project
- Same database
- Same free tier limits

---

## ✅ **Summary:**

**हाँ, blog images भी same location में जाएंगी:**
- ✅ Firebase Realtime Database
- ✅ Base64 format
- ✅ Same free tier (1 GB)
- ✅ Same storage location (different path: `blogPosts` vs `products`)

**Products और Blog images दोनों same Firebase database में हैं, बस different paths पर!**

