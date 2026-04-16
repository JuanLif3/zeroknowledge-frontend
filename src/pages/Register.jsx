import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.register(formData);
            navigate('/vault');
        } catch (err) {
            // Java puede devolver un listado de errores de validación, intentamos capturarlo
            const backendMsg = err.response?.data?.message || err.response?.data?.error;
            if (err.response?.status === 400) {
                setError("La contraseña no cumple con los requisitos de seguridad de grado militar o faltan datos.");
            } else {
                setError(backendMsg || "Error al procesar el registro. Intenta con otro correo.");
            }
        } finally {
            setIsLoading(false);
        }
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

                    {/* NUEVO: REGLAS VISUALES DE CONTRASEÑA */}
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
        </div>
    );
};

export default Register;