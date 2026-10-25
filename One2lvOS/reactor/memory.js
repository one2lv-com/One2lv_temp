// Reactor Memory Module

(function(window) {
    'use strict';

    class ReactorMemory {
        constructor() {
            this.shortTerm = new Map();
            this.longTerm = new Map();
        }

        store(key, value, retention = 'shortTerm') {
            const entry = {
                key,
                value,
                retention,
                timestamp: Date.now()
            };

            if (retention === 'shortTerm') {
                this.shortTerm.set(key, entry);
            } else {
                this.longTerm.set(key, entry);
                // Persist long-term memory to Supabase
                if (window.SupabaseBridge?.ready) {
                    window.SupabaseBridge.storeMemory(key, value).catch(e =>
                        console.error('[ReactorMemory] Supabase store failed:', e)
                    );
                }
            }

            EventBus.emit('memory:store', { key, retention });
        }

        async recall(key) {
            const local = this.shortTerm.get(key)?.value || this.longTerm.get(key)?.value;
            if (local !== undefined) return local;

            // Fallback: pull from Supabase long-term store
            if (window.SupabaseBridge?.ready) {
                const remote = await window.SupabaseBridge.recallMemory(key);
                if (remote !== null) {
                    this.longTerm.set(key, { key, value: remote, retention: 'longTerm', timestamp: Date.now() });
                    return remote;
                }
            }
            return null;
        }

        forget(key) {
            this.shortTerm.delete(key);
            this.longTerm.delete(key);
            if (window.SupabaseBridge?.ready) {
                window.SupabaseBridge.forgetMemory(key).catch(() => {});
            }
        }

        async hydrateFromSupabase() {
            if (!window.SupabaseBridge?.ready) return;
            const entries = await window.SupabaseBridge.loadAllMemory();
            for (const { key, value } of entries) {
                if (!this.longTerm.has(key)) {
                    this.longTerm.set(key, { key, value, retention: 'longTerm', timestamp: Date.now() });
                }
            }
            Logger.info('ReactorMemory', `Hydrated ${entries.length} long-term memories from Supabase`);
        }

        prune() {
            const now = Date.now();
            const ttl = 3600000; // 1 hour

            for (const [key, entry] of this.shortTerm) {
                if (now - entry.timestamp > ttl) {
                    this.shortTerm.delete(key);
                }
            }

            Logger.debug('ReactorMemory', 'Pruned old short-term memories');
        }
    }

    window.ReactorMemory = new ReactorMemory();

})(window);
