import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, HeartHandshake, ClipboardList, FileText } from 'lucide-react';
import { useFinancialTransactions } from '@/hooks/useFinancialData';
import { useHospitalarVisits } from '@/hooks/useHospitalaria';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useProfiles';
import { useSessions } from '@/hooks/useSessions';
import { format, eachMonthOfInterval, startOfYear, endOfMonth, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FinanceDashboard from '@/components/finance/FinanceDashboard';
import HospitalariaDashboard from '@/components/hospitalaria/HospitalariaDashboard';
import SecretaryDashboard from '@/components/secretary/SecretaryDashboard';
import ChancelleryDashboard from '@/components/chancellery/ChancelleryDashboard';

type ChartPeriod = '6m' | '12m' | 'gestao';

const ManagementAreaIndicators: React.FC = () => {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('12m');
  const { period } = useActiveMasterPeriod();
  const { data: transactions = [] } = useFinancialTransactions();
  const { data: visits = [] } = useHospitalarVisits();
  const { profiles } = useProfiles();
  const { sessions } = useSessions();

  const { data: allAttendances = [] } = useQuery({
    queryKey: ['attendances_indicators'],
    queryFn: async () => {
      const { data, error } = await supabase.from('session_attendances').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: minutes = [] } = useQuery({
    queryKey: ['minutes_indicators'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meeting_minutes').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const months = useMemo(() => {
    const now = new Date();
    let start: Date;
    if (chartPeriod === 'gestao' && period) {
      start = period.termStart;
    } else if (chartPeriod === '6m') {
      start = startOfMonth(subMonths(now, 5));
    } else {
      start = startOfMonth(subMonths(now, 11));
    }
    return eachMonthOfInterval({ start, end: endOfMonth(now) });
  }, [chartPeriod, period]);

  // Financial chart data
  const financeChartData = useMemo(() => {
    return months.map(m => {
      const key = format(m, 'yyyy-MM');
      const label = format(m, 'MMM/yy', { locale: ptBR });
      const receitas = transactions
        .filter(t => t.transaction_type === 'receita' && t.transaction_date.startsWith(key))
        .reduce((s, t) => s + Number(t.amount), 0);
      const despesas = transactions
        .filter(t => t.transaction_type === 'despesa' && t.transaction_date.startsWith(key))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { name: label, Receitas: receitas, Despesas: despesas };
    });
  }, [months, transactions]);

  // Visits chart data
  const visitsChartData = useMemo(() => {
    return months.map(m => {
      const key = format(m, 'yyyy-MM');
      const label = format(m, 'MMM/yy', { locale: ptBR });
      const count = visits.filter(v => v.visit_date.startsWith(key)).length;
      return { name: label, Visitas: count };
    });
  }, [months, visits]);

  // Attendance chart data
  const attendanceChartData = useMemo(() => {
    const activeCount = profiles.filter(p => p.user_id).length || 1;
    return months.map(m => {
      const key = format(m, 'yyyy-MM');
      const label = format(m, 'MMM/yy', { locale: ptBR });
      const monthSessions = sessions.filter(s => s.session_datetime.startsWith(key));
      if (monthSessions.length === 0) return { name: label, 'Presença (%)': 0 };
      const totalPresent = monthSessions.reduce((sum, s) => {
        return sum + allAttendances.filter((a: any) => a.session_id === s.id && a.is_present).length;
      }, 0);
      const pct = Math.round((totalPresent / (monthSessions.length * activeCount)) * 100);
      return { name: label, 'Presença (%)': pct };
    });
  }, [months, sessions, allAttendances, profiles]);

  // Minutes chart
  const minutesChartData = useMemo(() => {
    return months.map(m => {
      const key = format(m, 'yyyy-MM');
      const label = format(m, 'MMM/yy', { locale: ptBR });
      const count = minutes.filter((min: any) => min.meeting_date?.startsWith(key)).length;
      return { name: label, Atas: count };
    });
  }, [months, minutes]);

  const PeriodSelector = () => (
    <Select value={chartPeriod} onValueChange={v => setChartPeriod(v as ChartPeriod)}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="6m">Últimos 6 meses</SelectItem>
        <SelectItem value="12m">Últimos 12 meses</SelectItem>
        <SelectItem value="gestao">Gestão Atual</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="financeiro" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="hospitalaria" className="gap-2">
            <HeartHandshake className="w-4 h-4" />
            <span className="hidden sm:inline">Hospitalaria</span>
          </TabsTrigger>
          <TabsTrigger value="secretaria" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Secretaria</span>
          </TabsTrigger>
          <TabsTrigger value="chancelaria" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Chancelaria</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Receitas x Despesas — Evolução Mensal</CardTitle>
              <PeriodSelector />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={financeChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <FinanceDashboard />
        </TabsContent>

        <TabsContent value="hospitalaria" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Visitas Realizadas — Evolução Mensal</CardTitle>
              <PeriodSelector />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={visitsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Visitas" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <HospitalariaDashboard />
        </TabsContent>

        <TabsContent value="secretaria" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Presença Média por Sessão (%)</CardTitle>
                <PeriodSelector />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={attendanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Presença (%)" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atas Registradas por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={minutesChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="Atas" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <SecretaryDashboard />
        </TabsContent>

        <TabsContent value="chancelaria" className="mt-6">
          <ChancelleryDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagementAreaIndicators;
