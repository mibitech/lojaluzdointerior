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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCertificates, useSecretaryMutation, CERTIFICATE_TYPES, CERTIFICATE_STATUSES, SecretaryCertificate } from '@/hooks/useSecretary';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';

const SecretaryCertificates: React.FC = () => {
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const { data: items = [] } = useCertificates();
  const { insert, update, remove } = useSecretaryMutation('secretary_certificates', 'secretary_certificates');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<SecretaryCertificate | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const openNew = () => {
    setEditing(null);
    setForm({
      certificate_type: 'Certidão de Regularidade',
      issue_date: new Date().toISOString().split('T')[0],
      status: 'Emitida',
      registration_number: `CERT-${Date.now().toString().slice(-6)}`,
    });
    setDialog(true);
  };

  const openEdit = (item: SecretaryCertificate) => {
    setEditing(item);
    setForm({ ...item });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.certificate_type) return;
    const payload = {
      certificate_type: form.certificate_type,
      profile_id: form.profile_id || null,
      issue_date: form.issue_date,
      registration_number: form.registration_number || null,
      purpose: form.purpose || null,
      status: form.status,
      notes: form.notes || null,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await insert.mutateAsync({ ...payload, created_by: user?.id });
    }
    setDialog(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta certidão?')) await remove.mutateAsync(id);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Emitida': return 'default';
      case 'Entregue': return 'secondary';
      case 'Cancelada': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Certidões e Declarações</CardTitle>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Certidão</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Certidão' : 'Nova Certidão'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.certificate_type || ''} onValueChange={v => setForm({ ...form, certificate_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CERTIFICATE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Obreiro</Label>
                  <Select value={form.profile_id || 'none'} onValueChange={v => setForm({ ...form, profile_id: v === 'none' ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || 'Sem nome'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Emissão</Label>
                    <Input type="date" value={form.issue_date || ''} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Nº de Registro</Label>
                    <Input value={form.registration_number || ''} onChange={e => setForm({ ...form, registration_number: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Finalidade/Destino</Label>
                  <Input value={form.purpose || ''} onChange={e => setForm({ ...form, purpose: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status || 'Emitida'} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CERTIFICATE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
                  <TableHead>Obreiro</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Nº Registro</TableHead>
                  <TableHead>Finalidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma certidão encontrada</TableCell></TableRow>
                ) : items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.certificate_type}</TableCell>
                    <TableCell>{item.profiles?.full_name || '-'}</TableCell>
                    <TableCell>{format(parseDateSafe(item.issue_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-mono text-sm">{item.registration_number || '-'}</TableCell>
                    <TableCell>{item.purpose || '-'}</TableCell>
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
              <p className="text-center text-muted-foreground py-8">Nenhuma certidão encontrada</p>
            ) : items.map(item => (
              <Card key={item.id} className="shadow-soft">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.certificate_type}</p>
                      <p className="text-sm text-muted-foreground">{item.profiles?.full_name || '-'}</p>
                      <p className="text-sm text-muted-foreground">{format(parseDateSafe(item.issue_date), 'dd/MM/yyyy')}</p>
                    </div>
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

export default SecretaryCertificates;
