require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Bot sozlamalari
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// CORS sozlamalari - barcha domenlardan ruxsat
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Preflight requests uchun
app.options('*', cors());

app.use(express.json());

// Frontend fayllarni serve qilish
app.use(express.static(path.join(__dirname, '../frontend')));

// API endpoint - bot uchun
app.post('/api/area', async (req, res) => {
    const { bounds, userId } = req.body;

    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
        return res.status(400).json({ error: 'Invalid bounds data' });
    }

    console.log('Yangi hudud belgilandi:', bounds);
    console.log('User ID:', userId);
    console.log('Bounds details:');
    console.log('  North (lat max):', bounds.north);
    console.log('  South (lat min):', bounds.south);
    console.log('  East (lng max):', bounds.east);
    console.log('  West (lng min):', bounds.west);
    console.log('  Center:', bounds.center);

    // Hudud o'lchamini hisoblash
    const latDiff = Math.abs(bounds.north - bounds.south);
    const lngDiff = Math.abs(bounds.east - bounds.west);
    const latKm = latDiff * 111; // 1 degree lat ≈ 111 km
    const lngKm = lngDiff * 111 * Math.cos(bounds.center.lat * Math.PI / 180);

    console.log('Hudud o\'lchami:');
    console.log('  Lat farqi:', latDiff.toFixed(6), '(~' + (latKm * 1000).toFixed(0) + ' metr)');
    console.log('  Lng farqi:', lngDiff.toFixed(6), '(~' + (lngKm * 1000).toFixed(0) + ' metr)');
    console.log('  Maydon:', (latKm * lngKm).toFixed(2), 'km²');

    // To'g'ridan-to'g'ri settings.json ga yozish
    try {
        // Loyiha ildizidagi settings.json yo'li
        const settingsPath = path.resolve(__dirname, '../../settings.json');
        console.log('Settings.json yo\'li:', settingsPath);
        console.log('Fayl mavjudmi?', fs.existsSync(settingsPath));

        // Mavjud sozlamalarni o'qish
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            settings = JSON.parse(settingsData);
            console.log('Mavjud sozlamalar o\'qildi');
        } else {
            console.log('Settings.json topilmadi, yangi yaratiladi');
            settings = {
                office_location: { latitude: 41.2995, longitude: 69.2401, radius: 100 },
                work_hours: { start: 9, end: 17 },
                lunch_hours: { start: 12, end: 13 },
                location_interval: { minutes: 30, grace_period: 5 }
            };
        }

        // Yangi hudud qo'shish (to'rtburchak: point1=shimoliy-g'arbiy, point2=janubiy-sharqiy)
        settings.office_area = {
            point1: {
                lat: bounds.north,
                lng: bounds.west
            },
            point2: {
                lat: bounds.south,
                lng: bounds.east
            }
        };
        settings.use_area_mode = true;

        // Faylga yozish
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        console.log('✅ Settings.json yangilandi!');
        console.log('Yangi hudud:', settings.office_area);

        // Admin'ga xabar yuborish
        if (BOT_TOKEN && ADMIN_CHAT_ID) {
            try {
                const message = `✅ Ofis hududi yangilandi!\n\n` +
                    `📍 Shimol: ${bounds.north.toFixed(6)}\n` +
                    `📍 Janub: ${bounds.south.toFixed(6)}\n` +
                    `📍 Sharq: ${bounds.east.toFixed(6)}\n` +
                    `📍 G'arb: ${bounds.west.toFixed(6)}\n\n` +
                    `📐 Maydon: ${(latKm * lngKm).toFixed(2)} km²\n\n` +
                    `🎯 Sozlamalar avtomatik saqlandi!`;

                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    chat_id: ADMIN_CHAT_ID,
                    text: message
                });

                // Markazni xaritada ko'rsatish
                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
                    chat_id: ADMIN_CHAT_ID,
                    latitude: bounds.center.lat,
                    longitude: bounds.center.lng
                });

                console.log('✅ Admin\'ga xabar yuborildi');
            } catch (error) {
                console.error('❌ Admin\'ga xabar yuborishda xato:', error.message);
            }
        }
    } catch (error) {
        console.error('❌ Settings.json yangilashda xato:', error);
    }

    res.json({
        success: true,
        message: 'Hudud muvaffaqiyatli saqlandi',
        data: bounds
    });
});

// Frontend uchun
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server ishga tushdi: http://localhost:${PORT}`);
});
