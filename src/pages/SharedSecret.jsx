import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { secretService } from '../services/secretService';
import { decryptData } from '../services/cryptoService';
import { Lock, Unlock, AlertTriangle, ShieldAlert, Fingerprint } from 'lucide-react';

const SharedSecret = () => {
    const { id } = useParams();
    const [secret, setSecret] = useState(null);
    const [holdToReveal, setHoldToReveal] = useState(false); 
    const [isHolding, setIsHolding] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    
    // NUEVO: Estado que indica si el mensaje ya fue visto y destruido en RAM
    const [isBurned, setIsBurned] = useState(false); 
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Opcional: Si quieres que el cartel desaparezca solo, quita el comentario. 
    useEffect(() => {
        if (showInfo && !isBurned) {
            const timer = setTimeout(() => setShowInfo(false), 10000); // 10 segundos
            return () => clearTimeout(timer);
        }
    }, [showInfo, isBurned]);
    

    const handleReveal = async () => {
        setIsLoading(true);
        try {
            const hashKey = window.location.hash.substring(1);
            if (!hashKey) throw new Error("Falta llave local.");

            const response = await secretService.getSecret(id);
            const decryptedText = decryptData(response.encryptedMessage, hashKey);
            
            setSecret(decryptedText);
            setHoldToReveal(response.holdToReveal);
            if (response.holdToReveal) setShowInfo(true);
            
            window.history.replaceState(null, null, ' ');
        } catch (err) {
            setError("Mensaje destruido, caducado o enlace inválido.");
        } finally {
            setIsLoading(false);
        }
    };

    // FUNCIÓN CUANDO PRESIONAN EL CLICK
    const handlePressStart = () => {
        if (holdToReveal && !isBurned) {
            setIsHolding(true);
            setShowInfo(false); // Ocultamos la advertencia gigante apenas empiezan a leer
        }
    };

    // FUNCIÓN CUANDO SUELTAN EL CLICK O SALEN DEL RECUADRO
    const handlePressEnd = () => {
        if (holdToReveal && isHolding) {
            setIsHolding(false);
            setIsBurned(true); // ¡Marcamos como quemado!
            
            // LA CLAVE DE LA SEGURIDAD: Sobreescribimos el secreto en la RAM
            // Así, ni los hackers usando la consola (F12) podrán recuperarlo
            setSecret('/// PAYLOAD PURGADO ///\n\nEl protocolo de lectura única ha finalizado.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box" style={{ maxWidth: '650px', textAlign: 'center' }}>
                
                {/* ESTADO 1: ANTES DE REVELAR */}
                {!secret && !error && (
                    <>
                        <Lock size={48} color="#fff" style={{marginBottom: '1rem'}}/>
                        <h2 style={{letterSpacing: '3px'}}>/// INTERCEPTAR PAYLOAD ///</h2>
                        <p style={{ color: '#888', fontSize: '0.85rem', margin: '2rem 0', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.6' }}>
                            Estás a punto de leer un mensaje cifrado de extremo a extremo.<br/>
                            Al revelarlo, será purgado permanentemente del servidor.
                        </p>
                        <button onClick={handleReveal} disabled={isLoading} style={{ width: '100%', padding: '1.2rem', background: 'white', color: 'black', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer' }}>
                            {isLoading ? 'DESCIFRANDO EN RAM...' : 'REVELAR Y PURGAR DEL SERVIDOR'}
                        </button>
                    </>
                )}

                {/* ESTADO 2: SECRETO REVELADO */}
                {secret && (
                    <>
                        {isBurned ? <ShieldAlert size={48} color="#ef4444" style={{marginBottom: '1rem'}}/> : <Unlock size={48} color="#10b981" style={{marginBottom: '1rem'}}/>}
                        
                        <h2 style={{ color: isBurned ? '#ef4444' : '#10b981', letterSpacing: '2px' }}>
                            {isBurned ? 'SECRETO DESTRUIDO' : (holdToReveal ? 'MODO RESTRINGIDO ACTIVO' : 'PAYLOAD ABIERTO')}
                        </h2>

                        {/* EL CARTEL GIGANTE DE ADVERTENCIA */}
                        {showInfo && !isBurned && (
                            <div className="info-banner-snap">
                                <AlertTriangle size={40} style={{ flexShrink: 0 }} />
                                <div>
                                    <h3>¡ATENCIÓN: LECTURA ÚNICA!</h3>
                                    <p>Debes <strong>MANTENER PRESIONADO</strong> el recuadro de abajo para leer el mensaje. Si sueltas el clic, desvías el cursor o intentas copiarlo, el mensaje se <strong>DESTRUIRÁ PARA SIEMPRE</strong> de tu pantalla.</p>
                                </div>
                            </div>
                        )}

                        {/* EL CONTENEDOR SNAPCHAT (El campo de batalla) */}
                        <div 
                            className={`secret-viewer ${isHolding ? 'visible' : (isBurned ? 'burned' : 'blurred')}`}
                            onMouseDown={handlePressStart}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd} // Si sacan el ratón de la caja, ¡Pum!
                            onTouchStart={handlePressStart} // Para celulares
                            onTouchEnd={handlePressEnd}     // Para celulares
                            onContextMenu={(e) => e.preventDefault()} // Sin clic derecho
                            onCopy={(e) => {
                                e.preventDefault(); // Bloquear Copiar
                                alert("Violación detectada: Protocolo de autodestrucción activado.");
                                handlePressEnd(); // CASTIGO: Lo destruimos si intentan hacer Ctrl+C
                            }}
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        >
                            {isBurned ? (
                                 <div className="placeholder-content" style={{ color: '#ef4444' }}>
                                     <ShieldAlert size={56} />
                                     <span style={{fontSize: '1rem', fontWeight: 'bold'}}>EL SECRETO FUE ELIMINADO DE LA MEMORIA</span>
                                 </div>
                            ) : (!holdToReveal || isHolding) ? (
                                <div className="text-content">{secret}</div>
                            ) : (
                                <div className="placeholder-content">
                                    <Fingerprint size={56} />
                                    <span style={{fontSize: '1rem'}}>MANTÉN PRESIONADO EL CLIC PARA LEER</span>
                                </div>
                            )}
                        </div>

                        <p style={{ color: isBurned ? '#ef4444' : '#888', fontSize: '0.75rem', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                            <ShieldAlert size={14} /> El registro ya no existe en la base de datos.
                        </p>
                    </>
                )}

                {/* ESTADO 3: ERROR (Ya se abrió o no existe) */}
                {error && (
                    <>
                        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ color: '#ef4444' }}>ACCESO DENEGADO</h2>
                        <div style={{ border: '1px dashed #ef4444', padding: '1.5rem', color: '#ef4444', marginTop: '2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            {error}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SharedSecret;