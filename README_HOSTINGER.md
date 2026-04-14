# Hostinger Deployment Guide — Imaan & Akhlaq

Ye sabse aasaan tareeqa hai Hostinger par website live karne ka.  
**Node.js ki koi setting nahi karni paregi.**

---

## Step 1 — Local Build (Apne Computer Par)

Project folder mein ye command chalayein:

```bash
npm run package
```

Ye command:
1. Pehle fresh **build** karega (`dist/` folder update hoga)  
2. Phir ek nayi file **`imaan_hostinger.zip`** banayega (~5–15 MB)  
   *(Bari PDF books automatically exclude ho jaati hain)*

---

## Step 2 — File Upload (Hostinger File Manager)

1. Hostinger ke **hPanel** mein login karein
2. **File Manager** > **`public_html`** folder kholein
3. **`imaan_hostinger.zip`** upload karein
4. File par **right-click** > **Extract Here** karein
5. `public_html` mein seedha files aani chahiyein:
   ```
   public_html/
   ├── index.html
   ├── auth.html
   ├── club.html
   ├── .htaccess        ← yeh bahut zaroori hai!
   ├── static/
   │   ├── css/
   │   ├── img/
   │   └── js/
   ├── admin/
   ├── student/
   ├── teacher/
   └── parent/
   ```

---

## Step 3 — Khatam! ✅

Ab apni domain (website URL) kholen — website **live** hogi!

### Important: Agar files `public_html` ke andar ek aur folder mein chali jayein

Agar extract karne ke baad `public_html/imaan_hostinger/...` ban jaye  
toh us folder ke **andar** waali saari files **cut** karein aur  
`public_html` mein **paste** kar dein.

---

## Clean URL Mapping (.htaccess)

`.htaccess` file wajah se ye URLs perfectly kaam karte hain:

| URL | File |
|-----|------|
| `yoursite.com/` | `index.html` |
| `yoursite.com/auth` | `auth.html` |
| `yoursite.com/club` | `club.html` |
| `yoursite.com/admin/dashboard` | `admin/dashboard.html` |
| `yoursite.com/teacher/dashboard` | `teacher/dashboard.html` |
| `yoursite.com/student/activities` | `student/activities.html` |

---

## Technical Benefits

- ✅ **Zero Configuration** — Koi Node.js ya PHP setup nahi
- ✅ **Fast Loading** — Static HTML direct serve hoti hai
- ✅ **Small ZIP** — ~10 MB (PDF books exclude hai)
- ✅ **Clean URLs** — `.htaccess` se `/auth`, `/club` sab kaam karta hai
- ✅ **Any Host** — Hostinger, cPanel, Apache, Nginx sab par kaam karega
