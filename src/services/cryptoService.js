const enc = new TextEncoder();
const dec = new TextDecoder();

// DERIVACIÓN DE LLAVE (PBKDF2) - Estira la contraseña para hacerla indestructible
const deriveKey = async (password, saltString = "zk-vault-salt-v1") => {
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode(saltString), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
};

// ENCRIPTACIÓN AUTENTICADA (AES-GCM)
export const encryptData = async (text, password) => {
    const key = await deriveKey(password);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Vector de Inicialización único
    
    const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, key, enc.encode(text)
    );
    
    // Unimos el IV y los datos cifrados para guardarlos juntos en la base de datos
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);
    
    // Convertimos a Base64 para que viaje seguro por HTTP
    return btoa(String.fromCharCode(...combined));
};

// DESENCRIPTACIÓN CON VERIFICACIÓN DE INTEGRIDAD
export const decryptData = async (base64Text, password) => {
    try {
        const combined = new Uint8Array(atob(base64Text).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const cipherBuffer = combined.slice(12);
        
        const key = await deriveKey(password);
        
        // Si alguien modificó 1 solo bit en la BD, GCM rechazará esto y lanzará error
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv }, key, cipherBuffer
        );
        return dec.decode(decryptedBuffer);
    } catch (e) {
        return "/// ACCESO DENEGADO ///";
    }
};

// HASH DE AUTENTICACIÓN (Para no enviar jamás la clave real al backend)
export const hashPassword = async (password) => {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const initCrypto = () => { console.log("Web Crypto API Inicializada"); };