import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    withCredentials: true // Permite el envío automático de la Cookie HttpOnly
});

// INTERCEPTOR DE SEGURIDAD: Vigila todas las respuestas del servidor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si Java nos dice que no estamos autorizados (Cookie expirada o inválida)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Limpiamos la vista y lo mandamos al login
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;