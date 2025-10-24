export default function TransporterDashboard() {
  console.log("🚛 MINIMAL TEST COMPONENT LOADED");
  
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">🚛</h1>
        <h2 className="text-4xl font-bold mb-2">Dashboard Transporteur</h2>
        <p className="text-2xl">Test Minimal - Ce composant fonctionne!</p>
        <div className="mt-8 p-4 bg-white/20 rounded-lg">
          <p className="text-xl">Si vous voyez ce message, le routage fonctionne.</p>
        </div>
      </div>
    </div>
  );
}
