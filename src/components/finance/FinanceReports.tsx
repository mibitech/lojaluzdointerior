import { parseDateSafe } from '@/lib/utils';
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Download, Calendar } from 'lucide-react';
import {
  useFinancialTransactions,
  useFinancialAccounts,
  useAccountMovements,
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/hooks/useFinancialData';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const allCategories = [...REVENUE_CATEGORIES, ...EXPENSE_CATEGORIES];
const getCategoryLabel = (val: string) => allCategories.find(c => c.value === val)?.label || val;

type ReportType = 'mensal' | 'anual' | 'categoria' | 'completo';

const FinanceReports: React.FC = () => {
  const { data: transactions = [] } = useFinancialTransactions();
  const { data: accounts = [] } = useFinancialAccounts();
  const { data: movements = [] } = useAccountMovements();

  const [reportType, setReportType] = useState<ReportType>('mensal');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const years = useMemo(() => {
    const ySet = new Set(transactions.map(t => t.transaction_date.substring(0, 4)));
    ySet.add(String(new Date().getFullYear()));
    return Array.from(ySet).sort().reverse();
  }, [transactions]);

  // Monthly report data
  const monthlyReport = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = endOfMonth(start);
    const filtered = transactions.filter(t => {
      const d = parseDateSafe(t.transaction_date);
      return d >= start && d <= end;
    });
    const receitas = filtered.filter(t => t.transaction_type === 'receita');
    const despesas = filtered.filter(t => t.transaction_type === 'despesa');
    const totalReceitas = receitas.reduce((s, t) => s + Number(t.amount), 0);
    const totalDespesas = despesas.reduce((s, t) => s + Number(t.amount), 0);
    return { filtered, receitas, despesas, totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas };
  }, [transactions, selectedMonth]);

  // Annual report
  const annualReport = useMemo(() => {
    const filtered = transactions.filter(t => t.transaction_date.startsWith(selectedYear));
    const months: { month: string; receitas: number; despesas: number; saldo: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const prefix = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;
      const monthTx = filtered.filter(t => t.transaction_date.startsWith(prefix));
      const rec = monthTx.filter(t => t.transaction_type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
      const desp = monthTx.filter(t => t.transaction_type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);
      months.push({ month: format(new Date(Number(selectedYear), m, 1), 'MMMM', { locale: ptBR }), receitas: rec, despesas: desp, saldo: rec - desp });
    }
    const totalRec = months.reduce((s, m) => s + m.receitas, 0);
    const totalDesp = months.reduce((s, m) => s + m.despesas, 0);
    return { months, totalRec, totalDesp, saldo: totalRec - totalDesp };
  }, [transactions, selectedYear]);

  // Category report
  const categoryReport = useMemo(() => {
    const filtered = transactions.filter(t => t.transaction_date.startsWith(selectedYear));
    const recCats = REVENUE_CATEGORIES.map(c => ({
      category: c.label,
      total: filtered.filter(t => t.transaction_type === 'receita' && t.category === c.value).reduce((s, t) => s + Number(t.amount), 0),
    })).filter(c => c.total > 0);
    const despCats = EXPENSE_CATEGORIES.map(c => ({
      category: c.label,
      total: filtered.filter(t => t.transaction_type === 'despesa' && t.category === c.value).reduce((s, t) => s + Number(t.amount), 0),
    })).filter(c => c.total > 0);
    return { recCats, despCats };
  }, [transactions, selectedYear]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    if (reportType === 'mensal' || reportType === 'completo') {
      const data = monthlyReport.filtered.map(t => ({
        Data: format(new Date(t.transaction_date + 'T12:00:00'), 'dd/MM/yyyy'),
        Tipo: t.transaction_type === 'receita' ? 'Receita' : 'Despesa',
        Categoria: getCategoryLabel(t.category),
        Subcategoria: t.subcategory || '',
        Descrição: t.description || '',
        Valor: Number(t.amount),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos Mensal');
    }

    if (reportType === 'anual' || reportType === 'completo') {
      const data = annualReport.months.map(m => ({
        Mês: m.month,
        Receitas: m.receitas,
        Despesas: m.despesas,
        Saldo: m.saldo,
      }));
      data.push({ Mês: 'TOTAL', Receitas: annualReport.totalRec, Despesas: annualReport.totalDesp, Saldo: annualReport.saldo });
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Resumo Anual');
    }

    if (reportType === 'categoria' || reportType === 'completo') {
      const recData = categoryReport.recCats.map(c => ({ Categoria: c.category, Total: c.total }));
      const despData = categoryReport.despCats.map(c => ({ Categoria: c.category, Total: c.total }));
      const wsRec = XLSX.utils.json_to_sheet(recData);
      const wsDesp = XLSX.utils.json_to_sheet(despData);
      XLSX.utils.book_append_sheet(wb, wsRec, 'Receitas por Categoria');
      XLSX.utils.book_append_sheet(wb, wsDesp, 'Despesas por Categoria');
    }

    if (reportType === 'completo') {
      // Investments sheet
      const accData = accounts.map(a => ({
        Conta: a.account_name,
        Tipo: a.account_type,
        Instituição: a.institution || '',
        Saldo: Number(a.balance),
        Status: a.is_active ? 'Ativa' : 'Inativa',
      }));
      const wsAcc = XLSX.utils.json_to_sheet(accData);
      XLSX.utils.book_append_sheet(wb, wsAcc, 'Investimentos');

      // All transactions
      const allData = transactions.map(t => ({
        Data: format(new Date(t.transaction_date + 'T12:00:00'), 'dd/MM/yyyy'),
        Tipo: t.transaction_type === 'receita' ? 'Receita' : 'Despesa',
        Categoria: getCategoryLabel(t.category),
        Subcategoria: t.subcategory || '',
        Descrição: t.description || '',
        Valor: Number(t.amount),
        'Mês Referência': t.reference_month || '',
      }));
      const wsAll = XLSX.utils.json_to_sheet(allData);
      wsAll['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsAll, 'Todos Lançamentos');
    }

    const fileName = reportType === 'completo'
      ? `relatorio_financeiro_completo_${selectedYear}.xlsx`
      : `relatorio_${reportType}_${reportType === 'mensal' ? selectedMonth : selectedYear}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-[200px]">
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={v => setReportType(v as ReportType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Resumo Anual</SelectItem>
                  <SelectItem value="categoria">Por Categoria</SelectItem>
                  <SelectItem value="completo">Relatório Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(reportType === 'mensal' || reportType === 'completo') && (
              <div className="w-[180px]">
                <Label>Mês</Label>
                <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
              </div>
            )}
            <div className="w-[120px]">
              <Label>Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportToExcel} className="gap-2 ml-auto">
              <Download className="w-4 h-4" /> Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Report */}
      {(reportType === 'mensal' || reportType === 'completo') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Relatório Mensal — {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(monthlyReport.totalReceitas)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(monthlyReport.totalDespesas)}</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${monthlyReport.saldo >= 0 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${monthlyReport.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(monthlyReport.saldo)}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyReport.filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum lançamento no período</TableCell></TableRow>
                ) : monthlyReport.filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.transaction_date + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className={t.transaction_type === 'receita' ? 'text-green-600' : 'text-red-600'}>{t.transaction_type === 'receita' ? 'Receita' : 'Despesa'}</TableCell>
                    <TableCell>{getCategoryLabel(t.category)}</TableCell>
                    <TableCell>{t.description || '—'}</TableCell>
                    <TableCell className={`text-right font-medium ${t.transaction_type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Annual Report */}
      {(reportType === 'anual' || reportType === 'completo') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Resumo Anual — {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annualReport.months.map((m, i) => (
                  <TableRow key={i} className={m.receitas === 0 && m.despesas === 0 ? 'opacity-50' : ''}>
                    <TableCell className="capitalize font-medium">{m.month}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(m.receitas)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(m.despesas)}</TableCell>
                    <TableCell className={`text-right font-semibold ${m.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(m.saldo)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold border-t-2">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(annualReport.totalRec)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(annualReport.totalDesp)}</TableCell>
                  <TableCell className={`text-right ${annualReport.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(annualReport.saldo)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Category Report */}
      {(reportType === 'categoria' || reportType === 'completo') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg text-green-700">Receitas por Categoria — {selectedYear}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryReport.recCats.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">Sem dados</TableCell></TableRow>
                  ) : categoryReport.recCats.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.category}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{formatCurrency(c.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg text-red-700">Despesas por Categoria — {selectedYear}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryReport.despCats.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">Sem dados</TableCell></TableRow>
                  ) : categoryReport.despCats.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.category}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{formatCurrency(c.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinanceReports;
