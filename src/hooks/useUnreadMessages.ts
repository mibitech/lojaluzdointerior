import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMessages = () => {
  const { user, isMember } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    if (!user || !isMember) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      // Get all messages for the user
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .or(`recipient_id.eq.${user.id},recipient_id.is.null`);

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Get read messages
      const { data: readMessages, error: readsError } = await supabase
        .from('message_reads')
        .select('message_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      const readMessageIds = new Set(readMessages?.map(r => r.message_id) || []);
      const unread = messages.filter(m => !readMessageIds.has(m.id)).length;
      
      console.log('Unread count:', unread, 'Total messages:', messages.length, 'Read messages:', readMessageIds.size);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [user, isMember]);

  return { unreadCount, loading, refreshUnreadCount: fetchUnreadCount };
};
