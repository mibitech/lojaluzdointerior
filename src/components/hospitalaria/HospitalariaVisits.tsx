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
import { Plus, Edit, Trash2, List, CalendarDays } from 'lucide-react';
import { useHospitalarVisits, useHospitalarCases, useHospitalarMutation, VISIT_TYPES } from '@/hooks/useHospitalaria';
import { useProfiles } from '@/hooks/useProfiles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateSafe } from '@/lib/utils';
import HospitalariaCalendar from './HospitalariaCalendar';

const UPDATED_SITUATIONS = ['Visitar', 'Estável', 'Em recuperação', 'Necessita atenção', 'Crítico'] as const;

export const SITUATION_BADGE: Record<string, string> = {
  'Visitar':            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-transparent',
  'Estável':            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-transparent',
  'Em recuperação':     'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-transparent',
  'Necessita atenção':  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-transparent',
  'Crítico':            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-transparent',
};

const MS_15_DAYS = 15 * 24 * 60 * 60 * 1000;

function situationBadgeClass(v: { visit_date: string; updated_situation: string | null }): string {
  const sit = v.updated_situation ?? 'Visitar';
  const overdue = sit === 'Visitar' && (Date.now() - parseDateSafe(v.visit_date).getTime()) > MS_15_DAYS;
  return overdue
    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-transparent'
    : (SITUATION_BADGE[sit] ?? 'border-transparent');
}

function matchesFilter(v: { visit_date: string; updated_situation: string | null }, filter: string): boolean {
  if (filter === 'all') return true;
  const sit = v.updated_situation ?? 'Visitar';
  const overdue = sit === 'Visitar' && (Date.now() - parseDateSafe(v.visit_date).getTime()) > MS_15_DAYS;
  if (filter === 'overdue') return overdue;
  if (filter === 'Visitar') return sit === 'Visitar' && !overdue;
  return sit === filter;
}

function situationLabel(v: { visit_date: string; updated_situation: string | null }): string {
  const sit = v.updated_situation ?? 'Visitar';
  const overdue = sit === 'Visitar' && (Date.now() - parseDateSafe(v.visit_date).getTime()) > MS_15_DAYS;
  return overdue ? `${sit} (+15d)` : sit;
}

const HospitalariaVisits: React.FC = () => {
  const { data: visits = [], isLoading } = useHospitalarVisits();
  const { data: cases = [] } = useHospitalarCases();
  const { profiles } = useProfiles();
  const { insert, update, remove } = useHospitalarMutation('hospitalar_visits', 'hospitalar_visits');
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [filterSituation, setFilterSituation] = useState<string>('all');

  // Converte "dd/mm/aaaa" → "YYYY-MM-DD" para o banco; retorna null se inválido
  const parseBrDate = (s: string): string | null => {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    return `${m[3]}-${m[2]}-${m[1]}`;
  };
  // Converte "YYYY-MM-DD" → "dd/mm/aaaa" para exibição
  const toBrDate = (iso: string | null | undefined): string => {
    if (!iso) return '';
    const d = iso.slice(0, 10);
    return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
  };

  const openNew = (date?: Date) => {
    const d = date ?? new Date();
    setForm({ visit_type: 'Presencial', updated_situation: 'Visitar', _visit_date_display: toBrDate(format(d, 'yyyy-MM-dd')), _visit_date_h: String(date ? 0 : d.getHours()), _visit_date_m: String(date ? 0 : d.getMinutes()), _next_visit_display: '' });
    setEditingId(null); setDialog(true);
  };
  const openEdit = (v: any) => {
    const dt = v.visit_date ? v.visit_date.slice(0, 16) : '';
    const timePart = dt.slice(11, 16);
    setForm({ ...v, _visit_date_display: toBrDate(dt.slice(0, 10)), _visit_date_h: timePart ? String(parseInt(timePart.slice(0, 2), 10)) : '0', _visit_date_m: timePart ? String(parseInt(timePart.slice(3, 5), 10)) : '0', _next_visit_display: toBrDate(v.next_visit_date) });
    setEditingId(v.id); setDialog(true);
  };

  const save = async () => {
    const hh = String(form._visit_date_h ?? 0).padStart(2, '0');
    const mm = String(form._visit_date_m ?? 0).padStart(2, '0');
    const visitDateIso = parseBrDate(form._visit_date_display || '');
    const visitDate = visitDateIso ? `${visitDateIso}T${hh}:${mm}:00` : null;
    const nextVisitDate = parseBrDate(form._next_visit_display || '');
    const payload = { profile_id: form.profile_id, case_id: form.case_id || null, visit_date: visitDate, visit_type: form.visit_type, report: form.report || null, needs_identified: form.needs_identified || null, actions_taken: form.actions_taken || null, next_visit_date: nextVisitDate, updated_situation: form.updated_situation || null };
    if (editingId) await update.mutateAsync({ id: editingId, ...payload });
    else await insert.mutateAsync(payload);
    setDialog(false);
  };

  const del = async (id: string) => { if (confirm('Excluir esta visita?')) await remove.mutateAsync(id); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registro de Visitas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border overflow-hidden">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3 gap-1.5"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Calendário</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3 gap-1.5"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
            </div>
            <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-2" />Nova Visita</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtro por situação — somente na lista */}
          {viewMode === 'list' && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Situação:</span>
              <Select value={filterSituation} onValueChange={setFilterSituation}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {(['Visitar', 'Estável', 'Em recuperação', 'Necessita atenção', 'overdue'] as const).map(s => (
                    <SelectItem key={s} value={s}>{s === 'overdue' ? 'Visita (+15d)' : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoading ? <p className="text-center py-8">Carregando...</p> : viewMode === 'calendar' ? (
            <HospitalariaCalendar
              visits={filterSituation === 'all' ? visits : visits.filter(v => matchesFilter(v, filterSituation))}
              onEdit={openEdit}
              onNewVisit={openNew}
            />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Obreiro</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Relato</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Próxima Visita</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.filter(v => matchesFilter(v, filterSituation)).length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma visita registrada</TableCell></TableRow>
                    ) : visits.filter(v => matchesFilter(v, filterSituation)).map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.profiles?.full_name || '-'}</TableCell>
                        <TableCell>{format(parseDateSafe(v.visit_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                        <TableCell><Badge variant="secondary">{v.visit_type}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate">{v.report || '-'}</TableCell>
                        <TableCell>
                          {v.updated_situation
                            ? <Badge className={`text-xs ${situationBadgeClass(v)}`}>{situationLabel(v)}</Badge>
                            : '-'}
                        </TableCell>
                        <TableCell>{v.next_visit_date ? format(parseDateSafe(v.next_visit_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(v)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => del(v.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {visits.filter(v => matchesFilter(v, filterSituation)).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma visita registrada</p>
                ) : visits.filter(v => matchesFilter(v, filterSituation)).map(v => (
                  <Card key={v.id} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{v.profiles?.full_name || '-'}</p>
                          <p className="text-sm text-muted-foreground">{format(parseDateSafe(v.visit_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                        </div>
                        <Badge variant="secondary">{v.visit_type}</Badge>
                      </div>
                      {v.updated_situation && (
                        <Badge className={`text-xs ${situationBadgeClass(v)}`}>{situationLabel(v)}</Badge>
                      )}
                      {v.report && <p className="text-sm text-muted-foreground line-clamp-2">{v.report}</p>}
                      {v.next_visit_date && <p className="text-sm text-muted-foreground"><strong>Próxima:</strong> {format(parseDateSafe(v.next_visit_date), 'dd/MM/yyyy', { locale: ptBR })}</p>}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(v)}><Edit className="w-4 h-4 mr-1" />Editar</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => del(v.id)}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
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
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Nova'} Visita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Obreiro *</Label>
              <Select value={form.profile_id || ''} onValueChange={v => setForm({ ...form, profile_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Caso vinculado (opcional)</Label>
              <Select value={form.case_id || ''} onValueChange={v => setForm({ ...form, case_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{cases.map(c => <SelectItem key={c.id} value={c.id}>{c.profiles?.full_name} — {c.situation_type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label>Data *</Label>
                <Input
                  type="text"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  value={form._visit_date_display || ''}
                  onChange={e => {
                    let v = e.target.value.replace(/[^\d/]/g, '');
                    if (v.length === 2 && !v.includes('/')) v += '/';
                    else if (v.length === 5 && v.split('/').length === 2) v += '/';
                    setForm({ ...form, _visit_date_display: v });
                  }}
                />
              </div>
              <div className="col-span-1">
                <Label>Hora *</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min={0} max={23}
                    value={form._visit_date_h ?? ''}
                    onChange={e => setForm({ ...form, _visit_date_h: Math.min(23, Math.max(0, Number(e.target.value))) })}
                    className="w-14 text-center px-1"
                    placeholder="HH"
                  />
                  <span className="font-semibold">:</span>
                  <Input
                    type="number" min={0} max={59}
                    value={form._visit_date_m ?? ''}
                    onChange={e => setForm({ ...form, _visit_date_m: Math.min(59, Math.max(0, Number(e.target.value))) })}
                    className="w-14 text-center px-1"
                    placeholder="MM"
                  />
                </div>
              </div>
              <div className="col-span-1">
                <Label>Tipo</Label>
                <Select value={form.visit_type || 'Presencial'} onValueChange={v => setForm({ ...form, visit_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VISIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Relato da Visita</Label>
              <Textarea value={form.report || ''} onChange={e => setForm({ ...form, report: e.target.value })} rows={3}
                placeholder="Descreva como foi a visita, estado geral do obreiro e observações relevantes..." />
            </div>
            <div>
              <Label>Necessidades Identificadas</Label>
              <Textarea value={form.needs_identified || ''} onChange={e => setForm({ ...form, needs_identified: e.target.value })} rows={2}
                placeholder="Ex: necessidade de medicamentos, apoio financeiro, acompanhamento médico..." />
            </div>
            <div>
              <Label>Ações Tomadas</Label>
              <Textarea value={form.actions_taken || ''} onChange={e => setForm({ ...form, actions_taken: e.target.value })} rows={2}
                placeholder="Ex: encaminhamento ao fundo de beneficência, contato com responsável, agendamento de retorno..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Próxima Visita</Label>
                <Input
                  type="text"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  value={form._next_visit_display || ''}
                  onChange={e => {
                    let v = e.target.value.replace(/[^\d/]/g, '');
                    if (v.length === 2 && !v.includes('/')) v += '/';
                    else if (v.length === 5 && v.split('/').length === 2) v += '/';
                    setForm({ ...form, _next_visit_display: v });
                  }}
                />
              </div>
              <div>
                <Label>Situação Atualizada</Label>
                <Select value={form.updated_situation || ''} onValueChange={v => setForm({ ...form, updated_situation: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {UPDATED_SITUATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
              <Button onClick={save} disabled={!form.profile_id || !parseBrDate(form._visit_date_display || '')}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalariaVisits;
