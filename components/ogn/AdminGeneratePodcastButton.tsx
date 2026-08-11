'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

export default function AdminGeneratePodcastButton() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/podcast', {
        method: 'POST',
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Podcast generation initiated');
        window.location.reload();
      }
    } catch (err) {
      console.error('Error generating podcast:', err);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl gradient-hope px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      <span>Generate Episode</span>
    </button>
  );
}
