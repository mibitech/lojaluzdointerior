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

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string | null;
}

const CommissionGlossary = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [formData, setFormData] = useState({
    term: '',
    definition: '',
    category: '',
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .order('term');

      if (error) throw error;
      setTerms(data || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      toast({ title: 'Erro ao carregar termos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTerm) {
        const { error } = await supabase
          .from('glossary_terms')
          .update(formData)
          .eq('id', editingTerm.id);

        if (error) throw error;
        toast({ title: 'Termo atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('glossary_terms')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Termo cadastrado com sucesso!' });
      }

      setOpenDialog(false);
      resetForm();
      fetchTerms();
    } catch (error) {
      console.error('Error saving term:', error);
      toast({ title: 'Erro ao salvar termo', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este termo?')) return;

    try {
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Termo excluído com sucesso!' });
      fetchTerms();
    } catch (error) {
      console.error('Error deleting term:', error);
      toast({ title: 'Erro ao excluir termo', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ term: '', definition: '', category: '' });
    setEditingTerm(null);
  };

  const openEditDialog = (term: GlossaryTerm) => {
    setEditingTerm(term);
    setFormData({
      term: term.term,
      definition: term.definition,
      category: term.category || '',
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
          <h2 className="text-2xl font-bold">Gerenciar Glossário</h2>
          <p className="text-muted-foreground">
            Administre termos e definições maçônicas
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Termo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTerm ? 'Editar Termo' : 'Novo Termo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Termo</Label>
                <Input
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Simbologia, Graus, etc."
                />
              </div>
              <div>
                <Label>Definição</Label>
                <Textarea
                  value={formData.definition}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingTerm ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Termos do Glossário</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Termo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Definição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.term}</TableCell>
                  <TableCell>{term.category || '-'}</TableCell>
                  <TableCell className="max-w-md truncate">{term.definition}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(term)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(term.id)}>
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
        ) : terms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum termo cadastrado
            </CardContent>
          </Card>
        ) : (
          terms.map((term) => (
            <Card key={term.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{term.term}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(term)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(term.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {term.category && (
                    <Badge variant="outline">{term.category}</Badge>
                  )}
                  <p className="text-sm text-muted-foreground">{term.definition}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommissionGlossary;
