import api from './api';
// Actualizamos las importaciones para incluir el generador de Salt
import { hashPassword, generateRandomSalt } from './cryptoService'; 

export const authService = {
    //  Pedir el Salt al servidor
    getSalt: async (email) => {
        const response = await api.get(`/auth/salt/${email}`);
        return response.data.salt;
    },

    login: async (email, password, twoFactorCode = null) => {
        // Descargar el Salt único de este usuario
        const userSalt = await authService.getSalt(email);
        
        // Procesar la contraseña 600,000 veces usando ese Salt
        const hashedKey = await hashPassword(password, userSalt);
        
        // Intentar entrar
        const response = await api.post('/auth/login', { 
            email: email, 
            authHash: hashedKey,
            twoFactorCode: twoFactorCode 
        });

        // Guardamos el Salt en memoria para poder descifrar la bóveda
        localStorage.setItem('vault_user_email', email);
        localStorage.setItem('vault_user_salt', userSalt); 

        return response.data;
    },

    register: async (userData) => {
        // Al registrar, NOSOTROS creamos un Salt súper seguro
        const newSalt = generateRandomSalt();
        
        // Procesamos la contraseña 600,000 veces
        const hashedKey = await hashPassword(userData.password, newSalt);
        
        // Enviamos el Salt a Java para que lo guarde para siempre
        const response = await api.post('/auth/register', { 
            ...userData, 
            authHash: hashedKey,
            salt: newSalt 
        });

        // Guardamos en memoria local
        localStorage.setItem('vault_user_email', userData.email);
        localStorage.setItem('vault_user_salt', newSalt);

        return response.data;
    },

    logout: async () => {
        await api.post('/auth/logout'); 
        localStorage.removeItem('vault_user_email');
        localStorage.removeItem('vault_user_salt'); // Limpiamos al salir
    },

    setup2FA: async () => {
        const response = await api.get('/auth/2fa/setup');
        return response.data;
    },

    enable2FA: async (code) => {
        const response = await api.post('/auth/2fa/enable', { code: code });
        return response.data;
    },

    get2FAStatus: async () => {
        const response = await api.get('/auth/2fa/status');
        return response.data.isEnabled;
    }
};