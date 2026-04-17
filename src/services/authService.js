import api from './api';

export const authService = {
    // LOGIN
    login: async (email, password) => {
        const response = await api.post('/auth/login', { 
            email: email, 
            authHash: password // <-- Traducimos 'password' a 'authHash' para el backend
        });
        return response.data;
    },

    // REGISTRO
    register: async (email, password) => {
        const response = await api.post('/auth/register', { 
            email: email, 
            authHash: password // <-- Traducimos 'password' a 'authHash' para el backend
        });
        return response.data;
    },

    // LOGOUT (El que hicimos en la Fase 1)
    logout: async () => {
        await api.post('/auth/logout'); 
    }
};