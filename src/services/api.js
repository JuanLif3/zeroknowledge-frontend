import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el servidor dice "No Autorizado" (Token expirado/ausente)
        if (error.response && error.response.status === 401) {
            // Disparamos un evento de emergencia a toda la aplicación
            window.dispatchEvent(new Event('session_expired'));
        }
        return Promise.reject(error);
    }
);

export default api;