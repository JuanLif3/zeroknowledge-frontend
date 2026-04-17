import api from './api';

export const secretService = {
    // Le cambiamos el nombre al parámetro para no confundirnos
    createSecret: async (encryptedMessage, minutesToLive, holdToReveal = false) => {
        const response = await api.post('/shared-secrets', { 
            encryptedMessage, 
            minutesToLive: minutesToLive, // <-- ¡ESTA ES LA LÍNEA MÁGICA QUE ARREGLA TODO!
            holdToReveal 
        });
        return response.data.id || response.data;
    },
    
    getSecret: async (id) => {
        const response = await api.get(`/shared-secrets/${id}`);
        return response.data;
    }
};