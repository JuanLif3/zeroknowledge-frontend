import _sodium from 'libsodium-wrappers';

// * Inicializamos la libreria de criptografía
export const initCrypto = async () => {
    await _sodium.ready;
};

// * Convierte la contraseña del usuario en una llave maestra metematica de 32 bytes
const deriveKey = (password) => {
    const sodium = _sodium;
    // En produccion de usa Argon2id, aqui usamos un hash reapido de ejemplo
    return sodium.crypto_generichash(32, password);
};

// * Funcion para encriptar 
export const encryptData = (text, password) => {
    const sodium = _sodium;
    const key = deriveKey(password);

    // El "Nonce" es un número aleatorio de un solo uso (vital para que el cifrado sea seguro)
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    // Encriptamos el texto
    const ciphertext = sodium.crypto_secretbox_easy(text, nonce, key);
    // Juntamos el Nonce y el texto cifrado y lo convertimos a base 64 para poder guardarlo en Java
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce);
    combined.set(ciphertext, nonce.length);

    return sodium.to_base64(combined);
};

// * Función para DESENCRIPTAR
export const decryptData = (base64String, password) => {
    try {
        const sodium = _sodium;
        const key = deriveKey(password);
        const combined = sodium.from_base64(base64String);
        
        // Separamos el Nonce del Texto Cifrado
        const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
        const cipherText = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
        
        // Intentamos abrir el candado
        const decrypted = sodium.crypto_secretbox_open_easy(cipherText, nonce, key);
        return sodium.to_string(decrypted);
    } catch (e) {
        return "❌ CLAVE INCORRECTA";
    }
};
