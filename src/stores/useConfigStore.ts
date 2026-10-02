import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfigState {
  backgroundImage: string | null;
  backgroundLibrary: string[];
  setBackgroundImage: (url: string | null) => void;
  fetchBackgrounds: () => Promise<void>;
  uploadBackground: (file: File) => Promise<void>;
  deleteBackground: (path: string) => Promise<void>;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      backgroundImage: null,
      backgroundLibrary: [],

      setBackgroundImage: async (url) => {
        set({ backgroundImage: url });
        try {
          await fetch('/api/backgrounds/active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: url }),
          });
        } catch {}
      },

      fetchBackgrounds: async () => {
        try {
          const res = await fetch('/api/backgrounds');
          if (!res.ok) return;
          const data = await res.json();
          set({ backgroundLibrary: data.backgrounds || [] });
          
          const activeRes = await fetch('/api/backgrounds/active');
          if (activeRes.ok) {
            const activeData = await activeRes.json();
            if (activeData.path !== undefined) {
              set({ backgroundImage: activeData.path });
            }
          }
        } catch {}
      },

      uploadBackground: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/backgrounds', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        set((state) => ({
          backgroundLibrary: [...state.backgroundLibrary, data.path],
          backgroundImage: data.path,
        }));
      },

      deleteBackground: async (filePath: string) => {
        const filename = filePath.split('/').pop()!;
        await fetch('/api/backgrounds', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename }),
        });
        set((state) => ({
          backgroundLibrary: state.backgroundLibrary.filter((p) => p !== filePath),
          backgroundImage: state.backgroundImage === filePath ? null : state.backgroundImage,
        }));
      },
    }),
    {
      name: 'codak-config-storage',
      // Only persist the active background URL, not the library (fetched from server)
      partialize: (state) => ({ backgroundImage: state.backgroundImage }),
    }
  )
);
