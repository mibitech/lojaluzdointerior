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
import { SITUATION_BADGE } from './HospitalariaVisits';
import { parseDateSafe } from '@/lib/utils';

const MS_15_DAYS = 15 * 24 * 60 * 60 * 1000;

// Cor do círculo de visita realizada por situação
const SITUATION_DOT: Record<string, string> = {
  'Visitar':           'bg-red-500',
  'Estável':           'bg-green-500',
  'Em recuperação':    'bg-blue-400',
  'Necessita atenção': 'bg-yellow-400',
  'Crítico':           'bg-red-500',
};

function isStuckVisitar(v: { visit_date: string; updated_situation: string | null }): boolean {
  const sit = v.updated_situation ?? 'Visitar';
  return sit === 'Visitar' && (Date.now() - parseDateSafe(v.visit_date).getTime()) > MS_15_DAYS;
}

function realizedDotColor(v: { visit_date: string; updated_situation: string | null }): string {
  if (isStuckVisitar(v)) return 'bg-purple-500';
  const sit = v.updated_situation ?? 'Visitar';
  return SITUATION_DOT[sit] ?? 'bg-gray-400';
}

// Triângulo vermelho via clip-path
const Triangle = () => (
  <span
    className="shrink-0 inline-block h-3 w-3 bg-red-500"
    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
  />
);

interface Visit {
  id: string;
  visit_date: string;
  next_visit_date: string | null;
  visit_type: string;
  report: string | null;
  updated_situation: string | null;
  profiles?: { full_name: string | null } | null;
  case?: { situation_type: string; profiles?: { full_name: string | null } | null } | null;
}

interface Props {
  visits: Visit[];
  onEdit: (visit: Visit) => void;
  onNewVisit?: (date: Date) => void;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const VISIT_TYPE_CLASS: Record<string, string> = {
  'Presencial':  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-transparent',
  'Remota':      'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-transparent',
  'Telefônica':  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-transparent',
};

function visitTypeBadge(type: string) {
  return VISIT_TYPE_CLASS[type] ?? 'bg-muted text-muted-foreground border-transparent';
}

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

const SITUATIONS = ['Visitar', 'Estável', 'Em recuperação', 'Necessita atenção'] as const;

const HospitalariaCalendar: React.FC<Props> = ({ visits, onEdit, onNewVisit }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTs, setSelectedTs] = useState<number | null>(null);

  const days = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const todayTs = startOfDay(new Date()).getTime();

  const realizedIndex = useMemo(() => {
    const map = new Map<number, Visit[]>();
    visits.forEach(v => {
      const ts = toLocalDay(v.visit_date);
      if (!map.has(ts)) map.set(ts, []);
      map.get(ts)!.push(v);
    });
    return map;
  }, [visits]);

  const scheduledIndex = useMemo(() => {
    const map = new Map<number, Visit[]>();
    visits.forEach(v => {
      if (!v.next_visit_date) return;
      const ts = toLocalDay(v.next_visit_date);
      if (!map.has(ts)) map.set(ts, []);
      map.get(ts)!.push(v);
    });
    return map;
  }, [visits]);

  const selectedVisits = selectedTs ? (realizedIndex.get(selectedTs) ?? []) : [];
  const selectedScheduled = selectedTs ? (scheduledIndex.get(selectedTs) ?? []) : [];
  const selectedDay = selectedTs ? new Date(selectedTs) : null;

  const handleDayClick = (ts: number, day: Date) => {
    const realized = realizedIndex.get(ts) ?? [];
    const scheduled = scheduledIndex.get(ts) ?? [];
    if (realized.length > 0 || scheduled.length > 0) {
      setSelectedTs(ts);
    } else if (onNewVisit) {
      onNewVisit(day);
    }
  };

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
            const realized = realizedIndex.get(ts) ?? [];
            const scheduled = scheduledIndex.get(ts) ?? [];
            const hasEvents = realized.length > 0 || scheduled.length > 0;

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(ts, day)}
                className={[
                  'relative min-h-[72px] p-1.5 text-left border-b border-r transition-colors focus:outline-none',
                  !inMonth ? 'opacity-30' : '',
                  (hasEvents || onNewVisit) ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default',
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
                    {realized.slice(0, 2).map(v => (
                      <p key={v.id} className="truncate text-[10px] leading-tight rounded px-1 bg-blue-500/15 text-blue-700 dark:text-blue-300">
                        {v.profiles?.full_name?.split(' ')[0] ?? '—'}
                      </p>
                    ))}
                    {scheduled.slice(0, 2).map(v => (
                      <p key={`n${v.id}`} className="truncate text-[10px] leading-tight rounded px-1 bg-red-500/15 text-red-700 dark:text-red-300">
                        {v.profiles?.full_name?.split(' ')[0] ?? '—'}
                      </p>
                    ))}
                    {realized.length + scheduled.length > 4 && (
                      <p className="text-[10px] text-muted-foreground px-1">
                        +{realized.length + scheduled.length - 4} mais
                      </p>
                    )}
                  </div>
                )}

                {/* Indicadores — canto inferior direito */}
                {hasEvents && (
                  <div className="absolute bottom-1.5 right-1.5 flex flex-wrap gap-0.5 items-end justify-end">
                    {realized.map((v, i) => (
                      <span key={`r${i}`} className={`inline-block h-3 w-3 rounded-full ${realizedDotColor(v)}`} />
                    ))}
                    {scheduled.map((_, i) => (
                      <span
                        key={`s${i}`}
                        className="inline-block h-3 w-3 bg-red-500"
                        style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="rounded-md border bg-muted/20 p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Legenda</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {SITUATIONS.map(s => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`shrink-0 h-3 w-3 rounded-full ${SITUATION_DOT[s]}`} />
              {s}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="shrink-0 h-3 w-3 rounded-full bg-purple-500" />
            +15 sem solução
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="shrink-0 inline-block h-3 w-3 bg-red-500"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
            Próxima agendada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="shrink-0 h-3 w-3 rounded-full bg-yellow-400" />
            Hoje
          </span>
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

          <div className="space-y-4">
            {selectedVisits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Visitas realizadas
                </p>
                {selectedVisits.map(v => {
                  const sit = v.updated_situation ?? 'Visitar';
                  const overdue = isStuckVisitar(v);
                  return (
                    <div key={v.id} className="rounded-md border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{v.profiles?.full_name ?? '—'}</p>
                        <Badge className={`text-xs shrink-0 ${visitTypeBadge(v.visit_type)}`}>{v.visit_type}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          Horário: {format(parseDateSafe(v.visit_date), 'HH:mm', { locale: ptBR })}
                        </p>
                        <Badge className={`text-xs ${overdue ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-transparent' : (SITUATION_BADGE[sit] ?? 'border-transparent')}`}>
                          {sit}{overdue ? ' (+15d)' : ''}
                        </Badge>
                      </div>
                      {v.case && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-medium">Caso:</span>
                          <span>{v.case.profiles?.full_name ?? '—'} — {v.case.situation_type}</span>
                        </div>
                      )}
                      {v.report && (
                        <div className="border-t pt-2 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Relato</p>
                          <p className="text-xs text-muted-foreground">{v.report}</p>
                        </div>
                      )}
                      <Button
                        variant="outline" size="sm" className="w-full text-xs"
                        onClick={() => { setSelectedTs(null); onEdit(v); }}
                      >
                        Editar visita
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedScheduled.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Visitas agendadas
                </p>
                {selectedScheduled.map(v => (
                  <div key={`s-${v.id}`} className="rounded-md border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm">{v.profiles?.full_name ?? '—'}</p>
                      <Badge className={`text-xs shrink-0 ${visitTypeBadge(v.visit_type)}`}>{v.visit_type}</Badge>
                    </div>
                    <Button
                      variant="outline" size="sm" className="w-full text-xs"
                      onClick={() => { setSelectedTs(null); onEdit(v); }}
                    >
                      Editar visita
                    </Button>
                  </div>
                ))}
              </div>
            )}
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

export default HospitalariaCalendar;
