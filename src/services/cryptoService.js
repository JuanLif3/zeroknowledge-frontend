const enc = new TextEncoder();
const dec = new TextDecoder();

// DICCIONARIO BÁSICO ESPAÑOL (Para la Semilla de 24 Palabras)
const BIP39_ES = "abierto,abrazo,abrigo,abuela,acceso,aceite,actor,acuario,adorno,agenda,agua,águila,aguja,ajo,alarma,alce,aldea,aleta,alfombra,algodón,alianza,alimento,almeja,almohada,alojamiento,alpaca,altavoz,alumno,amable,amanecer,amarillo,ambulancia,amigo,amor,amplio,ancho,anciano,ancla,andén,anillo,animal,anotar,antena,antiguo,anuncio,apagar,aparato,aplauso,apoyo,aprender,araña,árbol,archivo,arcilla,arder,arena,armario,aroma,arroz,arte,asar,asiento,asno,asomar,astuto,atleta,átomo,atrapar,aula,ausente,avena,avión,azafata,azúcar,azul,babero,bahía,baile,bajar,balanza,balcón,balde,bambú,banco,banda,baño,barba,barco,barril,barro,báscula,bastón,basura,batalla,batería,baúl,bebé,bebida,bello,besar".split(",");

export const generateRandomSalt = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// * Fabrica la Llave Maestra Invisible (DEK) de 256 bits
export const generateMasterKey = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// * Fabrica la Frase Semilla de 24 palabras
export const generateSeedPhrase = () => {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(byte => BIP39_ES[byte % BIP39_ES.length]).join(' ');
};

const deriveKey = async (password, saltString) => {
    const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode(saltString), iterations: 600000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
};

export const hashPassword = async (password, saltString) => {
    const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const hashBuffer = await window.crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: enc.encode(saltString), iterations: 600000, hash: "SHA-256" }, keyMaterial, 256
    );
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// * ENVOLTURA (WRAPPING) DE LA DEK
export const wrapMasterKey = async (dekHex, passwordOrSeed, saltString) => {
    const kek = await deriveKey(passwordOrSeed, saltString); // 600,000 iteraciones
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, kek, enc.encode(dekHex));
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0); combined.set(new Uint8Array(cipherBuffer), iv.length);
    return btoa(String.fromCharCode(...combined));
};

export const unwrapMasterKey = async (wrappedKeyB64, passwordOrSeed, saltString) => {
    try {
        const combined = new Uint8Array(atob(wrappedKeyB64).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const cipherBuffer = combined.slice(12);
        const kek = await deriveKey(passwordOrSeed, saltString); // 600,000 iteraciones
        const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, kek, cipherBuffer);
        return dec.decode(decryptedBuffer); // Devuelve la DEK limpia
    } catch(e) {
        return null; // Si falló, la contraseña era incorrecta
    }
};

// * ENCRIPTACIÓN DIRECTA CON DEK
const getAesKey = async (dekHex) => {
    const keyBytes = new Uint8Array(dekHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return window.crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
};

export const encryptData = async (text, dekHex) => {
    const key = await getAesKey(dekHex);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(text));
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0); combined.set(new Uint8Array(cipherBuffer), iv.length);
    return btoa(String.fromCharCode(...combined));
};

export const decryptData = async (base64Text, dekHex) => {
    try {
        const combined = new Uint8Array(atob(base64Text).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const cipherBuffer = combined.slice(12);
        const key = await getAesKey(dekHex);
        const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, cipherBuffer);
        return dec.decode(decryptedBuffer);
    } catch (e) {
        return "/// ACCESO DENEGADO ///";
    }
};

export const initCrypto = () => { console.log("Motor Criptográfico KEK/DEK Inicializado"); };