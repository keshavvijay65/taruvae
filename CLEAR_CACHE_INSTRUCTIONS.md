# Images नहीं दिख रही हैं? यह करें:

## Step 1: Browser Cache Clear करें
1. Browser में `Ctrl+Shift+Delete` press करें
2. "Cached images and files" select करें
3. "Clear data" click करें

## Step 2: LocalStorage Clear करें
1. Browser में `F12` press करें (Developer Tools)
2. Console tab खोलें
3. यह command run करें:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Step 3: Dev Server Restart करें
1. Terminal में `Ctrl+C` press करें (server stop करने के लिए)
2. फिर `npm run dev` run करें

## Step 4: Hard Refresh करें
- Browser में `Ctrl+Shift+R` press करें
- या `Ctrl+F5` press करें

## Step 5: Network Tab Check करें
1. `F12` press करें
2. Network tab खोलें
3. Page refresh करें
4. Images section में check करें:
   - कौन सी images fail हो रही हैं?
   - 404 error आ रहा है?
   - Actual URL क्या है?

## अगर अभी भी नहीं दिख रही हैं:

### Option 1: Firebase Data Clear करें
Admin panel में जाएं और सभी products delete करके फिर से add करें

### Option 2: Image Paths Verify करें
Browser console में check करें:
```javascript
// Check actual file paths
console.log('/images/products/groundnut oi.jpg');
console.log('/images/products/GHEE.png');
console.log('/images/products/Hing.png');
```

### Option 3: Direct Image Test करें
Browser address bar में directly try करें:
```
http://localhost:3000/images/products/GHEE.png
http://localhost:3000/images/products/Hing.png
http://localhost:3000/images/products/groundnut%20oi.jpg
```

अगर ये direct URLs काम करती हैं, तो encoding issue है।
अगर ये भी नहीं काम करतीं, तो file path issue है।

