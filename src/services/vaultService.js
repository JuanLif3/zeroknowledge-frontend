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
    }
};