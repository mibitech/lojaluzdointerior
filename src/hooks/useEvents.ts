import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  is_public: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EventImage {
  id: string;
  event_id: string;
  image_url: string;
  file_name?: string;
  display_order: number;
  created_at: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar eventos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('events')
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

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      const { data, error } = await supabase
        .from('events')
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
      // First delete related images
      const { error: imagesError } = await supabase
        .from('event_images')
        .delete()
        .eq('event_id', id);

      if (imagesError) throw imagesError;

      // Then delete the event
      const { error } = await supabase
        .from('events')
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

  const uploadEventImage = async (eventId: string, file: File, displayOrder: number = 0) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}-${Date.now()}.${fileExt}`;
      const filePath = `${eventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('event_images')
        .insert([{
          event_id: eventId,
          image_url: publicUrl,
          display_order: displayOrder,
        }]);

      if (dbError) throw dbError;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const getEventImages = async (eventId: string): Promise<EventImage[]> => {
    try {
      const { data, error } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading event images:', error);
      return [];
    }
  };

  const deleteEventImage = async (imageId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const filePath = imageUrl.split('/events/')[1];

      if (filePath) {
        await supabase.storage
          .from('events')
          .remove([filePath]);
      }

      const { error } = await supabase
        .from('event_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Imagem excluída com sucesso',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir imagem',
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
    uploadEventImage,
    getEventImages,
    deleteEventImage,
  };
};
