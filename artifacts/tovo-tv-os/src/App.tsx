import React, { useState, useEffect } from 'react';
import { Play, ShieldAlert, Film, RefreshCw } from 'lucide-react';

export default function App() {
  const [movieId, setMovieId] = useState<string>('272');
  const [providerKey, setProviderKey] = useState<string>('vidsrc');
  const [streamUrl, setStreamUrl] = useState<string>('about:blank');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Communicates directly and uniquely with your private backend gateway framework
  const initializeAutomatedStream = async (targetId: string, currentProvider: string) => {
    if (!targetId) return;
    setLoading(true);
    setError(null);

    try {
      // Connects directly and exclusively to your local infrastructure service port
      const gatewayHost = `http://localhost:3000/api/route-stream?provider=${currentProvider}&id=${targetId}`;
      const response = await fetch(gatewayHost);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStreamUrl('about:blank');
      } else {
        setStreamUrl(data.destination);
      }
    } catch (err) {
      setError("Unable to resolve runtime tunnel validation parameters from your backend stream proxy.");
      setStreamUrl('about:blank');
    } finally {
      setLoading(false);
    }
  };

  // AUTOMATIC INITIALIZATION: Triggers parsing sequences instantly on rendering cycles
  useEffect(() => {
    initializeAutomatedStream(movieId, providerKey);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">

        {/* Isolated Core App Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <Film className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold text-white tracking-tight">
            Tovo TV-OS Platform <span className="text-slate-400 font-normal text-sm ml-2">Private Streaming Proxy Pipeline</span>
          </h1>
        </div>

        {/* Private Controller Controls Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Private Asset Tracking ID
            </label>
            <input
              type="text"
              value={movieId}
              onChange={(e) => setMovieId(e.target.value)}
              placeholder="Enter Private Token, e.g., 272"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Tunnel Fallback Route Choice
            </label>
            <select
              value={providerKey}
              onChange={(e) => setProviderKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="vidsrc">Private Route Alternative 1</option>
              <option value="embedcc">Private Route Alternative 2</option>
              <option value="embedsu">Private Route Alternative 3</option>
            </select>
          </div>
        </div>

        {/* Dispatch Action Execution Trigger Block */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={() => initializeAutomatedStream(movieId, providerKey)}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-medium text-sm py-2 px-6 rounded transition cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute Route
          </button>
        </div>

        {/* Local Stream Exception Monitor */}
        {error && (
          <div className="flex items-center gap-2 bg-red-950 border border-red-900 rounded-lg p-3 text-red-200 text-sm mb-4">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p><span className="font-semibold font-mono text-xs">ERR_PROXY:</span> {error}</p>
          </div>
        )}

        {/* Core Secure Iframe Frame Container Output */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 shadow-inner">
          <iframe
            id="tovo-isolated-viewscreen"
            src={streamUrl}
            className="absolute top-0 left-0 w-full h-full border-none"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms"
          ></iframe>
        </div>

      </div>
    </div>
  );
}
