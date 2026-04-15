import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vaultService } from '../services/vaultService';
import { authService } from '../services/authService';
import { initCrypto, encryptData, decryptData } from '../services/cryptoService';
import PasswordGenerator from '../components/PasswordGenerator';
import { Database, KeySquare, ShieldCheck, Link2, Radar, LogOut, PlusSquare, ShieldAlert, Lock, Unlock, CreditCard, StickyNote, Key } from 'lucide-react';

const Vault = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [masterKey, setMasterKey] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [activeTab, setActiveTab] = useState('caja');
    
    // --- ESTADOS DEL FORMULARIO ---
    const [itemType, setItemType] = useState('login'); 
    const [title, setTitle] = useState('');
    const [isHoneytoken, setIsHoneytoken] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);

    // Estados para LOGIN
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Estados para TARJETA
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    // Estado para NOTA
    const [noteContent, setNoteContent] = useState('');

    useEffect(() => { initCrypto(); fetchVault(); }, []);

    const fetchVault = async () => {
        try {
            const data = await vaultService.getMyVault();
            setItems(data);
        } catch (error) {
            if (error.response?.status === 403) navigate('/login');
        }
    };

    const handleUnlock = (e) => { e.preventDefault(); setIsUnlocked(true); };

    // --- LA MAGIA DEL EMPAQUETADO ---
    const handleSave = async (e) => {
        e.preventDefault();
        if (!isUnlocked) return alert("Desbloquea la bóveda primero");

        // 1. Armamos un JSON (Caja Fuerte) dependiendo de lo que el usuario quiere guardar
        let payloadObj = {};
        
        if (itemType === 'login') {
            payloadObj = { username, password };
        } else if (itemType === 'tarjeta') {
            payloadObj = { cardHolder, cardNumber, cardExpiry, cardCvv };
        } else if (itemType === 'nota') {
            payloadObj = { noteContent };
        }

        // 2. Convertimos el JSON a Texto
        const jsonString = JSON.stringify(payloadObj);

        // 3. ENCRIPTAMOS EL TITULO Y TODO EL JSON (Zero-Knowledge)
        const encTitle = encryptData(title, masterKey);
        const encPayload = encryptData(jsonString, masterKey);

        try {
            // 4. Enviamos al Java
            await vaultService.saveVaultItem(encTitle, itemType, encPayload, isHoneytoken);
            
            // Limpiamos los campos
            setTitle(''); setUsername(''); setPassword(''); setCardHolder(''); setCardNumber(''); setCardExpiry(''); setCardCvv(''); setNoteContent(''); setIsHoneytoken(false); setShowGenerator(false);
            fetchVault();
        } catch (error) { 
            alert("Error al guardar"); 
        }
    };

    const handleLogout = () => { authService.logout(); navigate('/login'); };

    const renderContent = () => {
        switch (activeTab) {
            case 'caja':
                return (
                    <div className="tab-content caja-split-layout">
                        {/* --- PANEL DE CREACIÓN --- */}
                        <div className="add-item-card">
                            <h3 className="icon-heading"><PlusSquare size={18} /> Nueva Entrada</h3>
                            
                            <div className="type-selector">
                                <button type="button" className={itemType === 'login' ? 'active' : ''} onClick={() => setItemType('login')}><Key size={16} /> Login</button>
                                <button type="button" className={itemType === 'tarjeta' ? 'active' : ''} onClick={() => setItemType('tarjeta')}><CreditCard size={16} /> Tarjeta</button>
                                <button type="button" className={itemType === 'nota' ? 'active' : ''} onClick={() => setItemType('nota')}><StickyNote size={16} /> Nota</button>
                            </div>

                            <form onSubmit={handleSave}>
                                <input type="text" placeholder="TÍTULO (Ej: Netflix, Visa)" required value={title} onChange={e => setTitle(e.target.value)} />
                                
                                {itemType === 'login' && (
                                    <>
                                        <input type="text" placeholder="USUARIO / EMAIL" required value={username} onChange={e => setUsername(e.target.value)} />
                                        <div className="password-input-group">
                                            <input type="text" placeholder="CONTRASEÑA" required value={password} onChange={e => setPassword(e.target.value)} />
                                            <button type="button" className="toggle-gen-btn" onClick={() => setShowGenerator(!showGenerator)}>{showGenerator ? 'Cerrar' : 'Generar'}</button>
                                        </div>
                                        {showGenerator && (
                                            <div style={{marginTop: '-1rem', marginBottom: '1rem'}}>
                                                <PasswordGenerator onPasswordGenerated={(newPass) => { setPassword(newPass); setShowGenerator(false); }} />
                                            </div>
                                        )}
                                    </>
                                )}

                                {itemType === 'tarjeta' && (
                                    <>
                                        <input type="text" placeholder="TITULAR DE LA TARJETA" required value={cardHolder} onChange={e => setCardHolder(e.target.value)} />
                                        <input type="text" placeholder="NÚMERO DE TARJETA" required value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                                        <div className="split-inputs">
                                            <input type="text" placeholder="VENCIMIENTO (MM/YY)" required value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                                            <input type="password" placeholder="CVV" required value={cardCvv} onChange={e => setCardCvv(e.target.value)} />
                                        </div>
                                    </>
                                )}

                                {itemType === 'nota' && (
                                    <textarea placeholder="ESCRIBE TU NOTA SEGURA AQUÍ..." required rows="6" value={noteContent} onChange={e => setNoteContent(e.target.value)}></textarea>
                                )}

                                <label className="honeytoken-label">
                                    <input type="checkbox" checked={isHoneytoken} onChange={e => setIsHoneytoken(e.target.checked)} />
                                    <ShieldAlert size={14} /> HONEYTOKEN (TRAMPA ACTIVA)
                                </label>
                                <button type="submit">Cifrar y Almacenar</button>
                            </form>
                        </div>

                        {/* --- PANEL DE LISTA --- */}
                        <div className="items-list-container">
                            <div className="list-header">
                                <h3>Bóveda Local</h3>
                                <span className="item-count">{items.length} ENTRIES</span>
                            </div>
                            
                            <div className="items-scroll-area">
                                {items.length === 0 && <p className="empty-msg">No hay datos en esta sección.</p>}
                                
                                {items.map(item => {
                                    // LA MAGIA DE LA DESENCRIPTACIÓN Y DESEMPAQUETADO
                                    const decTitle = decryptData(item.encryptedTitle, masterKey);
                                    const decPayloadString = decryptData(item.encryptedPayload, masterKey);
                                    
                                    let payload = {};
                                    try {
                                        // Intentamos convertir el texto desencriptado de vuelta a JSON
                                        payload = JSON.parse(decPayloadString);
                                    } catch (e) {
                                        payload = { error: "Datos corruptos o clave inválida" };
                                    }

                                    return (
                                        <div key={item.id} className={`vault-item ${item.isHoneytoken ? 'honeytoken' : ''}`}>
                                            <div className="item-header">
                                                {item.itemType === 'login' && <Key size={16} className="item-icon" />}
                                                {item.itemType === 'tarjeta' && <CreditCard size={16} className="item-icon" />}
                                                {item.itemType === 'nota' && <StickyNote size={16} className="item-icon" />}
                                                <h4>{decTitle}</h4>
                                            </div>
                                            <div className="item-details">
                                                {/* Renderizamos dependiendo del TIPO */}
                                                {item.itemType === 'login' && (
                                                    <>
                                                        <p><strong>USR:</strong> {payload.username}</p>
                                                        <p className="blur-text"><strong>KEY:</strong> {payload.password}</p>
                                                    </>
                                                )}
                                                {item.itemType === 'tarjeta' && (
                                                    <>
                                                        <p><strong>NÚM:</strong> {payload.cardNumber}</p>
                                                        <p><strong>VENCE:</strong> {payload.cardExpiry}</p>
                                                        <p className="blur-text"><strong>CVV:</strong> {payload.cardCvv}</p>
                                                    </>
                                                )}
                                                {item.itemType === 'nota' && (
                                                    <p className="blur-text"><strong>TXT:</strong> {payload.noteContent}</p>
                                                )}
                                                {payload.error && <p style={{color: 'red'}}>{payload.error}</p>}
                                            </div>
                                            {item.isHoneytoken && <span className="badge"><ShieldAlert size={12} style={{marginRight: '4px'}}/> TRAMPA</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            case 'generador': return <div className="tab-content"><PasswordGenerator /></div>;
            case 'auditoria': 
                return (
                    <div className="tab-content coming-soon">
                        <h2 className="icon-heading"><ShieldCheck size={28}/> Auditoría de Entropía</h2>
                        <p>Analizando la fortaleza de las llaves en la memoria RAM (Aislamiento de red activo)...</p>
                    </div>
                );
                case 'send': 
                return (
                    <div className="tab-content coming-soon">
                        <h2 className="icon-heading"><Link2 size={28}/> Transmisión Efímera (E2EE)</h2>
                        <p>Módulo para generar enlaces de autodestrucción (Lectura Única).</p>
                    </div>
                );
                case 'radar': 
                return (
                    <div className="tab-content coming-soon">
                        <h2 className="icon-heading"><Radar size={28}/> Monitoreo de Honeytokens</h2>
                        <p>Escaneando registros de intrusión y uso de credenciales trampa...</p>
                    </div>
                );
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
                        
                        <div className="nav-group">
                            <span className="nav-label">/// CORE_SYSTEM</span>
                            <nav>
                                <button className={activeTab === 'caja' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('caja')}>
                                    <Database size={18} /> Caja Cifrada
                                </button>
                                <button className={activeTab === 'generador' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('generador')}>
                                    <KeySquare size={18} /> Motor CSPRNG
                                </button>
                            </nav>
                        </div>

                        <div className="nav-group">
                            <span className="nav-label">/// ZERO_KNOWLEDGE</span>
                            <nav>
                                <button className={activeTab === 'auditoria' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('auditoria')}>
                                    <ShieldCheck size={18} /> Auditoría Local
                                </button>
                                <button className={activeTab === 'send' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('send')}>
                                    <Link2 size={18} /> Envío Efímero
                                </button>
                                <button className={activeTab === 'radar' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('radar')}>
                                    <Radar size={18} /> Radar Honeytoken
                                </button>
                            </nav>
                        </div>

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