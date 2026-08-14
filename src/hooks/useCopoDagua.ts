import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CopoDaguaEvent {
  id: string;
  month: string;
  event_date: string;
  day_of_week: string;
  session_type: string;
  session_degree?: string;
  study_time?: string;
  start_time: string;
  water_glass_group: string;
  created_at: string;
  updated_at: string;
}

export const useCopoDagua = () => {
  const [events, setEvents] = useState<CopoDaguaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('copo_dagua_calendar')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading copo dagua events:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar eventos do Copo D\'água',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<CopoDaguaEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('copo_dagua_calendar')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso',
      });

      await loadEvents();
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar evento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<CopoDaguaEvent>) => {
    try {
      const { data, error } = await supabase
        .from('copo_dagua_calendar')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Evento atualizado com sucesso',
      });

      await loadEvents();
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar evento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('copo_dagua_calendar')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Evento excluído com sucesso',
      });

      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir evento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteMultiple = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('copo_dagua_calendar')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${ids.length} evento(s) excluído(s) com sucesso`,
      });

      await loadEvents();
    } catch (error) {
      console.error('Error deleting multiple events:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir eventos',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteAll = async () => {
    try {
      const { error } = await supabase
        .from('copo_dagua_calendar')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Todos os eventos foram excluídos com sucesso',
      });

      await loadEvents();
    } catch (error) {
      console.error('Error deleting all events:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir todos os eventos',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return {
    events,
    loading,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    deleteMultiple,
    deleteAll,
  };
};
