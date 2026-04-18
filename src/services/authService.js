import api from './api';
import { hashPassword, generateRandomSalt, generateMasterKey, generateSeedPhrase, wrapMasterKey } from './cryptoService'; 

export const authService = {
    getSalt: async (email) => {
        const response = await api.get(`/auth/salt/${email}`);
        return response.data.salt;
    },

    login: async (email, password, twoFactorCode = null) => {
        const userSalt = await authService.getSalt(email);
        const hashedKey = await hashPassword(password, userSalt);
        
        const response = await api.post('/auth/login', { 
            email: email, 
            authHash: hashedKey,
            twoFactorCode: twoFactorCode 
        });

        localStorage.setItem('vault_user_email', email);
        localStorage.setItem('vault_user_salt', userSalt); 
        if (response.data.encryptedMasterKey) {
            localStorage.setItem('vault_encrypted_dek', response.data.encryptedMasterKey);
        }

        return response.data;
    },

    register: async (userData) => {
        const newSalt = generateRandomSalt();
        const hashedKey = await hashPassword(userData.password, newSalt);
        
        const dek = generateMasterKey();      
        const seed = generateSeedPhrase();    

        const encryptedMasterKey = await wrapMasterKey(dek, userData.password, newSalt);
        const recoveryMasterKey = await wrapMasterKey(dek, seed, newSalt);

        const response = await api.post('/auth/register', { 
            ...userData, 
            authHash: hashedKey,
            salt: newSalt,
            encryptedMasterKey: encryptedMasterKey,
            recoveryMasterKey: recoveryMasterKey
        });

        localStorage.setItem('vault_user_email', userData.email);
        localStorage.setItem('vault_user_salt', newSalt);
        localStorage.setItem('vault_encrypted_dek', encryptedMasterKey);

        return { ...response.data, seedPhrase: seed };
    },

    logout: async () => {
        await api.post('/auth/logout'); 
        localStorage.removeItem('vault_user_email');
        localStorage.removeItem('vault_user_salt');
        localStorage.removeItem('vault_encrypted_dek');
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