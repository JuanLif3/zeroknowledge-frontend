import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vaultService } from '../services/vaultService';
import { secretService } from '../services/secretService';
import { authService } from '../services/authService';
import { initCrypto, encryptData, decryptData } from '../services/cryptoService';
import PasswordGenerator from '../components/PasswordGenerator';
import { Database, KeySquare, ShieldCheck, Link2, Radar, LogOut, PlusSquare, ShieldAlert, Lock, Unlock, CreditCard, StickyNote, Key, AlertTriangle, CheckCircle, XOctagon, Copy, Search, Star, Folder, Edit2, Trash2, Globe, Check } from 'lucide-react';

const Vault = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [intrusions, setIntrusions] = useState([]);
    const [masterKey, setMasterKey] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    
    // NUEVO: La pestaña por defecto ahora es 'almacen'
    const [activeTab, setActiveTab] = useState('almacen');

    const [searchQuery, setSearchQuery] = useState('');
    const [activeSidebarFolder, setActiveSidebarFolder] = useState('all'); 
    const [filterType, setFilterType] = useState('all'); 

    const [isEditingPulse, setIsEditingPulse] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const initialFormState = {
        id: null, title: '', itemType: 'login', isHoneytoken: false,
        username: '', password: '', cardHolder: '', cardNumber: '', cardExpiry: '', cardCvv: '',
        noteContent: '', folder: '', url: '', extraNotes: '', isFavorite: false
    };
    const [formData, setFormData] = useState(initialFormState);
    const [showGenerator, setShowGenerator] = useState(false);

    const [secretMessage, setSecretMessage] = useState('');
    const [secretExpiry, setSecretExpiry] = useState(60);
    const [secretLink, setSecretLink] = useState('');

    useEffect(() => { initCrypto(); fetchVault(); }, []);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const fetchVault = async () => {
        try {
            const data = await vaultService.getMyVault();
            setItems(data);
            const logs = await vaultService.getIntrusions();
            setIntrusions(logs);
        } catch (error) { if (error.response?.status === 403) navigate('/login'); }
    };

    const handleUnlock = (e) => { e.preventDefault(); setIsUnlocked(true); showToast('Bóveda Desencriptada Exitosamente', 'success'); };
    const handleLogout = () => { authService.logout(); navigate('/login'); };

    const processedItems = items.map(item => {
        try {
            const decTitle = decryptData(item.encryptedTitle, masterKey);
            const payload = JSON.parse(decryptData(item.encryptedPayload, masterKey));
            return { ...item, decTitle, payload };
        } catch (e) { return { ...item, decTitle: 'ERROR', payload: { error: 'Datos corruptos' } }; }
    });

    const userFolders = Array.from(new Set(processedItems.map(i => i.payload.folder).filter(f => f && f.trim() !== '')));

    let filteredItems = processedItems.filter(item => {
        if (searchQuery && !item.decTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (activeSidebarFolder !== 'all' && item.payload.folder !== activeSidebarFolder) return false;
        if (filterType !== 'all' && item.itemType !== filterType) return false;
        return true;
    });

    filteredItems.sort((a, b) => {
        if (a.payload.isFavorite === b.payload.isFavorite) return 0;
        return a.payload.isFavorite ? -1 : 1;
    });

    const handleSave = async (e) => {
        e.preventDefault();
        let payloadObj = { folder: formData.folder, url: formData.url, extraNotes: formData.extraNotes, isFavorite: formData.isFavorite };
        if (formData.itemType === 'login') { payloadObj.username = formData.username; payloadObj.password = formData.password; }
        else if (formData.itemType === 'tarjeta') { payloadObj.cardHolder = formData.cardHolder; payloadObj.cardNumber = formData.cardNumber; payloadObj.cardExpiry = formData.cardExpiry; payloadObj.cardCvv = formData.cardCvv; }
        else if (formData.itemType === 'nota') { payloadObj.noteContent = formData.noteContent; }

        const jsonString = JSON.stringify(payloadObj);
        const encTitle = encryptData(formData.title, masterKey);
        const encPayload = encryptData(jsonString, masterKey);

        try {
            if (formData.id) {
                await vaultService.updateVaultItem(formData.id, encTitle, formData.itemType, encPayload, formData.isHoneytoken);
                showToast('Credencial Actualizada Correctamente', 'success');
            } else {
                await vaultService.saveVaultItem(encTitle, formData.itemType, encPayload, formData.isHoneytoken);
                showToast('Nueva Credencial Almacenada', 'success');
            }
            setFormData(initialFormState);
            fetchVault();
            setActiveTab('almacen'); // <--- Redirigir al almacén después de guardar
        } catch (error) { showToast('Error de Cifrado o Guardado', 'error'); }
    };

    const handleEdit = (item) => {
        setFormData({
            id: item.id, title: item.decTitle, itemType: item.itemType, isHoneytoken: item.honeytoken,
            username: item.payload.username || '', password: item.payload.password || '',
            cardHolder: item.payload.cardHolder || '', cardNumber: item.payload.cardNumber || '', cardExpiry: item.payload.cardExpiry || '', cardCvv: item.payload.cardCvv || '',
            noteContent: item.payload.noteContent || '', folder: item.payload.folder || '', url: item.payload.url || '', extraNotes: item.payload.extraNotes || '', isFavorite: item.payload.isFavorite || false
        });
        setActiveTab('crear'); // <--- Cambiar a la pestaña de crear/editar
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsEditingPulse(true);
        setTimeout(() => setIsEditingPulse(false), 1200);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await vaultService.deleteVaultItem(deleteConfirmId);
            if (formData.id === deleteConfirmId) setFormData(initialFormState);
            fetchVault();
            showToast('Registro Purgado del Sistema', 'info');
        } catch (error) { showToast('Error al eliminar', 'error'); }
        setDeleteConfirmId(null);
    };

    const toggleFavoriteFast = async (item) => {
        const newPayload = { ...item.payload, isFavorite: !item.payload.isFavorite };
        const encTitle = encryptData(item.decTitle, masterKey);
        const encPayload = encryptData(JSON.stringify(newPayload), masterKey);
        try {
            await vaultService.updateVaultItem(item.id, encTitle, item.itemType, encPayload, item.honeytoken);
            fetchVault();
            showToast(newPayload.isFavorite ? 'Agregado a Favoritos' : 'Removido de Favoritos', 'success');
        } catch (e) { showToast('Error al actualizar favorito', 'error'); }
    };

    // --- FUNCIONES SECUNDARIAS (Auditoria, Send, Radar) ---
    const runAudit = () => {
        const logins = processedItems.filter(i => i.itemType === 'login' && !i.payload.error);
        let weakCount = 0; let reusedCount = 0; const passMap = {}; const vulnerabilities = [];
        logins.forEach(item => {
            const pass = item.payload.password;
            if (!pass) return;
            const isWeak = pass.length < 10 || !/[0-9]/.test(pass) || !/[!@#$%^&*]/.test(pass);
            if (isWeak) { weakCount++; vulnerabilities.push({ title: item.decTitle, issue: 'Contraseña Débil (Baja Entropía)' }); }
            if (passMap[pass]) { passMap[pass].count++; passMap[pass].titles.push(item.decTitle); } else { passMap[pass] = { count: 1, titles: [item.decTitle] }; }
        });
        Object.values(passMap).forEach(group => {
            if (group.count > 1) {
                reusedCount += group.count;
                group.titles.forEach(t => {
                    if (!vulnerabilities.find(v => v.title === t && v.issue === 'Contraseña Reutilizada')) { vulnerabilities.push({ title: t, issue: 'Contraseña Reutilizada' }); }
                });
            }
        });
        let score = 100;
        if (logins.length > 0) { const penalties = (weakCount * 15) + (reusedCount * 20); score = Math.max(0, 100 - (penalties / logins.length)); } else { score = 0; }
        return { total: logins.length, weakCount, reusedCount, score: Math.round(score), vulnerabilities };
    };

    const handleGenerateSecretLink = async (e) => {
        e.preventDefault();
        if (!secretMessage) return showToast("Escribe un secreto primero", "error");
        try {
            const randomArray = new Uint32Array(4); window.crypto.getRandomValues(randomArray);
            const temporaryKey = Array.from(randomArray, dec => dec.toString(16)).join('');
            const encryptedMessage = encryptData(secretMessage, temporaryKey);
            const secretId = await secretService.createSecret(encryptedMessage, secretExpiry);
            const link = `${window.location.origin}/share/${secretId}#${temporaryKey}`;
            setSecretLink(link); setSecretMessage(''); showToast("Enlace Cifrado Generado", "success");
        } catch (error) { showToast("Error al generar el link seguro.", "error"); }
    };
    const copySecretLink = () => { navigator.clipboard.writeText(secretLink); showToast("¡Link copiado al portapapeles!", "success"); };

    const handleSimulateIntrusion = async (itemId) => {
        try { await vaultService.triggerIntrusion(itemId); const updatedLogs = await vaultService.getIntrusions(); setIntrusions(updatedLogs); } catch (error) { console.error("Error disparando la trampa", error); }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'almacen':
                return (
                    <div className="tab-content almacen-layout">
                        <div className="search-bar" style={{marginBottom: '2rem', position: 'relative'}}>
                            <Search size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888'}}/>
                            <input type="text" placeholder="Buscar credencial en almacén..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#050505', border: '1px solid #1a1a1a', color: 'white', fontFamily: 'monospace'}} />
                        </div>

                        <div className="vault-filters" style={{marginBottom: '2rem'}}>
                            <button className={filterType === 'all' ? 'active' : ''} onClick={() => setFilterType('all')}>Todo</button>
                            <button className={filterType === 'login' ? 'active' : ''} onClick={() => setFilterType('login')}><Key size={12}/> Logins</button>
                            <button className={filterType === 'tarjeta' ? 'active' : ''} onClick={() => setFilterType('tarjeta')}><CreditCard size={12}/> Tarjetas</button>
                            <button className={filterType === 'nota' ? 'active' : ''} onClick={() => setFilterType('nota')}><StickyNote size={12}/> Notas</button>
                        </div>
                        
                        <div className="items-scroll-area list-view">
                            {filteredItems.length === 0 && <p className="empty-msg">No se encontraron resultados en el almacén.</p>}
                            
                            {filteredItems.map(item => (
                                <div key={item.id} className={`vault-item horizontal-row ${item.honeytoken ? 'honeytoken' : ''}`}>
                                    <div className="item-header" style={{display: 'flex', alignItems: 'center', gap: '0.7rem'}}>
                                        {item.itemType === 'login' && <Key size={16} className="item-icon" />}
                                        {item.itemType === 'tarjeta' && <CreditCard size={16} className="item-icon" />}
                                        {item.itemType === 'nota' && <StickyNote size={16} className="item-icon" />}
                                        <h4 style={{margin: 0}}>{item.decTitle}</h4>
                                        {item.payload.isFavorite && <Star size={14} fill="#f59e0b" color="#f59e0b" style={{marginLeft: '5px'}}/>}
                                    </div>

                                    <div className="item-details">
                                        {item.itemType === 'login' && (<><p><strong>USR:</strong> {item.payload.username}</p><p className="blur-text"><strong>KEY:</strong> {item.payload.password}</p></>)}
                                        {item.itemType === 'tarjeta' && (<><p><strong>NÚM:</strong> {item.payload.cardNumber}</p><p className="blur-text"><strong>CVV:</strong> {item.payload.cardCvv}</p></>)}
                                        {item.itemType === 'nota' && (<p className="blur-text"><strong>TXT:</strong> {item.payload.noteContent.substring(0,20)}...</p>)}
                                        {item.payload.folder && <p style={{color: '#888', fontSize: '0.75rem', textTransform: 'uppercase'}}><Folder size={12}/> {item.payload.folder}</p>}
                                    </div>

                                    <div className="item-actions-bottom">
                                        <button className={`btn-fav ${item.payload.isFavorite ? 'is-fav' : ''}`} onClick={() => toggleFavoriteFast(item)}><Star size={14}/> Fav</button>
                                        <button className="btn-edit" onClick={() => handleEdit(item)}><Edit2 size={14}/> Editar</button>
                                        <button className="btn-del" onClick={() => setDeleteConfirmId(item.id)}><Trash2 size={14}/> Purga</button>
                                    </div>

                                    {item.honeytoken && <span className="badge"><ShieldAlert size={12} style={{marginRight: '4px'}}/> TRAMPA</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'crear':
                return (
                    <div className="tab-content crear-layout">
                        <div className={`add-item-card ${isEditingPulse ? 'pulse-edit' : ''}`}>
                            <h3 className="icon-heading" style={{ color: formData.id ? '#f59e0b' : 'white' }}>
                                {formData.id ? <><Edit2 size={18}/> Editar Credencial</> : <><PlusSquare size={18} /> Nueva Credencial</>}
                            </h3>
                            
                            <div className="type-selector">
                                <button type="button" className={formData.itemType === 'login' ? 'active' : ''} onClick={() => setFormData({...formData, itemType: 'login'})}><Key size={16} /> Login</button>
                                <button type="button" className={formData.itemType === 'tarjeta' ? 'active' : ''} onClick={() => setFormData({...formData, itemType: 'tarjeta'})}><CreditCard size={16} /> Tarjeta</button>
                                <button type="button" className={formData.itemType === 'nota' ? 'active' : ''} onClick={() => setFormData({...formData, itemType: 'nota'})}><StickyNote size={16} /> Nota</button>
                            </div>

                            <form onSubmit={handleSave}>
                                <input type="text" placeholder="TÍTULO (Ej: Netflix, Visa)" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                <input type="text" list="user-folders" placeholder="CARPETA (Crea una o elige de la lista)" value={formData.folder} onChange={e => setFormData({...formData, folder: e.target.value})} />
                                <datalist id="user-folders">{userFolders.map(f => <option key={f} value={f} />)}</datalist>

                                {formData.itemType !== 'nota' && <input type="text" placeholder="URL VINCULADA (Ej: https://...)" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />}

                                {formData.itemType === 'login' && (
                                    <>
                                        <input type="text" placeholder="USUARIO / EMAIL" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                                        <div className="password-input-group">
                                            <input type="text" placeholder="CONTRASEÑA" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                            <button type="button" className="toggle-gen-btn" onClick={() => setShowGenerator(!showGenerator)}>{showGenerator ? 'Cerrar' : 'Generar'}</button>
                                        </div>
                                        {showGenerator && <div style={{marginTop: '-1rem', marginBottom: '1rem'}}><PasswordGenerator onPasswordGenerated={(newPass) => { setFormData({...formData, password: newPass}); setShowGenerator(false); }} /></div>}
                                    </>
                                )}

                                {formData.itemType === 'tarjeta' && (
                                    <>
                                        <input type="text" placeholder="TITULAR" required value={formData.cardHolder} onChange={e => setFormData({...formData, cardHolder: e.target.value})} />
                                        <input type="text" placeholder="NÚMERO DE TARJETA" required value={formData.cardNumber} onChange={e => setFormData({...formData, cardNumber: e.target.value})} />
                                        <div className="split-inputs">
                                            <input type="text" placeholder="MM/YY" required value={formData.cardExpiry} onChange={e => setFormData({...formData, cardExpiry: e.target.value})} />
                                            <input type="password" placeholder="CVV" required value={formData.cardCvv} onChange={e => setFormData({...formData, cardCvv: e.target.value})} />
                                        </div>
                                    </>
                                )}

                                {formData.itemType === 'nota' ? (
                                    <textarea placeholder="ESCRIBE TU NOTA AQUÍ..." required rows="6" value={formData.noteContent} onChange={e => setFormData({...formData, noteContent: e.target.value})}></textarea>
                                ) : (
                                    <textarea placeholder="NOTAS ADICIONALES (Opcional)..." rows="3" value={formData.extraNotes} onChange={e => setFormData({...formData, extraNotes: e.target.value})}></textarea>
                                )}

                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                                    <label className="honeytoken-label" style={{margin: 0}}><input type="checkbox" checked={formData.isHoneytoken} onChange={e => setFormData({...formData, isHoneytoken: e.target.checked})} /> <ShieldAlert size={14} /> HONEYTOKEN</label>
                                    <label style={{color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px'}}><input type="checkbox" checked={formData.isFavorite} onChange={e => setFormData({...formData, isFavorite: e.target.checked})} /> <Star size={14} fill={formData.isFavorite ? '#f59e0b' : 'none'}/> FAVORITO</label>
                                </div>

                                <div style={{display: 'flex', gap: '1rem'}}>
                                    {formData.id && <button type="button" onClick={() => {setFormData(initialFormState); setActiveTab('almacen');}} style={{flex: 1, background: 'transparent', color: 'white', border: '1px solid #333'}}>Cancelar</button>}
                                    <button type="submit" style={{flex: 2, background: formData.id ? '#f59e0b' : 'white', borderColor: formData.id ? '#f59e0b' : 'white', color: 'black'}}>{formData.id ? 'Guardar Cambios' : 'Cifrar y Almacenar'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            // ... AQUÍ VAN generador, auditoria, send y radar exactamente como estaban ...
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
                            <div className="stat-card"><h4>Total Logins</h4><span>{auditStats.total}</span></div>
                            <div className={`stat-card ${auditStats.weakCount > 0 ? 'danger-text' : ''}`}><h4>Claves Débiles</h4><span>{auditStats.weakCount}</span></div>
                            <div className={`stat-card ${auditStats.reusedCount > 0 ? 'warning-text' : ''}`}><h4>Reutilizadas</h4><span>{auditStats.reusedCount}</span></div>
                        </div>
                        <div className="vulnerabilities-list">
                            <h3>/// VULNERABILIDADES DETECTADAS</h3>
                            {auditStats.vulnerabilities.length === 0 ? (
                                <div className="all-clear"><CheckCircle size={32} /><p>Estado Óptimo. No se detectaron vulnerabilidades en tus credenciales.</p></div>
                            ) : (
                                <div className="vuln-grid">
                                    {auditStats.vulnerabilities.map((vuln, index) => (
                                        <div key={index} className="vuln-item">
                                            {vuln.issue.includes('Débil') ? <XOctagon size={16} className="danger-text"/> : <AlertTriangle size={16} className="warning-text"/>}
                                            <div className="vuln-info"><strong>{vuln.title}</strong><span>{vuln.issue}</span></div>
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
                                <textarea placeholder="Escribe el texto o contraseña..." required rows="6" value={secretMessage} onChange={e => setSecretMessage(e.target.value)} style={{width: '100%', padding: '1rem', background: 'transparent', color: 'white', border: '1px solid #333', fontFamily: 'monospace'}} />
                                <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center'}}>
                                    <label style={{color: '#888', fontSize: '0.8rem', textTransform: 'uppercase'}}>Destrucción en:</label>
                                    <select value={secretExpiry} onChange={e => setSecretExpiry(Number(e.target.value))} style={{background: '#050505', color: 'white', border: '1px solid #333', padding: '0.5rem'}}>
                                        <option value={15}>15 Minutos</option>
                                        <option value={60}>1 Hora</option>
                                        <option value={1440}>24 Horas</option>
                                    </select>
                                </div>
                                <button type="submit" style={{width: '100%', marginTop: '2rem', padding: '1rem', background: 'white', color: 'black', fontWeight: 'bold', cursor: 'pointer', border: 'none', textTransform: 'uppercase', letterSpacing: '2px'}}>Cifrar y Generar Enlace</button>
                            </form>
                        ) : (
                            <div className="add-item-card" style={{border: '1px solid #10b981', textAlign: 'center'}}>
                                <CheckCircle size={48} color="#10b981" style={{marginBottom: '1rem'}} />
                                <h3 style={{marginTop: 0}}>Enlace Generado</h3>
                                <div style={{background: '#050505', padding: '1rem', border: '1px dashed #10b981', margin: '2rem 0', wordBreak: 'break-all', fontFamily: 'monospace', color: '#10b981'}}>{secretLink}</div>
                                <button onClick={copySecretLink} className="icon-btn-center" style={{width: '100%', padding: '1rem', background: '#10b981', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}><Copy size={18} /> Copiar Enlace Seguro</button>
                                <button onClick={() => setSecretLink('')} style={{background: 'transparent', color: 'white', border: 'none', marginTop: '1rem', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'}}>Crear otro secreto</button>
                            </div>
                        )}
                    </div>
                );
            case 'radar': 
                const honeytokens = processedItems.filter(i => i.honeytoken);
                const isUnderAttack = intrusions.length > 0;
                return (
                    <div className={`tab-content radar-dashboard ${isUnderAttack ? 'under-attack' : ''}`}>
                        <div className="radar-header">
                            <div className="radar-display"><div className="radar-sweep"></div><div className="radar-center"></div></div>
                            <div className="radar-info">
                                <h2 className="icon-heading"><Radar size={28} className={isUnderAttack ? 'pulse-red' : ''}/> {isUnderAttack ? '¡INTRUSIÓN DETECTADA!' : 'Red de Señuelos (Honeytokens)'}</h2>
                                <p>{isUnderAttack ? 'ALERTA: Se han detectado accesos no autorizados usando credenciales señuelo.' : 'Monitoreo activo de credenciales trampa. Todo despejado.'}</p>
                                <div className="sensor-count"><span className="count-number">{honeytokens.length}</span><span className="count-label">SENSORES ACTIVOS</span></div>
                            </div>
                        </div>
                        {isUnderAttack && (
                            <div className="alerts-panel" style={{marginBottom: '3rem', border: '1px solid #ef4444', padding: '2rem', background: 'rgba(239, 68, 68, 0.05)'}}>
                                <h3 style={{color: '#ef4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}><AlertTriangle size={20}/> REGISTRO DE AMENAZAS</h3>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#ffb3b3'}}>
                                    {intrusions.map((log, i) => (
                                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '0.5rem'}}>
                                            <span>[SEÑUELO ID: {log.vaultItemId}]</span>
                                            <span>IP ORIGEN: {log.ipAddress}</span>
                                            <span>{new Date(Array.isArray(log.attemptedAt) ? Date.UTC(log.attemptedAt[0], log.attemptedAt[1]-1, log.attemptedAt[2], log.attemptedAt[3], log.attemptedAt[4], log.attemptedAt[5]) : log.attemptedAt).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="honeytoken-list">
                            <h3>/// CUADRÍCULA DE MONITOREO</h3>
                            <div className="sensor-grid">
                                {honeytokens.map(item => {
                                    const attacksOnThis = intrusions.filter(log => log.vaultItemId === item.id).length;
                                    const compromised = attacksOnThis > 0;
                                    return (
                                        <div key={item.id} className="sensor-card" style={compromised ? {borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.02)'} : {}}>
                                            <div className="sensor-header" style={compromised ? {borderBottomColor: '#ef4444'} : {}}>
                                                <div className={`status-indicator ${compromised ? 'pulse-red' : 'blinking'}`} style={compromised ? {background: '#ef4444', boxShadow: '0 0 10px #ef4444'} : {}}></div>
                                                <h4 style={compromised ? {color: '#ef4444'} : {}}>{item.decTitle}</h4>
                                            </div>
                                            <div className="sensor-details">
                                                <p><strong>ESTADO:</strong> <span style={{color: compromised ? '#ef4444' : '#10b981'}}>{compromised ? 'COMPROMETIDO' : 'VIGILANDO'}</span></p>
                                                <p><strong>AMENAZAS:</strong> <span style={compromised ? {color: '#ef4444', fontWeight: 'bold'} : {}}>{attacksOnThis} DETECTADAS</span></p>
                                            </div>
                                            <button className="simulate-btn" onClick={() => handleSimulateIntrusion(item.id)} style={compromised ? {borderColor: '#ef4444', color: '#ef4444'} : {}}>
                                                Simular Intrusión
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="dashboard-layout">
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        {t.type === 'success' && <CheckCircle size={16} color="#10b981"/>}
                        {t.type === 'error' && <XOctagon size={16} color="#ef4444"/>}
                        {t.type === 'info' && <Check size={16} color="#3b82f6"/>}
                        {t.message}
                    </div>
                ))}
            </div>

            {deleteConfirmId && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <AlertTriangle size={48} color="#ef4444" style={{marginBottom: '1rem'}}/>
                        <h3>Protocolo de Purga</h3>
                        <p>¿Estás seguro de que deseas eliminar este registro de la base de datos cifrada? Esta acción es irreversible.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Abortar</button>
                            <button className="btn-danger" onClick={executeDelete}>Confirmar Purga</button>
                        </div>
                    </div>
                </div>
            )}

            {!isUnlocked ? (
                <div className="unlock-overlay"><form onSubmit={handleUnlock} className="unlock-box"><Lock size={48} color="#fff" strokeWidth={1} style={{marginBottom: '1rem'}} /><h2>ZK-Vault</h2><p>Bóveda sellada. Requiere autenticación local.</p><input type="password" required value={masterKey} onChange={(e) => setMasterKey(e.target.value)} placeholder="Master Key" /><button type="submit" className="icon-btn-center"><Unlock size={18}/> Desencriptar</button></form></div>
            ) : (
                <>
                    <aside className="sidebar">
                        <div className="brand"><h2>ZK-Vault</h2><span className="status">Conexión Segura</span></div>
                        <div className="nav-group">
                            <span className="nav-label">/// MI BÓVEDA</span>
                            <nav>
                                <button className={activeTab === 'almacen' && activeSidebarFolder === 'all' ? 'active icon-btn' : 'icon-btn'} onClick={() => {setActiveTab('almacen'); setActiveSidebarFolder('all');}}><Database size={18} /> Almacén</button>
                                <button className={activeTab === 'crear' ? 'active icon-btn' : 'icon-btn'} onClick={() => {setActiveTab('crear'); setFormData(initialFormState);}}><PlusSquare size={18} /> Crear Credencial</button>
                            </nav>
                        </div>
                        {userFolders.length > 0 && (
                            <div className="nav-group">
                                <span className="nav-label">/// CARPETAS</span>
                                <nav>
                                    {userFolders.map(folder => (
                                        <button key={folder} className={activeTab === 'almacen' && activeSidebarFolder === folder ? 'active icon-btn' : 'icon-btn'} onClick={() => {setActiveTab('almacen'); setActiveSidebarFolder(folder);}}>
                                            <Folder size={18} /> {folder}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        )}
                        <div className="nav-group">
                            <span className="nav-label">/// ZERO_KNOWLEDGE</span>
                            <nav>
                                <button className={activeTab === 'generador' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('generador')}><KeySquare size={18} /> Motor CSPRNG</button>
                                <button className={activeTab === 'auditoria' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('auditoria')}><ShieldCheck size={18} /> Auditoría Local</button>
                                <button className={activeTab === 'send' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('send')}><Link2 size={18} /> Envío Efímero</button>
                                <button className={activeTab === 'radar' ? 'active icon-btn' : 'icon-btn'} onClick={() => setActiveTab('radar')}><Radar size={18} /> Radar Honeytoken</button>
                            </nav>
                        </div>
                        <button className="logout-sidebar-btn icon-btn-center" onClick={handleLogout}><LogOut size={16} /> Finalizar Sesión</button>
                    </aside>
                    <main className="main-content">{renderContent()}</main>
                </>
            )}
        </div>
    );
};

export default Vault;