
import { useState, useEffect } from "react";

interface HealthCheck {
  status: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-pentag-dark mb-2">
          PenTAG Resource Planner
        </h1>
        <p className="text-pentag-primary mb-6">
          University of Exeter
        </p>
        <div className="border rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">API Status</p>
          {health ? (
            <p className="text-pentag-accent font-semibold">
              {health.status === "ok" ? "Connected" : "Error"}
            </p>
          ) : error ? (
            <p className="text-red-500 font-semibold">
              Not connected &mdash; run npm run dev:server
            </p>
          ) : (
            <p className="text-gray-400">Checking...</p>
          )}
        </div>
        <p className="text-sm text-gray-400">
          If you can see this page with a green &ldquo;Connected&rdquo; status,
          everything is working. The dashboard will be built here next.
        </p>
      </div>
    </div>
  );
}

export default App;

