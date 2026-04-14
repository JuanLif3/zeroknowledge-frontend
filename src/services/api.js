import axios from 'axios';

// Creamos la instancia base de Axios apuntando a nuestro Java
const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
});

// El Interceptor (El Guardia de Seguridad de salida)
api.interceptors.request.use(
    (config) => {
        // Buscamos si el usuario ya inició sesión y tiene su token guardado
        const token = localStorage.getItem('token');

        // Si hay token, se lo inyectamos a la cabecera Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;