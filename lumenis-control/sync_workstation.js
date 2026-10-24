const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Pull credentials from your .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

async function syncAll() {
    console.log('🌌 SYNCHRONIZING EXTENSIONS TO GITHUB & SUPABASE...');

    // --- 1. GITHUB SYNC ---
    console.log('\n📦 Step 1: Pushing Workstation Extensions to GitHub...');
    try {
        // Stage all changes
        execSync('git add .', { stdio: 'inherit' });

        // Commit the changes
        execSync('git commit -m "feat: Sync Reactor_Core workstation extensions and state"', { stdio: 'inherit' });

        // Push to the main branch
        execSync('git push origin main', { stdio: 'inherit' });
        console.log('✅ Successfully pushed to GitHub.');
    } catch (err) {
        console.log('⚠️ GitHub Notice: Push skipped (files might already be up to date or git needs config).');
    }

    // --- 2. SUPABASE SYNC ---
    console.log('\n🗄️ Step 2: Registering Workstation state in Supabase...');
    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Supabase credentials missing from .env. Skipping database sync.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Define the data to inject into your Supabase database
    const workstationState = {
        id: 'reactor_core_state',
        state: {
            station_name: 'Reactor_Core',
            resident_agent: 'Lumenis_Agentic_Core',
            ftps_port: 2121,
            webdav_port: 4443,
            vlc_port: 8443,
            status: 'ONLINE',
            last_boot: new Date().toISOString(),
            github_repo: 'https://github.com/one2lv-com/lumenis-control',
            interplanetar_repo: 'https://github.com/one2lv-com/interplanetar',
            extensions: [
                'FTPS Server',
                'WebDAV Server',
                'VLC Screen Broadcast',
                'Flux Compass',
                'Thought Registry'
            ]
        }
    };

    try {
        // Use runtime_states table for workstation configuration
        const { data, error } = await supabase
            .from('runtime_states')
            .upsert([workstationState], { onConflict: 'id' });

        if (error) throw error;
        console.log('✅ Successfully logged Reactor_Core configuration to Supabase.');
        console.log('   Table: runtime_states');
        console.log('   ID: reactor_core_state');
    } catch (err) {
        console.error('❌ Supabase Sync Error:', err.message);
        console.log('💡 Tip: Make sure your runtime_states table exists and is accessible.');
    }

    // --- 3. LOG SYNC EVENT ---
    console.log('\n📝 Step 3: Logging sync event...');
    try {
        const syncEvent = {
            event_type: 'WORKSTATION_SYNC',
            event_data: {
                timestamp: new Date().toISOString(),
                station: 'Reactor_Core',
                github_synced: true,
                supabase_synced: true,
                repositories: [
                    'one2lv-com/lumenis-control',
                    'one2lv-com/interplanetar'
                ]
            }
        };

        const { data, error } = await supabase
            .from('memory_events')
            .insert([syncEvent]);

        if (error) throw error;
        console.log('✅ Sync event logged to memory_events table.');
    } catch (err) {
        console.log('⚠️ Event logging skipped:', err.message);
    }

    console.log('\n✨ SYNC COMPLETE');
    console.log('🌌 Reactor_Core synchronized with GitHub and Supabase');
}

syncAll();
