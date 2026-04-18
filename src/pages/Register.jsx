import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ShieldCheck, AlertTriangle, Info, Download, Copy } from 'lucide-react'; 

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [seedPhrase, setSeedPhrase] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // El servicio ahora genera las llaves y devuelve las 24 palabras
            const data = await authService.register(formData);
            
            // Atrapamos las 24 palabras y abrimos el Modal del Kit de Emergencia
            setSeedPhrase(data.seedPhrase); 
        } catch (err) {
            const backendMsg = err.response?.data?.message || err.response?.data?.error;
            if (err.response?.status === 400) {
                setError("La contraseña no cumple con los requisitos o el servidor rechazó los datos.");
            } else {
                setError(backendMsg || "Error al procesar el registro. Intenta con otro correo.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadAndProceed = () => {
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
                    
                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                        <input type="password" placeholder="Contraseña Maestra de Acceso" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>

                    <div className="password-rules" style={{ background: '#050505', border: '1px dashed #333', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                            <Info size={14} /> <strong>POLÍTICA ESTRICTA REQUERIDA:</strong>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                            <li>Mínimo 12 caracteres de longitud</li>
                            <li>Al menos una letra MAYÚSCULA</li>
                            <li>Al menos una letra minúscula</li>
                            <li>Al menos un número (0-9)</li>
                            <li>Un símbolo especial (!@#$%^&*...)</li>
                        </ul>
                    </div>
                    
                    <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
                        {isLoading ? 'Forjando Llaves Invisibles...' : 'Establecer Bóveda'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>¿Ya tienes una Bóveda? <Link to="/login">Autenticarse</Link></p>
                </div>
            </div>

            {seedPhrase && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: '#111', border: '1px solid #10b981', padding: '3rem', borderRadius: '12px', maxWidth: '600px', width: '90%', textAlign: 'center', boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)' }}>
                        <ShieldCheck size={56} color="#10b981" style={{ marginBottom: '1rem' }}/>
                        <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>BÓVEDA FORJADA CON ÉXITO</h2>
                        
                        <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Tu "Llave Invisible" ha sido creada. Debido a la arquitectura Zero-Knowledge, si olvidas tu contraseña, esta frase de 24 palabras es <strong>la única forma en el universo</strong> de recuperar tus datos.
                        </p>

                        <div style={{ background: '#000', padding: '1.5rem', borderRadius: '8px', border: '1px dashed #10b981', color: '#10b981', fontFamily: 'monospace', fontSize: '1.1rem', lineHeight: '1.8', wordSpacing: '8px', marginBottom: '2rem' }}>
                            {seedPhrase}
                        </div>

                        <button 
                            onClick={handleDownloadAndProceed} 
                            style={{ width: '100%', padding: '1.2rem', background: '#10b981', color: 'black', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.target.style.background = '#059669'}
                            onMouseOut={(e) => e.target.style.background = '#10b981'}
                        >
                            <Download size={20} /> Descargar Kit de Recuperación y Entrar
                        </button>
                        <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '1rem' }}>
                            Guarda el archivo descargado en un USB o imprímelo. No lo subas a la nube.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;