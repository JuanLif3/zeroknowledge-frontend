import api from './api';
import { hashPassword } from './cryptoService'; // Importamos el generador de hash

export const authService = {
    login: async (email, password) => {
        const hashedKey = await hashPassword(password); // Convertimos la clave en un Hash irreversible
        const response = await api.post('/auth/login', { 
            email: email, 
            authHash: hashedKey 
        });
        return response.data;
    },

    register: async (userData) => {
        const hashedKey = await hashPassword(userData.password); // Hasheamos antes de enviar
        const response = await api.post('/auth/register', { 
            firstname: userData.firstname,
            lastname: userData.lastname,
            email: userData.email, 
            authHash: hashedKey 
        });
        return response.data;
    },

    logout: async () => {
        await api.post('/auth/logout'); 
    }
};