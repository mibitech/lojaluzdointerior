import { parseDateSafe } from '@/lib/utils';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import {
  useCorrespondence, useSecretaryMutation,
  CORRESPONDENCE_TYPES, CORRESPONDENCE_CATEGORIES, CORRESPONDENCE_PRIORITIES,
  CORRESPONDENCE_ENTRY_STATUSES, CORRESPONDENCE_EXIT_STATUSES,
  SecretaryCorrespondence as CorrespondenceType
} from '@/hooks/useSecretary';
import { useAuth } from '@/contexts/AuthContext';

const SecretaryCorrespondence: React.FC = () => {
  const { user } = useAuth();
  const { data: items = [] } = useCorrespondence();
  const { insert, update, remove } = useSecretaryMutation('secretary_correspondence', 'secretary_correspondence');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<CorrespondenceType | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const openNew = () => {
    setEditing(null);
    setForm({
      protocol_number: `CORR-${Date.now().toString().slice(-6)}`,
      correspondence_type: 'Entrada',
      correspondence_date: new Date().toISOString().split('T')[0],
      category: 'Administrativa',
      priority: 'Normal',
      status: 'Recebida',
    });
    setDialog(true);
  };

  const openEdit = (item: CorrespondenceType) => {
    setEditing(item);
    setForm({ ...item });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.subject || !form.sender || !form.recipient) return;
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...form });
    } else {
      await insert.mutateAsync({ ...form, created_by: user?.id });
    }
    setDialog(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta correspondência?')) await remove.mutateAsync(id);
  };

  const statuses = form.correspondence_type === 'Saída' ? CORRESPONDENCE_EXIT_STATUSES : CORRESPONDENCE_ENTRY_STATUSES;

  const filtered = items.filter(item => {
    if (filterType !== 'all' && item.correspondence_type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchTerm && !item.subject.toLowerCase().includes(searchTerm.toLowerCase()) && !item.sender.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Urgente': return 'destructive';
      case 'Confidencial': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Recebida': case 'Rascunho': return 'secondary';
      case 'Em Análise': return 'outline';
      case 'Respondida': case 'Enviada': case 'Confirmada': return 'default';
      case 'Arquivada': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Correspondências</CardTitle>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Correspondência</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Correspondência' : 'Nova Correspondência'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Protocolo</Label>
                    <Input value={form.protocol_number || ''} onChange={e => setForm({ ...form, protocol_number: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.correspondence_type || 'Entrada'} onValueChange={v => setForm({ ...form, correspondence_type: v, status: v === 'Saída' ? 'Rascunho' : 'Recebida' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CORRESPONDENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={form.correspondence_date || ''} onChange={e => setForm({ ...form, correspondence_date: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Remetente *</Label>
                    <Input value={form.sender || ''} onChange={e => setForm({ ...form, sender: e.target.value })} />
                  </div>
                  <div>
                    <Label>Destinatário *</Label>
                    <Input value={form.recipient || ''} onChange={e => setForm({ ...form, recipient: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Assunto *</Label>
                  <Input value={form.subject || ''} onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea rows={4} value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.category || 'Administrativa'} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CORRESPONDENCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={form.priority || 'Normal'} onValueChange={v => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CORRESPONDENCE_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status || ''} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Observações internas</Label>
                  <Textarea rows={2} value={form.internal_notes || ''} onChange={e => setForm({ ...form, internal_notes: e.target.value })} />
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
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por assunto ou remetente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {CORRESPONDENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {[...CORRESPONDENCE_ENTRY_STATUSES, ...CORRESPONDENCE_EXIT_STATUSES].filter((v, i, a) => a.indexOf(v) === i).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Remetente/Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma correspondência encontrada</TableCell></TableRow>
                ) : filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.protocol_number}</TableCell>
                    <TableCell>{format(parseDateSafe(item.correspondence_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell><Badge variant={item.correspondence_type === 'Entrada' ? 'default' : 'secondary'}>{item.correspondence_type}</Badge></TableCell>
                    <TableCell>{item.correspondence_type === 'Entrada' ? item.sender : item.recipient}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.subject}</TableCell>
                    <TableCell><Badge variant={getPriorityColor(item.priority) as any}>{item.priority}</Badge></TableCell>
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

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma correspondência encontrada</p>
            ) : filtered.map(item => (
              <Card key={item.id} className="shadow-soft">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.protocol_number} — {format(parseDateSafe(item.correspondence_date), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={item.correspondence_type === 'Entrada' ? 'default' : 'secondary'}>{item.correspondence_type}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(item.priority) as any}>{item.priority}</Badge>
                    <Badge variant={getStatusColor(item.status) as any}>{item.status}</Badge>
                  </div>
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

export default SecretaryCorrespondence;
