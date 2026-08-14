import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { MailOpen, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Message {
  id: string;
  title: string;
  content: string;
  created_at: string;
  recipient_id: string | null;
  message_reads?: Array<{
    read_at: string;
  }>;
}

export default function MemberMessages() {
  const { user, isMember } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUnreadCount } = useUnreadMessages();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Redirect to home if user is not a member
    if (!isMember && !loading) {
      navigate('/');
    }
  }, [isMember, loading, navigate]);

  useEffect(() => {
    if (isMember && user) {
      fetchMessages();
    }
  }, [isMember, user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data: allMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get all read records for the current user
      const { data: readRecords, error: readsError } = await supabase
        .from('message_reads')
        .select('message_id, read_at')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      // Map read records to messages
      const messagesWithReads = (allMessages || []).map(message => {
        const readRecord = readRecords?.find(r => r.message_id === message.id);
        return {
          ...message,
          message_reads: readRecord ? [{ read_at: readRecord.read_at }] : []
        };
      });

      setMessages(messagesWithReads);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mensagens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      // Insert the read record
      const { error } = await supabase
        .from('message_reads')
        .insert({
          message_id: messageId,
          user_id: user.id,
        });

      if (error && error.code !== '23505') { // Ignore unique constraint violations
        throw error;
      }

      // Update the local state immediately
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, message_reads: [{ read_at: new Date().toISOString() }] }
            : msg
        )
      );

      // Force refresh of unread count
      setTimeout(() => {
        refreshUnreadCount();
      }, 100);
    } catch (error: any) {
      toast({
        title: 'Erro ao marcar mensagem como lida',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
    
    if (!isMessageRead(message)) {
      await markAsRead(message.id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Force refresh unread count when closing
    setTimeout(() => {
      refreshUnreadCount();
    }, 100);
  };

  const isMessageRead = (message: Message) => {
    return message.message_reads && message.message_reads.length > 0;
  };

  if (!isMember) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Caixa Postal</h1>
          <p className="text-muted-foreground">
            Mensagens da comissão para você
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-4 md:p-6">
                <p className="text-center text-muted-foreground">Carregando mensagens...</p>
              </CardContent>
            </Card>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="p-4 md:p-6 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma mensagem</h3>
                <p className="text-muted-foreground">
                  Você não tem mensagens no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => {
              const isRead = isMessageRead(message);
              return (
                <Card
                  key={message.id}
                  className={`cursor-pointer shadow-soft hover:shadow-elegant transition-smooth ${
                    !isRead ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => handleOpenMessage(message)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {isRead ? (
                          <MailOpen className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        ) : (
                          <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold mb-1">{message.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(message.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-muted-foreground line-clamp-2">
                            {message.content}
                          </p>
                        </div>
                      </div>
                      {!isRead && (
                        <Badge variant="default" className="flex-shrink-0">Nova</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm text-muted-foreground">
            {selectedMessage && new Date(selectedMessage.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </DialogDescription>
          <div className="py-4">
            <p className="whitespace-pre-wrap">{selectedMessage?.content}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCloseDialog}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
