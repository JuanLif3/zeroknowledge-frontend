import CryptoJS from 'crypto-js';

export const initCrypto = () => {
    console.log("Criptografía de Grado Militar Iniciada (PBKDF2 - 100k Iteraciones)");
};

export const encryptData = (text, masterKey) => {
    if (!text) return '';
    
    // Generar un Salt aleatorio (16 bytes). Esto evita ataques de tablas Rainbow.
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    
    // Derivar una clave de 256-bits usando PBKDF2 (100,000 iteraciones)
    // Esto hace que el cifrado sea computacionalmente "pesado" e inmune a la fuerza bruta.
    const key = CryptoJS.PBKDF2(masterKey, salt, {
        keySize: 256 / 32,
        iterations: 100000
    });

    // Generar un Vector de Inicialización (IV) aleatorio
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    // Encriptar los datos usando el estándar bancario AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });

    // Empaquetar todo junto: salt + iv + texto cifrado
    return salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
};

export const decryptData = (encryptedPackage, masterKey) => {
    if (!encryptedPackage) return '';
    
    try {
        // Separamos el paquete en sus 3 partes
        const parts = encryptedPackage.split(':');
        
        // RETROCOMPATIBILIDAD: Si tienes datos viejos en tu DB que no usaban Salt e IV
        if (parts.length !== 3) {
            const bytes = CryptoJS.AES.decrypt(encryptedPackage, masterKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        }

        const salt = CryptoJS.enc.Hex.parse(parts[0]);
        const iv = CryptoJS.enc.Hex.parse(parts[1]);
        const ciphertext = parts[2];

        // Derivar exactamente la MISMA llave usando el Salt que guardamos
        const key = CryptoJS.PBKDF2(masterKey, salt, {
            keySize: 256 / 32,
            iterations: 100000
        });

        // Desencriptar
        const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });

        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (!result) throw new Error("Llave incorrecta");
        
        return result;
    } catch (error) {
        console.error("Vulnerabilidad o llave incorrecta detectada", error);
        throw new Error("Fallo de descifrado");
    }
};