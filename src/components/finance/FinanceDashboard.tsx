import { parseDateSafe } from '@/lib/utils';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, Crown } from 'lucide-react';
import {
  useFinancialTransactions,
  useFinancialAccounts,
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/hooks/useFinancialData';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

const FinanceDashboard: React.FC = () => {
  const { data: transactions = [] } = useFinancialTransactions();
  const { data: accounts = [] } = useFinancialAccounts();
  const { period, isWithinMasterPeriod, periodLabel, masterName } = useActiveMasterPeriod();

  const periodTransactions = useMemo(() => {
    if (!period) return transactions;
    return transactions.filter(t => isWithinMasterPeriod(t.transaction_date));
  }, [transactions, period, isWithinMasterPeriod]);

  const stats = useMemo(() => {
    const txs = periodTransactions;
    const totalReceitas = txs.filter(t => t.transaction_type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
    const totalDespesas = txs.filter(t => t.transaction_type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);
    const saldo = totalReceitas - totalDespesas;
    const totalInvestido = accounts.reduce((s, a) => s + Number(a.balance), 0);

    // Monthly data within master period or last 12 months
    const monthlyData: { month: string; receitas: number; despesas: number; saldo: number }[] = [];
    let runningSaldo = 0;

    const months = period
      ? eachMonthOfInterval({ start: period.termStart, end: period.termEnd > new Date() ? new Date() : period.termEnd })
      : Array.from({ length: 12 }, (_, i) => subMonths(new Date(), 11 - i));

    for (const d of months) {
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, 'MMM/yy', { locale: ptBR });
      const monthRevenue = txs.filter(t => t.transaction_type === 'receita' && parseDateSafe(t.transaction_date) >= start && parseDateSafe(t.transaction_date) <= end).reduce((s, t) => s + Number(t.amount), 0);
      const monthExpense = txs.filter(t => t.transaction_type === 'despesa' && parseDateSafe(t.transaction_date) >= start && parseDateSafe(t.transaction_date) <= end).reduce((s, t) => s + Number(t.amount), 0);
      runningSaldo += monthRevenue - monthExpense;
      monthlyData.push({ month: label, receitas: monthRevenue, despesas: monthExpense, saldo: runningSaldo });
    }

    // Category breakdown
    const expenseByCategory = EXPENSE_CATEGORIES.map(c => {
      const total = txs.filter(t => t.transaction_type === 'despesa' && t.category === c.value).reduce((s, t) => s + Number(t.amount), 0);
      return { name: c.label, value: total };
    }).filter(c => c.value > 0);

    const revenueByCategory = REVENUE_CATEGORIES.map(c => {
      const total = txs.filter(t => t.transaction_type === 'receita' && t.category === c.value).reduce((s, t) => s + Number(t.amount), 0);
      return { name: c.label, value: total };
    }).filter(c => c.value > 0);

    const now = new Date();
    const curStart = startOfMonth(now);
    const curEnd = endOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(subMonths(now, 1));

    const curRevenue = txs.filter(t => t.transaction_type === 'receita' && parseDateSafe(t.transaction_date) >= curStart && parseDateSafe(t.transaction_date) <= curEnd).reduce((s, t) => s + Number(t.amount), 0);
    const prevRevenue = txs.filter(t => t.transaction_type === 'receita' && parseDateSafe(t.transaction_date) >= prevStart && parseDateSafe(t.transaction_date) <= prevEnd).reduce((s, t) => s + Number(t.amount), 0);
    const curExpense = txs.filter(t => t.transaction_type === 'despesa' && parseDateSafe(t.transaction_date) >= curStart && parseDateSafe(t.transaction_date) <= curEnd).reduce((s, t) => s + Number(t.amount), 0);
    const prevExpense = txs.filter(t => t.transaction_type === 'despesa' && parseDateSafe(t.transaction_date) >= prevStart && parseDateSafe(t.transaction_date) <= prevEnd).reduce((s, t) => s + Number(t.amount), 0);

    const revenueChange = prevRevenue > 0 ? ((curRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const expenseChange = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : 0;

    // Alerts
    const alerts: string[] = [];
    if (saldo < 0) alerts.push('⚠️ Saldo geral negativo! Despesas superam receitas.');
    if (curExpense > curRevenue && curRevenue > 0) alerts.push('⚠️ Despesas do mês atual superam as receitas.');
    if (expenseChange > 20) alerts.push(`📈 Despesas aumentaram ${expenseChange.toFixed(0)}% em relação ao mês anterior.`);
    const topExpense = expenseByCategory.sort((a, b) => b.value - a.value)[0];
    if (topExpense && totalDespesas > 0 && (topExpense.value / totalDespesas) > 0.4) {
      alerts.push(`🔍 "${topExpense.name}" representa ${((topExpense.value / totalDespesas) * 100).toFixed(0)}% das despesas totais.`);
    }

    return { totalReceitas, totalDespesas, saldo, totalInvestido, monthlyData, expenseByCategory, revenueByCategory, curRevenue, curExpense, revenueChange, expenseChange, alerts };
  }, [periodTransactions, accounts, period]);

  const barChartConfig: ChartConfig = {
    receitas: { label: 'Receitas', color: '#10b981' },
    despesas: { label: 'Despesas', color: '#ef4444' },
  };

  const areaChartConfig: ChartConfig = {
    saldo: { label: 'Saldo Acumulado', color: '#3b82f6' },
  };

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
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receitas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(stats.totalReceitas)}</p>
                {stats.revenueChange !== 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {stats.revenueChange > 0 ? <ArrowUpRight className="w-3 h-3 text-green-600" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                    <span className={`text-xs ${stats.revenueChange > 0 ? 'text-green-600' : 'text-red-500'}`}>{Math.abs(stats.revenueChange).toFixed(1)}% vs mês anterior</span>
                  </div>
                )}
              </div>
              <TrendingUp className="w-10 h-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Despesas</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(stats.totalDespesas)}</p>
                {stats.expenseChange !== 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {stats.expenseChange > 0 ? <ArrowUpRight className="w-3 h-3 text-red-500" /> : <ArrowDownRight className="w-3 h-3 text-green-600" />}
                    <span className={`text-xs ${stats.expenseChange > 0 ? 'text-red-500' : 'text-green-600'}`}>{Math.abs(stats.expenseChange).toFixed(1)}% vs mês anterior</span>
                  </div>
                )}
              </div>
              <TrendingDown className="w-10 h-10 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.saldo >= 0 ? 'from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 border-blue-200 dark:border-blue-800' : 'from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-orange-200 dark:border-orange-800'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Operacional</p>
                <p className={`text-2xl font-bold ${stats.saldo >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>{formatCurrency(stats.saldo)}</p>
              </div>
              <Wallet className={`w-10 h-10 ${stats.saldo >= 0 ? 'text-blue-500/50' : 'text-orange-500/50'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investimentos</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(stats.totalInvestido)}</p>
                <span className="text-xs text-muted-foreground">{accounts.filter(a => a.is_active).length} conta(s) ativa(s)</span>
              </div>
              <PiggyBank className="w-10 h-10 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5" /> Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {stats.alerts.map((a, i) => (
                <li key={i} className="text-sm text-amber-700 dark:text-amber-300">{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expense Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receitas vs Despesas (Gestão)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                <Bar dataKey="receitas" fill="var(--color-receitas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="var(--color-despesas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Balance Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução do Saldo Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                <Area type="monotone" dataKey="saldo" stroke="var(--color-saldo)" fill="url(#saldoGrad)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Expense Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.expenseByCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.expenseByCategory} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={10}>
                      {stats.expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receitas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueByCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma receita registrada</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.revenueByCategory} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={10}>
                      {stats.revenueByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;
