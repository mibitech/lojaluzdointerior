import { parseDateSafe } from '@/lib/utils';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useHospitalarAidRequests, useHospitalarMutation, REQUESTER_TYPES, AID_TYPES, AID_STATUSES } from '@/hooks/useHospitalaria';
import { useProfiles } from '@/hooks/useProfiles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (val: number | null) => val != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '-';

const statusColor: Record<string, string> = { Pendente: 'secondary', 'Em Análise': 'default', Aprovado: 'default', Negado: 'destructive', Entregue: 'outline' };

const HospitalariaAidRequests: React.FC = () => {
  const { data: requests = [], isLoading } = useHospitalarAidRequests();
  const { profiles } = useProfiles();
  const { insert, update, remove } = useHospitalarMutation('hospitalar_aid_requests', 'hospitalar_aid_requests');
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const openNew = () => { setForm({ requester_type: 'Obreiro', aid_type: 'Financeiro', status: 'Pendente', request_date: new Date().toISOString().split('T')[0] }); setEditingId(null); setDialog(true); };
  const openEdit = (r: any) => { setForm(r); setEditingId(r.id); setDialog(true); };

  const save = async () => {
    const payload = { requester_type: form.requester_type, profile_id: form.profile_id || null, aid_type: form.aid_type, description: form.description, requested_amount: form.requested_amount ? Number(form.requested_amount) : null, request_date: form.request_date, status: form.status, decision_date: form.decision_date || null, approved_amount: form.approved_amount ? Number(form.approved_amount) : null, decision_notes: form.decision_notes || null, authorized_by: form.authorized_by || null };
    if (editingId) await update.mutateAsync({ id: editingId, ...payload });
    else await insert.mutateAsync(payload);
    setDialog(false);
  };

  const del = async (id: string) => { if (confirm('Excluir este pedido?')) await remove.mutateAsync(id); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos de Auxílio</CardTitle>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Pedido</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-center py-8">Carregando...</p> : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Obreiro</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Solicitado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum pedido</TableCell></TableRow>
                    ) : requests.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.requester_type}</TableCell>
                        <TableCell className="font-medium">{r.profiles?.full_name || '-'}</TableCell>
                        <TableCell>{r.aid_type}</TableCell>
                        <TableCell>{formatCurrency(r.requested_amount)}</TableCell>
                        <TableCell><Badge variant={statusColor[r.status] as any}>{r.status}</Badge></TableCell>
                        <TableCell>{format(parseDateSafe(r.request_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {requests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum pedido</p>
                ) : requests.map(r => (
                  <Card key={r.id} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{r.profiles?.full_name || '-'}</p>
                          <p className="text-sm text-muted-foreground">{r.aid_type} — {r.requester_type}</p>
                        </div>
                        <Badge variant={statusColor[r.status] as any}>{r.status}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{format(parseDateSafe(r.request_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        <span className="font-medium">{formatCurrency(r.requested_amount)}</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(r)}><Edit className="w-4 h-4 mr-1" />Editar</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => del(r.id)}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Novo'} Pedido de Auxílio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Solicitante</Label>
                <Select value={form.requester_type || 'Obreiro'} onValueChange={v => setForm({ ...form, requester_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REQUESTER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Auxílio</Label>
                <Select value={form.aid_type || 'Financeiro'} onValueChange={v => setForm({ ...form, aid_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AID_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Obreiro vinculado</Label>
              <Select value={form.profile_id || ''} onValueChange={v => setForm({ ...form, profile_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição da Necessidade *</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Solicitado</Label>
                <Input type="number" step="0.01" value={form.requested_amount || ''} onChange={e => setForm({ ...form, requested_amount: e.target.value })} />
              </div>
              <div>
                <Label>Data da Solicitação</Label>
                <Input type="date" value={form.request_date || ''} onChange={e => setForm({ ...form, request_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status || 'Pendente'} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AID_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data da Decisão</Label>
                <Input type="date" value={form.decision_date || ''} onChange={e => setForm({ ...form, decision_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Aprovado</Label>
                <Input type="number" step="0.01" value={form.approved_amount || ''} onChange={e => setForm({ ...form, approved_amount: e.target.value })} />
              </div>
              <div>
                <Label>Autorizado por</Label>
                <Select value={form.authorized_by || ''} onValueChange={v => setForm({ ...form, authorized_by: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações da Decisão</Label>
              <Textarea value={form.decision_notes || ''} onChange={e => setForm({ ...form, decision_notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
              <Button onClick={save} disabled={!form.description}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalariaAidRequests;
