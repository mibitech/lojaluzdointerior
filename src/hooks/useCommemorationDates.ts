import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CommemorationDate {
  id: string;
  profile_id: string;
  date: string;
  date_type: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export const useCommemorationDates = (profileId?: string) => {
  const [dates, setDates] = useState<CommemorationDate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDates = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('commemorative_dates')
        .select('*')
        .eq('profile_id', id)
        .order('date', { ascending: true });

      if (error) throw error;
      setDates(data || []);
    } catch (error) {
      console.error('Error loading commemoration dates:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar datas comemorativas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDate = async (dateData: Omit<CommemorationDate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('commemorative_dates')
        .insert(dateData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Data comemorativa adicionada',
      });

      if (profileId) await loadDates(profileId);
      return data;
    } catch (error) {
      console.error('Error creating date:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar data comemorativa',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateDate = async (id: string, dateData: Partial<CommemorationDate>) => {
    try {
      const { data, error } = await supabase
        .from('commemorative_dates')
        .update(dateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Data comemorativa atualizada',
      });

      if (profileId) await loadDates(profileId);
      return data;
    } catch (error) {
      console.error('Error updating date:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar data comemorativa',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteDate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('commemorative_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Data comemorativa removida',
      });

      if (profileId) await loadDates(profileId);
    } catch (error) {
      console.error('Error deleting date:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover data comemorativa',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (profileId) {
      loadDates(profileId);
      
      // Setup realtime subscription
      const channel = supabase
        .channel('commemorative-dates-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'commemorative_dates',
            filter: `profile_id=eq.${profileId}`
          },
          (payload) => {
            console.log('Commemorative date change detected:', payload);
            loadDates(profileId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profileId]);

  return {
    dates,
    loading,
    loadDates,
    createDate,
    updateDate,
    deleteDate,
  };
};
