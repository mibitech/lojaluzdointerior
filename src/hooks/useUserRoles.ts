import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export interface MemberAccess {
  profileId: string;
  userId: string | null;
  cim: string | null;
  fullName: string;
  email: string | null;
  isDirectorMember: boolean;
  roles: AppRole[];
}

export const useUserRoles = () => {
  const [members, setMembers] = useState<MemberAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);

      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, cim, full_name, email, is_director_member')
          .order('full_name', { ascending: true }),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const rolesByUser = new Map<string, AppRole[]>();
      for (const row of rolesResult.data || []) {
        const current = rolesByUser.get(row.user_id) || [];
        current.push(row.role);
        rolesByUser.set(row.user_id, current);
      }

      setMembers(
        (profilesResult.data || []).map((profile) => ({
          profileId: profile.id,
          userId: profile.user_id ?? null,
          cim: profile.cim ?? null,
          fullName: profile.full_name || 'Nome não informado',
          email: profile.email ?? null,
          isDirectorMember: profile.is_director_member ?? false,
          roles: profile.user_id ? rolesByUser.get(profile.user_id) || [] : [],
        }))
      );
    } catch (error) {
      console.error('Error loading user roles:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar acessos dos membros',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const grantRole = async (userId: string, role: AppRole) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .maybeSingle();

      if (error) throw error;
      // RLS bloqueado retorna zero linhas sem erro — não trate como sucesso
      if (!data) {
        throw new Error('Nenhum acesso concedido. Apenas administradores podem alterar papéis.');
      }

      toast({ title: 'Sucesso', description: 'Acesso concedido' });
      await loadMembers();
    } catch (error) {
      console.error('Error granting role:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao conceder acesso',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const revokeRole = async (userId: string, role: AppRole) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Nenhum acesso revogado. Apenas administradores podem alterar papéis.');
      }

      toast({ title: 'Sucesso', description: 'Acesso revogado' });
      await loadMembers();
    } catch (error) {
      console.error('Error revoking role:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao revogar acesso',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const setDirectorMember = async (profileId: string, value: boolean) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_director_member: value })
        .eq('id', profileId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('Nenhuma linha foi atualizada. Verifique suas permissões.');
      }

      toast({
        title: 'Sucesso',
        description: value ? 'Membro adicionado à diretoria' : 'Membro removido da diretoria',
      });
      await loadMembers();
    } catch (error) {
      console.error('Error updating commission member:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao atualizar diretoria',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return {
    members,
    loading,
    loadMembers,
    grantRole,
    revokeRole,
    setDirectorMember,
  };
};
