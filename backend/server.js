require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

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

    // Botga ma'lumot yuborish
    if (BOT_TOKEN && ADMIN_CHAT_ID) {
        try {
            // Komanda yaratish
            const command = `/set_area ${bounds.north.toFixed(6)} ${bounds.west.toFixed(6)} ${bounds.south.toFixed(6)} ${bounds.east.toFixed(6)}`;

            console.log('Komanda yaratildi:', command);

            // Avtomatik komanda yuborish
            const commandResult = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: ADMIN_CHAT_ID,
                text: command
            });

            console.log('✅ Komanda botga yuborildi:', commandResult.data);

            // Markazni xaritada ko'rsatish
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
                chat_id: ADMIN_CHAT_ID,
                latitude: bounds.center.lat,
                longitude: bounds.center.lng
            });

            console.log('✅ Lokatsiya yuborildi');
        } catch (error) {
            console.error('❌ Botga yuborishda xato:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }
    } else {
        console.warn('⚠️ BOT_TOKEN yoki ADMIN_CHAT_ID topilmadi!');
        console.log('BOT_TOKEN:', BOT_TOKEN ? 'Mavjud' : 'Yo\'q');
        console.log('ADMIN_CHAT_ID:', ADMIN_CHAT_ID ? 'Mavjud' : 'Yo\'q');
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
