const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Save runtime state to Supabase
async function saveRuntimeState(state) {
  try {
    const { data, error } = await supabase
      .from('runtime_states')
      .upsert({
        id: 'lumenis_core',
        state: state,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    console.log('Runtime state saved to Supabase');
    return data;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
  }
}

// Load runtime state from Supabase
async function loadRuntimeState() {
  try {
    const { data, error } = await supabase
      .from('runtime_states')
      .select('*')
      .eq('id', 'lumenis_core')
      .single();

    if (error) throw error;
    console.log('Runtime state loaded from Supabase');
    return data?.state || {};
  } catch (error) {
    console.error('Error loading from Supabase:', error);
    return {};
  }
}

// Save agent activity
async function saveAgentActivity(agentName, activity) {
  try {
    const { data, error } = await supabase
      .from('agent_activity')
      .insert({
        agent_name: agentName,
        activity: activity,
        timestamp: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving agent activity:', error);
  }
}

// Get recent agent activity
async function getAgentActivity(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('agent_activity')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting agent activity:', error);
    return [];
  }
}

// Realtime subscription for runtime state changes
function subscribeToRuntimeChanges(callback) {
  const channel = supabase
    .channel('runtime_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'runtime_states'
      },
      (payload) => {
        console.log('Runtime state changed:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

module.exports = {
  supabase,
  saveRuntimeState,
  loadRuntimeState,
  saveAgentActivity,
  getAgentActivity,
  subscribeToRuntimeChanges
};
