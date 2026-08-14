import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CalendarCheck, ClipboardList, Inbox, CheckCircle, Wallet, Sparkles, Home, Crown } from 'lucide-react';
import { useHospitalarCases, useHospitalarVisits, useHospitalarAidRequests, useHospitalarPhilanthropy, useHospitalarFund } from '@/hooks/useHospitalaria';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const HospitalariaDashboard: React.FC = () => {
  const { data: cases = [] } = useHospitalarCases();
  const { data: visits = [] } = useHospitalarVisits();
  const { data: aidRequests = [] } = useHospitalarAidRequests();
  const { data: philanthropy = [] } = useHospitalarPhilanthropy();
  const { data: fund = [] } = useHospitalarFund();
  const { period, isWithinMasterPeriod, periodLabel, masterName } = useActiveMasterPeriod();

  const activeCases = useMemo(() => cases.filter(c => c.status === 'Ativo').length, [cases]);
  const visitsPeriod = useMemo(() => visits.filter(v => isWithinMasterPeriod(v.visit_date)).length, [visits, isWithinMasterPeriod]);
  const pendingVisits = useMemo(() => {
    const visitedProfileIds = new Set(visits.filter(v => isWithinMasterPeriod(v.visit_date)).map(v => v.profile_id));
    return cases.filter(c => c.status === 'Ativo' && !visitedProfileIds.has(c.profile_id)).length;
  }, [cases, visits, isWithinMasterPeriod]);
  const openAidRequests = useMemo(() => aidRequests.filter(a => a.status === 'Pendente' || a.status === 'Em Análise').length, [aidRequests]);
  const grantedAidsPeriod = useMemo(() => aidRequests.filter(a => (a.status === 'Aprovado' || a.status === 'Entregue') && a.decision_date && isWithinMasterPeriod(a.decision_date)).length, [aidRequests, isWithinMasterPeriod]);
  const fundBalance = useMemo(() => fund.reduce((sum, f) => f.movement_type === 'Entrada' ? sum + Number(f.amount) : sum - Number(f.amount), 0), [fund]);
  const activePhilanthropy = useMemo(() => philanthropy.filter(p => p.status === 'Em Andamento').length, [philanthropy]);
  const familiesServed = useMemo(() => {
    const uniqueProfiles = new Set(aidRequests.filter(a => a.status === 'Entregue' && a.requester_type !== 'Obreiro').map(a => a.profile_id));
    return uniqueProfiles.size;
  }, [aidRequests]);

  // Charts
  const aidByType = useMemo(() => {
    const map: Record<string, number> = {};
    aidRequests.forEach(a => { map[a.aid_type] = (map[a.aid_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [aidRequests]);

  const casesByType = useMemo(() => {
    const map: Record<string, number> = {};
    cases.filter(c => c.status === 'Ativo').forEach(c => { map[c.situation_type] = (map[c.situation_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const kpis = [
    { label: 'Obreiros em Acompanhamento', value: activeCases, icon: Users, gradient: 'from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300', iconColor: 'text-blue-500/50' },
    { label: 'Visitas na Gestão', value: visitsPeriod, icon: CalendarCheck, gradient: 'from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300', iconColor: 'text-green-500/50' },
    { label: 'Visitas Pendentes', value: pendingVisits, icon: ClipboardList, gradient: 'from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300', iconColor: 'text-amber-500/50' },
    { label: 'Pedidos de Auxílio Abertos', value: openAidRequests, icon: Inbox, gradient: 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300', iconColor: 'text-red-500/50' },
    { label: 'Auxílios Concedidos na Gestão', value: grantedAidsPeriod, icon: CheckCircle, gradient: 'from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-900 border-teal-200 dark:border-teal-800', textColor: 'text-teal-700 dark:text-teal-300', iconColor: 'text-teal-500/50' },
    { label: 'Saldo do Tronco', value: formatCurrency(fundBalance), icon: Wallet, gradient: 'from-indigo-50 to-violet-100 dark:from-indigo-950 dark:to-violet-900 border-indigo-200 dark:border-indigo-800', textColor: 'text-indigo-700 dark:text-indigo-300', iconColor: 'text-indigo-500/50' },
    { label: 'Ações Filantrópicas Ativas', value: activePhilanthropy, icon: Sparkles, gradient: 'from-purple-50 to-fuchsia-100 dark:from-purple-950 dark:to-fuchsia-900 border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-500/50' },
    { label: 'Famílias Atendidas', value: familiesServed, icon: Home, gradient: 'from-pink-50 to-rose-100 dark:from-pink-950 dark:to-rose-900 border-pink-200 dark:border-pink-800', textColor: 'text-pink-700 dark:text-pink-300', iconColor: 'text-pink-500/50' },
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

      {/* KPI Cards */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auxílios por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {aidByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={aidByType} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {aidByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acompanhamentos Ativos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {casesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={casesByType}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HospitalariaDashboard;
