import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

// Extend Window interface to include deferredPrompt
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

/**
 * PWA Install Button Component (React version - backup for vanilla JS)
 * Note: The main install button is now in index.html as vanilla JS
 * This component remains as a fallback and works with the global deferredPrompt
 */
export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if vanilla JS already created the button
    if (document.getElementById('pwa-install-banner')) {
      console.log('ℹ️ Bouton PWA vanilla JS déjà présent, composant React désactivé');
      return;
    }

    // Check if global deferredPrompt exists from vanilla JS
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      setShowButton(true);
      console.log('📱 deferredPrompt global détecté, bouton React activé');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Don't prevent default if vanilla JS already handles it
      if (!document.getElementById('pwa-install-banner')) {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowButton(true);
        console.log('📱 PWA peut être installée - bouton React affiché');
      }
    };

    // Listen for custom pwa-installable event from pwa.ts
    const handlePWAInstallable = (e: Event) => {
      const customEvent = e as CustomEvent;
      setDeferredPrompt(customEvent.detail);
      setShowButton(true);
      console.log('📱 Événement PWA-installable reçu');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowButton(false);
      setDeferredPrompt(null);
      console.log('✅ CamionBack installé avec succès (React)');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || window.deferredPrompt;
    
    if (!prompt) {
      console.warn('⚠️ Aucun prompt d\'installation disponible');
      return;
    }

    try {
      // Show the install prompt
      prompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Utilisateur a accepté l\'installation (React)');
      } else {
        console.log('ℹ️ Utilisateur a refusé l\'installation (React)');
      }
      
      // Hide the button
      setShowButton(false);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation:', error);
    }
  };

  // Don't show button if not installable, already installed, or vanilla JS button exists
  if (!showButton || document.getElementById('pwa-install-banner')) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      data-testid="button-install-pwa"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#17cfcf',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        padding: '12px 20px',
        fontSize: '15px',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(23, 207, 207, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(23, 207, 207, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(23, 207, 207, 0.4)';
      }}
    >
      <Smartphone className="w-5 h-5" />
      Installer CamionBack
    </button>
  );
}
