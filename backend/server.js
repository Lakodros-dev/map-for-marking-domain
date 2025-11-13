const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Frontend fayllarni serve qilish
app.use(express.static(path.join(__dirname, '../frontend')));

// API endpoint - bot uchun
app.post('/api/area', (req, res) => {
    const { bounds } = req.body;

    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
        return res.status(400).json({ error: 'Invalid bounds data' });
    }

    console.log('Yangi hudud belgilandi:', bounds);

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
