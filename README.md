# Hudud Belgilash Xaritasi

Interaktiv xarita orqali hudud belgilash va koordinatalarni olish uchun veb-ilova.

## Xususiyatlar

- ✅ To'liq ekran xaritasi
- ✅ To'rtburchak shaklida hudud belgilash
- ✅ Tasdiqlash modal oynasi
- ✅ Koordinatalarni API orqali qaytarish
- ✅ Render.com ga deploy qilish uchun tayyor

## Loyiha tuzilishi

```
loyiha/
├── backend/           # Backend (Express API)
│   ├── server.js
│   ├── package.json
│   └── .gitignore
├── frontend/          # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## O'rnatish

```bash
cd backend
npm install
```

## Ishga tushirish

```bash
cd backend
npm start
```

Server `http://localhost:3000` da ishga tushadi.

## API

### POST /api/area

Belgilangan hududni saqlash.

**Request:**
```json
{
  "bounds": {
    "north": 41.3234,
    "south": 41.2756,
    "east": 69.2890,
    "west": 69.1912,
    "center": {
      "lat": 41.2995,
      "lng": 69.2401
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hudud muvaffaqiyatli saqlandi",
  "data": { ... }
}
```

## Render.com ga Deploy qilish

1. GitHub ga push qiling
2. Render.com da yangi Web Service yarating
3. Repository ni ulang
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Deploy tugmasini bosing

## Bot bilan integratsiya

Bot ushbu API endpoint ga POST so'rov yuborishi mumkin:

```python
import requests

url = "https://your-app.onrender.com/api/area"
data = {
    "bounds": {
        "north": 41.3234,
        "south": 41.2756,
        "east": 69.2890,
        "west": 69.1912
    }
}

response = requests.post(url, json=data)
print(response.json())
```
