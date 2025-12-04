# Old Data Clear करने के लिए:

## Method 1: Browser Console में Run करें

```javascript
// Clear all localStorage data
localStorage.clear();
sessionStorage.clear();

// Clear specific Firebase cache
localStorage.removeItem('taruvae-admin-products');
localStorage.removeItem('taruvae-products');

// Reload page
location.reload();
```

## Method 2: Admin Panel से Clear करें

1. `/admin/products` page पर जाएं
2. सभी products delete करें
3. Page refresh करें
4. Default products automatically load हो जाएंगे

## Method 3: Direct URL Test करें

Browser address bar में directly try करें:
```
http://localhost:3000/images/products/GHEE.png
http://localhost:3000/images/products/Hing.png
http://localhost:3000/images/products/groundnut%20oi.jpg
```

अगर ये काम करती हैं, तो encoding issue है (fix हो गया है)।

