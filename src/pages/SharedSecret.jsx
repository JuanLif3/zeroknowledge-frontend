import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { secretService } from '../services/secretService';
import { decryptData } from '../services/cryptoService';
import { Lock, Unlock, AlertTriangle, ShieldAlert } from 'lucide-react';

const SharedSecret = () => {
    // Obtenemos el ID de la URL (Ej: ca924022-...)
    const { id } = useParams();
    
    const [secret, setSecret] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleReveal = async () => {
        setIsLoading(true);
        try {
            // 1. Obtener la llave local que está DESPUÉS del hashtag '#'
            const hashKey = window.location.hash.substring(1);
            if (!hashKey) {
                throw new Error("Enlace inválido: Falta la llave de descifrado local.");
            }

            // 2. Pedirle el texto cifrado a Java
            // ⚠️ ALERTA: ¡En el milisegundo en que Java responde, destruye el archivo!
            const response = await secretService.getSecret(id);

            // 3. Desencriptar en la RAM del navegador del receptor
            const decryptedText = decryptData(response.encryptedMessage, hashKey);
            setSecret(decryptedText);
            
            // 4. Limpiar el hashtag de la barra de direcciones por seguridad extra
            window.history.replaceState(null, null, ' ');
        } catch (err) {
            setError("El mensaje ha sido destruido, caducó por tiempo, o el enlace es inválido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Usamos la misma clase del login para mantener el diseño minimalista centrado
        <div className="auth-container">
            <div className="auth-box" style={{ maxWidth: '600px', textAlign: 'center' }}>
                
                {/* ESTADO 1: ANTES DE HACER CLIC */}
                {!secret && !error && (
                    <>
                        <Lock size={48} color="#fff" style={{ marginBottom: '1rem' }} />
                        <h2>/// INTERCEPTAR SECRETO ///</h2>
                        <p style={{ color: '#888', fontSize: '0.85rem', margin: '2rem 0', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.5' }}>
                            Estás a punto de leer un mensaje cifrado de extremo a extremo.<br/>
                            Al revelarlo, será purgado permanentemente del servidor.
                        </p>
                        <button onClick={handleReveal} disabled={isLoading} style={{ width: '100%', padding: '1.2rem', background: 'white', color: 'black', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', transition: '0.2s' }}>
                            {isLoading ? 'Ejecutando descifrado...' : 'Revelar y Destruir'}
                        </button>
                    </>
                )}

                {/* ESTADO 2: MENSAJE DESENCRIPTADO CON ÉXITO */}
                {secret && (
                    <>
                        <Unlock size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ color: '#10b981', borderBottomColor: '#10b981' }}>PAYLOAD REVELADO</h2>
                        <div style={{ background: '#050505', border: '1px solid #333', padding: '2.5rem', marginTop: '2rem', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', color: 'white', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>
                            {secret}
                        </div>
                        <p style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                            <ShieldAlert size={14} /> Este registro ya fue eliminado del servidor.
                        </p>
                    </>
                )}

                {/* ESTADO 3: ERROR (Ya se abrió o no existe) */}
                {error && (
                    <>
                        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ color: '#ef4444', borderBottomColor: '#ef4444' }}>ACCESO DENEGADO</h2>
                        <div style={{ border: '1px dashed #ef4444', padding: '1.5rem', color: '#ef4444', marginTop: '2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default SharedSecret;