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
import { useHospitalarPhilanthropy, useHospitalarMutation, PHILANTHROPY_TYPES, PHILANTHROPY_STATUSES } from '@/hooks/useHospitalaria';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColor: Record<string, string> = { Planejada: 'secondary', 'Em Andamento': 'default', Concluída: 'outline', Cancelada: 'destructive' };

const HospitalariaPhilanthropy: React.FC = () => {
  const { data: items = [], isLoading } = useHospitalarPhilanthropy();
  const { insert, update, remove } = useHospitalarMutation('hospitalar_philanthropy', 'hospitalar_philanthropy');
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const openNew = () => { setForm({ action_type: 'Outra', status: 'Planejada', start_date: new Date().toISOString().split('T')[0] }); setEditingId(null); setDialog(true); };
  const openEdit = (item: any) => { setForm(item); setEditingId(item.id); setDialog(true); };

  const save = async () => {
    const payload = { name: form.name, action_type: form.action_type, description: form.description || null, start_date: form.start_date, end_date: form.end_date || null, goal: form.goal || null, expected_beneficiaries: form.expected_beneficiaries ? Number(form.expected_beneficiaries) : null, status: form.status, result: form.result || null };
    if (editingId) await update.mutateAsync({ id: editingId, ...payload });
    else await insert.mutateAsync(payload);
    setDialog(false);
  };

  const del = async (id: string) => { if (confirm('Excluir esta ação?')) await remove.mutateAsync(id); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ações Filantrópicas</CardTitle>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Ação</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-center py-8">Carregando...</p> : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Beneficiários</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma ação registrada</TableCell></TableRow>
                    ) : items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.action_type}</TableCell>
                        <TableCell><Badge variant={statusColor[item.status] as any}>{item.status}</Badge></TableCell>
                        <TableCell>{format(parseDateSafe(item.start_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell>{item.end_date ? format(parseDateSafe(item.end_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                        <TableCell>{item.expected_beneficiaries || '-'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => del(item.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma ação registrada</p>
                ) : items.map(item => (
                  <Card key={item.id} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.action_type} — {format(parseDateSafe(item.start_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                        <Badge variant={statusColor[item.status] as any}>{item.status}</Badge>
                      </div>
                      {item.expected_beneficiaries && <p className="text-sm text-muted-foreground">Beneficiários: {item.expected_beneficiaries}</p>}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}><Edit className="w-4 h-4 mr-1" />Editar</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => del(item.id)}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
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
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Nova'} Ação Filantrópica</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Ação *</Label>
              <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.action_type || 'Outra'} onValueChange={v => setForm({ ...form, action_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PHILANTHROPY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status || 'Planejada'} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PHILANTHROPY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div>
                <Label>Beneficiários</Label>
                <Input type="number" value={form.expected_beneficiaries || ''} onChange={e => setForm({ ...form, expected_beneficiaries: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Meta</Label>
              <Input value={form.goal || ''} onChange={e => setForm({ ...form, goal: e.target.value })} />
            </div>
            <div>
              <Label>Resultado/Impacto</Label>
              <Textarea value={form.result || ''} onChange={e => setForm({ ...form, result: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
              <Button onClick={save} disabled={!form.name}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalariaPhilanthropy;
