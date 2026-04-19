import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, Terminal, Key, Share2, Lock, EyeOff, 
  Cpu, GlobeLock, ChevronRight, Fingerprint, Laptop, 
  Network, Server, LockKeyhole, ArrowRight
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import '../styles/_landing.scss';

const Landing = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [demoSecret, setDemoSecret] = useState('');
  const [hashedSecret, setHashedSecret] = useState('');
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [activeFlowStep, setActiveFlowStep] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (demoSecret) {
      const hash = CryptoJS.SHA256(demoSecret).toString(CryptoJS.enc.Hex);
      setHashedSecret(`0x${hash.substring(0, 48)}...`);
    } else {
      setHashedSecret('');
    }
  }, [demoSecret]);

  const architectureFeatures = [
    {
      id: 'aislamiento',
      icon: <EyeOff size={28} />,
      title: 'Aislamiento Total del Cliente',
      description: 'Tu contraseña maestra nunca abandona tu computadora. La derivación de claves se ejecuta localmente mediante el algoritmo Argon2id. Lo que llega a nuestro backend es un hash secundario.',
      terminalTitle: 'argon2_derivation.sh',
      terminalLogs: (
        <>
          <p><span className="prompt">~ $</span> input_pwd --local</p>
          <p className="dimmed">Derivando con Argon2id (Mem: 64MB)...</p>
          <p className="success">[LOCAL] MasterKey = 0x9A4B2C...</p>
          <p><span className="prompt">~ $</span> send_to_server --auth</p>
          <p className="typing-effect" style={{color: '#ffbd2e'}}>Servidor recibe: 0x112233... (Imposible descifrar)</p>
        </>
      )
    },
    {
      id: 'p2p',
      icon: <Share2 size={28} />,
      title: 'Intercambio P2P Simulado',
      description: 'Utilizamos el "Fragmento de URL" (#). Por diseño, los navegadores no envían estos datos al servidor. La llave viaja adjunta al link, descifrando todo localmente.',
      terminalTitle: 'network_intercept.log',
      terminalLogs: (
        <>
          <p><span className="prompt">~ $</span> intercept_url --target "/share#key=123"</p>
          <p className="success">[NETWORK] Petición interceptada.</p>
          <p><span className="prompt">~ $</span> cat /request/url</p>
          <p className="typing-effect" style={{color: '#ff4444'}}>[ERROR] Fragmento "#key" NO VIAJA. Servidor ciego.</p>
        </>
      )
    },
    {
      id: 'recovery',
      icon: <ShieldAlert size={28} />,
      title: 'Protocolo de Recuperación',
      description: 'Generamos una Recovery Key de 256-bits al registrarte. Si la pierdes junto con tu clave maestra, tu bóveda será matemáticamente irrecuperable.',
      terminalTitle: 'recovery_matrix.sys',
      terminalLogs: (
        <>
           <p><span className="prompt">~ $</span> reset_password --target "usuario"</p>
           <p style={{color: '#ff4444'}}>[ACCESS DENIED] Backend reset disabled.</p>
           <p><span className="prompt">~ $</span> init_recovery</p>
           <p className="typing-effect success">[WARNING] Sin llave física, los datos son polvo.</p>
        </>
      )
    },
    {
      id: 'wasm',
      icon: <Cpu size={28} />,
      title: 'Criptografía WebAssembly',
      description: 'Utilizamos libsodium-wrappers y crypto-js, ejecutando primitivas auditadas (como XChaCha20-Poly1305) a velocidades nativas en tu navegador.',
      terminalTitle: 'wasm_benchmark.exe',
      terminalLogs: (
        <>
          <p><span className="prompt">~ $</span> load_module --libsodium</p>
          <p className="success">[OK] WebAssembly module loaded.</p>
          <p><span className="prompt">~ $</span> benchmark XChaCha20-Poly1305</p>
          <p className="dimmed">Cifrando payload en el hilo principal...</p>
          <p className="typing-effect">Ejecución: 12ms. Velocidad nativa confirmada.</p>
        </>
      )
    }
  ];

  return (
    <div className="landing-container" style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` }}>
      
      <nav className="landing-nav">
        <div className="nav-brand">
          <Fingerprint size={28} />
          <span className="mono-font">ZeroKnowledge_Vault</span>
        </div>
        <div className="nav-links">
          <Link to="/login" className="btn-ghost mono-font">/login</Link>
          <Link to="/register" className="btn-primary mono-font">/register</Link>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-content">
          <div className="badge mono-font"><Lock size={14} /> SYSTEM_SECURED_V1</div>
          <h1 className="hero-title">
            Tu privacidad no es una opción.<br />
            <span className="highlight">Es una garantía matemática.</span>
          </h1>
          <p className="hero-description">
            No te pedimos que confíes en nosotros; te damos el código para que lo verifiques. 
            Cifrado del lado del cliente significa que nuestra base de datos es solo un 
            almacén de ruido incomprensible. Solo tú tienes la llave.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary large">Inicializar Bóveda <ChevronRight size={18} /></Link>
            <Link to="/login" className="btn-outline large mono-font">$ connect --vault</Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="terminal-window">
            <div className="terminal-header">
              <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
              <span className="title mono-font">encrypt_payload.sh</span>
            </div>
            <div className="terminal-body mono-font">
              <p><span className="prompt">~ $</span> libsodium-wrappers --init</p>
              <p className="success">[OK] Sodium library initialized.</p>
              <p><span className="prompt">~ $</span> derive_key -alg Argon2id -mem 64MB</p>
              <p className="dimmed">Deriving master key from passphrase...</p>
              <p className="success">[OK] Local key derived successfully.</p>
              <p><span className="prompt">~ $</span> encrypt_vault --xchacha20</p>
              <p className="typing-effect">Cyphertext sent to server: 0x8f2a9b...</p>
            </div>
          </div>
        </div>
      </header>

      <div className="tech-marquee mono-font">
        <div className="marquee-content">
          <span>ARGON2ID KEY DERIVATION</span> • <span>XCHACHA20-POLY1305 ENCRYPTION</span> • 
          <span>CLIENT-SIDE ONLY</span> • <span>NO TRACKERS</span> • <span>OPEN ARCHITECTURE</span> •
          <span>ARGON2ID KEY DERIVATION</span> • <span>XCHACHA20-POLY1305 ENCRYPTION</span> • 
          <span>CLIENT-SIDE ONLY</span> • <span>NO TRACKERS</span> • <span>OPEN ARCHITECTURE</span>
        </div>
      </div>

      <section className="section-padding">
        <div className="section-header">
          <h2 className="mono-font">{'// CORE_ARCHITECTURE'}</h2>
          <p>Diseñado bajo el principio de "No confíes, verifica". Haz clic para inspeccionar.</p>
        </div>

        <div className="responsive-flex">
          <div className="features-list">
            {architectureFeatures.map((f, i) => (
              <div 
                key={f.id} 
                className={`feature-card interactive ${activeFeatureIndex === i ? 'active' : ''}`}
                onClick={() => setActiveFeatureIndex(i)}
              >
                <div className="card-head">
                  <span style={{ color: activeFeatureIndex === i ? '#ffffff' : '#888888' }}>{f.icon}</span> 
                  <h3 style={{ color: activeFeatureIndex === i ? '#ffffff' : '#888888' }}>{f.title}</h3>
                </div>
                {activeFeatureIndex === i && <p>{f.description}</p>}
              </div>
            ))}
          </div>

          <div className="terminal-display hero-visual" style={{ position: 'sticky', top: '100px' }}>
            <div className="terminal-window fixed-height">
              <div className="terminal-header">
                <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
                <span className="title mono-font">{architectureFeatures[activeFeatureIndex].terminalTitle}</span>
              </div>
              <div key={activeFeatureIndex} className="terminal-body mono-font">
                {architectureFeatures[activeFeatureIndex].terminalLogs}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: '#030303', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="section-header">
          <h2 className="mono-font">{'// PROOF_OF_CONCEPT'}</h2>
          <p>Comprueba en vivo el principio "Zero-Knowledge".</p>
        </div>

        <div className="flex-grid">
          <div className="feature-card col">
            <Terminal size={32} style={{ color: '#fff', marginBottom: '1.5rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Tu Dispositivo (Local)</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              Escribe un secreto aquí. Este texto se procesa en tu navegador y <strong>nunca</strong> viaja por internet en texto plano.
            </p>
            <input 
              type="text" 
              className="mono-font"
              placeholder="Ej. Mi código es 1234..."
              value={demoSecret}
              onChange={(e) => setDemoSecret(e.target.value)}
              style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #333', color: '#fff', outline: 'none' }}
            />
          </div>

          <div className="hero-visual col">
            <div className="terminal-window" style={{ height: '100%' }}>
              <div className="terminal-header">
                <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
                <span className="title mono-font">server_database_view</span>
              </div>
              <div className="terminal-body mono-font">
                <p><span className="prompt">~ $</span> select * from vaults where id='tu_usuario'</p>
                {demoSecret ? (
                  <>
                    <p className="dimmed" style={{marginTop: '1rem'}}>Datos interceptados en la base de datos:</p>
                    <p style={{ color: '#ff4444', wordBreak: 'break-all', margin: '1rem 0' }}>{hashedSecret}</p>
                    <p className="success">[BLIND] El servidor no tiene la llave para leer esto.</p>
                  </>
                ) : (
                  <p className="typing-effect" style={{marginTop: '1rem'}}>A la espera de carga útil cifrada...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="security-map section-padding">
        <div className="section-header centered">
          <GlobeLock size={48} style={{ margin: '0 auto 1.5rem auto', color: '#fff' }} />
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: '#fff' }}>Matemáticamente a prueba de brechas.</h2>
          <p style={{ maxWidth: '800px', margin: '0 auto', color: '#888', fontSize: '1.1rem' }}>
            El modelo de amenazas asume por defecto que nuestro servidor ha sido comprometido. 
            Tu seguridad no depende de firewalls, depende de las leyes inquebrantables de la matemática.
          </p>
        </div>

        <div className="node-pipeline-container">
          <div className="pipeline-line"></div>
          <div className="nodes-wrapper">
            {[
              { id: 0, title: 'LOCAL', icon: <Laptop /> },
              { id: 1, title: 'RAM', icon: <Cpu /> },
              { id: 2, title: 'RED', icon: <Network /> },
              { id: 3, title: 'SERVER', icon: <Server /> }
            ].map((node, idx) => (
              <div 
                key={node.id} 
                className={`node-item ${activeFlowStep === idx ? 'active' : ''}`}
                onClick={() => setActiveFlowStep(idx)}
                onMouseEnter={() => setActiveFlowStep(idx)}
              >
                <div className="node-circle">{node.icon}</div>
                <span className="mono-font" style={{letterSpacing: '2px'}}>{node.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="node-details-card">
           <div className="details-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <LockKeyhole size={18} color="#fff" />
                <h3 className="mono-font" style={{ margin: 0, fontSize: '0.9rem', color: '#fff', letterSpacing: '1px' }}>
                  FASE_0{activeFlowStep + 1} // ANALYTICS
                </h3>
              </div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0 0 1rem 0', color: '#fff' }}>
                {activeFlowStep === 0 && "1. Ingreso Local"}
                {activeFlowStep === 1 && "2. Cifrado en RAM"}
                {activeFlowStep === 2 && "3. Transmisión Opaca"}
                {activeFlowStep === 3 && "4. Almacenaje Ciego"}
              </h4>
              <p style={{ color: '#888', lineHeight: '1.8', fontSize: '0.95rem' }}>
                {activeFlowStep === 0 && "El usuario interactúa con la interfaz. La Master Password existe únicamente en el contexto de lectura del navegador."}
                {activeFlowStep === 1 && "El algoritmo Argon2id genera una llave de 256-bits. XChaCha20-Poly1305 toma tus datos y los transforma en ruido matemático."}
                {activeFlowStep === 2 && "El paquete cifrado es enviado al servidor a través de TLS 1.3. Cualquier intercepción solo capturará cadenas aleatorias."}
                {activeFlowStep === 3 && "La base de datos recibe el ruido criptográfico. Si un atacante roba nuestros discos, tardaría milenios en descifrar un bloque."}
              </p>
           </div>
           
           <div className="details-visual">
              <span className="mono-font" style={{ fontSize: '0.7rem', color: '#555', marginBottom: '1.5rem', display: 'block' }}>
                {'>'} X-RAY_PAYLOAD_INSPECTOR
              </span>
              <div className="mono-font" style={{ fontSize: '0.9rem', lineHeight: '1.6', textAlign: 'left' }}>
                {activeFlowStep === 0 && (
                  <div>
                    <span style={{ color: '#666' }}>const</span> p = <span style={{ color: '#27c93f' }}>"Mi contraseña"</span>;<br/><br/>
                    <span style={{ color: '#ffbd2e' }}>// STATUS: TEXTO PLANO [VULNERABLE]</span>
                  </div>
                )}
                {activeFlowStep === 1 && (
                  <div>
                    <span style={{ color: '#666' }}>[sodium]</span> derive_key(master_pwd)<br />
                    <span style={{ color: '#666' }}>[sodium]</span> encrypt(payload, key)<br /><br />
                    <span style={{ color: '#ffbd2e' }}>// STATUS: DESTRUYENDO LEGIBILIDAD...</span>
                  </div>
                )}
                {activeFlowStep === 2 && (
                  <div style={{ color: '#888' }}>
                    <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/>
                    POST /api/vault HTTP/2<br />
                    Body: {"{"} data: <span style={{ color: '#fff' }}>"U2F..."</span> {"}"}<br /><br />
                    <span style={{ color: '#27c93f' }}>// STATUS: VIAJANDO ENCAPSULADO</span>
                  </div>
                )}
                {activeFlowStep === 3 && (
                  <div style={{ color: '#ff4444' }}>
                    0x7b226976223a2238...<br /><br />
                    <span style={{ color: '#555' }}>// STATUS: ALMACENAMIENTO CIEGO.</span>
                  </div>
                )}
              </div>
           </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="cta-box">
          <h2 className="mono-font">READY_TO_ENCRYPT?</h2>
          <p>Toma el control absoluto de tus credenciales hoy mismo.</p>
          <Link to="/register" className="btn-primary block">Crear Bóveda Segura</Link>
        </div>
        <div className="footer-bottom mono-font">
          <span>© {new Date().getFullYear()} NORTEDEV.CL - ZeroKnowledge Vault.</span>
          <span>System v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;