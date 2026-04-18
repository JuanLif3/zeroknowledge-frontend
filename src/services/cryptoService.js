const enc = new TextEncoder();
const dec = new TextDecoder();

// * DERIVACIÓN DE LLAVE (PBKDF2) - Ahora con Email dinámico y 600k iteraciones
const deriveKey = async (password, email) => {
    // El email hace que el "Salt" sea único para cada usuario en el mundo
    const saltString = email.toLowerCase().trim() + "-zk-vault-v1";
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        // ¡Subimos de 100,000 a 600,000 iteraciones (Estándar OWASP 2024)!
        { name: "PBKDF2", salt: enc.encode(saltString), iterations: 600000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
};

// * ENCRIPTACIÓN (Requiere el email)
export const encryptData = async (text, password, email) => {
    const key = await deriveKey(password, email);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(text));
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);
    return btoa(String.fromCharCode(...combined));
};

// * DESENCRIPTACIÓN (Requiere el email)
export const decryptData = async (base64Text, password, email) => {
    try {
        const combined = new Uint8Array(atob(base64Text).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const cipherBuffer = combined.slice(12);
        const key = await deriveKey(password, email);
        const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, cipherBuffer);
        return dec.decode(decryptedBuffer);
    } catch (e) {
        return "/// ACCESO DENEGADO ///";
    }
};

export const hashPassword = async (password) => {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const initCrypto = () => { console.log("Web Crypto API Inicializada - Nivel Militar"); };