import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await authService.register(email, password);
            alert('Bóveda creada exitosamente');
            navigate('/login');
        } catch (err) {
            setError('Error al registrar. Quizás el correo ya existe.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Inicializar Bóveda</h2>
                {error && <div className="error-msg">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nuevo Email</label>
                        <input 
                            type="email" 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>
                    <div className="input-group">
                        <label>Master Password (Mín 8 caracteres)</label>
                        <input 
                            type="password" 
                            required 
                            minLength="8"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>
                    <button type="submit">Generar Llaves & Registrar</button>
                </form>

                <div className="auth-link">
                    ¿Ya tienes una bóveda? <Link to="/login">Entrar</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;