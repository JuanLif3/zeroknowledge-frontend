import api from './api';

export const authService = {
    
    // Función para Registrarse
    register: async (email, password) => {
        const response = await api.post('/auth/register', { email, password });
        // Si Java nos devuelve el token, lo guardamos en la caja fuerte del navegador
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    // Función para Iniciar Sesión
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    // Función para Cerrar Sesión (Simplemente destruimos el token)
    logout: () => {
        localStorage.removeItem('token');
    }
}