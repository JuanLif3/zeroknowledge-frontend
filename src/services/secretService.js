import api from './api';

export const secretService = {
    // Generar el secreto en la base de datos
    createSecret: async (encryptedMessage, minutesToLive) => {
        // Fijate que usamos la ruta /public/secrets
        const response = await api.post('/public/secrets', {
            encryptedMessage,
            minutesToLive
        });
        return response.data; // Java nos devuelve el ID (Ej: "abc-123-xyz")
    },

    // Obtener el secreto (y destruirlo en el proceso)
    getSecret: async (id) => {
        const response = await api.get(`/public/secrets/${id}`);
        return response.data;
    }
};