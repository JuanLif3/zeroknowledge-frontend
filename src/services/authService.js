import api from './api';

export const authService = {
    // LOGIN: Recibe email y password por separado
    login: async (email, password) => {
        const response = await api.post('/auth/login', { 
            email: email, 
            authHash: password // Traducción para el backend
        });
        return response.data;
    },

    // REGISTRO: Recibe el objeto formData completo desde Register.jsx
    register: async (userData) => {
        const response = await api.post('/auth/register', { 
            firstname: userData.firstname,
            lastname: userData.lastname,
            email: userData.email, 
            authHash: userData.password // Traducción de la contraseña al formato seguro
        });
        return response.data;
    },

    // LOGOUT
    logout: async () => {
        await api.post('/auth/logout'); 
    }
};