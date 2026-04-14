import { useState } from 'react';
// IMPORTAMOS LOS ICONOS
import { Terminal, Copy } from 'lucide-react';

const PasswordGenerator = () => {
    // ... (mantén todos tus estados y funciones intactos: length, useUpper, generateSecurePassword, copyToClipboard, etc.)
    const [length, setLength] = useState(16);
    const [useUpper, setUseUpper] = useState(true);
    const [useLower, setUseLower] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);
    const [generatedPassword, setGeneratedPassword] = useState('');

    const generateSecurePassword = (e) => {
        if (e) e.preventDefault();
        const chars = [
            useUpper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
            useLower ? 'abcdefghijklmnopqrstuvwxyz' : '',
            useNumbers ? '0123456789' : '',
            useSymbols ? '!@#$%^&*()_+~`|}{[]:;?><,./-=' : ''
        ].join('');
        if (chars.length === 0) return alert('Selecciona un tipo de carácter');
        let newPassword = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            newPassword += chars[array[i] % chars.length];
        }
        setGeneratedPassword(newPassword);
    };

    const copyToClipboard = () => {
        if (!generatedPassword) return;
        navigator.clipboard.writeText(generatedPassword);
        alert('¡Contraseña copiada de forma segura!');
    };

    return (
        <div className="password-generator-box standalone">
            <h2 className="icon-heading"><Terminal size={24} /> Generador de Grado Militar</h2>
            <p>Las contraseñas se generan localmente usando criptografía del navegador.</p>
            
            <div className="result-box">
                <span className="password-display">{generatedPassword || 'Haz clic en generar...'}</span>
                <button onClick={copyToClipboard} className="copy-btn">
                    <Copy size={18} /> Copiar
                </button>
            </div>

            <div className="gen-controls">
                <label>Longitud: <strong>{length}</strong></label>
                <input type="range" min="8" max="64" value={length} onChange={(e) => setLength(e.target.value)} />
            </div>

            <div className="gen-checkboxes">
                <label><input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)}/> A-Z</label>
                <label><input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)}/> a-z</label>
                <label><input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)}/> 0-9</label>
                <label><input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)}/> Símbolos</label>
            </div>

            <button className="gen-btn-large" onClick={generateSecurePassword}>Generar Nueva Contraseña</button>
        </div>
    );
};

export default PasswordGenerator;