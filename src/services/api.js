import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    withCredentials: true // Permite el envío automático de la Cookie HttpOnly
});

// INTERCEPTOR INTELIGENTE
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("🔍 API Error detectado:", error.response?.status, "en la ruta:", error.config?.url);

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const requestUrl = error.config.url || '';
            const currentPath = window.location.pathname;

            // 1. REGLA DE ORO: Si estamos en la pantalla de lectura de secretos, NUNCA redirigir al login.
            if (currentPath.startsWith('/share')) {
                return Promise.reject(error);
            }

            // 2. Si el 403 ocurre al intentar CREAR un secreto, es un error del controlador de Java, NO de sesión.
            if (requestUrl.includes('secret')) {
                return Promise.reject(error);
            }

            // 3. Si ocurre al intentar leer la bóveda (/vault), entonces SÍ expiró la sesión. Al Login.
            if (requestUrl.includes('/vault')) {
                if (currentPath !== '/login' && currentPath !== '/register') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;