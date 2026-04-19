import axios from 'axios';

// Vite utiliza import.meta.env para leer variables de entorno.
// Si VITE_API_URL no existe (en local), usará 'http://localhost:8080/api/v1' por defecto.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para manejar la expiración de sesión globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el servidor responde 401 (No autorizado/Token expirado)
        if (error.response && error.response.status === 401) {
            // Disparamos un evento que capturará el componente Vault para mostrar el modal de re-autenticación
            window.dispatchEvent(new Event('session_expired'));
        }
        return Promise.reject(error);
    }
);

export default api;