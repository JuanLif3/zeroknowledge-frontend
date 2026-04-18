import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
// Añadimos el icono de Download
import { ShieldCheck, AlertTriangle, Info, Download } from 'lucide-react'; 

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // NUEVO ESTADO: Controla si el modal de emergencia está visible
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);

    // PASO 1: Guardar en base de datos y abrir el Modal
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.register(formData);
            // En vez de navegar, abrimos el recuadro de advertencia
            setShowRecoveryModal(true); 
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

    // PASO 2: Cuando el usuario hace clic en el botón del Modal
    const handleDownloadAndProceed = () => {
        const kitContent = `
===================================================
      KIT DE EMERGENCIA - ZERO KNOWLEDGE VAULT 
===================================================

ATENCIÓN: Guarda este documento en un lugar sumamente seguro 
(ej. imprímelo y guárdalo en una caja fuerte, o en un USB offline).

Como utilizamos una arquitectura Zero-Knowledge (Cero Conocimiento), 
nosotros NO tenemos copia de tu contraseña. Todo se encripta en tu PC.

SI PIERDES ESTA CLAVE, PERDERÁS EL ACCESO A TODA TU BÓVEDA DE FORMA IRREVERSIBLE. ⚠️
El soporte técnico NO PUEDE ayudarte a recuperarla.

👤 USUARIO: ${formData.email}
🔑 CONTRASEÑA MAESTRA: ${formData.password}

Generado el: ${new Date().toLocaleString()}
===================================================
`;
        const blob = new Blob([kitContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Recovery_Kit_${formData.firstname}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // ¡Ahora sí! Entramos a la bóveda
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
                        {isLoading ? 'Forjando Llaves...' : 'Establecer Bóveda'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>¿Ya tienes una Bóveda? <Link to="/login">Autenticarse</Link></p>
                </div>
            </div>

            {/* ========================================== */}
            {/* RECUADRO MODAL DE ADVERTENCIA ZERO-KNOWLEDGE */}
            {/* ========================================== */}
            {showRecoveryModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#111', border: '1px solid #ef4444', padding: '2.5rem', borderRadius: '12px', maxWidth: '450px', textAlign: 'center', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.2)' }}>
                        <AlertTriangle size={56} color="#ef4444" style={{ marginBottom: '1rem' }}/>
                        <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>Paso Final de Seguridad</h2>
                        
                        <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                            Tu bóveda ha sido creada con éxito y encriptada en tu dispositivo. 
                            Debido a nuestra arquitectura <strong>Zero-Knowledge</strong>, nosotros NO tenemos tu contraseña.
                        </p>
                        
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed #ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', color: '#ef4444', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            ⚠️ Si pierdes tu Contraseña Maestra, perderás el acceso a todos tus datos para siempre. El soporte técnico no puede restaurarla.
                        </div>

                        <button 
                            onClick={handleDownloadAndProceed} 
                            style={{ width: '100%', padding: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.target.style.background = '#dc2626'}
                            onMouseOut={(e) => e.target.style.background = '#ef4444'}
                        >
                            <Download size={20} /> Entiendo el riesgo, Descargar Kit y Entrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;