import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
}

const CommissionFAQ = () => {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    display_order: 0,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching FAQ items:', error);
      toast({ title: 'Erro ao carregar perguntas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('faq_items')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: 'Pergunta atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('faq_items')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Pergunta cadastrada com sucesso!' });
      }

      setOpenDialog(false);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error saving FAQ item:', error);
      toast({ title: 'Erro ao salvar pergunta', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta pergunta?')) return;

    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Pergunta excluída com sucesso!' });
      fetchItems();
    } catch (error) {
      console.error('Error deleting FAQ item:', error);
      toast({ title: 'Erro ao excluir pergunta', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ question: '', answer: '', category: '', display_order: 0 });
    setEditingItem(null);
  };

  const openEditDialog = (item: FAQItem) => {
    setEditingItem(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category || '',
      display_order: item.display_order,
    });
    setOpenDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar FAQ</h2>
          <p className="text-muted-foreground">
            Administre perguntas e respostas frequentes
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Pergunta</Label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Iniciação, Cerimônias, etc."
                />
              </div>
              <div>
                <Label>Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Resposta</Label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Pergunta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.display_order}</TableCell>
                  <TableCell className="font-medium">{item.question}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma pergunta cadastrada
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">#{item.display_order}</Badge>
                      {item.category && (
                        <Badge variant="secondary">{item.category}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{item.question}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommissionFAQ;
