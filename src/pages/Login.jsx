import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.login(formData.email, formData.password);
            // Al ser exitoso, la Cookie se guarda sola. Vamos a la bóveda.
            navigate('/vault');
        } catch (err) {
            // Intentamos leer el mensaje exacto que nos mandó Java
            const backendMessage = err.response?.data?.message || err.response?.data?.error;
            setError(backendMessage || "Credenciales incorrectas. Verifica tu usuario y contraseña.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <ShieldCheck size={48} color="#10b981" />
                    <h2>Identificación Requerida</h2>
                    <p>Ingresa a tu entorno Zero-Knowledge</p>
                </div>

                {error && (
                    <div className="error-banner pulse-red" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', color: '#ef4444', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <input type="email" placeholder="Correo Electrónico" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <input type="password" placeholder="Contraseña de Acceso" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    
                    <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
                        {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>¿No tienes autorización? <Link to="/register">Solicitar Acceso</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;