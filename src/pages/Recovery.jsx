import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ShieldAlert, Key, AlertTriangle, Mail } from 'lucide-react'; 

const Recovery = () => {
    const navigate = useNavigate();
    
    // Controla si estamos en el paso 1 (Pedir código) o paso 2 (Poner claves)
    const [step, setStep] = useState(1); 
    
    const [formData, setFormData] = useState({ email: '', otp: '', seedPhrase: '', newPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Pedir el código al servidor
    const handleRequestCode = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await authService.requestPasswordReset(formData.email);
            setStep(2); // Avanzamos al paso 2
        } catch (err) {
            setError(err.response?.data?.message || "Error al solicitar el código.");
        } finally {
            setIsLoading(false);
        }
    };

    // Confirmar todo
    const handleRecovery = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await authService.resetPassword(formData.email, formData.seedPhrase, formData.newPassword, formData.otp);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 4000);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Error al procesar la recuperación. Revisa tus datos.");
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
                    <p>{step === 1 ? 'Identifica tu cuenta' : 'Restaura tus llaves'}</p>
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
                    <>
                        {/* PEDIR CORREO */}
                        {step === 1 && (
                            <form onSubmit={handleRequestCode} className="auth-form">
                                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                                    Ingresa tu correo. Te enviaremos un código de seguridad para evitar que alguien secuestre tu cuenta.
                                </p>
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <input type="email" placeholder="Tu Correo Electrónico" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} autoFocus />
                                </div>
                                <button type="submit" disabled={isLoading} style={{ background: '#ef4444', color: 'white', border: 'none' }}>
                                    {isLoading ? 'Conectando...' : 'Solicitar Código'}
                                </button>
                            </form>
                        )}

                        {/* CÓDIGO + 24 PALABRAS + NUEVA CLAVE */}
                        {step === 2 && (
                            <form onSubmit={handleRecovery} className="auth-form" style={{ animation: 'fadeIn 0.5s' }}>
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', color: '#3b82f6', fontSize: '0.85rem' }}>
                                    <Mail size={18} style={{ flexShrink: 0 }}/>
                                    <span>Hemos enviado un código a tu consola de Spring Boot. Ingrésalo abajo junto con tus 24 palabras.</span>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <input type="text" placeholder="Código de 6 dígitos" required maxLength="6" value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })} style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem', fontWeight: 'bold' }} autoFocus />
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
                                <button type="button" onClick={() => setStep(1)} style={{ background: 'transparent', color: '#888', border: 'none', width: '100%', marginTop: '1rem', cursor: 'pointer' }}>
                                    Volver
                                </button>
                            </form>
                        )}
                    </>
                )}

                <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                    <Link to="/login">Cancelar y volver al login</Link>
                </div>
            </div>
        </div>
    );
};

export default Recovery;