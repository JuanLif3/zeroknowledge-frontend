import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vaultService } from '../services/vaultService';
import { authService } from '../services/authService';
import { initCrypto, encryptData, decryptData } from '../services/cryptoService';
import PasswordGenerator from '../components/PasswordGenerator';
import { Database, KeySquare, Activity, Settings, LogOut, PlusSquare, ShieldAlert, Lock, Unlock, CreditCard, StickyNote, Key } from 'lucide-react';

const Vault = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [masterKey, setMasterKey] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [activeTab, setActiveTab] = useState('caja');
    
    // --- ESTADOS DEL FORMULARIO ---
    const [itemType, setItemType] = useState('login'); // Controla el Split View
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isHoneytoken, setIsHoneytoken] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);

    useEffect(() => { 
        initCrypto(); 
        fetchVault(); 
    }, []);

    const fetchVault = async () => {
        try {
            const data = await vaultService.getMyVault();
            setItems(data);
        } catch (error) {
            if (error.response?.status === 403) navigate('/login');
        }
    };

    const handleUnlock = (e) => { 
        e.preventDefault(); 
        setIsUnlocked(true); 
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isUnlocked) return alert("Desbloquea la bóveda primero");

        // Bloqueo temporal de Arquitectura
        if (itemType !== 'login') {
            alert("⚠️ ALERTA DE ARQUITECTURA: El backend en Java aún no soporta Tarjetas ni Notas. Debemos refactorizar la base de datos primero.");
            return;
        }

        const encTitle = encryptData(title, masterKey);
        const encUser = encryptData(username, masterKey);
        const encPass = encryptData(password, masterKey);
        try {
            await vaultService.saveVaultItem(encTitle, encUser, encPass, isHoneytoken);
            setTitle(''); setUsername(''); setPassword(''); setIsHoneytoken(false); setShowGenerator(false);
            fetchVault();
        } catch (error) { 
            alert("Error al guardar"); 
        }
    };

    const handleLogout = () => { 
        authService.logout(); 
        navigate('/login'); 
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'caja':
                return (
                    <div className="tab-content caja-split-layout">
                        {/* COLUMNA IZQUIERDA: FORMULARIO DINÁMICO */}
                        <div className="add-item-card">
                            <h3 className="icon-heading"><PlusSquare size={18} /> Nueva Entrada</h3>
                            
                            {/* SELECTOR DE TIPO (Login, Tarjeta, Nota) */}
                            <div className="type-selector">
                                <button type="button" className={itemType === 'login' ? 'active' : ''} onClick={() => setItemType('login')}>
                                    <Key size={16} /> Login
                                </button>
                                <button type="button" className={itemType === 'tarjeta' ? 'active' : ''} onClick={() => setItemType('tarjeta')}>
                                    <CreditCard size={16} /> Tarjeta
                                </button>
                                <button type="button" className={itemType === 'nota' ? 'active' : ''} onClick={() => setItemType('nota')}>
                                    <StickyNote size={16} /> Nota
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <input type="text" placeholder="TÍTULO (Ej: Netflix, Visa Santander)" required value={title} onChange={e => setTitle(e.target.value)} />
                                
                                {/* CAMPOS DINÁMICOS SEGÚN EL TIPO */}
                                {itemType === 'login' && (
                                    <>
                                        <input type="text" placeholder="USUARIO / EMAIL" required value={username} onChange={e => setUsername(e.target.value)} />
                                        <div className="password-input-group">
                                            <input type="text" placeholder="CONTRASEÑA" required value={password} onChange={e => setPassword(e.target.value)} />
                                            <button type="button" className="toggle-gen-btn" onClick={() => setShowGenerator(!showGenerator)}>
                                                {showGenerator ? 'Cerrar' : 'Generar'}
                                            </button>
                                        </div>
                                        {showGenerator && (
                                            <div style={{marginTop: '-1rem', marginBottom: '1rem'}}>
                                                <PasswordGenerator onPasswordGenerated={(newPass) => {
                                                    setPassword(newPass);
                                                    setShowGenerator(false);
                                                }} />
                                            </div>
                                        )}
                                    </>
                                )}

                                {itemType === 'tarjeta' && (
                                    <>
                                        <input type="text" placeholder="TITULAR DE LA TARJETA" required />
                                        <input type="text" placeholder="NÚMERO DE TARJETA (XXXX-XXXX-XXXX-XXXX)" required />
                                        <div className="split-inputs">
                                            <input type="text" placeholder="VENCIMIENTO (MM/YY)" required />
                                            <input type="password" placeholder="CVV" required />
                                        </div>
                                    </>
                                )}

                                {itemType === 'nota' && (
                                    <textarea placeholder="ESCRIBE TU NOTA SEGURA AQUÍ..." required rows="6"></textarea>
                                )}

                                <label className="honeytoken-label">
                                    <input type="checkbox" checked={isHoneytoken} onChange={e => setIsHoneytoken(e.target.checked)} />
                                    <ShieldAlert size={14} /> HONEYTOKEN (TRAMPA ACTIVA)
                                </label>
                                <button type="submit">Cifrar y Almacenar</button>
                            </form>
                        </div>

                        {/* COLUMNA DERECHA: LA LISTA DE ELEMENTOS */}
                        <div className="items-list-container">
                            <div className="list-header">
                                <h3>Bóveda Local</h3>
                                <span className="item-count">{items.length} ENTRIES</span>
                            </div>
                            
                            <div className="items-scroll-area">
                                {items.length === 0 && <p className="empty-msg">No hay datos en esta sección.</p>}
                                
                                {items.map(item => (
                                    <div key={item.id} className={`vault-item ${item.isHoneytoken ? 'honeytoken' : ''}`}>
                                        <div className="item-header">
                                            <Key size={16} className="item-icon" />
                                            <h4>{decryptData(item.encryptedTitle, masterKey)}</h4>
                                        </div>
                                        <div className="item-details">
                                            <p><strong>USR:</strong> {decryptData(item.encryptedUsername, masterKey)}</p>
                                            <p className="blur-text"><strong>KEY:</strong> {decryptData(item.encryptedPassword, masterKey)}</p>
                                        </div>
                                        {item.isHoneytoken && <span className="badge"><ShieldAlert size={12} style={{marginRight: '4px'}}/> TRAMPA</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'generador': return <div className="tab-content"><PasswordGenerator /></div>;
            case 'auditoria': return <div className="tab-content coming-soon"><h2 className="icon-heading"><Activity size={28}/> Auditoría de Salud</h2><p>Módulo de análisis criptográfico en desarrollo.</p></div>;
            case 'configuracion': return <div className="tab-content coming-soon"><h2 className="icon-heading"><Settings size={28}/> Configuración</h2><p>Parámetros del sistema y rotación de llaves.</p></div>;
            default: return null;
        }
    };

    return (
        <div className="dashboard-layout">
            {!isUnlocked ? (
                <div className="unlock-overlay">
                    <form onSubmit={handleUnlock} className="unlock-box">
                        <Lock size={48} color="#fff" strokeWidth={1} style={{marginBottom: '1rem'}} />
                        <h2>ZK-Vault</h2>
                        <p>Bóveda sellada. Requiere autenticación local.</p>
                        <input type="password" required value={masterKey} onChange={(e) => setMasterKey(e.target.value)} placeholder="Master Key" />
                        <button type="submit" className="icon-btn-center"><Unlock size={18}/> Desencriptar</button>
                    </form>
                </div>
            ) : (
                <>
                    <aside className="sidebar">
                        <div className="brand">
                            <h2>ZK-Vault</h2>
                            <span className="status">Conexión Segura</span>
                        </div>
                        <nav>
                            <button className={activeTab === 'caja' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('caja')}>
                                <Database size={18} /> Mi Caja
                            </button>
                            <button className={activeTab === 'generador' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('generador')}>
                                <KeySquare size={18} /> Generador
                            </button>
                            <button className={activeTab === 'auditoria' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('auditoria')}>
                                <Activity size={18} /> Auditoría
                            </button>
                            <button className={activeTab === 'configuracion' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('configuracion')}>
                                <Settings size={18} /> Parámetros
                            </button>
                        </nav>
                        <button className="logout-sidebar-btn icon-btn-center" onClick={handleLogout}>
                            <LogOut size={16} /> Finalizar Sesión
                        </button>
                    </aside>
                    <main className="main-content">
                        {renderContent()}
                    </main>
                </>
            )}
        </div>
    );
};

export default Vault;