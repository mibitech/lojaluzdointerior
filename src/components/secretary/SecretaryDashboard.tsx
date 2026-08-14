import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart2, FileText, Clock, Mail, Send, Archive, BellRing, Crown } from 'lucide-react';
import { useCorrespondence, useSecretaryDocuments, useConvocations, useCertificates } from '@/hooks/useSecretary';
import { useProfiles } from '@/hooks/useProfiles';
import { useSessions } from '@/hooks/useSessions';
import { parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';
import { Badge } from '@/components/ui/badge';

const SecretaryDashboard: React.FC = () => {
  const { profiles } = useProfiles();
  const { sessions } = useSessions();
  const { data: correspondence = [] } = useCorrespondence();
  const { data: documents = [] } = useSecretaryDocuments();
  const { data: convocations = [] } = useConvocations();
  const { period, isWithinMasterPeriod, periodLabel, masterName } = useActiveMasterPeriod();

  const { data: minutes = [] } = useQuery({
    queryKey: ['meeting_minutes_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meeting_minutes').select('*').order('meeting_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allAttendances = [] } = useQuery({
    queryKey: ['all_attendances_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('session_attendances').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const activeMembers = profiles.length;

  const avgAttendance = useMemo(() => {
    if (sessions.length === 0 || profiles.length === 0) return '0%';
    const periodSessions = period
      ? sessions.filter(s => isWithinMasterPeriod(s.session_datetime))
      : sessions.slice(0, 10);
    if (periodSessions.length === 0) return '0%';
    const totalPresent = periodSessions.reduce((sum, s) => {
      const present = allAttendances.filter(a => a.session_id === s.id && a.is_present).length;
      return sum + present;
    }, 0);
    const avg = (totalPresent / (periodSessions.length * profiles.length)) * 100;
    return `${Math.round(avg)}%`;
  }, [sessions, allAttendances, profiles, period, isWithinMasterPeriod]);

  const minutesPeriod = useMemo(() => minutes.filter(m => isWithinMasterPeriod(m.meeting_date)).length, [minutes, isWithinMasterPeriod]);

  const pendingMinutes = useMemo(() => minutes.filter(m => m.status === 'Pendente').length, [minutes]);

  const unreadCorrespondence = useMemo(() => correspondence.filter(c => c.correspondence_type === 'Entrada' && c.status === 'Recebida').length, [correspondence]);

  const sentCorrespondencePeriod = useMemo(() => correspondence.filter(c => c.correspondence_type === 'Saída' && isWithinMasterPeriod(c.correspondence_date)).length, [correspondence, isWithinMasterPeriod]);

  const documentsPeriod = useMemo(() => documents.filter(d => isWithinMasterPeriod(d.document_date)).length, [documents, isWithinMasterPeriod]);

  const convocationsPeriod = useMemo(() => convocations.filter(c => isWithinMasterPeriod(c.convocation_date)).length, [convocations, isWithinMasterPeriod]);

  const kpis = [
    { label: 'Total de Obreiros Ativos', value: activeMembers, icon: Users, gradient: 'from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300', iconColor: 'text-blue-500/50' },
    { label: 'Presença Média nas Sessões', value: avgAttendance, icon: BarChart2, gradient: 'from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300', iconColor: 'text-green-500/50' },
    { label: 'Atas Registradas na Gestão', value: minutesPeriod, icon: FileText, gradient: 'from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300', iconColor: 'text-amber-500/50' },
    { label: 'Atas Pendentes de Aprovação', value: pendingMinutes, icon: Clock, gradient: 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300', iconColor: 'text-red-500/50' },
    { label: 'Correspondências Não Lidas', value: unreadCorrespondence, icon: Mail, gradient: 'from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-900 border-teal-200 dark:border-teal-800', textColor: 'text-teal-700 dark:text-teal-300', iconColor: 'text-teal-500/50' },
    { label: 'Correspondências Enviadas na Gestão', value: sentCorrespondencePeriod, icon: Send, gradient: 'from-indigo-50 to-violet-100 dark:from-indigo-950 dark:to-violet-900 border-indigo-200 dark:border-indigo-800', textColor: 'text-indigo-700 dark:text-indigo-300', iconColor: 'text-indigo-500/50' },
    { label: 'Documentos Arquivados na Gestão', value: documentsPeriod, icon: Archive, gradient: 'from-purple-50 to-fuchsia-100 dark:from-purple-950 dark:to-fuchsia-900 border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-500/50' },
    { label: 'Convocações na Gestão', value: convocationsPeriod, icon: BellRing, gradient: 'from-pink-50 to-rose-100 dark:from-pink-950 dark:to-rose-900 border-pink-200 dark:border-pink-800', textColor: 'text-pink-700 dark:text-pink-300', iconColor: 'text-pink-500/50' },
  ];

  return (
    <div className="space-y-6">
      {/* Master Period Info */}
      {period && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Crown className="w-4 h-4" />
          <span>Gestão: <strong className="text-foreground">{masterName}</strong></span>
          <Badge variant="outline" className="text-xs">{periodLabel}</Badge>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.textColor}`}>{kpi.value}</p>
                </div>
                <kpi.icon className={`w-10 h-10 ${kpi.iconColor}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SecretaryDashboard;
