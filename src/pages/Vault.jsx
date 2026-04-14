import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vaultService } from '../services/vaultService';
import { authService } from '../services/authService';
import { initCrypto, encryptData, decryptData } from '../services/cryptoService';

const Vault = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [masterKey, setMasterKey] = useState(''); // La llave que está en la mente del usuario
    const [isUnlocked, setIsUnlocked] = useState(false); // ¿Ya ingresó su llave?

    // Estados del formulario
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isHoneytoken, setIsHoneytoken] = useState(false);

    useEffect(() => {
        initCrypto();
        fetchVault();
    }, []);

    const fetchVault = async () => {
        try {
            const data = await vaultService.getMyVault();
            setItems(data);
        } catch (error) {
            if (error.response?.status === 403) {
                navigate('/login'); // Si el token expiró, lo echamos al login
            }
        }
    };

    const handleUnlock = (e) => {
        e.preventDefault();
        setIsUnlocked(true); // Desbloqueamos la bóveda en la memoria RAM
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isUnlocked) return alert("Debes desbloquear la bóveda primero");

        // 1. ENCRIPTAMOS ANTES DE ENVIAR (Zero-Knowledge)
        const encTitle = encryptData(title, masterKey);
        const encUser = encryptData(username, masterKey);
        const encPass = encryptData(password, masterKey);

        try {
            // 2. Enviamos basura criptográfica a Java
            await vaultService.saveVaultItem(encTitle, encUser, encPass, isHoneytoken);
            
            // Limpiamos y recargamos
            setTitle(''); setUsername(''); setPassword(''); setIsHoneytoken(false);
            fetchVault();
        } catch (error) {
            alert("Error al guardar en la bóveda");
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="vault-container">
            <header className="vault-header">
                <h2>ZK-Vault Dashboard</h2>
                <button className="logout-btn" onClick={handleLogout}>Cerrar Sesión</button>
            </header>

            {!isUnlocked ? (
                <div className="unlock-overlay">
                    <form onSubmit={handleUnlock} className="unlock-box">
                        <h3>🔑 Desbloquear Bóveda</h3>
                        <p>Ingresa tu Master Password para desencriptar los datos localmente.</p>
                        <input 
                            type="password" 
                            required 
                            value={masterKey} 
                            onChange={(e) => setMasterKey(e.target.value)} 
                            placeholder="Master Password"
                        />
                        <button type="submit">Desencriptar en Memoria</button>
                    </form>
                </div>
            ) : (
                <div className="vault-content">
                    {/* Formulario para añadir nueva contraseña */}
                    <div className="add-item-card">
                        <h3>➕ Nueva Credencial</h3>
                        <form onSubmit={handleSave}>
                            <input type="text" placeholder="Ej: Netflix" required value={title} onChange={e => setTitle(e.target.value)} />
                            <input type="text" placeholder="Usuario/Email" required value={username} onChange={e => setUsername(e.target.value)} />
                            <input type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} />
                            
                            <label className="honeytoken-label">
                                <input type="checkbox" checked={isHoneytoken} onChange={e => setIsHoneytoken(e.target.checked)} />
                                ☢️ Es un Honeytoken (Credencial Falsa/Trampa)
                            </label>
                            
                            <button type="submit">Encriptar y Guardar</button>
                        </form>
                    </div>

                    {/* Lista de contraseñas */}
                    <div className="items-list">
                        <h3>Tus Credenciales Guardadas</h3>
                        {items.length === 0 && <p>La bóveda está vacía.</p>}
                        
                        {items.map(item => (
                            <div key={item.id} className={`vault-item ${item.isHoneytoken ? 'honeytoken' : ''}`}>
                                <div className="item-details">
                                    {/* Aquí ocurre la DESENCRIPTACIÓN EN TIEMPO REAL */}
                                    <h4>{decryptData(item.encryptedTitle, masterKey)}</h4>
                                    <p><strong>Usuario:</strong> {decryptData(item.encryptedUsername, masterKey)}</p>
                                    <p><strong>Clave:</strong> {decryptData(item.encryptedPassword, masterKey)}</p>
                                </div>
                                {item.isHoneytoken && <span className="badge">TRAMPA ACTIVA</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vault;