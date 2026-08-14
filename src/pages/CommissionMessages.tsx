import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

interface Message {
  id: string;
  title: string;
  content: string;
  recipient_id: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
  read_count?: number;
  total_recipients?: number;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

export default function CommissionMessages() {
  const { user, isCommissionMember } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    recipient_id: 'all',
  });

  useEffect(() => {
    // Redirect to home if user is not a commission member
    if (!isCommissionMember && !loading) {
      navigate('/');
    }
  }, [isCommissionMember, loading, navigate]);

  useEffect(() => {
    if (isCommissionMember) {
      fetchMessages();
      fetchMembers();
    }
  }, [isCommissionMember]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for recipient_ids and read counts
      const messagesWithDetails = await Promise.all(
        (data || []).map(async (message) => {
          let profiles = null;
          
          if (message.recipient_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', message.recipient_id)
              .single();
            profiles = profile;
          }

          // Get read count
          const { count: readCount } = await supabase
            .from('message_reads')
            .select('*', { count: 'exact', head: true })
            .eq('message_id', message.id);

          // Get total recipients count (all members if recipient_id is null, otherwise 1)
          let totalRecipients = 1;
          if (!message.recipient_id) {
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .not('user_id', 'is', null);
            totalRecipients = count || 0;
          }
          
          return { 
            ...message, 
            profiles,
            read_count: readCount || 0,
            total_recipients: totalRecipients
          };
        })
      );
      
      setMessages(messagesWithDetails as Message[]);
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

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .not('user_id', 'is', null)
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar membros',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const messageData = {
        title: formData.title,
        content: formData.content,
        recipient_id: formData.recipient_id === 'all' ? null : formData.recipient_id,
        created_by: user?.id,
      };

      if (editingMessage) {
        const { error } = await supabase
          .from('messages')
          .update(messageData)
          .eq('id', editingMessage.id);

        if (error) throw error;

        toast({
          title: 'Mensagem atualizada',
          description: 'A mensagem foi atualizada com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('messages')
          .insert([messageData]);

        if (error) throw error;

        toast({
          title: 'Mensagem enviada',
          description: 'A mensagem foi enviada com sucesso.',
        });
      }

      setFormData({ title: '', content: '', recipient_id: 'all' });
      setEditingMessage(null);
      setIsDialogOpen(false);
      fetchMessages();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Mensagem excluída',
        description: 'A mensagem foi excluída com sucesso.',
      });

      fetchMessages();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir mensagem',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setFormData({
      title: message.title,
      content: message.content,
      recipient_id: message.recipient_id || 'all',
    });
    setIsDialogOpen(true);
  };

  const handleNewMessage = () => {
    setEditingMessage(null);
    setFormData({ title: '', content: '', recipient_id: 'all' });
    setIsDialogOpen(true);
  };

  if (!isCommissionMember) {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Mensagens</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewMessage}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMessage ? 'Editar Mensagem' : 'Nova Mensagem'}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="sr-only">
              Formulário para {editingMessage ? 'editar' : 'criar nova'} mensagem
            </DialogDescription>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="recipient">Destinatário</Label>
                <Select
                  value={formData.recipient_id}
                  onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destinatário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Irmãos</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Mensagem</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  {editingMessage ? 'Atualizar' : 'Enviar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensagens Enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Leituras</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">{message.title}</TableCell>
                    <TableCell>
                      {message.recipient_id 
                        ? (message.profiles?.full_name || 'Irmão específico')
                        : 'Todos os Irmãos'}
                    </TableCell>
                    <TableCell>
                      <span className={message.read_count === message.total_recipients ? 'text-green-600' : 'text-muted-foreground'}>
                        {message.read_count}/{message.total_recipients}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(message.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(message)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(message.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
