import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogEntry {
  module: 'Financeiro' | 'Hospitalaria' | 'Secretaria' | 'Chancelaria' | 'Gestão';
  action: 'Criou' | 'Editou' | 'Excluiu' | 'Aprovou' | 'Negou' | 'Exportou' | 'Visualizou';
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user, fullName } = useAuth();

  const logAction = useCallback(async (entry: AuditLogEntry) => {
    if (!user) return;

    try {
      // Get user profile for position
      const { data: profile } = await supabase
        .from('profiles')
        .select('position')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabase.from('audit_logs' as any).insert({
        user_id: profile ? undefined : undefined, // We don't have profile.id easily, skip
        user_name: fullName || user.email || 'Desconhecido',
        user_position: profile?.position || null,
        module: entry.module,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId || null,
        entity_label: entry.entityLabel || null,
        previous_data: entry.previousData || null,
        new_data: entry.newData || null,
      } as any);
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }, [user, fullName]);

  return { logAction };
}
