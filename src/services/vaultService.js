import api from './api';

export const vaultService = {
    // * Obtener las credenciales (llegarán encriptadas)
    getMyVault: async () => {
        const response = await api.get('/vault');
        return response.data;
    },

    // * Guardar una nueva credencial (ya debe venir encriptada desde la UI)
    saveVaultItem: async (encryptedTitle, itemType, encryptedPayload, isHoneytoken) => {
        const response = await api.post('/vault', {
            encryptedTitle,
            itemType,
            encryptedPayload,
            isHoneytoken
        });
        return response.data;
    },

    // * Disparar intrusión (Simular que un hacker usó la clave)
    triggerIntrusion: async (id) => {
        await api.post(`/vault/honeytokens/${id}/trap`);
    },

    // * Obtener los registros de ataques desde Java
    getIntrusions: async () => {
        const response = await api.get('/vault/intrusions');
        return response.data;
    }
};