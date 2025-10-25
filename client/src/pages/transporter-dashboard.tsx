import { useState } from "react";

export default function TransporterDashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem("camionback_user") || "{}"));

  return (
    <div style={{ minHeight: '100vh', background: '#0a2540', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px' }}>
        <h1 style={{ color: '#00d4b2', fontSize: '28px', marginBottom: '20px' }}>
          Dashboard Transporteur
        </h1>
        
        <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontSize: '16px' }}>
            <strong>Utilisateur:</strong> {user.name || 'Non connecté'}
          </p>
          <p style={{ margin: '10px 0 0 0', fontSize: '16px' }}>
            <strong>Rôle:</strong> {user.role || 'N/A'}
          </p>
        </div>

        <div style={{ background: '#e8f4f1', padding: '20px', borderRadius: '6px', border: '2px solid #00d4b2' }}>
          <h2 style={{ color: '#0a2540', fontSize: '20px', marginTop: 0 }}>
            ✅ Dashboard chargé avec succès
          </h2>
          <p style={{ color: '#555', lineHeight: '1.6' }}>
            Le composant de base fonctionne. Je vais maintenant restaurer progressivement toutes les fonctionnalités :
          </p>
          <ul style={{ color: '#555', lineHeight: '1.8' }}>
            <li>✓ Composant de base OK</li>
            <li>⏳ Imports des composants UI...</li>
            <li>⏳ Hooks et queries...</li>
            <li>⏳ Onglets et filtres...</li>
            <li>⏳ Actions et dialogs...</li>
          </ul>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '15px' }}>
            Veuillez patienter 30 secondes, je restaure tout progressivement...
          </p>
        </div>
      </div>
    </div>
  );
}
