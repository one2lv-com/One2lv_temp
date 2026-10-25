/**
 * State Loader
 * Manages system state persistence and restoration from multiple sources
 */

class StateLoader {
    constructor() {
        this.sources = [
            { name: 'Supabase reactor state', load: () => this.loadFromSupabase() },
            { name: 'localStorage autosave', load: () => this.loadFromLocalStorage() },
            { name: 'Registry snapshot', load: () => this.loadFromRegistry() },
            { name: 'snapshot.json', load: () => this.loadFromJSON() },
            { name: 'embedded image payload', load: () => this.loadFromImage() },
            { name: 'emergency default', load: () => this.loadDefault() }
        ];

        this.state = null;
    }

    async restore() {
        console.log('[StateLoader] Beginning state restoration');

        for (const source of this.sources) {
            try {
                console.log(`[StateLoader] Trying: ${source.name}`);
                this.state = await source.load();

                if (this.state) {
                    console.log(`[StateLoader] Successfully loaded from: ${source.name}`);
                    return this.state;
                }
            } catch (error) {
                console.warn(`[StateLoader] ${source.name} failed:`, error.message);
            }
        }

        console.error('[StateLoader] All sources failed, using emergency default');
        return this.loadDefault();
    }

    async loadFromLocalStorage() {
        const data = localStorage.getItem('One2lvOS_autosave');

        if (!data) {
            return null;
        }

        const state = JSON.parse(data);
        const age = Date.now() - state.timestamp;

        // Auto-save should be recent (within 24 hours)
        if (age > 24 * 60 * 60 * 1000) {
            console.warn('[StateLoader] localStorage autosave too old');
            return null;
        }

        return state;
    }

    async loadFromRegistry() {
        // Load from IndexedDB registry
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('One2lvOS_Registry', 1);

            request.onerror = () => reject(new Error('IndexedDB open failed'));

            request.onsuccess = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('snapshots')) {
                    resolve(null);
                    return;
                }

                const transaction = db.transaction(['snapshots'], 'readonly');
                const store = transaction.objectStore('snapshots');
                const getRequest = store.get('latest');

                getRequest.onsuccess = () => {
                    resolve(getRequest.result || null);
                };

                getRequest.onerror = () => resolve(null);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('snapshots')) {
                    db.createObjectStore('snapshots');
                }
            };
        });
    }

    async loadFromJSON() {
        try {
            const response = await fetch('Assets/snapshots/snapshot.json');

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            return null;
        }
    }

    async loadFromSupabase() {
        if (!window.SupabaseBridge) return null;
        if (!window.SupabaseBridge.ready) {
            await window.SupabaseBridge.init();
        }
        return await window.SupabaseBridge.loadReactorState();
    }

    async loadFromImage() {
        // Steganographic image payload (advanced feature)
        // This would decode state data hidden in an image using LSB steganography
        // For now, return null (not implemented)
        return null;
    }

    loadDefault() {
        console.log('[StateLoader] Loading emergency defaults');

        return {
            version: '0.9',
            timestamp: Date.now(),
            modules: {
                reactor: { enabled: true },
                registry: { enabled: true },
                desktop: { enabled: true },
                infinityGlasses: { enabled: true }
            },
            registry: {
                nodes: [],
                connections: []
            },
            desktop: {
                windows: [],
                layout: 'default'
            },
            user: {
                preferences: {
                    theme: 'neon-cyan',
                    notifications: true,
                    autoSave: true
                }
            }
        };
    }

    async save(state) {
        // Save to localStorage
        try {
            state.timestamp = Date.now();
            localStorage.setItem('One2lvOS_autosave', JSON.stringify(state));
            console.log('[StateLoader] Auto-saved to localStorage');
        } catch (error) {
            console.error('[StateLoader] localStorage save failed:', error);
        }

        // Save to IndexedDB
        try {
            await this.saveToRegistry(state);
            console.log('[StateLoader] Saved to Registry');
        } catch (error) {
            console.error('[StateLoader] Registry save failed:', error);
        }

        // Save to Supabase
        if (window.SupabaseBridge?.ready) {
            try {
                await window.SupabaseBridge.saveReactorState(state);
                console.log('[StateLoader] Saved to Supabase');
            } catch (error) {
                console.error('[StateLoader] Supabase save failed:', error);
            }
        }
    }

    async saveToRegistry(state) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('One2lvOS_Registry', 1);

            request.onerror = () => reject(new Error('IndexedDB open failed'));

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['snapshots'], 'readwrite');
                const store = transaction.objectStore('snapshots');

                store.put(state, 'latest');

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(new Error('Transaction failed'));
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('snapshots')) {
                    db.createObjectStore('snapshots');
                }
            };
        });
    }
}

// Initialize state loader
window.StateLoader = new StateLoader();
