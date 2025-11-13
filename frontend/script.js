// Telegram WebApp API
const tg = window.Telegram?.WebApp || {
    expand: () => console.log('Telegram WebApp not available'),
    sendData: (data) => console.log('Data to send:', data),
    close: () => console.log('Close WebApp')
};

// Telegram ichida ochilgan bo'lsa, to'liq ekran
if (window.Telegram?.WebApp) {
    tg.expand();
}

// API URL ni aniqlash
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://map-backend.onrender.com'; // Backend URL ni kiriting

// Xaritani yaratish (Toshkent markazi)
const map = L.map('map').setView([41.2995, 69.2401], 12);

// OpenStreetMap qatlami
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Chizish uchun layer
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Chizish kontroli
const drawControl = new L.Control.Draw({
    draw: {
        rectangle: {
            shapeOptions: {
                color: '#3388ff',
                weight: 2
            }
        },
        polygon: false,
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false
    },
    edit: {
        featureGroup: drawnItems,
        remove: true
    }
});
map.addControl(drawControl);

let currentBounds = null;

// Hudud chizilganda
map.on(L.Draw.Event.CREATED, function (e) {
    const layer = e.layer;

    // Oldingi shaklni o'chirish
    drawnItems.clearLayers();
    drawnItems.addLayer(layer);

    // Koordinatalarni olish
    const bounds = layer.getBounds();
    currentBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        center: {
            lat: bounds.getCenter().lat,
            lng: bounds.getCenter().lng
        }
    };

    // Modal oynani ko'rsatish
    showModal(currentBounds);
});

// Modal oynani ko'rsatish
function showModal(bounds) {
    const modal = document.getElementById('modal');
    const coordsDiv = document.getElementById('coordinates');

    coordsDiv.innerHTML = `
    <strong>Shimol:</strong> ${bounds.north.toFixed(6)}<br>
    <strong>Janub:</strong> ${bounds.south.toFixed(6)}<br>
    <strong>Sharq:</strong> ${bounds.east.toFixed(6)}<br>
    <strong>G'arb:</strong> ${bounds.west.toFixed(6)}<br>
    <strong>Markaz:</strong> ${bounds.center.lat.toFixed(6)}, ${bounds.center.lng.toFixed(6)}
  `;

    modal.style.display = 'block';
}

// Tasdiqlash tugmasi
document.getElementById('confirmBtn').addEventListener('click', async function () {
    console.log('Tasdiqlash bosildi');
    console.log('currentBounds:', currentBounds);

    if (!currentBounds) {
        alert('Iltimos, avval xaritada hudud belgilang!');
        return;
    }

    // Loading holatini ko'rsatish
    const confirmBtn = document.getElementById('confirmBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Yuborilmoqda...';
    confirmBtn.disabled = true;

    try {
        console.log('Backend ga yuborilmoqda:', API_URL);

        // Backend ga saqlash
        const response = await fetch(`${API_URL}/api/area`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bounds: currentBounds })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            // Telegram botga yuborish
            const telegramData = {
                bounds: currentBounds,
                timestamp: new Date().toISOString()
            };

            // Telegram WebApp orqali botga yuborish
            if (window.Telegram?.WebApp) {
                console.log('Telegram ga yuborilmoqda:', telegramData);
                tg.sendData(JSON.stringify(telegramData));
                showNotification('Ma\'lumot botga yuborildi!', 'success');

                // Mini app ni yopish
                setTimeout(() => {
                    tg.close();
                }, 1500);
            } else {
                // Oddiy brauzerda
                showNotification('Hudud saqlandi! (Telegram bot uchun Telegram ichida oching)', 'success');
                console.log('Telegram ga yuborilishi kerak:', telegramData);
            }

            document.getElementById('modal').style.display = 'none';
        } else {
            showNotification('Xatolik yuz berdi!', 'error');
        }
    } catch (error) {
        console.error('Xatolik:', error);
        showNotification('Server bilan bog\'lanishda xatolik: ' + error.message, 'error');
    } finally {
        // Tugmani qayta faollashtirish
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
});

// Bekor qilish tugmasi
document.getElementById('cancelBtn').addEventListener('click', function () {
    document.getElementById('modal').style.display = 'none';
    drawnItems.clearLayers();
    currentBounds = null;
});

// Bildirishnoma ko'rsatish
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification ' + (type === 'error' ? 'error' : '');
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Modal tashqarisiga bosilganda yopish
window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
