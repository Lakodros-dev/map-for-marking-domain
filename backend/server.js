require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Bot sozlamalari
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// CORS sozlamalari - barcha domenlardan ruxsat (development uchun)
app.use(cors({
    origin: '*',
    credentials: false
}));

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

            const message = `🗺 Yangi ofis hududi belgilandi!\n\n` +
                `📍 Shimol: ${bounds.north.toFixed(6)}\n` +
                `📍 Janub: ${bounds.south.toFixed(6)}\n` +
                `📍 Sharq: ${bounds.east.toFixed(6)}\n` +
                `📍 G'arb: ${bounds.west.toFixed(6)}\n` +
                `📍 Markaz: ${bounds.center.lat.toFixed(6)}, ${bounds.center.lng.toFixed(6)}\n\n` +
                `✅ Quyidagi komandani yuboring:\n\n` +
                `<code>${command}</code>`;

            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });

            // Markazni xaritada ko'rsatish
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
                chat_id: ADMIN_CHAT_ID,
                latitude: bounds.center.lat,
                longitude: bounds.center.lng
            });

            console.log('✅ Botga yuborildi');
        } catch (error) {
            console.error('❌ Botga yuborishda xato:', error.message);
        }
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
