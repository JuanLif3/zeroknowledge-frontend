import api from './api';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    logout: () => {
        // Al estar en HttpOnly, no podemos borrar la cookie desde JS.
        // En producción, llamaríamos a un endpoint backend /auth/logout para que la destruya.
        // Por ahora, recargamos la página para limpiar la RAM.
        window.location.href = '/login';
    }
};