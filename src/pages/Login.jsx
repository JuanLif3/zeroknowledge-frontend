import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ShieldCheck, AlertTriangle, Key } from 'lucide-react'; 

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '', twoFactorCode: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // NUEVO ESTADO: ¿Estamos en la fase de pedir el código de 6 dígitos?
    const [needs2FA, setNeeds2FA] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Enviamos el email, clave y el código (que estará vacío la primera vez)
            const response = await authService.login(formData.email, formData.password, formData.twoFactorCode);
            
            if (response.requires2FA) {
                // Java nos detuvo. Ocultamos el form normal y pedimos el 2FA.
                setNeeds2FA(true);
                setIsLoading(false);
                return;
            }

            // Si Java nos da luz verde, entramos a la bóveda
            navigate('/vault');
        } catch (err) {
            const backendMsg = err.response?.data?.message || err.response?.data?.error;
            setError(backendMsg || "Error al autenticar. Revisa tus credenciales.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <ShieldCheck size={48} color="#10b981" />
                    <h2>Acceso Autorizado</h2>
                    <p>Desencripta tu Bóveda Zero-Knowledge</p>
                </div>

                {error && (
                    <div className="error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', color: '#ef4444', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {/* SI NO REQUIERE 2FA, MOSTRAMOS EMAIL Y CLAVE NORMALES */}
                    {!needs2FA ? (
                        <>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <input type="email" placeholder="Correo Electrónico" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <input type="password" placeholder="Contraseña Maestra" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
                                {isLoading ? 'Verificando...' : 'Autenticar'}
                            </button>
                        </>
                    ) : (
                        /* SI REQUIERE 2FA, MOSTRAMOS SOLO EL RECUADRO DE 6 DÍGITOS */
                        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <Key size={32} color="#f59e0b" />
                            </div>
                            <h3 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>Verificación en Dos Pasos</h3>
                            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                Ingresa el código de 6 dígitos de tu aplicación de autenticación.
                            </p>
                            
                            <input 
                                type="text" 
                                placeholder="000000" 
                                maxLength="6"
                                required 
                                value={formData.twoFactorCode} 
                                onChange={(e) => setFormData({ ...formData, twoFactorCode: e.target.value.replace(/\D/g, '') })}
                                style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #f59e0b', background: '#000', color: '#f59e0b', width: '100%', textAlign: 'center', fontSize: '2rem', letterSpacing: '10px', marginBottom: '1.5rem', fontWeight: 'bold' }}
                                autoFocus
                            />
                            
                            <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''} style={{ background: '#f59e0b', color: 'black' }}>
                                {isLoading ? 'Validando...' : 'Verificar Código'}
                            </button>
                            <button type="button" onClick={() => { setNeeds2FA(false); setFormData({...formData, twoFactorCode: ''}); }} style={{ background: 'transparent', color: '#888', border: 'none', marginTop: '1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Volver al inicio de sesión
                            </button>
                        </div>
                    )}
                </form>

                {!needs2FA && (
                    <div className="auth-footer">
                        <p>¿No tienes una bóveda? <Link to="/register">Crear Bóveda Local</Link></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;