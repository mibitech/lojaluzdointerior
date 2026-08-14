import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, addMonths, subMonths, startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateSafe } from '@/lib/utils';

interface Case {
  id: string;
  start_date: string;
  situation_type: string;
  status: string;
  priority: string;
  description: string | null;
  profiles?: { full_name: string | null } | null;
  responsible?: { full_name: string | null } | null;
}

interface Props {
  cases: Case[];
  onEdit: (c: Case) => void;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PRIORITY_DOT: Record<string, string> = {
  Alta:  'bg-red-500',
  Média: 'bg-yellow-400',
  Baixa: 'bg-green-500',
};

const MS_15_DAYS = 15 * 24 * 60 * 60 * 1000;

function isOverdue(c: Case): boolean {
  return c.status === 'Ativo' && (Date.now() - parseDateSafe(c.start_date).getTime()) > MS_15_DAYS;
}

function dotColor(c: Case): string {
  return isOverdue(c) ? 'bg-purple-500' : (PRIORITY_DOT[c.priority] ?? 'bg-muted-foreground');
}

const PRIORITY_BADGE: Record<string, string> = {
  Alta:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-transparent',
  Média: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-transparent',
  Baixa: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-transparent',
};

const STATUS_BADGE: Record<string, string> = {
  Ativo:     'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-transparent',
  Resolvido: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-transparent',
  Encerrado: 'bg-muted text-muted-foreground border-transparent',
};

function toLocalDay(dateStr: string): number {
  return startOfDay(parseDateSafe(dateStr)).getTime();
}

function buildCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(startOfDay(cur));
    cur = addDays(cur, 1);
  }
  return days;
}

const HospitalariaCasesCalendar: React.FC<Props> = ({ cases, onEdit }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTs, setSelectedTs] = useState<number | null>(null);

  const days = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const todayTs = startOfDay(new Date()).getTime();

  const caseIndex = useMemo(() => {
    const map = new Map<number, Case[]>();
    cases.forEach(c => {
      const ts = toLocalDay(c.start_date);
      if (!map.has(ts)) map.set(ts, []);
      map.get(ts)!.push(c);
    });
    return map;
  }, [cases]);

  const selectedCases = selectedTs ? (caseIndex.get(selectedTs) ?? []) : [];
  const selectedDay = selectedTs ? new Date(selectedTs) : null;

  return (
    <div className="space-y-4">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs"
            onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grade */}
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {WEEK_DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const ts = day.getTime();
            const inMonth = isSameMonth(day, currentMonth);
            const isToday = ts === todayTs;
            const dayCases = caseIndex.get(ts) ?? [];
            const hasEvents = dayCases.length > 0;

            return (
              <button
                key={idx}
                onClick={() => hasEvents ? setSelectedTs(ts) : undefined}
                className={[
                  'relative min-h-[72px] p-1.5 text-left border-b border-r transition-colors focus:outline-none',
                  !inMonth ? 'opacity-30' : '',
                  hasEvents ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default',
                  isToday ? 'bg-yellow-400/30' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className={[
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm',
                  isToday ? 'bg-primary text-primary-foreground font-semibold' : 'font-medium',
                ].join(' ')}>
                  {format(day, 'd')}
                </span>

                {hasEvents && (
                  <div className="mt-0.5 hidden lg:block space-y-0.5">
                    {dayCases.slice(0, 3).map(c => (
                      <p key={c.id} className="truncate text-[10px] leading-tight rounded px-1 bg-blue-500/15 text-blue-700 dark:text-blue-300">
                        {c.profiles?.full_name?.split(' ')[0] ?? '—'}
                      </p>
                    ))}
                    {dayCases.length > 3 && (
                      <p className="text-[10px] text-muted-foreground px-1">+{dayCases.length - 3} mais</p>
                    )}
                  </div>
                )}

                {hasEvents && (
                  <div className="absolute bottom-1.5 right-1.5 flex flex-wrap gap-0.5 justify-end">
                    {dayCases.map(c => (
                      <span key={c.id} className={`inline-block h-3 w-3 rounded-full ${dotColor(c)}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="rounded-md border bg-muted/20 p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Legenda</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="shrink-0 h-3 w-3 rounded-full bg-red-500" /> Alta prioridade</span>
          <span className="flex items-center gap-2"><span className="shrink-0 h-3 w-3 rounded-full bg-yellow-400" /> Média prioridade</span>
          <span className="flex items-center gap-2"><span className="shrink-0 h-3 w-3 rounded-full bg-green-500" /> Baixa prioridade</span>
          <span className="flex items-center gap-2"><span className="shrink-0 h-3 w-3 rounded-full bg-yellow-400 border-2 border-yellow-600" /> Hoje</span>
        </div>
        <div className="mt-2 pt-2 border-t grid grid-cols-1 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="shrink-0 h-3 w-3 rounded-full bg-purple-500" /> Acompanhamento ativo há mais de 15 dias sem atualização</span>
        </div>
      </div>

      {/* Modal de detalhe */}
      <Dialog open={!!selectedDay} onOpenChange={open => { if (!open) setSelectedTs(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedDay && format(selectedDay, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {selectedCases.map(c => (
              <div key={c.id} className={`rounded-md border p-3 space-y-2 ${isOverdue(c) ? 'border-purple-400 bg-purple-500/10' : 'bg-muted/30'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{c.profiles?.full_name ?? '—'}</p>
                  <Badge className={`text-xs shrink-0 ${PRIORITY_BADGE[c.priority] ?? ''}`}>{c.priority}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`text-xs ${STATUS_BADGE[c.status] ?? ''}`}>{c.status}</Badge>
                  <span className="text-xs text-muted-foreground">{c.situation_type}</span>
                </div>
                {c.responsible?.full_name && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Responsável:</span> {c.responsible.full_name}
                  </p>
                )}
                {c.description && (
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Descrição</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </div>
                )}
                <Button
                  variant="outline" size="sm" className="w-full text-xs"
                  onClick={() => { setSelectedTs(null); onEdit(c); }}
                >
                  Editar acompanhamento
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setSelectedTs(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalariaCasesCalendar;
