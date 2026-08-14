import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id?: string;
  cim?: string | null;
  full_name?: string;
  position?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  masonic_degree: number;
  is_director_member: boolean;
  commission?: string;
  member_status: string;
  created_at: string;
  updated_at: string;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar perfis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id: string, profileData: Partial<Profile>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;

      // RLS bloqueado retorna zero linhas sem erro — não trate como sucesso
      if (!data) {
        throw new Error('Nenhuma linha foi atualizada. Verifique suas permissões.');
      }

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso',
      });

      await loadProfiles();
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao atualizar perfil',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const uploadProfileImage = async (profileId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `${profileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  return {
    profiles,
    loading,
    loadProfiles,
    updateProfile,
    uploadProfileImage,
  };
};
