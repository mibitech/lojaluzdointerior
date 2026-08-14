import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category: string;
  is_public: boolean;
  is_featured: boolean;
  event_date?: string;
  image_url?: string;
  partnerships?: string;
  results?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityImage {
  id: string;
  activity_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar atividades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([activityData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Atividade criada com sucesso',
      });

      await loadActivities();
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar atividade',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateActivity = async (id: string, activityData: Partial<Activity>) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update(activityData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Atividade atualizada com sucesso',
      });

      await loadActivities();
      return data;
    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar atividade',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Atividade excluída com sucesso',
      });

      await loadActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir atividade',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const uploadActivityImage = async (activityId: string, file: File, displayOrder: number = 0) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activityId}-${Date.now()}.${fileExt}`;
      const filePath = `${activityId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('activities')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('activities')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('activity_images')
        .insert([{
          activity_id: activityId,
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

  const getActivityImages = async (activityId: string): Promise<ActivityImage[]> => {
    try {
      const { data, error } = await supabase
        .from('activity_images')
        .select('*')
        .eq('activity_id', activityId)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading activity images:', error);
      return [];
    }
  };

  const deleteActivityImage = async (imageId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const filePath = imageUrl.split('/activities/')[1];

      if (filePath) {
        await supabase.storage
          .from('activities')
          .remove([filePath]);
      }

      const { error } = await supabase
        .from('activity_images')
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
    loadActivities();
  }, []);

  return {
    activities,
    loading,
    loadActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    uploadActivityImage,
    getActivityImages,
    deleteActivityImage,
  };
};
