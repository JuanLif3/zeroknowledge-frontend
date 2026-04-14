import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // LLamamos a nuestro puente HTTP (Axios)
            await authService.login(email, password);
            // SI funciona, java nos dio el JWT y ya esta en localStorage
            // Redirigimos a la boveda 
            alert('Login exitoso! Redirigiendo a la bóveda...');
            navigate('/vault');
        } catch (err) {
            setError('Credenciales inválidas. Intenta de nuevo.');
        }
    };

    return(
        <div className="auth-container">
            <div className="auth-box">
                <h2>ZK-Vault Login</h2>
                {error && <div className="error-msg">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email Cifrado</label>
                        <input 
                            type="email" 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="admin@cybersec.com"
                        />
                    </div>
                    <div className="input-group">
                        <label>Master Password</label>
                        <input 
                            type="password" 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit">Desencriptar Bóveda</button>
                </form>

                <div className="auth-link">
                    ¿No tienes una bóveda? <Link to="/register">Crear una aquí</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;