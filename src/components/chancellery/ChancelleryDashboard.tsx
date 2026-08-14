import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, BarChart3, Cake, TrendingUp, TrendingDown, Calendar, ClipboardList, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, isSameMonth, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';
import { Crown } from 'lucide-react';

interface SessionWithAttendance {
  id: string;
  title: string;
  session_datetime: string;
  session_degree: string;
  presentCount: number;
  totalMembers: number;
  visitorCount: number;
}

interface BirthdayEntry {
  profileName: string;
  description: string;
  dateType: string;
  date: string;
  dayOfMonth: number;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--muted))',
];

const ChancelleryDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<SessionWithAttendance[]>([]);
  const [allBirthdays, setAllBirthdays] = useState<BirthdayEntry[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [loading, setLoading] = useState(true);
  const { period, periodLabel, masterName } = useActiveMasterPeriod();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, attendancesRes, visitorsRes, profilesRes, datesRes] = await Promise.all([
        supabase.from('sessions').select('*').order('session_datetime', { ascending: false }),
        supabase.from('session_attendances').select('*'),
        supabase.from('visitors').select('*'),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('commemorative_dates').select('*, profiles:profile_id(full_name)'),
      ]);

      const sessionsData = sessionsRes.data || [];
      const attendancesData = attendancesRes.data || [];
      const visitorsData = visitorsRes.data || [];
      const profilesData = profilesRes.data || [];
      const datesData = datesRes.data || [];

      setTotalProfiles(profilesData.length);

      // Build sessions with attendance counts
      const sessionsWithAttendance: SessionWithAttendance[] = sessionsData.map((s) => {
        const sessionAttendances = attendancesData.filter(a => a.session_id === s.id);
        const presentCount = sessionAttendances.filter(a => a.is_present).length;
        const visitorCount = visitorsData.filter(v => v.session_id === s.id).length;
        return {
          id: s.id,
          title: s.title,
          session_datetime: s.session_datetime,
          session_degree: s.session_degree,
          presentCount,
          totalMembers: profilesData.length,
          visitorCount,
        };
      });

      setSessions(sessionsWithAttendance);

      // Build birthday list
      const birthdays: BirthdayEntry[] = datesData.map((d: any) => ({
        profileName: d.profiles?.full_name || 'Desconhecido',
        description: d.description,
        dateType: d.date_type,
        date: d.date,
        dayOfMonth: parseISO(d.date).getDate(),
      }));

      setAllBirthdays(birthdays);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by selected month
  const selectedDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const sessionsThisMonth = useMemo(
    () => sessions.filter(s => isSameMonth(parseISO(s.session_datetime), selectedDate)),
    [sessions, selectedDate]
  );

  const birthdaysThisMonth = useMemo(() => {
    const month = selectedDate.getMonth() + 1;
    return allBirthdays
      .filter(b => {
        const bMonth = parseISO(b.date).getMonth() + 1;
        return bMonth === month;
      })
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  }, [allBirthdays, selectedDate]);

  // Última sessão realizada (data <= hoje)
  const lastSession = useMemo(() => {
    const today = startOfDay(addDays(new Date(), 1)); // início de amanhã = fim de hoje
    const pastSessions = sessions.filter(s => isBefore(parseISO(s.session_datetime), today));
    if (pastSessions.length === 0) return null;
    return pastSessions[0]; // já ordenado desc
  }, [sessions]);

  // KPIs
  const totalPresencesMonth = useMemo(
    () => sessionsThisMonth.reduce((sum, s) => sum + s.presentCount, 0),
    [sessionsThisMonth]
  );
  const totalVisitorsMonth = useMemo(
    () => sessionsThisMonth.reduce((sum, s) => sum + s.visitorCount, 0),
    [sessionsThisMonth]
  );
  const avgFrequencyMonth = useMemo(() => {
    if (sessionsThisMonth.length === 0) return 0;
    const avg = sessionsThisMonth.reduce((sum, s) => {
      return sum + (s.totalMembers > 0 ? (s.presentCount / s.totalMembers) * 100 : 0);
    }, 0) / sessionsThisMonth.length;
    return Math.round(avg);
  }, [sessionsThisMonth]);

  const lastSessionFrequency = useMemo(() => {
    if (!lastSession || lastSession.totalMembers === 0) return 0;
    return Math.round((lastSession.presentCount / lastSession.totalMembers) * 100);
  }, [lastSession]);

  // Session type totals (all time)
  const sessionTypeTotals = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => {
      const titleLower = s.title.toLowerCase();
      let tipo = 'Outras';
      if (titleLower.includes('ordinária') || titleLower.includes('ordinaria')) tipo = 'Ordinária';
      else if (titleLower.includes('magna')) tipo = 'Magna';
      else if (titleLower.includes('extraordinária') || titleLower.includes('extraordinaria')) tipo = 'Extraordinária';
      else if (titleLower.includes('especial')) tipo = 'Especial';
      else if (titleLower.includes('iniciação') || titleLower.includes('iniciacao')) tipo = 'Iniciação';
      else if (titleLower.includes('elevação') || titleLower.includes('elevacao')) tipo = 'Elevação';
      else if (titleLower.includes('exaltação') || titleLower.includes('exaltacao')) tipo = 'Exaltação';
      else if (titleLower.includes('instrução') || titleLower.includes('instrucao')) tipo = 'Instrução';
      map[tipo] = (map[tipo] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  // Helper to classify degree
  const classifyDegree = (degree: string) => {
    const d = (degree || '').toLowerCase();
    if (d.includes('mestre') || d.includes('m∴m∴') || d === '3') return 'Mestre';
    if (d.includes('aprendiz') || d.includes('a∴m∴') || d === '1') return 'Aprendiz';
    if (d.includes('companheiro') || d.includes('c∴m∴') || d === '2') return 'Companheiro';
    return 'Outros';
  };

  // Session degree totals (period start to today)
  const sessionDegreeTotals = useMemo(() => {
    const now = new Date();
    const periodStart = period ? period.termStart : null;
    const filtered = sessions.filter(s => {
      const dt = parseISO(s.session_datetime);
      if (dt > now) return false;
      if (periodStart && dt < periodStart) return false;
      return true;
    });
    const map: Record<string, number> = { 'Mestre': 0, 'Aprendiz': 0, 'Companheiro': 0, 'Outros': 0 };
    filtered.forEach(s => { map[classifyDegree(s.session_degree)]++; });
    const total = filtered.length;

    // All-time totals (all sessions in the period, including future)
    const allMap: Record<string, number> = { 'Mestre': 0, 'Aprendiz': 0, 'Companheiro': 0, 'Outros': 0 };
    const allFiltered = sessions.filter(s => {
      const dt = parseISO(s.session_datetime);
      if (periodStart && dt < periodStart) return false;
      return true;
    });
    allFiltered.forEach(s => { allMap[classifyDegree(s.session_degree)]++; });
    const allTotal = allFiltered.length;

    const degrees = ['Mestre', 'Aprendiz', 'Companheiro', 'Outros'].filter(d => map[d] > 0 || allMap[d] > 0);
    return { degrees, map, allMap, total, allTotal };
  }, [sessions, period]);

  // Chart data: attendance per session this month
  const attendanceChartData = useMemo(
    () => sessionsThisMonth
      .sort((a, b) => new Date(a.session_datetime).getTime() - new Date(b.session_datetime).getTime())
      .map(s => ({
        name: format(parseISO(s.session_datetime), 'dd/MM', { locale: ptBR }),
        presentes: s.presentCount,
        visitantes: s.visitorCount,
        titulo: s.title,
      })),
    [sessionsThisMonth]
  );

  // Frequency evolution (last 6 months)
  const frequencyEvolution = useMemo(() => {
    const months: { label: string; avg: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedDate);
      d.setMonth(d.getMonth() - i);
      const mSessions = sessions.filter(s => isSameMonth(parseISO(s.session_datetime), d));
      let avg = 0;
      if (mSessions.length > 0) {
        avg = mSessions.reduce((sum, s) => {
          return sum + (s.totalMembers > 0 ? (s.presentCount / s.totalMembers) * 100 : 0);
        }, 0) / mSessions.length;
      }
      months.push({
        label: format(d, 'MMM/yy', { locale: ptBR }),
        avg: Math.round(avg),
      });
    }
    return months;
  }, [sessions, selectedDate]);

  // Degree distribution pie
  const degreeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    sessionsThisMonth.forEach(s => {
      map[s.session_degree] = (map[s.session_degree] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sessionsThisMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

      {/* Month Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const d = new Date(selectedDate);
            d.setMonth(d.getMonth() - 1);
            setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[160px] text-center capitalize">
          {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const d = new Date(selectedDate);
            d.setMonth(d.getMonth() + 1);
            setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Última Sessão - Presenças */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presenças (Última Sessão)</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{lastSession?.presentCount ?? 0}</p>
                {lastSession && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(lastSession.session_datetime), 'dd/MM/yyyy', { locale: ptBR })} — {lastSession.title}
                  </p>
                )}
              </div>
              <UserCheck className="w-10 h-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Última Sessão - Visitantes */}
        <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visitantes (Última Sessão)</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{lastSession?.visitorCount ?? 0}</p>
                {lastSession && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(lastSession.session_datetime), 'dd/MM/yyyy', { locale: ptBR })} — {lastSession.title}
                  </p>
                )}
              </div>
              <Users className="w-10 h-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Frequência Última Sessão */}
        <Card className={`bg-gradient-to-br ${lastSessionFrequency >= 60 ? 'from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-900 border-teal-200 dark:border-teal-800' : 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frequência (Última Sessão)</p>
                <p className={`text-2xl font-bold ${lastSessionFrequency >= 60 ? 'text-teal-700 dark:text-teal-300' : 'text-red-700 dark:text-red-300'}`}>{lastSessionFrequency}%</p>
                {lastSession && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {lastSession.presentCount} de {lastSession.totalMembers} membros
                  </p>
                )}
              </div>
              {lastSessionFrequency >= 60 ? (
                <TrendingUp className="w-10 h-10 text-teal-500/50" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-500/50" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessões no Mês */}
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessões no Mês</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{sessionsThisMonth.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalPresencesMonth} presenças · {totalVisitorsMonth} visitantes
                </p>
              </div>
              <BarChart3 className="w-10 h-10 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Frequência Média do Mês */}
        <Card className={`bg-gradient-to-br ${avgFrequencyMonth >= 60 ? 'from-indigo-50 to-violet-100 dark:from-indigo-950 dark:to-violet-900 border-indigo-200 dark:border-indigo-800' : 'from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-orange-200 dark:border-orange-800'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frequência Média (Mês)</p>
                <p className={`text-2xl font-bold ${avgFrequencyMonth >= 60 ? 'text-indigo-700 dark:text-indigo-300' : 'text-orange-700 dark:text-orange-300'}`}>{avgFrequencyMonth}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Acumulado de {sessionsThisMonth.length} sessão(ões)
                </p>
              </div>
              <Activity className={`w-10 h-10 ${avgFrequencyMonth >= 60 ? 'text-indigo-500/50' : 'text-orange-500/50'}`} />
            </div>
            {avgFrequencyMonth < 60 && avgFrequencyMonth > 0 && (
              <p className="text-xs text-destructive mt-2 font-medium">⚠ Frequência abaixo de 60%</p>
            )}
          </CardContent>
        </Card>

        {/* Totais por Tipo de Sessão */}
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-950 dark:to-fuchsia-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Reuniões por Grau</p>
              <ClipboardList className="w-10 h-10 text-purple-500/50" />
            </div>
            {sessionDegreeTotals.degrees.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Grau</span>
                  <div className="flex gap-3">
                    <span className="w-16 text-center">Gestão</span>
                    <span className="w-16 text-center">Geral</span>
                  </div>
                </div>
                {sessionDegreeTotals.degrees.map(grau => (
                  <div key={grau} className="flex items-center justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">{grau}</span>
                    <div className="flex gap-3">
                      <Badge variant="secondary" className="text-xs w-16 justify-center">{sessionDegreeTotals.map[grau]}</Badge>
                      <Badge variant="outline" className="text-xs w-16 justify-center">{sessionDegreeTotals.allMap[grau]}</Badge>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t border-purple-200 dark:border-purple-700">
                  <span className="text-purple-700 dark:text-purple-300">Total</span>
                  <div className="flex gap-3">
                    <Badge variant="default" className="text-xs w-16 justify-center">{sessionDegreeTotals.total}</Badge>
                    <Badge variant="outline" className="text-xs w-16 justify-center font-semibold">{sessionDegreeTotals.allTotal}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma sessão</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Birthdays this month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="w-5 h-5 text-primary" />
            Comemorações de {format(selectedDate, 'MMMM', { locale: ptBR })}
            <Badge variant="secondary" className="ml-2">{birthdaysThisMonth.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {birthdaysThisMonth.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {birthdaysThisMonth.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{b.dayOfMonth}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{b.profileName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      <Badge variant="outline" className="mr-1 text-[10px] px-1 py-0">
                        {b.dateType}
                      </Badge>
                      {b.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum aniversariante neste mês
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance per session */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Presenças por Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'presentes' ? 'Irmãos Presentes' : 'Visitantes',
                    ]}
                  />
                  <Legend formatter={(value) => value === 'presentes' ? 'Irmãos' : 'Visitantes'} />
                  <Bar dataKey="presentes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="visitantes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma sessão neste mês</p>
            )}
          </CardContent>
        </Card>

        {/* Degree distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessões por Grau</CardTitle>
          </CardHeader>
          <CardContent>
            {degreeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={degreeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {degreeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Frequency evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução da Frequência (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={frequencyEvolution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [`${value}%`, 'Frequência']}
              />
              <defs>
                <linearGradient id="freqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="avg"
                stroke="hsl(var(--primary))"
                fill="url(#freqGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChancelleryDashboard;
