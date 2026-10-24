import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, SupabaseClient, RealtimePostgresInsertPayload } from '@supabase/supabase-js';

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = (typeof __SUPABASE_URL__ !== 'undefined' ? __SUPABASE_URL__ : '').trim();
  const key = (typeof __SUPABASE_ANON_KEY__ !== 'undefined' ? __SUPABASE_ANON_KEY__ : '').trim();
  if (!url || !key || !url.startsWith('http')) return null;
  try {
    _supabase = createClient(url, key);
    return _supabase;
  } catch {
    return null;
  }
}

export interface CommandRecord {
  id?: number;
  action: string;
  target: string;
  source: string;
  created_at?: string;
}

export function useSupabase(onCommand?: (record: CommandRecord) => void) {
  const [status, setStatus] = useState<'CONNECTING' | 'ACTIVE' | 'OFFLINE'>('CONNECTING');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus('OFFLINE');
      setIsSubscribed(false);
      return;
    }

    const channel = supabase
      .channel('ai_commands_channel')
      .on<CommandRecord>(
        'postgres_changes' as const,
        { event: 'INSERT', schema: 'public', table: 'ai_commands' },
        (payload: RealtimePostgresInsertPayload<CommandRecord>) => {
          if (onCommandRef.current) {
            onCommandRef.current(payload.new as CommandRecord);
          }
        }
      )
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          setStatus('ACTIVE');
          setIsSubscribed(true);
        } else if (subStatus === 'CLOSED' || subStatus === 'CHANNEL_ERROR') {
          setStatus('OFFLINE');
          setIsSubscribed(false);
        } else {
          setStatus('CONNECTING');
          setIsSubscribed(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const insertCommand = useCallback(async (cmd: CommandRecord): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('ai_commands').insert([cmd]);
      return !error;
    } catch {
      return false;
    }
  }, []);

  return { status, isSubscribed, insertCommand };
}
