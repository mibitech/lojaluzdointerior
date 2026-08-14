import { parseDateSafe } from '@/lib/utils';
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Wallet } from 'lucide-react';
import { useHospitalarFund, useHospitalarMutation, FUND_MOVEMENT_TYPES, FUND_ORIGINS } from '@/hooks/useHospitalaria';
import { useProfiles } from '@/hooks/useProfiles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const HospitalariaFund: React.FC = () => {
  const { data: movements = [], isLoading } = useHospitalarFund();
  const { profiles } = useProfiles();
  const { insert, update, remove } = useHospitalarMutation('hospitalar_beneficence_fund', 'hospitalar_beneficence_fund');
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const balance = useMemo(() => movements.reduce((sum, m) => m.movement_type === 'Entrada' ? sum + Number(m.amount) : sum - Number(m.amount), 0), [movements]);

  const openNew = () => { setForm({ movement_type: 'Entrada', origin: 'Outro', movement_date: new Date().toISOString().split('T')[0] }); setEditingId(null); setDialog(true); };
  const openEdit = (m: any) => { setForm(m); setEditingId(m.id); setDialog(true); };

  const save = async () => {
    const payload = { movement_type: form.movement_type, origin: form.origin, amount: Number(form.amount), movement_date: form.movement_date, description: form.description || null, authorized_by: form.authorized_by || null, aid_request_id: form.aid_request_id || null };
    if (editingId) await update.mutateAsync({ id: editingId, ...payload });
    else await insert.mutateAsync(payload);
    setDialog(false);
  };

  const del = async (id: string) => { if (confirm('Excluir este lançamento?')) await remove.mutateAsync(id); };

  return (
    <div className="space-y-4">
      <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800' : 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo do Tronco de Beneficência</p>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(balance)}</p>
            </div>
            <Wallet className={`w-12 h-12 ${balance >= 0 ? 'text-green-500/50' : 'text-red-500/50'}`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Extrato do Tronco de Beneficência</CardTitle>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Lançamento</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-center py-8">Carregando...</p> : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origem/Destino</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum lançamento</TableCell></TableRow>
                    ) : movements.map(m => (
                      <TableRow key={m.id}>
                        <TableCell>{format(parseDateSafe(m.movement_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell><Badge variant={m.movement_type === 'Entrada' ? 'default' : 'destructive'}>{m.movement_type}</Badge></TableCell>
                        <TableCell>{m.origin}</TableCell>
                        <TableCell className={m.movement_type === 'Entrada' ? 'text-green-600' : 'text-red-600'}>{m.movement_type === 'Entrada' ? '+' : '-'}{formatCurrency(Number(m.amount))}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{m.description || '-'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(m)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => del(m.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {movements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum lançamento</p>
                ) : movements.map(m => (
                  <Card key={m.id} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{m.origin}</p>
                          <p className="text-sm text-muted-foreground">{format(parseDateSafe(m.movement_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                        <Badge variant={m.movement_type === 'Entrada' ? 'default' : 'destructive'}>{m.movement_type}</Badge>
                      </div>
                      <p className={`text-lg font-bold ${m.movement_type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{m.movement_type === 'Entrada' ? '+' : '-'}{formatCurrency(Number(m.amount))}</p>
                      {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(m)}><Edit className="w-4 h-4 mr-1" />Editar</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => del(m.id)}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Novo'} Lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.movement_type || 'Entrada'} onValueChange={v => setForm({ ...form, movement_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FUND_MOVEMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Origem/Destino</Label>
                <Select value={form.origin || 'Outro'} onValueChange={v => setForm({ ...form, origin: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FUND_ORIGINS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.movement_date || ''} onChange={e => setForm({ ...form, movement_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Autorizado por</Label>
              <Select value={form.authorized_by || ''} onValueChange={v => setForm({ ...form, authorized_by: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione (para saídas)" /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
              <Button onClick={save} disabled={!form.amount}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalariaFund;
