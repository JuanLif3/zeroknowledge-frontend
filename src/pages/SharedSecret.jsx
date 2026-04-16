import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { secretService } from '../services/secretService';
import { decryptData } from '../services/cryptoService';
import { Lock, Unlock, AlertTriangle, ShieldAlert, Fingerprint, EyeOff, Info } from 'lucide-react';

const SharedSecret = () => {
    const { id } = useParams();
    const [secret, setSecret] = useState(null);
    const [holdToReveal, setHoldToReveal] = useState(false); // Viene del backend
    const [isHolding, setIsHolding] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Temporizador de 7 segundos para la explicación
    useEffect(() => {
        if (showInfo) {
            const timer = setTimeout(() => setShowInfo(false), 7000);
            return () => clearTimeout(timer);
        }
    }, [showInfo]);

    const handleReveal = async () => {
        setIsLoading(true);
        try {
            const hashKey = window.location.hash.substring(1);
            if (!hashKey) throw new Error("Falta llave local.");

            const response = await secretService.getSecret(id);
            const decryptedText = decryptData(response.encryptedMessage, hashKey);
            
            setSecret(decryptedText);
            setHoldToReveal(response.holdToReveal); // Asumimos que el backend lo envía
            if (response.holdToReveal) setShowInfo(true);
            
            window.history.replaceState(null, null, ' ');
        } catch (err) {
            setError("Mensaje destruido o inválido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box" style={{ maxWidth: '600px', textAlign: 'center' }}>
                
                {/* 1. ANTES DE REVELAR */}
                {!secret && !error && (
                    <>
                        <Lock size={48} color="#fff" />
                        <h2>/// INTERCEPTAR PAYLOAD ///</h2>
                        <button onClick={handleReveal} disabled={isLoading} className="btn-large">
                            {isLoading ? 'DESCIFRANDO...' : 'REVELAR Y PURGAR'}
                        </button>
                    </>
                )}

                {/* 2. SECRETO REVELADO */}
                {secret && (
                    <>
                        <Unlock size={48} color="#10b981" />
                        <h2 style={{ color: '#10b981' }}>{holdToReveal ? 'MODO RESTRINGIDO' : 'PAYLOAD ABIERTO'}</h2>

                        {/* EXPLICACIÓN TEMPORAL (7 SEGUNDOS) */}
                        {showInfo && (
                            <div className="info-banner-snap">
                                <Info size={16} />
                                <p>Este mensaje tiene protección biométrica simulada. Manten presionado el recuadro para leer. Si sueltas el clic, el texto se ocultará.</p>
                            </div>
                        )}

                        {/* EL CONTENEDOR SNAPCHAT */}
                        <div 
                            className={`secret-viewer ${isHolding ? 'visible' : 'blurred'}`}
                            onMouseDown={() => holdToReveal && setIsHolding(true)}
                            onMouseUp={() => setIsHolding(false)}
                            onMouseLeave={() => setIsHolding(false)}
                            onTouchStart={() => holdToReveal && setIsHolding(true)}
                            onTouchEnd={() => setIsHolding(false)}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ userSelect: 'none' }}
                        >
                            {!holdToReveal || isHolding ? (
                                <div className="text-content">{secret}</div>
                            ) : (
                                <div className="placeholder-content">
                                    <Fingerprint size={40} />
                                    <span>MANTÉN PRESIONADO PARA LEER</span>
                                </div>
                            )}
                        </div>

                        <p className="warning-p">
                            <ShieldAlert size={14} /> El registro ha sido purgado de la memoria del servidor.
                        </p>
                    </>
                )}

                {error && <div className="error-box">{error}</div>}
            </div>
        </div>
    );
};

export default SharedSecret;