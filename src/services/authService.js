import api from './api';
import { hashPassword } from './cryptoService'; // Importamos el generador de hash

export const authService = {
    login: async (email, password, twoFactorCode = null) => {
        const hashedKey = await hashPassword(password);
        const response = await api.post('/auth/login', { email, authHash: hashedKey, twoFactorCode });
        // Guardamos el email en memoria local (no es un dato sensible)
        localStorage.setItem('vault_user_email', email); 
        return response.data;
    },

    register: async (userData) => {
        const hashedKey = await hashPassword(userData.password);
        const response = await api.post('/auth/register', { ...userData, authHash: hashedKey });
        localStorage.setItem('vault_user_email', userData.email);
        return response.data;
    },

    logout: async () => {
        await api.post('/auth/logout'); 
        localStorage.removeItem('vault_user_email'); // Limpiamos al salir
    },

    // Pide la imagen del QR al backend
    setup2FA: async () => {
        const response = await api.get('/auth/2fa/setup');
        return response.data; // Devuelve { qrCode: "data:image/png..." }
    },

    // Envía los 6 dígitos para validar
    enable2FA: async (code) => {
        const response = await api.post('/auth/2fa/enable', { code: code });
        return response.data;
    },

    get2FAStatus: async () => {
        const response = await api.get('/auth/2fa/status');
        return response.data.isEnabled; // Devuelve true o false
    }
};