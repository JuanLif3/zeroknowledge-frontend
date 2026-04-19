import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { 
    ShieldCheck, 
    AlertTriangle, 
    Eye, 
    EyeOff, 
    CheckCircle2, 
    Circle,
    Download
} from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // ESTADOS PARA LA FRASE SEMILLA Y VALIDACIÓN
    const [seedPhrase, setSeedPhrase] = useState(null);
    const [confirmWords, setConfirmWords] = useState({ index: 0, val: '' });
    const [hasCheckedTerms, setHasCheckedTerms] = useState(false);

    // ESTADO PARA MOSTRAR/OCULTAR CONTRASEÑA
    const [showPassword, setShowPassword] = useState(false);

    // VALIDACIÓN DINÁMICA DE REQUISITOS
    const passReqs = {
        length: formData.password.length >= 12,
        lower: /[a-z]/.test(formData.password),
        upper: /[A-Z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        symbol: /[^A-Za-z0-9]/.test(formData.password)
    };

    // Al generarse la frase, elegimos un índice al azar para la prueba de seguridad
    useEffect(() => {
        if (seedPhrase) {
            const randomIndex = Math.floor(Math.random() * 24) + 1;
            setConfirmWords({ index: randomIndex, val: '' });
        }
    }, [seedPhrase]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Verificación extra de seguridad en caso de que modifiquen el HTML
        if (!hasCheckedTerms) {
            setError("Debes aceptar la responsabilidad de custodia de tus llaves.");
            return;
        }
        
        // No permitimos enviar si la contraseña es débil
        if (!Object.values(passReqs).every(Boolean)) {
            setError("La contraseña maestra debe cumplir con todos los requisitos de seguridad.");
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            // El servicio genera las llaves DEK/KEK y devuelve las 24 palabras
            const data = await authService.register(formData);
            setSeedPhrase(data.seedPhrase); 
        } catch (err) {
            const backendMsg = err.response?.data?.message || err.response?.data?.error;
            setError(backendMsg || "Error al procesar el registro. Intenta con otro correo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalCheckAndProceed = () => {
        const words = seedPhrase.split(' ');
        if (confirmWords.val.trim().toLowerCase() !== words[confirmWords.index - 1]) {
            alert(`¡Validación fallida! La palabra número #${confirmWords.index} no es correcta. Por favor, verifícala en tu lista.`);
            return;
        }

        // Si la palabra es correcta, procedemos a la descarga del Kit y navegación
        const kitContent = `
===================================================
      KIT DE EMERGENCIA - ZERO KNOWLEDGE VAULT 
===================================================

ATENCIÓN: Guarda este documento en un lugar sumamente seguro 
(ej. imprímelo y guárdalo en una caja fuerte, o en un USB offline).

Como utilizamos una arquitectura Zero-Knowledge KEK/DEK, 
nosotros NO tenemos copia de tu contraseña ni de tu llave maestra.

SI OLVIDAS TU CONTRASEÑA, ESTA FRASE SEMILLA DE 24 PALABRAS
ES LA ÚNICA FORMA DE RECUPERAR EL ACCESO A TU BÓVEDA. ⚠️

👤 USUARIO: ${formData.email}

🌱 FRASE SEMILLA (24 PALABRAS):
${seedPhrase}

Generado el: ${new Date().toLocaleString()}
===================================================
`;
        const blob = new Blob([kitContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Recovery_Seed_${formData.firstname}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        navigate('/vault');
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <ShieldCheck size={48} color="#f59e0b" />
                    <h2>Generar Credenciales</h2>
                    <p>Inicialización de Bóveda Personal</p>
                </div>

                {error && (
                    <div className="error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', color: '#ef4444', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="split-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input type="text" placeholder="Nombre" required value={formData.firstname} onChange={(e) => setFormData({ ...formData, firstname: e.target.value })} />
                        <input type="text" placeholder="Apellido" required value={formData.lastname} onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <input type="email" placeholder="Correo Electrónico" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    
                    {/* INPUT DE CONTRASEÑA CON OJO */}
                    <div className="form-group" style={{ position: 'relative', marginBottom: '1rem' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Contraseña Maestra" 
                            required 
                            value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ paddingRight: '2.5rem', width: '100%' }}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                background: 'transparent', border: 'none', color: '#888', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* POLÍTICA ESTRICTA DINÁMICA */}
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid #f59e0b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                        <h4 style={{ color: '#f59e0b', marginTop: 0, marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Política Estricta Requerida:
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#ccc' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: passReqs.length ? '#10b981' : '#ccc', textDecoration: passReqs.length ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                                {passReqs.length ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} />} Mínimo 12 caracteres
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: passReqs.lower ? '#10b981' : '#ccc', textDecoration: passReqs.lower ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                                {passReqs.lower ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} />} Al menos una minúscula
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: passReqs.upper ? '#10b981' : '#ccc', textDecoration: passReqs.upper ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                                {passReqs.upper ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} />} Al menos una mayúscula
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: passReqs.number ? '#10b981' : '#ccc', textDecoration: passReqs.number ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                                {passReqs.number ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} />} Al menos un número
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: passReqs.symbol ? '#10b981' : '#ccc', textDecoration: passReqs.symbol ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                                {passReqs.symbol ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} />} Al menos un símbolo (!@#$%^&*)
                            </li>
                        </ul>
                    </div>

                    {/* CHECKBOX DE RESPONSABILIDAD CENTRADO */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px dashed #ef4444' }}>
                        <input 
                            type="checkbox" 
                            id="risk-terms" 
                            required 
                            checked={hasCheckedTerms} 
                            onChange={(e) => setHasCheckedTerms(e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#ef4444', flexShrink: 0 }}
                        />
                        <label htmlFor="risk-terms" style={{ color: '#ffb3b3', fontSize: '0.85rem', lineHeight: '1.5', cursor: 'pointer', textAlign: 'left', margin: 0 }}>
                            Entiendo que ZK-Vault <strong>NO</strong> tiene mi contraseña. Si pierdo mi acceso y mi Kit de Emergencia, <strong style={{ color: '#ef4444', textDecoration: 'underline' }}>perderé mis datos para siempre</strong>.
                        </label>
                    </div>
                    
                    <button type="submit" disabled={isLoading || !Object.values(passReqs).every(Boolean)} className={isLoading ? 'loading' : ''}>
                        {isLoading ? 'Forjando Llaves Invisibles...' : 'Establecer Bóveda'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>¿Ya tienes una Bóveda? <Link to="/login">Autenticarse</Link></p>
                </div>
            </div>

            {/* MODAL DE VERIFICACIÓN DE FRASE SEMILLA */}
            {seedPhrase && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.96)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: '#111', border: '1px solid #10b981', padding: '2.5rem', borderRadius: '12px', maxWidth: '600px', width: '95%', textAlign: 'center' }}>
                        <ShieldCheck size={48} color="#10b981" style={{ marginBottom: '1rem' }}/>
                        <h2 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.4rem' }}>KIT DE EMERGENCIA GENERADO</h2>
                        
                        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Anota estas 24 palabras en papel. No tomes capturas ni las guardes en la nube.
                        </p>

                        <div style={{ background: '#000', padding: '1.2rem', borderRadius: '8px', border: '1px dashed #10b981', color: '#10b981', fontFamily: 'monospace', fontSize: '1rem', lineHeight: '1.8', wordSpacing: '8px', marginBottom: '2rem' }}>
                            {seedPhrase}
                        </div>

                        {/* TEST DE SEGURIDAD: OBLIGAR AL USUARIO A VALIDAR UNA PALABRA */}
                        <div style={{ marginBottom: '2rem', borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
                            <p style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '0.8rem' }}>
                                <strong>PRUEBA DE CUSTODIA:</strong> Escribe la palabra número <strong>#{confirmWords.index}</strong> de tu lista:
                            </p>
                            <input 
                                type="text" 
                                placeholder="Escribe aquí..."
                                value={confirmWords.val} 
                                onChange={(e) => setConfirmWords({...confirmWords, val: e.target.value})}
                                style={{ background: '#000', border: '1px solid #333', color: '#fff', textAlign: 'center', padding: '0.7rem', width: '180px', borderRadius: '4px', outline: 'none' }}
                            />
                        </div>

                        <button 
                            onClick={handleFinalCheckAndProceed} 
                            style={{ width: '100%', padding: '1rem', background: '#10b981', color: 'black', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            <Download size={18} /> Validar, Descargar y Entrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;