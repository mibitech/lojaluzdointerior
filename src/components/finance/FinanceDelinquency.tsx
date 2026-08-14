import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, UserX, AlertTriangle, Search, DollarSign, Users } from 'lucide-react';
import { useFinancialTransactions } from '@/hooks/useFinancialData';
import { useProfiles, type Profile } from '@/hooks/useProfiles';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';
import { format, eachMonthOfInterval, startOfMonth, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface MemberDelinquency {
  profile: Profile;
  unpaidMonths: string[]; // format: YYYY-MM
  totalOwed: number;
  paidMonths: string[];
}

const FinanceDelinquency: React.FC = () => {
  const { data: transactions = [] } = useFinancialTransactions();
  const { profiles, loading: profilesLoading } = useProfiles();
  const { period, periodLabel, masterName } = useActiveMasterPeriod();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('inadimplente');

  // Calculate expected months within the master period up to current month
  const expectedMonths = useMemo(() => {
    if (!period) return [];
    const now = new Date();
    const endDate = isBefore(period.termEnd, now) ? period.termEnd : now;
    if (isAfter(period.termStart, endDate)) return [];
    return eachMonthOfInterval({ start: period.termStart, end: endDate }).map(d =>
      format(d, 'yyyy-MM')
    );
  }, [period]);

  // Build delinquency data per member
  const delinquencyData = useMemo(() => {
    if (!period || expectedMonths.length === 0) return [];

    // Get mensalidade transactions grouped by profile_id + reference_month
    const paidMap = new Map<string, Set<string>>();
    transactions
      .filter(t => t.transaction_type === 'receita' && t.category === 'mensalidade' && t.profile_id)
      .forEach(t => {
        const key = t.profile_id!;
        if (!paidMap.has(key)) paidMap.set(key, new Set());
        if (t.reference_month) {
          paidMap.get(key)!.add(t.reference_month);
        }
      });

    // Only consider active members (those with user_id)
    const activeProfiles = profiles.filter(p => p.user_id && p.member_status !== 'Remido');

    return activeProfiles.map(profile => {
      const paid = paidMap.get(profile.id) || new Set<string>();
      const paidMonths = expectedMonths.filter(m => paid.has(m));
      const unpaidMonths = expectedMonths.filter(m => !paid.has(m));

      // Estimate amount owed - use average mensalidade or a default
      const mensalidadeTxs = transactions.filter(
        t => t.transaction_type === 'receita' && t.category === 'mensalidade'
      );
      const avgMensalidade = mensalidadeTxs.length > 0
        ? mensalidadeTxs.reduce((s, t) => s + Number(t.amount), 0) / mensalidadeTxs.length
        : 0;

      return {
        profile,
        unpaidMonths,
        paidMonths,
        totalOwed: unpaidMonths.length * avgMensalidade,
      } as MemberDelinquency;
    });
  }, [transactions, profiles, period, expectedMonths]);

  // Filter and sort
  const filtered = useMemo(() => {
    let data = delinquencyData;

    if (filterStatus === 'inadimplente') {
      data = data.filter(d => d.unpaidMonths.length > 0);
    } else if (filterStatus === 'em_dia') {
      data = data.filter(d => d.unpaidMonths.length === 0);
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      data = data.filter(d => d.profile.full_name?.toLowerCase().includes(s));
    }

    return data.sort((a, b) => b.unpaidMonths.length - a.unpaidMonths.length);
  }, [delinquencyData, filterStatus, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const inadimplentes = delinquencyData.filter(d => d.unpaidMonths.length > 0);
    const totalMembers = delinquencyData.length;
    const totalInadimplentes = inadimplentes.length;
    const totalOwed = inadimplentes.reduce((s, d) => s + d.totalOwed, 0);
    const criticos = inadimplentes.filter(d => d.unpaidMonths.length >= 3).length;
    const taxaAdimplencia = totalMembers > 0
      ? ((totalMembers - totalInadimplentes) / totalMembers * 100)
      : 100;

    return { totalMembers, totalInadimplentes, totalOwed, criticos, taxaAdimplencia };
  }, [delinquencyData]);

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(d, 'MMM/yy', { locale: ptBR });
  };

  const getSeverityBadge = (unpaidCount: number) => {
    if (unpaidCount === 0) return <Badge className="bg-green-600">Em dia</Badge>;
    if (unpaidCount <= 2) return <Badge variant="outline" className="border-amber-500 text-amber-600">Atenção</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
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
        <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inadimplentes</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.totalInadimplentes}</p>
                <span className="text-xs text-muted-foreground">de {stats.totalMembers} membros</span>
              </div>
              <UserX className="w-10 h-10 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total em Atraso</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(stats.totalOwed)}</p>
                <span className="text-xs text-muted-foreground">estimativa</span>
              </div>
              <DollarSign className="w-10 h-10 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-900 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Situação Crítica</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.criticos}</p>
                <span className="text-xs text-muted-foreground">3+ meses em atraso</span>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Adimplência</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.taxaAdimplencia.toFixed(1)}%</p>
                <span className="text-xs text-muted-foreground">{stats.totalMembers - stats.totalInadimplentes} em dia</span>
              </div>
              <Users className="w-10 h-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Buscar Membro</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do irmão..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Label>Situação</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="inadimplente">Inadimplentes</SelectItem>
                  <SelectItem value="em_dia">Em dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Situação de Mensalidades por Membro</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-center">Meses Pagos</TableHead>
                  <TableHead className="text-center">Meses em Atraso</TableHead>
                  <TableHead>Meses Pendentes</TableHead>
                  <TableHead className="text-right">Valor Estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profilesLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{filterStatus === 'inadimplente' ? 'Nenhum inadimplente encontrado 🎉' : 'Nenhum registro encontrado'}</TableCell></TableRow>
                ) : (
                  filtered.map(item => (
                    <TableRow key={item.profile.id}>
                      <TableCell className="font-medium">{item.profile.full_name || 'Sem nome'}</TableCell>
                      <TableCell>{getSeverityBadge(item.unpaidMonths.length)}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-600 font-medium">{item.paidMonths.length}</span>
                        <span className="text-muted-foreground">/{expectedMonths.length}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.unpaidMonths.length > 0 ? (
                          <span className="text-red-600 font-bold">{item.unpaidMonths.length}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.unpaidMonths.length === 0 ? (
                            <span className="text-sm text-muted-foreground">—</span>
                          ) : (
                            item.unpaidMonths.slice(0, 6).map(m => (
                              <Badge key={m} variant="outline" className="text-xs border-red-300 text-red-600">{formatMonth(m)}</Badge>
                            ))
                          )}
                          {item.unpaidMonths.length > 6 && (
                            <Badge variant="outline" className="text-xs">+{item.unpaidMonths.length - 6}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {item.unpaidMonths.length > 0 ? formatCurrency(item.totalOwed) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3 p-4">
            {profilesLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">{filterStatus === 'inadimplente' ? 'Nenhum inadimplente encontrado 🎉' : 'Nenhum registro encontrado'}</p>
            ) : filtered.map(item => (
              <Card key={item.profile.id} className="shadow-soft">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold">{item.profile.full_name || 'Sem nome'}</p>
                    {getSeverityBadge(item.unpaidMonths.length)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pagos: <span className="text-green-600 font-medium">{item.paidMonths.length}</span>/{expectedMonths.length}</span>
                    <span className="text-muted-foreground">Atraso: <span className="text-red-600 font-bold">{item.unpaidMonths.length}</span></span>
                  </div>
                  {item.unpaidMonths.length > 0 && (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {item.unpaidMonths.slice(0, 4).map(m => (
                          <Badge key={m} variant="outline" className="text-xs border-red-300 text-red-600">{formatMonth(m)}</Badge>
                        ))}
                        {item.unpaidMonths.length > 4 && <Badge variant="outline" className="text-xs">+{item.unpaidMonths.length - 4}</Badge>}
                      </div>
                      <p className="text-right font-medium text-red-600">{formatCurrency(item.totalOwed)}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info note */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>ℹ️ Como funciona:</strong> A inadimplência é calculada comparando os meses do período da gestão atual
            com os lançamentos de receita do tipo "Mensalidade" vinculados a cada membro (campo "Mês de Referência" e "Irmão" no lançamento).
            Para que o controle funcione corretamente, ao registrar uma mensalidade, vincule o membro no campo profile_id e preencha o mês de referência.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDelinquency;
