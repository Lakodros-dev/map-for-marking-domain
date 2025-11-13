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
    if (!currentBounds) return;

    try {
        const response = await fetch('/api/area', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bounds: currentBounds })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Hudud muvaffaqiyatli saqlandi!', 'success');
            document.getElementById('modal').style.display = 'none';
        } else {
            showNotification('Xatolik yuz berdi!', 'error');
        }
    } catch (error) {
        console.error('Xatolik:', error);
        showNotification('Server bilan bog\'lanishda xatolik!', 'error');
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
