export default function TransporterDashboard() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a2540', 
      color: 'white',
      padding: '40px',
      fontFamily: 'system-ui'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: '#1a3a5a',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#00ff99' }}>
          ✅ DASHBOARD CHARGÉ
        </h1>
        <p style={{ fontSize: '18px', marginBottom: '15px' }}>
          Le composant fonctionne maintenant !
        </p>
        <p style={{ fontSize: '14px', color: '#aaa' }}>
          Je vais restaurer progressivement les fonctionnalités...
        </p>
      </div>
    </div>
  );
}
