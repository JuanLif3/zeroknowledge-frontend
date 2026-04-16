import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vaultService } from '../services/vaultService';
import { authService } from '../services/authService';
import { initCrypto, encryptData, decryptData } from '../services/cryptoService';
import PasswordGenerator from '../components/PasswordGenerator';
import { secretService } from '../services/secretService';
import { Database, KeySquare, ShieldCheck, Link2, Radar, LogOut, PlusSquare, ShieldAlert, Lock, Unlock, CreditCard, StickyNote, Key, AlertTriangle, CheckCircle, XOctagon, Copy } from 'lucide-react';

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
    const [filterType, setFilterType] = useState('all');

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
    const [secretMessage, setSecretMessage] = useState('');
    const [secretExpiry, setSecretExpiry] = useState(60); // Minutos por defecto
    const [secretLink, setSecretLink] = useState('');

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

    // --- MOTOR DE AUDITORÍA ZERO-KNOWLEDGE ---
    const runAudit = () => {
        const logins = items.filter(i => i.itemType === 'login');
        let weakCount = 0;
        let reusedCount = 0;
        const passMap = {};
        const vulnerabilities = [];

        logins.forEach(item => {
            const decTitle = decryptData(item.encryptedTitle, masterKey);
            const decPayload = JSON.parse(decryptData(item.encryptedPayload, masterKey));
            const pass = decPayload.password;

            if (!pass) return;

            // 1. Detectar Contraseñas Débiles (Menos de 10 chars o sin números/símbolos)
            const isWeak = pass.length < 10 || !/[0-9]/.test(pass) || !/[!@#$%^&*]/.test(pass);
            if (isWeak) {
                weakCount++;
                vulnerabilities.push({ title: decTitle, issue: 'Contraseña Débil (Baja Entropía)' });
            }

            // 2. Mapear para detectar Reutilizadas
            if (passMap[pass]) {
                passMap[pass].count++;
                passMap[pass].titles.push(decTitle);
            } else {
                passMap[pass] = { count: 1, titles: [decTitle] };
            }
        });

        // 3. Procesar las reutilizadas
        Object.values(passMap).forEach(group => {
            if (group.count > 1) {
                reusedCount += group.count;
                group.titles.forEach(t => {
                    if (!vulnerabilities.find(v => v.title === t && v.issue === 'Contraseña Reutilizada')) {
                        vulnerabilities.push({ title: t, issue: 'Contraseña Reutilizada' });
                    }
                });
            }
        });

        // 4. Calcular Score (0 - 100)
        let score = 100;
        if (logins.length > 0) {
            const penalties = (weakCount * 15) + (reusedCount * 20); // Castigo por cada error
            score = Math.max(0, 100 - (penalties / logins.length));
        } else {
            score = 0;
        }

        return { total: logins.length, weakCount, reusedCount, score: Math.round(score), vulnerabilities };
    };

    // --- MAGIA ZERO-KNOWLEDGE: GENERAR ENLACE EFÍMERO ---
    const handleGenerateSecretLink = async (e) => {
        e.preventDefault();
        if (!secretMessage) return alert("Escribe un secreto primero");

        try {
            // 1. Generar una LLAVE TEMPORAL aleatoria en la RAM (No es tu Master Key)
            const randomArray = new Uint32Array(4);
            window.crypto.getRandomValues(randomArray);
            const temporaryKey = Array.from(randomArray, dec => dec.toString(16)).join('');

            // 2. Encriptar el mensaje con esa llave temporal
            const encryptedMessage = encryptData(secretMessage, temporaryKey);

            // 3. Enviar SOLO el texto cifrado a Java
            const secretId = await secretService.createSecret(encryptedMessage, secretExpiry);

            // 4. Crear el Link Mágico (ID + Hashtag + Llave Temporal)
            const link = `${window.location.origin}/share/${secretId}#${temporaryKey}`;
            setSecretLink(link);
            setSecretMessage(''); // Borramos el texto por seguridad
        } catch (error) {
            alert("Error al generar el link seguro.");
        }
    };

    const copySecretLink = () => {
        navigator.clipboard.writeText(secretLink);
        alert("¡Link copiado! Envíalo por un chat seguro.");
    };

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
                                <span className="item-count">{filteredItems.length} ENTRIES</span>
                            </div>

                            {/* LOS BOTONES DE FILTRO */}
                            <div className="vault-filters">
                                <button className={filterType === 'all' ? 'active' : ''} onClick={() => setFilterType('all')}>Todo</button>
                                <button className={filterType === 'login' ? 'active' : ''} onClick={() => setFilterType('login')}><Key size={12}/> Logins</button>
                                <button className={filterType === 'tarjeta' ? 'active' : ''} onClick={() => setFilterType('tarjeta')}><CreditCard size={12}/> Tarjetas</button>
                                <button className={filterType === 'nota' ? 'active' : ''} onClick={() => setFilterType('nota')}><StickyNote size={12}/> Notas</button>
                            </div>
                            
                            <div className="items-scroll-area">
                                {filteredItems.length === 0 && <p className="empty-msg">No hay datos en esta categoría.</p>}
                                
                                {filteredItems.map(item => {
                                    const decTitle = decryptData(item.encryptedTitle, masterKey);
                                    const decPayloadString = decryptData(item.encryptedPayload, masterKey);
                                    let payload = {};
                                    try { payload = JSON.parse(decPayloadString); } 
                                    catch (e) { payload = { error: "Datos corruptos" }; }

                                    return (
                                        <div key={item.id} className={`vault-item ${item.honeytoken ? 'honeytoken' : ''}`}>
                                            <div className="item-header">
                                                {item.itemType === 'login' && <Key size={16} className="item-icon" />}
                                                {item.itemType === 'tarjeta' && <CreditCard size={16} className="item-icon" />}
                                                {item.itemType === 'nota' && <StickyNote size={16} className="item-icon" />}
                                                <h4>{decTitle}</h4>
                                            </div>
                                            <div className="item-details">
                                                {item.itemType === 'login' && (
                                                    <><p><strong>USR:</strong> {payload.username}</p><p className="blur-text"><strong>KEY:</strong> {payload.password}</p></>
                                                )}
                                                {item.itemType === 'tarjeta' && (
                                                    <><p><strong>NÚM:</strong> {payload.cardNumber}</p><p><strong>VENCE:</strong> {payload.cardExpiry}</p><p className="blur-text"><strong>CVV:</strong> {payload.cardCvv}</p></>
                                                )}
                                                {item.itemType === 'nota' && (
                                                    <p className="blur-text"><strong>TXT:</strong> {payload.noteContent}</p>
                                                )}
                                                {payload.error && <p style={{color: 'red'}}>{payload.error}</p>}
                                            </div>
                                            {item.honeytoken && <span className="badge"><ShieldAlert size={12} style={{marginRight: '4px'}}/> TRAMPA</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            case 'generador': return <div className="tab-content"><PasswordGenerator /></div>;
            case 'auditoria': 
                const auditStats = runAudit();
                return (
                    <div className="tab-content audit-dashboard">
                        <div className="audit-header">
                            <div>
                                <h2 className="icon-heading"><ShieldCheck size={28}/> Auditoría de Entropía</h2>
                                <p>Análisis heurístico local. Ningún dato ha sido enviado al servidor.</p>
                            </div>
                            <div className={`score-badge ${auditStats.score > 80 ? 'good' : auditStats.score > 50 ? 'warning' : 'danger'}`}>
                                <span className="score-value">{auditStats.score}</span>
                                <span className="score-label">Health Score</span>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <h4>Total Logins</h4>
                                <span>{auditStats.total}</span>
                            </div>
                            <div className={`stat-card ${auditStats.weakCount > 0 ? 'danger-text' : ''}`}>
                                <h4>Claves Débiles</h4>
                                <span>{auditStats.weakCount}</span>
                            </div>
                            <div className={`stat-card ${auditStats.reusedCount > 0 ? 'warning-text' : ''}`}>
                                <h4>Reutilizadas</h4>
                                <span>{auditStats.reusedCount}</span>
                            </div>
                        </div>

                        <div className="vulnerabilities-list">
                            <h3>/// VULNERABILIDADES DETECTADAS</h3>
                            {auditStats.vulnerabilities.length === 0 ? (
                                <div className="all-clear">
                                    <CheckCircle size={32} />
                                    <p>Estado Óptimo. No se detectaron vulnerabilidades en tus credenciales.</p>
                                </div>
                            ) : (
                                <div className="vuln-grid">
                                    {auditStats.vulnerabilities.map((vuln, index) => (
                                        <div key={index} className="vuln-item">
                                            {vuln.issue.includes('Débil') ? <XOctagon size={16} className="danger-text"/> : <AlertTriangle size={16} className="warning-text"/>}
                                            <div className="vuln-info">
                                                <strong>{vuln.title}</strong>
                                                <span>{vuln.issue}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
                case 'send': 
                return (
                    <div className="tab-content standalone-form">
                        <h2 className="icon-heading"><Link2 size={28}/> Transmisión Efímera (E2EE)</h2>
                        <p style={{color: '#888', marginBottom: '2rem'}}>Crea un enlace que se autodestruirá al ser leído. El servidor nunca conocerá el contenido.</p>
                        
                        {!secretLink ? (
                            <form onSubmit={handleGenerateSecretLink} className="add-item-card" style={{border: '1px solid #1a1a1a'}}>
                                <textarea 
                                    placeholder="Escribe el texto, contraseña o nota que deseas compartir de forma segura..." 
                                    required rows="6" 
                                    value={secretMessage} 
                                    onChange={e => setSecretMessage(e.target.value)}
                                    style={{width: '100%', padding: '1rem', background: 'transparent', color: 'white', border: '1px solid #333', fontFamily: 'monospace'}}
                                />
                                
                                <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center'}}>
                                    <label style={{color: '#888', fontSize: '0.8rem', textTransform: 'uppercase'}}>Destrucción Automática en:</label>
                                    <select 
                                        value={secretExpiry} 
                                        onChange={e => setSecretExpiry(Number(e.target.value))}
                                        style={{background: '#050505', color: 'white', border: '1px solid #333', padding: '0.5rem'}}
                                    >
                                        <option value={15}>15 Minutos</option>
                                        <option value={60}>1 Hora</option>
                                        <option value={1440}>24 Horas</option>
                                    </select>
                                </div>

                                <button type="submit" style={{width: '100%', marginTop: '2rem', padding: '1rem', background: 'white', color: 'black', fontWeight: 'bold', cursor: 'pointer', border: 'none', textTransform: 'uppercase', letterSpacing: '2px'}}>
                                    Cifrar y Generar Enlace
                                </button>
                            </form>
                        ) : (
                            <div className="add-item-card" style={{border: '1px solid #10b981', textAlign: 'center'}}>
                                <CheckCircle size={48} color="#10b981" style={{marginBottom: '1rem'}} />
                                <h3 style={{marginTop: 0}}>Enlace Generado Exitosamente</h3>
                                <p style={{color: '#888', fontSize: '0.9rem'}}>El secreto ha sido cifrado en tu dispositivo. Quien tenga este enlace podrá abrirlo <strong>una sola vez</strong>.</p>
                                
                                <div style={{background: '#050505', padding: '1rem', border: '1px dashed #10b981', margin: '2rem 0', wordBreak: 'break-all', fontFamily: 'monospace', color: '#10b981'}}>
                                    {secretLink}
                                </div>

                                <button onClick={copySecretLink} className="icon-btn-center" style={{width: '100%', padding: '1rem', background: '#10b981', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}>
                                    <Copy size={18} /> Copiar Enlace Seguro
                                </button>
                                <button onClick={() => setSecretLink('')} style={{background: 'transparent', color: 'white', border: 'none', marginTop: '1rem', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'}}>
                                    Crear otro secreto
                                </button>
                            </div>
                        )}
                    </div>
                );
                case 'radar': 
                const honeytokens = items.filter(i => i.honeytoken);
                return (
                    <div className="tab-content radar-dashboard">
                        <div className="radar-header">
                            <div className="radar-display">
                                <div className="radar-sweep"></div>
                                <div className="radar-center"></div>
                            </div>
                            <div className="radar-info">
                                <h2 className="icon-heading"><Radar size={28}/> Red de Señuelos (Honeytokens)</h2>
                                <p>Monitoreo activo de credenciales trampa. Si un atacante usa estas llaves, se disparará una alerta de intrusión.</p>
                                <div className="sensor-count">
                                    <span className="count-number">{honeytokens.length}</span>
                                    <span className="count-label">SENSORES ACTIVOS</span>
                                </div>
                            </div>
                        </div>

                        <div className="honeytoken-list">
                            <h3>/// CUADRÍCULA DE MONITOREO</h3>
                            {honeytokens.length === 0 ? (
                                <div className="empty-radar">
                                    <ShieldAlert size={32} color="#f59e0b" style={{marginBottom: '1rem'}}/>
                                    <p>No tienes ningún señuelo activo. Activa la casilla "HONEYTOKEN" al crear un nuevo registro para desplegar un sensor.</p>
                                </div>
                            ) : (
                                <div className="sensor-grid">
                                    {honeytokens.map(item => {
                                        const decTitle = decryptData(item.encryptedTitle, masterKey);
                                        return (
                                            <div key={item.id} className="sensor-card">
                                                <div className="sensor-header">
                                                    <div className="status-indicator blinking"></div>
                                                    <h4>{decTitle}</h4>
                                                </div>
                                                <div className="sensor-details">
                                                    <p><strong>ESTADO:</strong> <span style={{color: '#10b981'}}>VIGILANDO</span></p>
                                                    <p><strong>ÚLTIMO PING:</strong> {new Date().toLocaleTimeString()}</p>
                                                    <p><strong>AMENAZAS:</strong> 0 DETECTADAS</p>
                                                </div>
                                                <button className="simulate-btn" onClick={() => alert(`Simulando alerta para ${decTitle}. En producción, esto enviaría un webhook al SOC.`)}>
                                                    Simular Intrusión
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'configuracion': return <div className="tab-content coming-soon"><h2 className="icon-heading"><Settings size={28}/> Configuración</h2><p>Parámetros del sistema y rotación de llaves.</p></div>;
            default: return null;
        }
    };

    // --- LÓGICA DE FILTRADO EN TIEMPO REAL ---
    const filteredItems = items.filter(item => {
        if (filterType === 'all') return true;
        return item.itemType === filterType;
    });

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