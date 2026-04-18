const enc = new TextEncoder();
const dec = new TextDecoder();

// * Generador de Salt Aleatorio (Se usa al registrarse)
export const generateRandomSalt = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// * Derivación de Llave (Ahora con 600,000 iteraciones y Salt Dinámico)
const deriveKey = async (password, saltString) => {
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        // ¡Estándar OWASP 2024: 600,000 iteraciones para reventar las tarjetas gráficas de los hackers!
        { name: "PBKDF2", salt: enc.encode(saltString), iterations: 600000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
};

// * Encriptar Bóveda
export const encryptData = async (text, password, saltString) => {
    const key = await deriveKey(password, saltString);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(text));
    
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);
    return btoa(String.fromCharCode(...combined));
};

// * Desencriptar Bóveda
export const decryptData = async (base64Text, password, saltString) => {
    try {
        const combined = new Uint8Array(atob(base64Text).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const cipherBuffer = combined.slice(12);
        const key = await deriveKey(password, saltString);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, cipherBuffer);
        return dec.decode(decryptedBuffer);
    } catch (e) {
        return "/// ACCESO DENEGADO ///";
    }
};

// * Ahora el Hash para iniciar sesión también usa las 600,000 iteraciones
export const hashPassword = async (password, saltString) => {
    // Importamos la contraseña básica
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"] 
    );

    // Extraemos el Hash puro (deriveBits) en lugar de una Llave (deriveKey)
    const hashBuffer = await window.crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: enc.encode(saltString), iterations: 600000, hash: "SHA-256" },
        keyMaterial, 
        256 // Queremos 256 bits
    );

    // Convertimos los bits a formato Hexadecimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
export const initCrypto = () => { console.log("Web Crypto API Inicializada - Nivel Militar 600k"); };