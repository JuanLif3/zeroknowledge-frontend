import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { vaultService } from '../services/vaultService';
import { secretService } from '../services/secretService';
import { authService } from '../services/authService';
import { initCrypto, encryptData, decryptData, unwrapMasterKey } from '../services/cryptoService';
import PasswordGenerator from '../components/PasswordGenerator';
import { Database, KeySquare, ShieldCheck, Link2, Radar, LogOut, PlusSquare, ShieldAlert, Lock, Unlock, CreditCard, StickyNote, Key, AlertTriangle, CheckCircle, XOctagon, Copy, Search, Star, Folder, Edit2, Trash2, Globe, Check, X, FolderPlus, FolderEdit, Save, Menu, Download } from 'lucide-react';

const Vault = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [intrusions, setIntrusions] = useState([]);
    const [masterKey, setMasterKey] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [activeTab, setActiveTab] = useState('almacen');
    const [processedItems, setProcessedItems] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeSidebarFolder, setActiveSidebarFolder] = useState('all'); 
    const [filterType, setFilterType] = useState('all'); 

    const [isEditingPulse, setIsEditingPulse] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    
    // NUEVOS ESTADOS UX
    const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
    const [showFolderManager, setShowFolderManager] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolder, setEditingFolder] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);

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
    const [holdToReveal, setHoldToReveal] = useState(false);

    const [qrCode, setQrCode] = useState(null); // Guardará la imagen del QR
    const [twoFactorCode, setTwoFactorCode] = useState(''); // Guardará lo que escriba el usuario
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    const [userEmail] = useState(localStorage.getItem('vault_user_email') || '');
    const [userSalt] = useState(localStorage.getItem('vault_user_salt') || '');
    const [showReauthModal, setShowReauthModal] = useState(false);
    const [reauthPassword, setReauthPassword] = useState('');

    useEffect(() => { initCrypto(); fetchVault(); }, []);

    // SINCRONIZACIÓN DE ESTADO DE SEGURIDAD
    useEffect(() => {
        // Apenas la bóveda se desbloquee, preguntamos al servidor el estado real
        if (isUnlocked) {
            authService.get2FAStatus()
                .then(isEnabled => setIs2FAEnabled(isEnabled))
                .catch(err => console.error("Error consultando seguridad:", err));
        }
    }, [isUnlocked]); // Se dispara cada vez que entras a la bóveda

    // SONAR DEL RADAR (BÚSQUEDA EN TIEMPO REAL)
    useEffect(() => {
        // Solo encendemos el radar si la bóveda está abierta
        if (!isUnlocked) return; 

        const radarSweep = setInterval(async () => {
            try {
                const logs = await vaultService.getIntrusions();
                
                setIntrusions(prevLogs => {
                    // Si el servidor encontró MÁS intrusiones de las que ya teníamos en pantalla...
                    if (logs.length > prevLogs.length) {
                        // ¡Hacemos saltar la alarma visual y sonora!
                        showToast('⚠️ ALERTA: NUEVA INTRUSIÓN DETECTADA EN EL RADAR', 'error');
                        return logs; // Actualizamos el estado para que la pantalla se ponga roja
                    }
                    return prevLogs; // Si está todo tranquilo, no cambiamos nada
                });
            } catch (error) {
                console.error("Interferencia en el radar:", error);
            }
        }, 5000); // 5000 milisegundos = Hace un escaneo cada 5 segundos

        // Apagamos el radar si el usuario cierra sesión o sale del componente
        return () => clearInterval(radarSweep); 
    }, [isUnlocked]);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} copiado al portapapeles`, 'info');
    };

    const handleNavClick = (tab, folder = null) => {
        setActiveTab(tab);
        if (folder) {
            setActiveSidebarFolder(folder);
        } else if (tab === 'almacen') {
            setActiveSidebarFolder('all');
        }
        setIsMobileMenuOpen(false); // Cierra el menú en móviles

        // Si entra a la pestaña de configuración, revisamos su estado
        if (tab === 'configuracion') {
            authService.get2FAStatus()
                .then(isEnabled => setIs2FAEnabled(isEnabled))
                .catch(() => console.log("Error al consultar estado 2FA"));
        }
    };

    const fetchVault = async () => {
        try {
            const data = await vaultService.getMyVault();
            setItems(data);
            const logs = await vaultService.getIntrusions();
            setIntrusions(logs);
        } catch (error) { if (error.response?.status === 403) navigate('/login'); }
    };

    const handleUnlock = async (e) => {
        e.preventDefault();
        
        // Buscamos la caja fuerte que Java nos mandó en el Login
        const encryptedDek = localStorage.getItem('vault_encrypted_dek');
        
        // Intentamos abrir la caja con la Contraseña que el usuario acaba de escribir
        // ¡OJO! Si el usuario olvidó la contraseña, aquí Mismo podría pegar sus 24 palabras y se abriría igual.
        const dek = await unwrapMasterKey(encryptedDek, masterKey, userSalt); // masterKey aquí es el input del form

        if (!dek) {
            showToast("Contraseña incorrecta. Acceso denegado.", "error");
            return;
        }

        // Si se abrió, la variable masterKey del estado ahora guardará la Llave Invisible Pura
        setMasterKey(dek);
        setIsUnlocked(true);
        showToast('Bóveda Desencriptada Exitosamente', 'success');
    };

    const handleLogout = async () => {
        try {
            // 1. Matamos la cookie en el servidor
            await authService.logout();
        } catch (error) {
            console.error("Error al cerrar sesión en el servidor", error);
        } finally {
            // 2. Limpiamos cualquier rastro en el navegador y redirigimos
            setMasterKey('');
            setIsUnlocked(false);
            window.location.href = '/login'; 
        }
    };
    

    // ==========================================
    // MOTOR DE DESCIFRADO ASÍNCRONO (AES-GCM)
    // ==========================================
    useEffect(() => {
        if (!isUnlocked || !masterKey) {
            setProcessedItems([]);
            return;
        }

        const decryptVault = async () => {
            // Desciframos todas las credenciales en paralelo de forma asíncrona
            const decrypted = await Promise.all(items.map(async (item) => {
                try {
                    const decTitle = await decryptData(item.encryptedTitle, masterKey);
                    const decPayloadStr = await decryptData(item.encryptedPayload, masterKey);
                    
                    if (decTitle === "/// ACCESO DENEGADO ///" || decPayloadStr === "/// ACCESO DENEGADO ///") {
                        return { ...item, decTitle: 'CORRUPTO / LLAVE INVÁLIDA', payload: { error: true, folder: '' } };
                    }

                    return { ...item, decTitle, payload: JSON.parse(decPayloadStr) };
                } catch (e) {
                    return { ...item, decTitle: 'ERROR DE LECTURA', payload: { error: true, folder: '' } };
                }
            }));
            
            setProcessedItems(decrypted);
        };

        decryptVault();
    }, [items, masterKey, isUnlocked]);

    useEffect(() => {
        const handleSessionExpired = () => {
            if (isUnlocked) setShowReauthModal(true);
        };
        window.addEventListener('session_expired', handleSessionExpired);
        return () => window.removeEventListener('session_expired', handleSessionExpired);
    }, [isUnlocked]);

    // GESTIÓN AVANZADA DE CARPETAS (Zero Knowledge)
    const prefsItem = processedItems.find(i => i.itemType === 'system_prefs');
    const customFolders = prefsItem?.payload?.folders || [];
    const usedFolders = processedItems.filter(i => i.itemType !== 'system_prefs' && i.payload.folder).map(i => i.payload.folder);
    const allFolders = Array.from(new Set([...customFolders, ...usedFolders]))
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    const saveSystemPrefs = async (foldersArray) => {
        const payload = JSON.stringify({ folders: foldersArray });
        const encTitle = encryptData('SYSTEM_PREFS', masterKey);
        const encPayload = encryptData(payload, masterKey);
        if (prefsItem) {
            await vaultService.updateVaultItem(prefsItem.id, encTitle, 'system_prefs', encPayload, false);
        } else {
            await vaultService.saveVaultItem(encTitle, 'system_prefs', encPayload, false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        const fName = newFolderName.trim();
        if (!fName) return;
        if (allFolders.includes(fName)) return showToast('La carpeta ya existe', 'error');
        await saveSystemPrefs([...customFolders, fName]);
        setNewFolderName(''); fetchVault(); showToast('Carpeta creada', 'success');
    };

    const handleDeleteFolder = async (folderName) => {
        if (!window.confirm(`¿Eliminar carpeta "${folderName}"? Las credenciales no se borrarán.`)) return;
        const updatedFolders = customFolders.filter(f => f !== folderName);
        await saveSystemPrefs(updatedFolders);
        // Quitar la carpeta de los items existentes
        const itemsToUpdate = processedItems.filter(i => i.itemType !== 'system_prefs' && i.payload.folder === folderName);
        await Promise.all(itemsToUpdate.map(item => {
            const encTitle = encryptData(item.decTitle, masterKey);
            const encPayload = encryptData(JSON.stringify({ ...item.payload, folder: '' }), masterKey);
            return vaultService.updateVaultItem(item.id, encTitle, item.itemType, encPayload, item.honeytoken);
        }));
        fetchVault(); showToast('Carpeta eliminada', 'info');
        if (activeSidebarFolder === folderName) setActiveSidebarFolder('all');
    };

    const handleRenameFolderSubmit = async (e) => {
        e.preventDefault();
        const oldName = editingFolder.oldName; const newName = editingFolder.newName.trim();
        if (!newName || newName === oldName) return setEditingFolder(null);

        let updatedFolders = customFolders.map(f => f === oldName ? newName : f);
        if (!customFolders.includes(oldName)) updatedFolders.push(newName);
        await saveSystemPrefs(updatedFolders);

        const itemsToUpdate = processedItems.filter(i => i.itemType !== 'system_prefs' && i.payload.folder === oldName);
        await Promise.all(itemsToUpdate.map(item => {
            const encTitle = encryptData(item.decTitle, masterKey);
            const encPayload = encryptData(JSON.stringify({ ...item.payload, folder: newName }), masterKey);
            return vaultService.updateVaultItem(item.id, encTitle, item.itemType, encPayload, item.honeytoken);
        }));

        setEditingFolder(null); fetchVault(); showToast('Carpeta renombrada', 'success');
        if (activeSidebarFolder === oldName) setActiveSidebarFolder(newName);
    };

    // FILTRADO DE ALMACÉN
    let filteredItems = processedItems.filter(item => {
        if (item.itemType === 'system_prefs') return false; // Ocultamos el archivo de configuración
        if (searchQuery && !item.decTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (activeSidebarFolder !== 'all' && item.payload.folder !== activeSidebarFolder) return false;
        if (filterType !== 'all' && item.itemType !== filterType) return false;
        return true;
    });

    filteredItems.sort((a, b) => (a.payload.isFavorite === b.payload.isFavorite) ? 0 : (a.payload.isFavorite ? -1 : 1));

    const handleSave = async (e) => {
        e.preventDefault();
        let payloadObj = { folder: formData.folder, url: formData.url, extraNotes: formData.extraNotes, isFavorite: formData.isFavorite };
        if (formData.itemType === 'login') { payloadObj.username = formData.username; payloadObj.password = formData.password; }
        else if (formData.itemType === 'tarjeta') { payloadObj.cardHolder = formData.cardHolder; payloadObj.cardNumber = formData.cardNumber; payloadObj.cardExpiry = formData.cardExpiry; payloadObj.cardCvv = formData.cardCvv; }
        else if (formData.itemType === 'nota') { payloadObj.noteContent = formData.noteContent; }

        const jsonString = JSON.stringify(payloadObj);
        
        // 👇 ¡AQUÍ ESTÁ EL CAMBIO VITAL! Faltaba el "await" 👇
        const encTitle = await encryptData(formData.title, masterKey);
        const encPayload = await encryptData(jsonString, masterKey);

        try {
            if (formData.id) {
                await vaultService.updateVaultItem(formData.id, encTitle, formData.itemType, encPayload, formData.isHoneytoken);
                showToast('Credencial Actualizada Correctamente', 'success');
            } else {
                await vaultService.saveVaultItem(encTitle, formData.itemType, encPayload, formData.isHoneytoken);
                showToast('Nueva Credencial Almacenada', 'success');
            }
            setFormData(initialFormState); fetchVault(); setActiveTab('almacen');
        } catch (error) { showToast('Error de Cifrado o Guardado', 'error'); }
    };

    // Abre el recuadro de opciones
    const triggerExport = () => {
        setShowExportModal(true);
    };

    // Exportación Segura (Backup)
    const handleExportEncrypted = () => {
        // CORRECCIÓN: Usamos 'items' en lugar de 'vaultItems'
        const encryptedData = items.map(item => ({
            id: item.id,
            type: item.itemType,
            title: item.encryptedTitle,
            payload: item.encryptedPayload,
            createdAt: item.createdAt
        }));

        const blob = new Blob([JSON.stringify(encryptedData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ZKVault_Encrypted_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        setShowExportModal(false);
        // showToast("Backup Cifrado descargado con éxito.", "success"); 
    };

    // Exportación Peligrosa (Para migrar a otra app)
    const handleExportPlainText = async () => {
        if (!window.confirm("⚠️ ADVERTENCIA ROJA: Estás a punto de descargar todas tus contraseñas legibles y sin protección. Cualquier persona o virus con acceso a este archivo podrá robar tu identidad. ¿Estás absolutamente seguro?")) {
            return;
        }

        try {
            const decryptedData = [];
            // CORRECCIÓN: Usamos 'items' en lugar de 'vaultItems'
            for (const item of items) { 
                const title = await decryptData(item.encryptedTitle, masterKey);
                const payload = await decryptData(item.encryptedPayload, masterKey);
                decryptedData.push({
                    type: item.itemType,
                    title: title,
                    data: JSON.parse(payload)
                });
            }

            const blob = new Blob([JSON.stringify(decryptedData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ZKVault_Exposed_DANGER_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            setShowExportModal(false);
        } catch (err) {
            console.error("Error exportando:", err);
            alert("Hubo un error al exportar los datos. Verifica tu conexión.");
        }
    };

    const handleEdit = (item) => {
        setFormData({
            id: item.id, title: item.decTitle, itemType: item.itemType, isHoneytoken: item.honeytoken,
            username: item.payload.username || '', password: item.payload.password || '',
            cardHolder: item.payload.cardHolder || '', cardNumber: item.payload.cardNumber || '', cardExpiry: item.payload.cardExpiry || '', cardCvv: item.payload.cardCvv || '',
            noteContent: item.payload.noteContent || '', folder: item.payload.folder || '', url: item.payload.url || '', extraNotes: item.payload.extraNotes || '', isFavorite: item.payload.isFavorite || false
        });
        setActiveTab('crear'); window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsEditingPulse(true); setTimeout(() => setIsEditingPulse(false), 1200);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await vaultService.deleteVaultItem(deleteConfirmId);
            if (formData.id === deleteConfirmId) setFormData(initialFormState);
            fetchVault(); showToast('Registro Purgado del Sistema', 'info');
        } catch (error) { showToast('Error al eliminar', 'error'); }
        setDeleteConfirmId(null);
    };

    const toggleFavoriteFast = async (item) => {
        const encTitle = encryptData(item.decTitle, masterKey);
        const encPayload = encryptData(JSON.stringify({ ...item.payload, isFavorite: !item.payload.isFavorite }), masterKey);
        try {
            await vaultService.updateVaultItem(item.id, encTitle, item.itemType, encPayload, item.honeytoken);
            fetchVault(); showToast(!item.payload.isFavorite ? 'Agregado a Favoritos' : 'Removido', 'success');
        } catch (e) { showToast('Error al actualizar favorito', 'error'); }
    };

    // ... Funciones Auditoría/Radar/Send (Se mantienen iguales) ...
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
            
            // AQUÍ ESTÁ EL CAMBIO: Enviamos holdToReveal al servicio
            const secretId = await secretService.createSecret(encryptedMessage, secretExpiry, holdToReveal);
            
            const link = `${window.location.origin}/share/${secretId}#${temporaryKey}`;
            setSecretLink(link); setSecretMessage(''); showToast("Enlace Cifrado Generado", "success");
        } catch (error) { showToast("Error al generar el link seguro.", "error"); }
    };

    // ==========================================
    // LÓGICA DE 2FA (Google Authenticator)
    // ==========================================
    const handleGenerateQR = async () => {
        try {
            const data = await authService.setup2FA();
            setQrCode(data.qrCode);
            showToast("Código QR Generado. Escanéalo con tu App.", "info");
        } catch (error) {
            showToast("Error al generar el QR", "error");
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        try {
            await authService.enable2FA(twoFactorCode);
            showToast("¡Autenticación 2FA Activada con Éxito!", "success");
            setQrCode(null); 
            setTwoFactorCode('');
            setIs2FAEnabled(true); 
        } catch (error) {
            showToast("Código inválido. Revisa tu celular e intenta de nuevo.", "error");
        }
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
                                <div key={item.id} className={`vault-item horizontal-row ${item.honeytoken ? 'honeytoken' : ''}`} onClick={() => setSelectedItemForDetail(item)} style={{cursor: 'pointer'}}>
                                    <div className="item-header" style={{display: 'flex', alignItems: 'center', gap: '0.7rem'}}>
                                        {item.itemType === 'login' && <Key size={16} className="item-icon" />}
                                        {item.itemType === 'tarjeta' && <CreditCard size={16} className="item-icon" />}
                                        {item.itemType === 'nota' && <StickyNote size={16} className="item-icon" />}
                                        <h4 style={{margin: 0}}>{item.decTitle}</h4>
                                        {item.payload.isFavorite && <Star size={14} fill="#f59e0b" color="#f59e0b" style={{marginLeft: '5px'}}/>}
                                    </div>

                                    {/* DATOS DIFUMINADOS/OCULTOS EN ALMACÉN */}
                                    <div className="item-details">
                                        {item.itemType === 'login' && (<><p><strong>USR:</strong> <span style={{color: '#555'}}>••••••••</span></p><p><strong>KEY:</strong> <span style={{color: '#555'}}>••••••••</span></p></>)}
                                        {item.itemType === 'tarjeta' && (<><p><strong>NÚM:</strong> <span style={{color: '#555'}}>•••• •••• •••• {item.payload.cardNumber?.slice(-4) || '••••'}</span></p><p><strong>CVV:</strong> <span style={{color: '#555'}}>•••</span></p></>)}
                                        {item.itemType === 'nota' && (<p><strong>TXT:</strong> <span style={{color: '#555'}}>Contenido encriptado...</span></p>)}
                                        {item.payload.folder && <p style={{color: '#888', fontSize: '0.75rem', textTransform: 'uppercase'}}><Folder size={12}/> {item.payload.folder}</p>}
                                    </div>

                                    <div className="item-actions-bottom">
                                        <button className={`btn-fav ${item.payload.isFavorite ? 'is-fav' : ''}`} onClick={(e) => {e.stopPropagation(); toggleFavoriteFast(item);}}><Star size={14}/> Fav</button>
                                        <button className="btn-edit" onClick={(e) => {e.stopPropagation(); handleEdit(item);}}><Edit2 size={14}/> Editar</button>
                                        <button className="btn-del" onClick={(e) => {e.stopPropagation(); setDeleteConfirmId(item.id);}}><Trash2 size={14}/> Purga</button>
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
                                
                                {/* NUEVO: SELECTOR DE CARPETAS CON GESTOR */}
                                <div className="folder-select-group">
                                    <select value={formData.folder} onChange={e => setFormData({...formData, folder: e.target.value})}>
                                        <option value="">-- Sin Carpeta --</option>
                                        {allFolders.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                    <button type="button" className="btn-manage-folders" onClick={() => setShowFolderManager(true)} title="Gestionar Carpetas"><FolderPlus size={18}/></button>
                                </div>

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
                                        {/* MÁSCARA NÚMERO DE TARJETA */}
                                        <input type="text" placeholder="NÚMERO DE TARJETA" required value={formData.cardNumber} 
                                            onChange={e => {
                                                let val = e.target.value.replace(/\D/g, '');
                                                val = val.replace(/(.{4})/g, '$1 ').trim();
                                                setFormData({...formData, cardNumber: val.substring(0, 19)});
                                            }} 
                                        />
                                        <div className="split-inputs">
                                            {/* MÁSCARA FECHA EXPIRACIÓN */}
                                            <input type="text" placeholder="MM/YY" required value={formData.cardExpiry} 
                                                onChange={e => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                                    setFormData({...formData, cardExpiry: val});
                                                }} 
                                            />
                                            <input type="password" placeholder="CVV" required maxLength="4" value={formData.cardCvv} onChange={e => setFormData({...formData, cardCvv: e.target.value})} />
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
                case 'configuracion':
                return (
                    <div className="tab-content standalone-form" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '2rem' }}>
                        <h2 className="icon-heading" style={{ justifyContent: 'center' }}><ShieldCheck size={28}/> Seguridad Avanzada</h2>
                        
                        {/* SI EL 2FA YA ESTÁ ACTIVO, MOSTRAMOS EL ESCUDO VERDE */}
                        {is2FAEnabled ? (
                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid #10b981', padding: '3rem 2rem', borderRadius: '12px', marginTop: '2rem' }}>
                                <ShieldCheck size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '1rem' }}>Autenticación 2FA Activada</h3>
                                <p style={{ color: '#aaa', lineHeight: '1.6' }}>
                                    Tu cuenta está blindada mediante Autenticación de Dos Factores. <br/>
                                    Se requerirá un código de tu aplicación autenticadora (ej. Google Authenticator) cada vez que inicies sesión.
                                </p>
                            </div>
                        ) : (
                            /* SI NO ESTÁ ACTIVO, MOSTRAMOS EL FLUJO DE CREACIÓN QUE YA TENÍAS */
                            <>
                                <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                                    Protege tu bóveda vinculando tu cuenta con una aplicación de Autenticación 
                                    (como Google Authenticator o Authy).
                                </p>

                                {!qrCode ? (
                                    <button 
                                        onClick={handleGenerateQR} 
                                        style={{ background: '#3b82f6', color: 'white', padding: '1rem 2rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                                    >
                                        Generar Código QR de Vinculación
                                    </button>
                                ) : (
                                    <div style={{ background: '#111', border: '1px solid #333', padding: '2rem', borderRadius: '12px' }}>
                                        <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>Paso 1: Escanea este Código</h3>
                                        <div style={{ background: 'white', display: 'inline-block', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                            <img src={qrCode} alt="Código QR 2FA" style={{ width: '200px', height: '200px' }} />
                                        </div>

                                        <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>Paso 2: Confirma el Código</h3>
                                        <form onSubmit={handleVerify2FA} style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Ej. 123456" 
                                                maxLength="6"
                                                value={twoFactorCode}
                                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                                style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #444', background: '#000', color: '#fff', width: '120px', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
                                                required 
                                            />
                                            <button type="submit" style={{ background: '#10b981', color: 'black', border: 'none', borderRadius: '6px', padding: '0 1.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                                Validar
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </>
                        )}
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

                                <div style={{ marginTop: '1.5rem' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.85rem', cursor: 'pointer' }}>
        <input 
            type="checkbox" 
            checked={holdToReveal} 
            onChange={(e) => setHoldToReveal(e.target.checked)} 
        />
        MODO SNAPCHAT (MANTENER PARA REVELAR)
    </label>
    
    {/* Recuadro explicativo opcional */}
    {holdToReveal && (
        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed #f59e0b', padding: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: '#f59e0b' }}>
            <p><strong>¿CÓMO FUNCIONA?</strong> El receptor no podrá ver el mensaje a menos que mantenga presionado el botón. Esto bloquea la mayoría de los métodos de captura de pantalla y asegura que el usuario esté presente.</p>
        </div>
    )}
</div>
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
                                    
                                    // LA MAGIA: Construimos la URL que atrapa al hacker usando el UUID de la base de datos
                                    const trapUrl = `http://localhost:8080/api/v1/trap/${item.trapToken}`;

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
                                            
                                            {/* NUEVA SECCIÓN: URL DE TRAMPA EN VEZ DEL BOTÓN DE SIMULAR */}
                                            <div style={{ marginTop: '1rem', borderTop: compromised ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #222', paddingTop: '1rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                                                    URL Trampa (Pública):
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={trapUrl}
                                                        style={{
                                                            flex: 1, padding: '0.5rem', background: '#000',
                                                            border: '1px solid #333', 
                                                            color: compromised ? '#ef4444' : '#10b981',
                                                            fontSize: '0.75rem', width: '100%', outline: 'none'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleCopy(trapUrl, 'URL Trampa')}
                                                        style={{
                                                            padding: '0 1rem', background: 'rgba(16, 185, 129, 0.1)',
                                                            color: '#10b981', border: 'none', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                        title="Copiar para engañar al hacker"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                </div>
                                                <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.8rem', lineHeight: '1.4' }}>
                                                    * Deja este enlace en un lugar donde un intruso pueda robarlo (ej. en un archivo llamado "Acceso-API.txt"). Si intenta acceder, registraremos su IP de inmediato.
                                                </p>
                                            </div>
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
        <div className={`dashboard-layout ${isMobileMenuOpen ? 'menu-active' : ''}`}>
            {/* SISTEMA DE TOASTS */}
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

            {/* MODAL 1: DETALLES DE CREDENCIAL (Clic en Almacén) */}
            {selectedItemForDetail && (
                <div className="modal-overlay" onClick={() => setSelectedItemForDetail(null)}>
                    <div className="modal-box item-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-header">
                            <h3>
                                <div className="icon-wrapper">
                                    {selectedItemForDetail.itemType === 'login' && <Key size={20} color="#10b981" />}
                                    {selectedItemForDetail.itemType === 'tarjeta' && <CreditCard size={20} color="#10b981" />}
                                    {selectedItemForDetail.itemType === 'nota' && <StickyNote size={20} color="#10b981" />}
                                </div>
                                {selectedItemForDetail.decTitle}
                            </h3>
                            <button className="close-btn" onClick={() => setSelectedItemForDetail(null)}><X size={24}/></button>
                        </div>
                        
                        <div className="detail-body">
                            {selectedItemForDetail.itemType === 'login' && (
                                <>
                                    <div className="detail-row">
                                        <div className="detail-content">
                                            <span className="detail-label">Usuario / Email</span>
                                            <span className="detail-value">{selectedItemForDetail.payload.username}</span>
                                        </div>
                                        <button className="btn-copy" onClick={() => handleCopy(selectedItemForDetail.payload.username, 'Usuario')}><Copy size={14}/> Copiar</button>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-content">
                                            <span className="detail-label">Contraseña de Acceso</span>
                                            <span className="detail-value">{selectedItemForDetail.payload.password}</span>
                                        </div>
                                        <button className="btn-copy" onClick={() => handleCopy(selectedItemForDetail.payload.password, 'Contraseña')}><Copy size={14}/> Copiar</button>
                                    </div>
                                </>
                            )}
                            
                            {selectedItemForDetail.itemType === 'tarjeta' && (
                                <>
                                    <div className="detail-row">
                                        <div className="detail-content">
                                            <span className="detail-label">Titular de la Tarjeta</span>
                                            <span className="detail-value">{selectedItemForDetail.payload.cardHolder}</span>
                                        </div>
                                        <button className="btn-copy" onClick={() => handleCopy(selectedItemForDetail.payload.cardHolder, 'Titular')}><Copy size={14}/> Copiar</button>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-content">
                                            <span className="detail-label">Número de Tarjeta</span>
                                            <span className="detail-value">{selectedItemForDetail.payload.cardNumber}</span>
                                        </div>
                                        <button className="btn-copy" onClick={() => handleCopy(selectedItemForDetail.payload.cardNumber, 'Número')}><Copy size={14}/> Copiar</button>
                                    </div>
                                    <div style={{display: 'flex', gap: '1rem'}}>
                                        <div className="detail-row" style={{flex: 1}}>
                                            <div className="detail-content">
                                                <span className="detail-label">Vencimiento</span>
                                                <span className="detail-value">{selectedItemForDetail.payload.cardExpiry}</span>
                                            </div>
                                            <button className="btn-copy" onClick={() => handleCopy(selectedItemForDetail.payload.cardExpiry, 'Fecha')}><Copy size={14}/></button>
                                        </div>
                                        <div className="detail-row" style={{flex: 1}}>
                                            <div className="detail-content">
                                                <span className="detail-label">CVV</span>
                                                <span className="detail-value">{selectedItemForDetail.payload.cardCvv}</span>
                                            </div>
                                            <button className="btn-copy" onClick={() => handleCopy(selectedItemForDetail.payload.cardCvv, 'CVV')}><Copy size={14}/></button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedItemForDetail.itemType === 'nota' && (
                                <div className="detail-row" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem'}}>
                                        <span className="detail-label">Contenido de la Nota Segura</span>
                                        <button className="btn-copy" style={{opacity: 1}} onClick={() => handleCopy(selectedItemForDetail.payload.noteContent, 'Nota')}><Copy size={14}/> Copiar</button>
                                    </div>
                                    <span className="detail-value" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>{selectedItemForDetail.payload.noteContent}</span>
                                </div>
                            )}

                            {selectedItemForDetail.payload.url && (
                                <div className="detail-row">
                                    <div className="detail-content">
                                        <span className="detail-label">URL Vinculada</span>
                                        <a href={selectedItemForDetail.payload.url} target="_blank" rel="noreferrer" className="detail-value">{selectedItemForDetail.payload.url}</a>
                                    </div>
                                    <button className="btn-copy" onClick={() => handleCopy(selectedItemForDetail.payload.url, 'URL')}><Copy size={14}/> Copiar</button>
                                </div>
                            )}
                            
                            {selectedItemForDetail.payload.extraNotes && (
                                <div className="detail-row">
                                    <div className="detail-content">
                                        <span className="detail-label">Notas Adicionales</span>
                                        <span className="detail-value" style={{color: '#888', fontSize: '0.85rem'}}>{selectedItemForDetail.payload.extraNotes}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: GESTOR DE CARPETAS */}
            {showFolderManager && (
                <div className="modal-overlay" onClick={() => {setShowFolderManager(false); setEditingFolder(null);}}>
                    <div className="modal-box folder-manager-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-header">
                            <h3>Gestionar Carpetas</h3>
                            <button onClick={() => {setShowFolderManager(false); setEditingFolder(null);}}><X size={24}/></button>
                        </div>
                        
                        <div className="folder-list">
                            {allFolders.length === 0 ? <p style={{color: '#666', textAlign: 'center', padding: '2rem 0'}}>No hay carpetas creadas.</p> : null}
                            {allFolders.map(folder => (
                                <div key={folder} className="folder-row">
                                    {editingFolder?.oldName === folder ? (
                                        <form onSubmit={handleRenameFolderSubmit} style={{display: 'flex', width: '100%', gap: '0.5rem'}}>
                                            <input type="text" value={editingFolder.newName} onChange={e => setEditingFolder({...editingFolder, newName: e.target.value})} autoFocus style={{flex: 1, padding: '0.5rem', background: '#000', border: '1px solid #333', color: 'white'}} />
                                            <button type="submit" style={{background: '#10b981', color: 'black', border: 'none', padding: '0 1rem', cursor: 'pointer'}}><Save size={16}/></button>
                                            <button type="button" onClick={() => setEditingFolder(null)} style={{background: 'transparent', color: 'white', border: '1px solid #333', padding: '0 1rem', cursor: 'pointer'}}><X size={16}/></button>
                                        </form>
                                    ) : (
                                        <>
                                            <span><Folder size={16} color="#888"/> {folder}</span>
                                            <div className="folder-actions">
                                                <button className="btn-edit" onClick={() => setEditingFolder({oldName: folder, newName: folder})}><FolderEdit size={16}/></button>
                                                <button className="btn-del" onClick={() => handleDeleteFolder(folder)}><Trash2 size={16}/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleCreateFolder} className="add-folder-form">
                            <input type="text" placeholder="Nueva Carpeta..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
                            <button type="submit">Añadir</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE PURGA */}
            {deleteConfirmId && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <AlertTriangle size={48} color="#ef4444" style={{marginBottom: '1rem'}}/>
                        <h3>Protocolo de Purga</h3>
                        <p>¿Estás seguro de que deseas eliminar este registro? Esta acción es irreversible.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Abortar</button>
                            <button className="btn-danger" onClick={executeDelete}>Confirmar Purga</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE RESCATE DE SESIÓN (401) */}
            {showReauthModal && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <form className="modal-box" onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            const res = await authService.login(reauthPassword);
                            if (res.requires2FA) {
                                showToast("Por seguridad 2FA, debes iniciar sesión desde cero.", "info");
                                handleLogout();
                            } else {
                                setShowReauthModal(false);
                                setReauthPassword('');
                                showToast("Sesión restaurada con éxito. Haz clic en Guardar nuevamente.", "success");
                            }
                        } catch (err) {
                            showToast("Contraseña incorrecta", "error");
                        }
                    }}>
                        <ShieldAlert size={48} color="#f59e0b" style={{marginBottom: '1rem'}}/>
                        <h3 style={{ color: '#f59e0b' }}>Tu Sesión ha Expirado</h3>
                        <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '1rem' }}>
                            Tranquilo, tu formulario no se ha borrado. Ingresa tu Contraseña Maestra para restaurar la conexión con el servidor.
                        </p>
                        <input type="password" required placeholder="Contraseña Maestra" value={reauthPassword} onChange={(e) => setReauthPassword(e.target.value)} style={{ width: '100%', padding: '1rem', background: '#000', color: '#fff', border: '1px solid #333', marginBottom: '1rem' }} autoFocus/>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={handleLogout}>Salir</button>
                            <button type="submit" style={{ background: '#f59e0b', color: 'black', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Restaurar Sesión</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ========================================== */}
            {/* MODAL DE EXPORTACIÓN (SOBERANÍA DE DATOS) */}
            {/* ========================================== */}
            {showExportModal && (
                <div className="modal-overlay" style={{ zIndex: 10000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#111', border: '1px solid #333', padding: '2.5rem', borderRadius: '12px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <h2 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Download size={24}/> Exportar Bóveda</h2>
                        <p style={{ color: '#aaa', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Elige el formato de seguridad para descargar tus datos. Eres dueño de tu información, pero recuerda ser precavido.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* BOTÓN 1: BACKUP SEGURO */}
                            <button 
                                onClick={handleExportEncrypted} 
                                style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid #10b981', padding: '1.5rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'}
                            >
                                <h4 style={{ color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><ShieldCheck size={20}/> Backup Cifrado (Recomendado)</h4>
                                <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>Descarga los datos en formato crudo AES-GCM. Si te roban este archivo, no podrán leerlo sin tu contraseña maestra. Ideal para guardar en la nube.</p>
                            </button>

                            {/* BOTÓN 2: TEXTO PLANO PELIGROSO */}
                            <button 
                                onClick={handleExportPlainText} 
                                style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed #ef4444', padding: '1.5rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                            >
                                <h4 style={{ color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><AlertTriangle size={20}/> Texto Plano (Peligroso)</h4>
                                <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>Descarga tus credenciales desencriptadas y totalmente legibles. Usa esta opción ÚNICAMENTE si vas a migrar a otro gestor de contraseñas (ej. 1Password).</p>
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowExportModal(false)} 
                            style={{ marginTop: '2rem', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '1rem' }}
                            onMouseOver={(e) => e.target.style.color = '#fff'}
                            onMouseOut={(e) => e.target.style.color = '#888'}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {!isUnlocked ? (
                /* PANTALLA DE DESBLOQUEO */
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
                    {/* CABECERA MÓVIL BLINDADA */}
                    <header className="mobile-header">
                        <div className="mobile-brand">
                            <h2>ZK-Vault</h2>
                        </div>
                        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </header>

                    {/* OVERLAY PARA CERRAR EL MENÚ AL TOCAR AFUERA */}
                    <div className={`sidebar-overlay ${isMobileMenuOpen ? 'show' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

                    {/* SIDEBAR CORREGIDO */}
                    <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                        <div className="sidebar-inner">
                            <div className="brand desktop-only">
                                <h2>ZK-Vault</h2>
                                <span className="status">Conexión Segura</span>
                            </div>
                            
                            <div className="nav-group">
                                <span className="nav-label">/// MI BÓVEDA</span>
                                <nav>
                                    <button className={activeTab === 'almacen' && activeSidebarFolder === 'all' ? 'active icon-btn' : 'icon-btn'} onClick={() => handleNavClick('almacen', 'all')}>
                                        <Database size={18} /> Almacén
                                    </button>
                                    <button className={activeTab === 'crear' ? 'active icon-btn' : 'icon-btn'} onClick={() => { handleNavClick('crear'); setFormData(initialFormState); }}>
                                        <PlusSquare size={18} /> Crear Credencial
                                    </button>
                                    
                                </nav>
                            </div>

                            {allFolders.length > 0 && (
                                <div className="nav-group">
                                    <span className="nav-label">/// CARPETAS</span>
                                    <nav className="folders-nav">
                                        {allFolders.map(folder => (
                                            <button key={folder} className={activeTab === 'almacen' && activeSidebarFolder === folder ? 'active icon-btn' : 'icon-btn'} onClick={() => handleNavClick('almacen', folder)}>
                                                <Folder size={18} /> {folder}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            )}

                            <div className="nav-group">
                                <span className="nav-label">/// ZERO_KNOWLEDGE</span>
                                <nav>
                                    <button className={activeTab === 'generador' ? 'active icon-btn' : 'icon-btn'} onClick={() => handleNavClick('generador')}><KeySquare size={18} /> Motor CSPRNG</button>
                                    <button className={activeTab === 'auditoria' ? 'active icon-btn' : 'icon-btn'} onClick={() => handleNavClick('auditoria')}><ShieldCheck size={18} /> Auditoría Local</button>
                                    <button className={activeTab === 'send' ? 'active icon-btn' : 'icon-btn'} onClick={() => handleNavClick('send')}><Link2 size={18} /> Envío Efímero</button>
                                    <button 
                                        className={activeTab === 'radar' ? 'active icon-btn' : 'icon-btn'} onClick={() => handleNavClick('radar')}>
                                            <Radar size={18} /> Radar Honeytoken
                                        </button>
                                        <button onClick={triggerExport} className="icon-btn-center" style={{marginTop: '1rem', background: '#10b981', color: 'black', border: 'none'}}>
    Exportar Bóveda Descifrada
</button>

<button className={activeTab === 'configuracion' ? 'active' : ''} onClick={() => setActiveTab('configuracion')}>
        Seguridad y 2FA
    </button>
    
                                </nav>
                            </div>
                            <button className="logout-sidebar-btn icon-btn-center" onClick={handleLogout}>
                                <LogOut size={16} /> Finalizar Sesión
                            </button>
                        </div>
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