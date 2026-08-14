import { parseDateSafe } from '@/lib/utils';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useConvocations, useSecretaryMutation, SESSION_TYPES, RECIPIENTS_TYPES, SEND_CHANNELS, CONVOCATION_STATUSES, SecretaryConvocation } from '@/hooks/useSecretary';
import { useAuth } from '@/contexts/AuthContext';

const SecretaryConvocations: React.FC = () => {
  const { user } = useAuth();
  const { data: items = [] } = useConvocations();
  const { insert, update, remove } = useSecretaryMutation('secretary_convocations', 'secretary_convocations');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<SecretaryConvocation | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [newAgendaItem, setNewAgendaItem] = useState('');

  const openNew = () => {
    setEditing(null);
    setForm({
      session_type: 'Ordinária',
      convocation_date: new Date().toISOString().split('T')[0],
      recipients_type: 'Todos os obreiros',
      send_channel: 'E-mail',
      status: 'Rascunho',
      agenda_items: [],
    });
    setDialog(true);
  };

  const openEdit = (item: SecretaryConvocation) => {
    setEditing(item);
    setForm({ ...item });
    setDialog(true);
  };

  const addAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    setForm({ ...form, agenda_items: [...(form.agenda_items || []), newAgendaItem.trim()] });
    setNewAgendaItem('');
  };

  const removeAgendaItem = (index: number) => {
    const items = [...(form.agenda_items || [])];
    items.splice(index, 1);
    setForm({ ...form, agenda_items: items });
  };

  const handleSave = async () => {
    if (!form.session_type || !form.convocation_date) return;
    const payload = {
      session_type: form.session_type,
      convocation_date: form.convocation_date,
      convocation_time: form.convocation_time || null,
      location: form.location || null,
      agenda_items: form.agenda_items || [],
      recipients_type: form.recipients_type,
      send_channel: form.send_channel,
      status: form.status,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await insert.mutateAsync({ ...payload, created_by: user?.id });
    }
    setDialog(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta convocação?')) await remove.mutateAsync(id);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Rascunho': return 'secondary';
      case 'Enviada': return 'default';
      case 'Confirmada': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Convocações</CardTitle>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Convocação</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Convocação' : 'Nova Convocação'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Sessão</Label>
                    <Select value={form.session_type || 'Ordinária'} onValueChange={v => setForm({ ...form, session_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SESSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status || 'Rascunho'} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CONVOCATION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={form.convocation_date || ''} onChange={e => setForm({ ...form, convocation_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Hora</Label>
                    <Input type="time" value={form.convocation_time || ''} onChange={e => setForm({ ...form, convocation_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Local</Label>
                  <Input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Destinatários</Label>
                    <Select value={form.recipients_type || 'Todos os obreiros'} onValueChange={v => setForm({ ...form, recipients_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RECIPIENTS_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Canal de Envio</Label>
                    <Select value={form.send_channel || 'E-mail'} onValueChange={v => setForm({ ...form, send_channel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SEND_CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Pauta</Label>
                  <div className="space-y-2">
                    {(form.agenda_items || []).map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <span className="text-sm flex-1">{i + 1}. {item}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeAgendaItem(i)}><X className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input placeholder="Adicionar item à pauta..." value={newAgendaItem} onChange={e => setNewAgendaItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAgendaItem())} />
                      <Button variant="outline" onClick={addAgendaItem}>Adicionar</Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={insert.isPending || update.isPending}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma convocação encontrada</TableCell></TableRow>
                ) : items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.session_type}</TableCell>
                    <TableCell>{format(parseDateSafe(item.convocation_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{item.convocation_time || '-'}</TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell>{item.recipients_type}</TableCell>
                    <TableCell><Badge variant={getStatusColor(item.status) as any}>{item.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma convocação encontrada</p>
            ) : items.map(item => (
              <Card key={item.id} className="shadow-soft">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.session_type}</p>
                      <p className="text-sm text-muted-foreground">{format(parseDateSafe(item.convocation_date), 'dd/MM/yyyy')} {item.convocation_time || ''}</p>
                    </div>
                    <Badge variant={getStatusColor(item.status) as any}>{item.status}</Badge>
                  </div>
                  {item.agenda_items.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Pauta:</p>
                      <ol className="list-decimal list-inside">{item.agenda_items.map((a, i) => <li key={i}>{a}</li>)}</ol>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}><Edit className="w-4 h-4 mr-1" />Editar</Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
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

export default SecretaryConvocations;
