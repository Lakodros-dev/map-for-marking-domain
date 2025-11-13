// API konfiguratsiyasi
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : window.location.origin;

export { API_URL };
