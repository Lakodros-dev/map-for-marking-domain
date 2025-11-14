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
    : 'https://map-backend.onrender.com';

console.log('Script yuklandi, API_URL:', API_URL);

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

    console.log('Hudud belgilandi:', currentBounds);

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
    console.log('Modal oyna ochildi');
}

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

// Tasdiqlash funksiyasi
async function handleConfirm() {
    console.log('handleConfirm chaqirildi');
    console.log('currentBounds:', currentBounds);

    if (!currentBounds) {
        alert('Iltimos, avval xaritada hudud belgilang!');
        return;
    }

    const confirmBtn = document.getElementById('confirmBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Yuborilmoqda...';
    confirmBtn.disabled = true;

    try {
        console.log('Backend ga yuborilmoqda:', API_URL);

        // Telegram User ID ni olish
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;
        console.log('Telegram User ID:', userId);

        const response = await fetch(`${API_URL}/api/area`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bounds: currentBounds,
                userId: userId
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            showNotification('✅ Hudud botga yuborildi!', 'success');

            // Modal yopish
            document.getElementById('modal').style.display = 'none';

            // Telegram WebApp yopish
            if (window.Telegram?.WebApp) {
                setTimeout(() => {
                    tg.close();
                }, 1500);
            }
        } else {
            showNotification('❌ Xatolik yuz berdi!', 'error');
        }
    } catch (error) {
        console.error('Xatolik:', error);
        showNotification('❌ Server bilan bog\'lanishda xatolik: ' + error.message, 'error');
    } finally {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
}

// Bekor qilish funksiyasi
function handleCancel() {
    console.log('handleCancel chaqirildi');
    document.getElementById('modal').style.display = 'none';
    drawnItems.clearLayers();
    currentBounds = null;
}

// Event listener qo'shish
console.log('Event listenerlar qo\'shilmoqda...');

const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

console.log('confirmBtn:', confirmBtn);
console.log('cancelBtn:', cancelBtn);

if (confirmBtn) {
    confirmBtn.onclick = handleConfirm;
    console.log('Tasdiqlash tugmasi ulandi');
} else {
    console.error('confirmBtn topilmadi!');
}

if (cancelBtn) {
    cancelBtn.onclick = handleCancel;
    console.log('Bekor qilish tugmasi ulandi');
} else {
    console.error('cancelBtn topilmadi!');
}

// Modal tashqarisiga bosilganda yopish
window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

console.log('Script to\'liq yuklandi');
