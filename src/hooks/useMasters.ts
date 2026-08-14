import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface WorshipfulMaster {
  id: string;
  name: string;
  installation_year: number;
  term_start_date: string;
  term_end_date?: string;
  bio?: string;
  achievements?: string;
  photo_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useMasters = () => {
  const [masters, setMasters] = useState<WorshipfulMaster[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMasters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('worshipful_masters')
        .select('*')
        .order('installation_year', { ascending: false });

      if (error) throw error;
      setMasters(data || []);
    } catch (error) {
      console.error('Error loading masters:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar mestres',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createMaster = async (masterData: Omit<WorshipfulMaster, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('worshipful_masters')
        .insert([masterData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Mestre criado com sucesso',
      });

      await loadMasters();
      return data;
    } catch (error) {
      console.error('Error creating master:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar mestre',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateMaster = async (id: string, masterData: Partial<WorshipfulMaster>) => {
    try {
      const { data, error } = await supabase
        .from('worshipful_masters')
        .update(masterData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Mestre atualizado com sucesso',
      });

      await loadMasters();
      return data;
    } catch (error) {
      console.error('Error updating master:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar mestre',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteMaster = async (id: string) => {
    try {
      const { error } = await supabase
        .from('worshipful_masters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Mestre excluído com sucesso',
      });

      await loadMasters();
    } catch (error) {
      console.error('Error deleting master:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir mestre',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const uploadMasterImage = async (masterId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${masterId}-${Date.now()}.${fileExt}`;
      const filePath = `${masterId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('masters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('masters')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadMasters();
  }, []);

  return {
    masters,
    loading,
    loadMasters,
    createMaster,
    updateMaster,
    deleteMaster,
    uploadMasterImage,
  };
};
