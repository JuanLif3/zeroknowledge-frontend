import { useState } from 'react';
import { Terminal, Copy } from 'lucide-react';

// Recuperamos la propiedad onPasswordGenerated
const PasswordGenerator = ({ onPasswordGenerated }) => {
    const [length, setLength] = useState(16);
    const [useUpper, setUseUpper] = useState(true);
    const [useLower, setUseLower] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);
    const [generatedPassword, setGeneratedPassword] = useState('');

    const generateSecurePassword = (e) => {
        if (e) e.preventDefault(); // Evita recargar si está dentro de un formulario

        const chars = [
            useUpper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
            useLower ? 'abcdefghijklmnopqrstuvwxyz' : '',
            useNumbers ? '0123456789' : '',
            useSymbols ? '!@#$%^&*()_+~`|}{[]:;?><,./-=' : ''
        ].join('');

        if (chars.length === 0) return alert('Selecciona al menos un tipo de carácter');

        let newPassword = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            newPassword += chars[array[i] % chars.length];
        }

        // --- LA LÓGICA DE DECISIÓN ---
        if (onPasswordGenerated) {
            // MODO FORMULARIO: Se lo mandamos a Vault.jsx para que lo ponga en el input
            onPasswordGenerated(newPassword);
        } else {
            // MODO PESTAÑA: Lo guardamos aquí mismo para mostrarlo en grande
            setGeneratedPassword(newPassword);
        }
    };

    const copyToClipboard = (e) => {
        if (e) e.preventDefault();
        if (!generatedPassword) return;
        navigator.clipboard.writeText(generatedPassword);
        alert('¡Contraseña copiada de forma segura!');
    };

    // Usamos renderizado condicional. Si NO pasamos onPasswordGenerated, es standalone.
    const isStandalone = !onPasswordGenerated;

    return (
        <div className={`password-generator-box ${isStandalone ? 'standalone' : ''}`}>
            
            {/* Si es Standalone (Pestaña Grande), mostramos el título y la caja de copiar */}
            {isStandalone ? (
                <>
                    <h2 className="icon-heading"><Terminal size={24} /> Generador CSPRNG</h2>
                    <p>Criptografía de Grado Militar ejecutada en la memoria del navegador.</p>
                    
                    <div className="result-box">
                        <span className="password-display">{generatedPassword || 'Esperando ejecución...'}</span>
                        <button type="button" onClick={copyToClipboard} className="copy-btn">
                            <Copy size={18} /> Copiar
                        </button>
                    </div>
                </>
            ) : (
                // Si es Inline (dentro del formulario), solo un título pequeño
                <h4 className="icon-heading" style={{ marginBottom: '1rem', color: '#888' }}>
                    <Terminal size={14} /> Ajustes de Entropía
                </h4>
            )}

            <div className="gen-controls">
                <label>LONGITUD: <strong>{length}</strong></label>
                <input type="range" min="8" max="64" value={length} onChange={(e) => setLength(parseInt(e.target.value))} />
            </div>

            <div className="gen-checkboxes">
                <label><input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)}/> A-Z</label>
                <label><input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)}/> a-z</label>
                <label><input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)}/> 0-9</label>
                <label><input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)}/> !@#</label>
            </div>

            {/* El botón cambia de nombre y estilo dependiendo de dónde esté */}
            <button 
                type="button" 
                className={isStandalone ? "gen-btn-large" : "gen-btn"} 
                onClick={generateSecurePassword}
            >
                {isStandalone ? "Generar Nueva Contraseña" : "Generar y Autocompletar"}
            </button>
        </div>
    );
};

export default PasswordGenerator;