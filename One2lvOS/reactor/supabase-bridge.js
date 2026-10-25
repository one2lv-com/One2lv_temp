/**
 * Supabase Bridge - Lumenis Reactor Core
 * Connects the Reactor's memory, tasks, and state to Supabase persistent storage.
 */

(function(window) {
    'use strict';

    // Supabase CDN client — injected from .env via meta tags or window config
    const SUPABASE_URL = window.__ONE2LVOS_CONFIG__?.SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = window.__ONE2LVOS_CONFIG__?.SUPABASE_ANON_KEY || '';

    class SupabaseBridge {
        constructor() {
            this.client = null;
            this.ready = false;
            this._channel = null;
        }

        async init() {
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                console.warn('[SupabaseBridge] Missing SUPABASE_URL or SUPABASE_ANON_KEY — bridge disabled');
                return false;
            }

            // Dynamically load Supabase JS SDK if not already present
            if (!window.supabase) {
                await this._loadSDK();
            }

            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            this.ready = true;
            console.log('[SupabaseBridge] Connected to Supabase');
            return true;
        }

        _loadSDK() {
            return new Promise((resolve, reject) => {
                if (document.querySelector('script[data-supabase-sdk]')) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
                script.setAttribute('data-supabase-sdk', '1');
                script.onload = resolve;
                script.onerror = () => reject(new Error('Supabase SDK load failed'));
                document.head.appendChild(script);
            });
        }

        // -----------------------------------------------------------------------
        // REACTOR STATE
        // -----------------------------------------------------------------------

        async saveReactorState(state) {
            if (!this.ready) return null;
            const { data, error } = await this.client
                .from('reactor_states')
                .upsert({
                    id: 'lumenis_core',
                    state,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
            if (error) console.error('[SupabaseBridge] saveReactorState error:', error.message);
            return data;
        }

        async loadReactorState() {
            if (!this.ready) return null;
            const { data, error } = await this.client
                .from('reactor_states')
                .select('*')
                .eq('id', 'lumenis_core')
                .single();
            if (error) {
                console.warn('[SupabaseBridge] loadReactorState:', error.message);
                return null;
            }
            console.log('[SupabaseBridge] Reactor state loaded from Supabase');
            return data?.state || null;
        }

        // -----------------------------------------------------------------------
        // REACTOR TASKS
        // -----------------------------------------------------------------------

        async saveTask(task) {
            if (!this.ready) return null;
            const { data, error } = await this.client
                .from('reactor_tasks')
                .upsert({
                    id: task.id,
                    task_data: task,
                    status: task.status,
                    created_at: new Date(task.created).toISOString(),
                    updated_at: new Date(task.updated).toISOString()
                }, { onConflict: 'id' });
            if (error) console.error('[SupabaseBridge] saveTask error:', error.message);
            return data;
        }

        async loadTasks(filter = {}) {
            if (!this.ready) return [];
            let query = this.client.from('reactor_tasks').select('*');
            if (filter.status) query = query.eq('status', filter.status);
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) {
                console.error('[SupabaseBridge] loadTasks error:', error.message);
                return [];
            }
            return (data || []).map(row => row.task_data);
        }

        // -----------------------------------------------------------------------
        // LONG-TERM MEMORY
        // -----------------------------------------------------------------------

        async storeMemory(key, value) {
            if (!this.ready) return null;
            const { data, error } = await this.client
                .from('reactor_memory')
                .upsert({
                    key,
                    value: JSON.stringify(value),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
            if (error) console.error('[SupabaseBridge] storeMemory error:', error.message);
            return data;
        }

        async recallMemory(key) {
            if (!this.ready) return null;
            const { data, error } = await this.client
                .from('reactor_memory')
                .select('value')
                .eq('key', key)
                .single();
            if (error) return null;
            try { return JSON.parse(data.value); } catch { return data.value; }
        }

        async forgetMemory(key) {
            if (!this.ready) return;
            await this.client.from('reactor_memory').delete().eq('key', key);
        }

        async loadAllMemory() {
            if (!this.ready) return [];
            const { data, error } = await this.client
                .from('reactor_memory')
                .select('key, value');
            if (error) return [];
            return (data || []).map(row => {
                try { return { key: row.key, value: JSON.parse(row.value) }; }
                catch { return { key: row.key, value: row.value }; }
            });
        }

        // -----------------------------------------------------------------------
        // REALTIME SUBSCRIPTIONS
        // -----------------------------------------------------------------------

        subscribeToReactorChanges(callback) {
            if (!this.ready) return null;
            this._channel = this.client
                .channel('reactor_realtime')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'reactor_states'
                }, payload => {
                    console.log('[SupabaseBridge] Reactor state updated remotely');
                    callback(payload);
                })
                .subscribe();
            return this._channel;
        }

        unsubscribe() {
            if (this._channel) {
                this.client.removeChannel(this._channel);
                this._channel = null;
            }
        }
    }

    window.SupabaseBridge = new SupabaseBridge();

})(window);
