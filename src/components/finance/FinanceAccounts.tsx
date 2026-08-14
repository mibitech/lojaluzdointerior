import React, { useState } from 'react';
import { parseDateSafe } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowUpRight, ArrowDownRight, TrendingUp, Landmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useFinancialAccounts,
  useAccountMovements,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateMovement,
  MOVEMENT_TYPES,
  type FinancialAccount,
} from '@/hooks/useFinancialData';
import { format } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const FinanceAccounts: React.FC = () => {
  const { user } = useAuth();
  const { data: accounts = [], isLoading } = useFinancialAccounts();
  const { data: movements = [] } = useAccountMovements();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createMovement = useCreateMovement();

  const [accountDialog, setAccountDialog] = useState(false);
  const [movDialog, setMovDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const [accForm, setAccForm] = useState({ account_name: '', account_type: 'investimento', institution: '', description: '', balance: '0' });
  const [movForm, setMovForm] = useState({ account_id: '', movement_type: 'aplicacao', amount: '', movement_date: new Date().toISOString().split('T')[0], description: '' });

  const resetAccForm = () => { setAccForm({ account_name: '', account_type: 'investimento', institution: '', description: '', balance: '0' }); setEditingAccount(null); };
  const resetMovForm = () => setMovForm({ account_id: '', movement_type: 'aplicacao', amount: '', movement_date: new Date().toISOString().split('T')[0], description: '' });

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      account_name: accForm.account_name,
      account_type: accForm.account_type,
      institution: accForm.institution || null,
      description: accForm.description || null,
      balance: parseFloat(accForm.balance) || 0,
      is_active: true,
    };
    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount.id, ...payload });
    } else {
      await createAccount.mutateAsync(payload);
    }
    setAccountDialog(false);
    resetAccForm();
  };

  const handleMovSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMovement.mutateAsync({
      account_id: movForm.account_id,
      movement_type: movForm.movement_type,
      amount: parseFloat(movForm.amount),
      movement_date: movForm.movement_date,
      description: movForm.description || null,
      created_by: user?.id || null,
    });
    setMovDialog(false);
    resetMovForm();
  };

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const activeAccounts = accounts.filter(a => a.is_active);

  const filteredMovements = selectedAccountId
    ? movements.filter(m => m.account_id === selectedAccountId)
    : movements;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Landmark className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Contas Ativas</p>
                <p className="text-2xl font-bold">{activeAccounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Movimentações</p>
              <p className="text-2xl font-bold">{movements.length}</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={accountDialog} onOpenChange={o => { setAccountDialog(o); if (!o) resetAccForm(); }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1"><Plus className="w-3 h-3" /> Conta</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta de Investimento'}</DialogTitle></DialogHeader>
                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div>
                      <Label>Nome da Conta *</Label>
                      <Input value={accForm.account_name} onChange={e => setAccForm(f => ({ ...f, account_name: e.target.value }))} required placeholder="Ex: Poupança BB" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo</Label>
                        <Select value={accForm.account_type} onValueChange={v => setAccForm(f => ({ ...f, account_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="investimento">Investimento</SelectItem>
                            <SelectItem value="poupanca">Poupança</SelectItem>
                            <SelectItem value="cdb">CDB</SelectItem>
                            <SelectItem value="fundo">Fundo</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Saldo Inicial (R$)</Label>
                        <Input type="number" step="0.01" value={accForm.balance} onChange={e => setAccForm(f => ({ ...f, balance: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label>Instituição</Label>
                      <Input value={accForm.institution} onChange={e => setAccForm(f => ({ ...f, institution: e.target.value }))} placeholder="Ex: Banco do Brasil" />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea value={accForm.description} onChange={e => setAccForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => { setAccountDialog(false); resetAccForm(); }}>Cancelar</Button>
                      <Button type="submit" disabled={!accForm.account_name}>{editingAccount ? 'Salvar' : 'Criar Conta'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={movDialog} onOpenChange={o => { setMovDialog(o); if (!o) resetMovForm(); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1"><Plus className="w-3 h-3" /> Movimentação</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
                  <form onSubmit={handleMovSubmit} className="space-y-4">
                    <div>
                      <Label>Conta *</Label>
                      <Select value={movForm.account_id} onValueChange={v => setMovForm(f => ({ ...f, account_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                        <SelectContent>
                          {activeAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo *</Label>
                        <Select value={movForm.movement_type} onValueChange={v => setMovForm(f => ({ ...f, movement_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MOVEMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Valor (R$) *</Label>
                        <Input type="number" step="0.01" min="0" value={movForm.amount} onChange={e => setMovForm(f => ({ ...f, amount: e.target.value }))} required />
                      </div>
                    </div>
                    <div>
                      <Label>Data *</Label>
                      <Input type="date" value={movForm.movement_date} onChange={e => setMovForm(f => ({ ...f, movement_date: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea value={movForm.description} onChange={e => setMovForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => { setMovDialog(false); resetMovForm(); }}>Cancelar</Button>
                      <Button type="submit" disabled={!movForm.account_id || !movForm.amount}>Registrar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contas de Investimento</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma conta cadastrada</TableCell></TableRow>
                ) : accounts.map(a => (
                  <TableRow key={a.id} className={selectedAccountId === a.id ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium cursor-pointer hover:text-primary" onClick={() => setSelectedAccountId(selectedAccountId === a.id ? '' : a.id)}>
                      {a.account_name}
                    </TableCell>
                    <TableCell className="capitalize">{a.account_type}</TableCell>
                    <TableCell>{a.institution || '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">{formatCurrency(Number(a.balance))}</TableCell>
                    <TableCell><Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingAccount(a); setAccForm({ account_name: a.account_name, account_type: a.account_type, institution: a.institution || '', description: a.description || '', balance: String(a.balance) }); setAccountDialog(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteAccount.mutate(a.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3 p-4">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : accounts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhuma conta cadastrada</p>
            ) : accounts.map(a => (
              <Card key={a.id} className={`shadow-soft cursor-pointer ${selectedAccountId === a.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedAccountId(selectedAccountId === a.id ? '' : a.id)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{a.account_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{a.account_type} — {a.institution || '—'}</p>
                    </div>
                    <Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'Ativa' : 'Inativa'}</Badge>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(Number(a.balance))}</p>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setEditingAccount(a); setAccForm({ account_name: a.account_name, account_type: a.account_type, institution: a.institution || '', description: a.description || '', balance: String(a.balance) }); setAccountDialog(true); }}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={(e) => { e.stopPropagation(); deleteAccount.mutate(a.id); }}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Movements */}
      {filteredMovements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Movimentações {selectedAccountId ? `— ${accounts.find(a => a.id === selectedAccountId)?.account_name}` : '— Todas'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>{format(parseDateSafe(m.movement_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {m.movement_type === 'resgate' ? <ArrowDownRight className="w-4 h-4 text-red-500" /> : <ArrowUpRight className="w-4 h-4 text-green-500" />}
                          {MOVEMENT_TYPES.find(t => t.value === m.movement_type)?.label || m.movement_type}
                        </div>
                      </TableCell>
                      <TableCell>{accounts.find(a => a.id === m.account_id)?.account_name || '—'}</TableCell>
                      <TableCell>{m.description || '—'}</TableCell>
                      <TableCell className={`text-right font-medium ${m.movement_type === 'resgate' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(m.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3 p-4">
              {filteredMovements.map(m => (
                <Card key={m.id} className="shadow-soft">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        {m.movement_type === 'resgate' ? <ArrowDownRight className="w-4 h-4 text-red-500" /> : <ArrowUpRight className="w-4 h-4 text-green-500" />}
                        <span className="font-medium">{MOVEMENT_TYPES.find(t => t.value === m.movement_type)?.label || m.movement_type}</span>
                      </div>
                      <span className={`font-bold ${m.movement_type === 'resgate' ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(m.amount)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{accounts.find(a => a.id === m.account_id)?.account_name || '—'} — {format(parseDateSafe(m.movement_date), 'dd/MM/yyyy')}</p>
                    {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinanceAccounts;
