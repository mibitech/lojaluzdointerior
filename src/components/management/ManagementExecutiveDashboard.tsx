import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, UserCheck, UserX, BarChart2, Calendar, Award, Wallet, TrendingUp,
  TrendingDown, Activity, AlertCircle, HeartHandshake, CalendarCheck, Inbox,
  CheckCircle, PiggyBank, Sparkles, FileText, Clock, Mail, Archive, BellRing,
  Crown, Stamp,
} from 'lucide-react';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';
import { useFinancialTransactions, useFinancialAccounts } from '@/hooks/useFinancialData';
import { useProfiles } from '@/hooks/useProfiles';
import { useSessions } from '@/hooks/useSessions';
import { useCorrespondence, useSecretaryDocuments, useConvocations, useCertificates } from '@/hooks/useSecretary';
import { useHospitalarCases, useHospitalarVisits, useHospitalarAidRequests, useHospitalarPhilanthropy, useHospitalarFund } from '@/hooks/useHospitalaria';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, eachMonthOfInterval, isBefore, format } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface KPIItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  textColor: string;
  iconColor: string;
  subtitle?: string;
}

const KPICard: React.FC<{ kpi: KPIItem }> = ({ kpi }) => (
  <Card className={`bg-gradient-to-br ${kpi.gradient}`}>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{kpi.label}</p>
          <p className={`text-2xl font-bold ${kpi.textColor}`}>{kpi.value}</p>
          {kpi.subtitle && <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>}
        </div>
        <kpi.icon className={`w-10 h-10 ${kpi.iconColor}`} />
      </div>
    </CardContent>
  </Card>
);

const ManagementExecutiveDashboard: React.FC = () => {
  const { period, isWithinMasterPeriod, periodLabel, masterName } = useActiveMasterPeriod();
  const { data: transactions = [] } = useFinancialTransactions();
  const { data: accounts = [] } = useFinancialAccounts();
  const { profiles } = useProfiles();
  const { sessions } = useSessions();
  const { data: correspondence = [] } = useCorrespondence();
  const { data: documents = [] } = useSecretaryDocuments();
  const { data: convocations = [] } = useConvocations();
  const { data: certificates = [] } = useCertificates();
  const { data: cases = [] } = useHospitalarCases();
  const { data: visits = [] } = useHospitalarVisits();
  const { data: aidRequests = [] } = useHospitalarAidRequests();
  const { data: philanthropy = [] } = useHospitalarPhilanthropy();
  const { data: fund = [] } = useHospitalarFund();

  const { data: minutes = [] } = useQuery({
    queryKey: ['meeting_minutes_mgmt'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meeting_minutes').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allAttendances = [] } = useQuery({
    queryKey: ['all_attendances_mgmt'],
    queryFn: async () => {
      const { data, error } = await supabase.from('session_attendances').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // ========== VISÃO GERAL ==========
  const activeMembers = profiles.filter(p => p.user_id).length;

  // Inadimplência
  const delinquencyStats = useMemo(() => {
    if (!period) return { adimplentes: 0, inadimplentes: 0, taxa: 0 };
    const now = new Date();
    const endDate = isBefore(period.termEnd, now) ? period.termEnd : now;
    const expectedMonths = eachMonthOfInterval({ start: period.termStart, end: endDate }).map(d => format(d, 'yyyy-MM'));

    const paidMap = new Map<string, Set<string>>();
    transactions
      .filter(t => t.transaction_type === 'receita' && t.category === 'mensalidade' && t.profile_id)
      .forEach(t => {
        if (!paidMap.has(t.profile_id!)) paidMap.set(t.profile_id!, new Set());
        if (t.reference_month) paidMap.get(t.profile_id!)!.add(t.reference_month);
      });

    const activeProfiles = profiles.filter(p => p.user_id);
    let inadimplentes = 0;
    activeProfiles.forEach(p => {
      const paid = paidMap.get(p.id) || new Set();
      const unpaid = expectedMonths.filter(m => !paid.has(m));
      if (unpaid.length > 0) inadimplentes++;
    });
    const adimplentes = activeProfiles.length - inadimplentes;
    const taxa = activeProfiles.length > 0 ? (inadimplentes / activeProfiles.length * 100) : 0;
    return { adimplentes, inadimplentes, taxa };
  }, [transactions, profiles, period]);

  // Presença média
  const avgAttendance = useMemo(() => {
    const periodSessions = period
      ? sessions.filter(s => isWithinMasterPeriod(s.session_datetime))
      : sessions.slice(0, 10);
    if (periodSessions.length === 0 || profiles.length === 0) return 0;
    const totalPresent = periodSessions.reduce((sum, s) => {
      return sum + allAttendances.filter(a => a.session_id === s.id && a.is_present).length;
    }, 0);
    return Math.round((totalPresent / (periodSessions.length * profiles.length)) * 100);
  }, [sessions, allAttendances, profiles, period, isWithinMasterPeriod]);

  const sessionsPeriod = useMemo(() =>
    period ? sessions.filter(s => isWithinMasterPeriod(s.session_datetime)).length : sessions.length,
    [sessions, period, isWithinMasterPeriod]);

  // ========== FINANCEIRO ==========
  const periodTxs = useMemo(() =>
    period ? transactions.filter(t => isWithinMasterPeriod(t.transaction_date)) : transactions,
    [transactions, period, isWithinMasterPeriod]);

  const totalReceitas = useMemo(() =>
    periodTxs.filter(t => t.transaction_type === 'receita').reduce((s, t) => s + Number(t.amount), 0),
    [periodTxs]);

  const totalDespesas = useMemo(() =>
    periodTxs.filter(t => t.transaction_type === 'despesa').reduce((s, t) => s + Number(t.amount), 0),
    [periodTxs]);

  const saldo = totalReceitas - totalDespesas;

  const now = new Date();
  const curStart = startOfMonth(now);
  const curEnd = endOfMonth(now);

  const receitaMes = useMemo(() =>
    transactions.filter(t => t.transaction_type === 'receita' && new Date(t.transaction_date) >= curStart && new Date(t.transaction_date) <= curEnd).reduce((s, t) => s + Number(t.amount), 0),
    [transactions, curStart, curEnd]);

  const despesaMes = useMemo(() =>
    transactions.filter(t => t.transaction_type === 'despesa' && new Date(t.transaction_date) >= curStart && new Date(t.transaction_date) <= curEnd).reduce((s, t) => s + Number(t.amount), 0),
    [transactions, curStart, curEnd]);

  const totalInvestido = useMemo(() =>
    accounts.reduce((s, a) => s + Number(a.balance), 0),
    [accounts]);

  // ========== HOSPITALARIA ==========
  const activeCases = useMemo(() => cases.filter(c => c.status === 'Ativo').length, [cases]);
  const visitsPeriod = useMemo(() => visits.filter(v => isWithinMasterPeriod(v.visit_date)).length, [visits, isWithinMasterPeriod]);
  const openAidRequests = useMemo(() => aidRequests.filter(a => a.status === 'Pendente' || a.status === 'Em Análise').length, [aidRequests]);
  const grantedAids = useMemo(() => aidRequests.filter(a => (a.status === 'Aprovado' || a.status === 'Entregue') && a.decision_date && isWithinMasterPeriod(a.decision_date)).length, [aidRequests, isWithinMasterPeriod]);
  const fundBalance = useMemo(() => fund.reduce((sum, f) => f.movement_type === 'Entrada' ? sum + Number(f.amount) : sum - Number(f.amount), 0), [fund]);
  const activePhilanthropy = useMemo(() => philanthropy.filter(p => p.status === 'Em Andamento').length, [philanthropy]);

  // ========== SECRETARIA ==========
  const minutesPeriod = useMemo(() => minutes.filter(m => isWithinMasterPeriod(m.meeting_date)).length, [minutes, isWithinMasterPeriod]);
  const unreadCorrespondence = useMemo(() => correspondence.filter(c => c.correspondence_type === 'Entrada' && c.status === 'Recebida').length, [correspondence]);
  const documentsPeriod = useMemo(() => documents.filter(d => isWithinMasterPeriod(d.document_date)).length, [documents, isWithinMasterPeriod]);
  const convocationsPeriod = useMemo(() => convocations.filter(c => isWithinMasterPeriod(c.convocation_date)).length, [convocations, isWithinMasterPeriod]);
  const certificatesPeriod = useMemo(() => certificates.filter(c => isWithinMasterPeriod(c.issue_date)).length, [certificates, isWithinMasterPeriod]);

  // ========== KPI SECTIONS ==========
  const visaoGeral: KPIItem[] = [
    { label: 'Total de Obreiros Ativos', value: activeMembers, icon: Users, gradient: 'from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300', iconColor: 'text-blue-500/50' },
    { label: 'Obreiros em Dia', value: delinquencyStats.adimplentes, icon: UserCheck, gradient: 'from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300', iconColor: 'text-green-500/50' },
    { label: 'Obreiros Inadimplentes', value: delinquencyStats.inadimplentes, icon: UserX, gradient: 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300', iconColor: 'text-red-500/50' },
    { label: 'Presença Média (%)', value: `${avgAttendance}%`, icon: BarChart2, gradient: 'from-indigo-50 to-violet-100 dark:from-indigo-950 dark:to-violet-900 border-indigo-200 dark:border-indigo-800', textColor: 'text-indigo-700 dark:text-indigo-300', iconColor: 'text-indigo-500/50' },
    { label: 'Sessões Realizadas', value: sessionsPeriod, icon: Calendar, gradient: 'from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300', iconColor: 'text-amber-500/50' },
    { label: 'Grau Médio dos Obreiros', value: profiles.length > 0 ? (profiles.reduce((s, p) => s + (p.masonic_degree || 1), 0) / profiles.length).toFixed(1) : '—', icon: Award, gradient: 'from-purple-50 to-fuchsia-100 dark:from-purple-950 dark:to-fuchsia-900 border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-500/50' },
  ];

  const financeiro: KPIItem[] = [
    { label: 'Saldo Operacional', value: formatCurrency(saldo), icon: Wallet, gradient: saldo >= 0 ? 'from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 border-blue-200 dark:border-blue-800' : 'from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-orange-200 dark:border-orange-800', textColor: saldo >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300', iconColor: saldo >= 0 ? 'text-blue-500/50' : 'text-orange-500/50' },
    { label: 'Receita do Mês', value: formatCurrency(receitaMes), icon: TrendingUp, gradient: 'from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300', iconColor: 'text-green-500/50' },
    { label: 'Despesa do Mês', value: formatCurrency(despesaMes), icon: TrendingDown, gradient: 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300', iconColor: 'text-red-500/50' },
    { label: 'Resultado do Mês', value: formatCurrency(receitaMes - despesaMes), icon: Activity, gradient: (receitaMes - despesaMes) >= 0 ? 'from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-900 border-teal-200 dark:border-teal-800' : 'from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-orange-200 dark:border-orange-800', textColor: (receitaMes - despesaMes) >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-orange-700 dark:text-orange-300', iconColor: (receitaMes - despesaMes) >= 0 ? 'text-teal-500/50' : 'text-orange-500/50' },
    { label: 'Taxa de Inadimplência', value: `${delinquencyStats.taxa.toFixed(1)}%`, icon: AlertCircle, gradient: 'from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300', iconColor: 'text-amber-500/50' },
    { label: 'Investimentos', value: formatCurrency(totalInvestido), icon: PiggyBank, gradient: 'from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-500/50' },
  ];

  const hospitalaria: KPIItem[] = [
    { label: 'Obreiros em Acompanhamento', value: activeCases, icon: HeartHandshake, gradient: 'from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300', iconColor: 'text-blue-500/50' },
    { label: 'Visitas na Gestão', value: visitsPeriod, icon: CalendarCheck, gradient: 'from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300', iconColor: 'text-green-500/50' },
    { label: 'Pedidos de Auxílio Abertos', value: openAidRequests, icon: Inbox, gradient: 'from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300', iconColor: 'text-amber-500/50' },
    { label: 'Auxílios Concedidos', value: grantedAids, icon: CheckCircle, gradient: 'from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-900 border-teal-200 dark:border-teal-800', textColor: 'text-teal-700 dark:text-teal-300', iconColor: 'text-teal-500/50' },
    { label: 'Saldo do Tronco', value: formatCurrency(fundBalance), icon: PiggyBank, gradient: 'from-indigo-50 to-violet-100 dark:from-indigo-950 dark:to-violet-900 border-indigo-200 dark:border-indigo-800', textColor: 'text-indigo-700 dark:text-indigo-300', iconColor: 'text-indigo-500/50' },
    { label: 'Ações Filantrópicas Ativas', value: activePhilanthropy, icon: Sparkles, gradient: 'from-purple-50 to-fuchsia-100 dark:from-purple-950 dark:to-fuchsia-900 border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-500/50' },
  ];

  const secretaria: KPIItem[] = [
    { label: 'Atas Registradas', value: minutesPeriod, icon: FileText, gradient: 'from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300', iconColor: 'text-amber-500/50' },
    { label: 'Correspondências Não Lidas', value: unreadCorrespondence, icon: Mail, gradient: 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300', iconColor: 'text-red-500/50' },
    { label: 'Documentos Arquivados', value: documentsPeriod, icon: Archive, gradient: 'from-purple-50 to-fuchsia-100 dark:from-purple-950 dark:to-fuchsia-900 border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-500/50' },
    { label: 'Convocações Emitidas', value: convocationsPeriod, icon: BellRing, gradient: 'from-pink-50 to-rose-100 dark:from-pink-950 dark:to-rose-900 border-pink-200 dark:border-pink-800', textColor: 'text-pink-700 dark:text-pink-300', iconColor: 'text-pink-500/50' },
    { label: 'Certidões Emitidas', value: certificatesPeriod, icon: Stamp, gradient: 'from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-900 border-teal-200 dark:border-teal-800', textColor: 'text-teal-700 dark:text-teal-300', iconColor: 'text-teal-500/50' },
  ];

  const sections = [
    { title: 'Visão Geral da Loja', kpis: visaoGeral },
    { title: 'Financeiro', kpis: financeiro },
    { title: 'Hospitalaria', kpis: hospitalaria },
    { title: 'Secretaria', kpis: secretaria },
  ];

  return (
    <div className="space-y-8">
      {/* Master Period Info */}
      {period && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Crown className="w-4 h-4" />
          <span>Gestão: <strong className="text-foreground">{masterName}</strong></span>
          <Badge variant="outline" className="text-xs">{periodLabel}</Badge>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full" />
            {section.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.kpis.map((kpi) => (
              <KPICard key={kpi.label} kpi={kpi} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManagementExecutiveDashboard;
