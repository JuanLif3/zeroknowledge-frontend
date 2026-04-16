import api from './api';

export const secretService = {
    // Generar el secreto en la base de datos
    createSecret: async (encryptedMessage, expiresInMinutes, holdToReveal = false) => {
        const response = await api.post('/secrets', { 
            encryptedMessage, 
            expiresInMinutes,
            holdToReveal // Se lo pasamos a Spring Boot
        });
        return response.data.id;
    },

    // Obtener el secreto (y destruirlo en el proceso)
    getSecret: async (id) => {
        const response = await api.get(`/public/secrets/${id}`);
        return response.data;
    },

    //  Disparar intrusión
    triggerIntrusion: async (id) => {
        await api.post(`/vault/honeytokens/${id}/trap`);
    },

    //  Obtener registros del radar
    getIntrusions: async () => {
        const response = await api.get('/vault/intrusions');
        return response.data;
    }
};