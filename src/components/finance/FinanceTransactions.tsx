import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useFinancialTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES,
  type FinancialTransaction,
} from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const allCategories = [...REVENUE_CATEGORIES, ...EXPENSE_CATEGORIES];
const getCategoryLabel = (val: string) => allCategories.find(c => c.value === val)?.label || val;

const FinanceTransactions: React.FC = () => {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = useFinancialTransactions();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    transaction_type: 'receita' as 'receita' | 'despesa',
    category: '',
    subcategory: '',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    reference_month: '',
  });

  const resetForm = () => {
    setForm({
      transaction_type: 'receita',
      category: '',
      subcategory: '',
      description: '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      reference_month: '',
    });
    setEditing(null);
  };

  const openEdit = (tx: FinancialTransaction) => {
    setEditing(tx);
    setForm({
      transaction_type: tx.transaction_type,
      category: tx.category,
      subcategory: tx.subcategory || '',
      description: tx.description || '',
      amount: String(tx.amount),
      transaction_date: tx.transaction_date,
      reference_month: tx.reference_month || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      transaction_type: form.transaction_type,
      category: form.category,
      subcategory: form.subcategory || null,
      description: form.description || null,
      amount: parseFloat(form.amount),
      transaction_date: form.transaction_date,
      reference_month: form.reference_month || null,
      created_by: user?.id || null,
      profile_id: null,
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const categories = form.transaction_type === 'receita' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'all' && tx.transaction_type !== filterType) return false;
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (
          (tx.description?.toLowerCase().includes(s)) ||
          getCategoryLabel(tx.category).toLowerCase().includes(s) ||
          (tx.subcategory?.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, searchTerm]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar descrição, categoria..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[160px]">
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <Label>Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {allCategories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Novo Lançamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo *</Label>
                      <Select value={form.transaction_type} onValueChange={v => setForm(f => ({ ...f, transaction_type: v as any, category: '' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Categoria *</Label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor (R$) *</Label>
                      <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>Data *</Label>
                      <Input type="date" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <Label>Subcategoria</Label>
                    <Input value={form.subcategory} onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))} placeholder="Ex: Irmão João Silva" />
                  </div>
                  <div>
                    <Label>Mês de Referência</Label>
                    <Input type="month" value={form.reference_month} onChange={e => setForm(f => ({ ...f, reference_month: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Observações sobre o lançamento" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
                    <Button type="submit" disabled={!form.category || !form.amount}>
                      {editing ? 'Salvar' : 'Registrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lançamento encontrado</TableCell></TableRow>
                ) : (
                  filtered.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(tx.transaction_date + 'T12:00:00'), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.transaction_type === 'receita' ? 'default' : 'destructive'} className={tx.transaction_type === 'receita' ? 'bg-green-600' : ''}>
                          {tx.transaction_type === 'receita' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCategoryLabel(tx.category)}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.subcategory || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.description || '—'}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.transaction_type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.transaction_type === 'despesa' ? '- ' : ''}{formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(tx)}><Pencil className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(tx.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3 p-4">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum lançamento encontrado</p>
            ) : filtered.map(tx => (
              <Card key={tx.id} className="shadow-soft">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{getCategoryLabel(tx.category)}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(tx.transaction_date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                    </div>
                    <Badge variant={tx.transaction_type === 'receita' ? 'default' : 'destructive'} className={tx.transaction_type === 'receita' ? 'bg-green-600' : ''}>
                      {tx.transaction_type === 'receita' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </div>
                  {tx.description && <p className="text-sm text-muted-foreground">{tx.description}</p>}
                  <p className={`text-lg font-bold ${tx.transaction_type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.transaction_type === 'despesa' ? '- ' : ''}{formatCurrency(tx.amount)}
                  </p>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(tx)}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={() => deleteMutation.mutate(tx.id)}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceTransactions;
