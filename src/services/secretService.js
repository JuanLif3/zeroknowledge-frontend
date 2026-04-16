import api from './api';

export const secretService = {
    createSecret: async (encryptedMessage, expiresInMinutes, holdToReveal = false) => {
        // Asegúrate de que esta ruta '/shared-secrets' sea EXACTAMENTE la misma que tienes en tu SharedSecretController.java
        const response = await api.post('/shared-secrets', { 
            encryptedMessage, 
            expiresInMinutes,
            holdToReveal
        });
        return response.data.id || response.data;
    },
    
    getSecret: async (id) => {
        // Lo mismo aquí
        const response = await api.get(`/shared-secrets/${id}`);
        return response.data;
    }
};