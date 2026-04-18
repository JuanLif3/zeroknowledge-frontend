import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ShieldAlert, Key, AlertTriangle } from 'lucide-react'; 

const Recovery = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', seedPhrase: '', newPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRecovery = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.resetPassword(formData.email, formData.seedPhrase, formData.newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 4000);
        } catch (err) {
            setError(err.message || "Error al procesar la recuperación. Revisa tus palabras.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box" style={{ maxWidth: '500px' }}>
                <div className="auth-header">
                    <ShieldAlert size={48} color="#ef4444" />
                    <h2 style={{ color: '#ef4444' }}>Recuperación Crítica</h2>
                    <p>Restaura tu bóveda usando tu Kit de Emergencia</p>
                </div>

                {error && (
                    <div className="error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', color: '#ef4444', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} /><span>{error}</span>
                    </div>
                )}

                {success ? (
                    <div style={{ textAlign: 'center', color: '#10b981', padding: '2rem 0' }}>
                        <Key size={64} style={{ marginBottom: '1rem' }} />
                        <h3>¡Llaves Restauradas!</h3>
                        <p style={{ color: '#aaa' }}>Tu bóveda ha sido salvada. Redirigiendo al login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleRecovery} className="auth-form">
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <input type="email" placeholder="Tu Correo Electrónico" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <textarea 
                                placeholder="Pega aquí tus 24 palabras separadas por espacios..." 
                                required rows="4" 
                                value={formData.seedPhrase} 
                                onChange={(e) => setFormData({ ...formData, seedPhrase: e.target.value })}
                                style={{ width: '100%', padding: '1rem', background: '#000', color: '#10b981', border: '1px solid #333', fontFamily: 'monospace', borderRadius: '4px' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <input type="password" placeholder="Tu NUEVA Contraseña Maestra" required value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                        </div>

                        <button type="submit" disabled={isLoading} style={{ background: '#ef4444', color: 'white', border: 'none' }}>
                            {isLoading ? 'Desencriptando...' : 'Rescatar Bóveda'}
                        </button>
                    </form>
                )}

                <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                    <Link to="/login">Volver al inicio de sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default Recovery;