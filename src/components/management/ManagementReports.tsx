import { parseDateSafe } from '@/lib/utils';
import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, FileText, Download, Eye } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { useFinancialTransactions, useFinancialAccounts } from '@/hooks/useFinancialData';
import { useProfiles } from '@/hooks/useProfiles';
import { useHospitalarCases, useHospitalarVisits, useHospitalarAidRequests, useHospitalarFund, useHospitalarPhilanthropy } from '@/hooks/useHospitalaria';
import { useCorrespondence, useSecretaryDocuments } from '@/hooks/useSecretary';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type PeriodFilter = 'mes_atual' | 'trimestre' | 'semestre' | 'ano' | 'gestao';

const getPeriodRange = (filter: PeriodFilter, periodStart?: Date, periodEnd?: Date) => {
  const now = new Date();
  switch (filter) {
    case 'mes_atual': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'trimestre': return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    case 'semestre': return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
    case 'ano': return { start: startOfYear(now), end: endOfMonth(now) };
    case 'gestao': return periodStart && periodEnd ? { start: periodStart, end: periodEnd } : { start: startOfYear(now), end: endOfMonth(now) };
  }
};

interface ReportDef {
  id: string;
  title: string;
  description: string;
  module: string;
}

const REPORTS: ReportDef[] = [
  { id: 'dre', title: 'DRE Simplificado', description: 'Demonstrativo de receitas e despesas por categoria', module: 'Financeiro' },
  { id: 'extrato', title: 'Extrato Completo', description: 'Todos os lançamentos financeiros do período', module: 'Financeiro' },
  { id: 'inadimplencia', title: 'Inadimplência por Obreiro', description: 'Detalhamento de mensalidades em aberto', module: 'Financeiro' },
  { id: 'balancete', title: 'Balancete Mensal', description: 'Resumo financeiro mensal com saldos', module: 'Financeiro' },
  { id: 'assistidos', title: 'Obreiros Assistidos', description: 'Relatório de acompanhamentos no período', module: 'Hospitalaria' },
  { id: 'auxilios', title: 'Auxílios Concedidos', description: 'Histórico de auxílios com valores e beneficiários', module: 'Hospitalaria' },
  { id: 'tronco_extrato', title: 'Extrato do Tronco', description: 'Movimentações do Tronco de Beneficência', module: 'Hospitalaria' },
  { id: 'filantropia', title: 'Ações Filantrópicas', description: 'Relatório de ações com impacto registrado', module: 'Hospitalaria' },
  { id: 'atas', title: 'Livro de Atas', description: 'Todas as atas registradas no período', module: 'Secretaria' },
  { id: 'frequencia', title: 'Frequência por Obreiro', description: 'Presença detalhada em sessões', module: 'Secretaria' },
  { id: 'correspondencias', title: 'Correspondências', description: 'Registro de envios e recebimentos', module: 'Secretaria' },
  { id: 'documentos', title: 'Inventário de Documentos', description: 'Documentos arquivados no período', module: 'Secretaria' },
  { id: 'exec_mensal', title: 'Relatório Executivo Mensal', description: 'Resumo consolidado de todos os módulos', module: 'Consolidado' },
  { id: 'exec_anual', title: 'Relatório Anual da Gestão', description: 'Relatório completo do ano por área', module: 'Consolidado' },
];

const moduleColors: Record<string, string> = {
  'Financeiro': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Hospitalaria': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Secretaria': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'Consolidado': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const ManagementReports: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('gestao');
  const [moduleFilter, setModuleFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ title: string; rows: Record<string, unknown>[]; columns: string[] } | null>(null);

  const { period } = useActiveMasterPeriod();
  const { data: transactions = [] } = useFinancialTransactions();
  const { data: accounts = [] } = useFinancialAccounts();
  const { profiles } = useProfiles();
  const { data: cases = [] } = useHospitalarCases();
  const { data: visits = [] } = useHospitalarVisits();
  const { data: aidRequests = [] } = useHospitalarAidRequests();
  const { data: fund = [] } = useHospitalarFund();
  const { data: philanthropy = [] } = useHospitalarPhilanthropy();
  const { data: correspondence = [] } = useCorrespondence();
  const { data: documents = [] } = useSecretaryDocuments();

  const { data: minutes = [] } = useQuery({
    queryKey: ['meeting_minutes_reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meeting_minutes').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: attendances = [] } = useQuery({
    queryKey: ['attendances_reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('session_attendances').select('*, profiles:profile_id(full_name)');
      if (error) throw error;
      return data || [];
    },
  });

  const range = useMemo(() => getPeriodRange(periodFilter, period?.termStart, period?.termEnd), [periodFilter, period]);

  const isInRange = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    return d >= range.start && d <= range.end;
  }, [range]);

  const filteredReports = REPORTS.filter(r => {
    if (moduleFilter !== 'todos' && r.module !== moduleFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getReportData = useCallback((reportId: string): { data: Record<string, unknown>[]; sheetName: string } => {
    switch (reportId) {
      case 'extrato':
        return {
          data: transactions.filter(t => isInRange(t.transaction_date)).map(t => ({
            Data: format(parseDateSafe(t.transaction_date), 'dd/MM/yyyy'),
            Tipo: t.transaction_type === 'receita' ? 'Receita' : 'Despesa',
            Categoria: t.category,
            Descrição: t.description || '',
            Valor: Number(t.amount),
          })),
          sheetName: 'Extrato',
        };
      case 'dre': {
        const periodTxs = transactions.filter(t => isInRange(t.transaction_date));
        const receitas = periodTxs.filter(t => t.transaction_type === 'receita');
        const despesas = periodTxs.filter(t => t.transaction_type === 'despesa');
        const catReceitas = new Map<string, number>();
        const catDespesas = new Map<string, number>();
        receitas.forEach(t => catReceitas.set(t.category, (catReceitas.get(t.category) || 0) + Number(t.amount)));
        despesas.forEach(t => catDespesas.set(t.category, (catDespesas.get(t.category) || 0) + Number(t.amount)));
        return {
          data: [
            { Grupo: 'RECEITAS', Categoria: '', Valor: '' },
            ...Array.from(catReceitas.entries()).map(([cat, val]) => ({ Grupo: '', Categoria: cat, Valor: val })),
            { Grupo: 'Total Receitas', Categoria: '', Valor: receitas.reduce((s, t) => s + Number(t.amount), 0) },
            { Grupo: '', Categoria: '', Valor: '' },
            { Grupo: 'DESPESAS', Categoria: '', Valor: '' },
            ...Array.from(catDespesas.entries()).map(([cat, val]) => ({ Grupo: '', Categoria: cat, Valor: val })),
            { Grupo: 'Total Despesas', Categoria: '', Valor: despesas.reduce((s, t) => s + Number(t.amount), 0) },
            { Grupo: '', Categoria: '', Valor: '' },
            { Grupo: 'RESULTADO', Categoria: '', Valor: receitas.reduce((s, t) => s + Number(t.amount), 0) - despesas.reduce((s, t) => s + Number(t.amount), 0) },
          ],
          sheetName: 'DRE',
        };
      }
      case 'balancete':
        return {
          data: accounts.map(a => ({
            Conta: a.account_name,
            Tipo: a.account_type,
            Instituição: a.institution || '-',
            Saldo: Number(a.balance),
            Status: a.is_active ? 'Ativa' : 'Inativa',
          })),
          sheetName: 'Balancete',
        };
      case 'inadimplencia': {
        const delinquent = transactions
          .filter(t => t.transaction_type === 'receita' && t.category === 'Mensalidade' && isInRange(t.transaction_date))
          .reduce((acc, t) => {
            const name = profiles.find(p => p.id === t.profile_id)?.full_name || 'Desconhecido';
            if (!acc[name]) acc[name] = { pago: 0, total: 0 };
            acc[name].total += Number(t.amount);
            return acc;
          }, {} as Record<string, { pago: number; total: number }>);
        return {
          data: Object.entries(delinquent).map(([name, v]) => ({
            Obreiro: name,
            'Valor Esperado': v.total,
            'Valor Pago': v.pago,
            'Em Aberto': v.total - v.pago,
          })),
          sheetName: 'Inadimplência',
        };
      }
      case 'assistidos':
        return {
          data: cases.filter(c => isInRange(c.start_date)).map(c => {
            const member = profiles.find(p => p.id === c.profile_id);
            return {
              Obreiro: member?.full_name || '-',
              Situação: c.situation_type,
              Prioridade: c.priority,
              Status: c.status,
              Início: format(parseDateSafe(c.start_date), 'dd/MM/yyyy'),
            };
          }),
          sheetName: 'Assistidos',
        };
      case 'auxilios':
        return {
          data: aidRequests.filter(a => isInRange(a.request_date)).map(a => {
            const member = profiles.find(p => p.id === a.profile_id);
            return {
              Obreiro: member?.full_name || '-',
              Tipo: a.aid_type,
              'Valor Solicitado': a.requested_amount ? Number(a.requested_amount) : '-',
              'Valor Aprovado': a.approved_amount ? Number(a.approved_amount) : '-',
              Status: a.status,
              Data: format(parseDateSafe(a.request_date), 'dd/MM/yyyy'),
            };
          }),
          sheetName: 'Auxílios',
        };
      case 'tronco_extrato':
        return {
          data: fund.filter(f => isInRange(f.movement_date)).map(f => ({
            Data: format(parseDateSafe(f.movement_date), 'dd/MM/yyyy'),
            Tipo: f.movement_type,
            Origem: f.origin,
            Descrição: f.description || '',
            Valor: Number(f.amount),
          })),
          sheetName: 'Tronco',
        };
      case 'filantropia':
        return {
          data: philanthropy.filter(p => isInRange(p.start_date)).map(p => ({
            Nome: p.name,
            Tipo: p.action_type,
            Status: p.status,
            Início: format(parseDateSafe(p.start_date), 'dd/MM/yyyy'),
            'Beneficiários Esperados': p.expected_beneficiaries || '-',
            Resultado: p.result || '-',
          })),
          sheetName: 'Filantropia',
        };
      case 'atas':
        return {
          data: minutes.filter((m: any) => isInRange(m.meeting_date)).map((m: any) => ({
            Título: m.title,
            Data: format(parseDateSafe(m.meeting_date), 'dd/MM/yyyy'),
            Grau: m.masonic_degree,
            Descrição: m.description || '-',
          })),
          sheetName: 'Atas',
        };
      case 'frequencia':
        return {
          data: profiles.filter(p => p.user_id).map(p => {
            const presences = attendances.filter((a: any) => a.profile_id === p.id && a.is_present);
            const total = attendances.filter((a: any) => a.profile_id === p.id);
            return {
              Obreiro: p.full_name || '',
              Presenças: presences.length,
              'Total de Sessões': total.length,
              'Frequência (%)': total.length > 0 ? Math.round((presences.length / total.length) * 100) : 0,
            };
          }),
          sheetName: 'Frequência',
        };
      case 'correspondencias':
        return {
          data: correspondence.filter(c => isInRange(c.correspondence_date)).map(c => ({
            Protocolo: c.protocol_number,
            Data: format(parseDateSafe(c.correspondence_date), 'dd/MM/yyyy'),
            Tipo: c.correspondence_type,
            Remetente: c.sender,
            Destinatário: c.recipient,
            Assunto: c.subject,
            Status: c.status,
          })),
          sheetName: 'Correspondências',
        };
      case 'documentos':
        return {
          data: documents.filter((d: any) => isInRange(d.document_date)).map((d: any) => ({
            Título: d.title,
            Categoria: d.category,
            Data: format(parseDateSafe(d.document_date), 'dd/MM/yyyy'),
            Referência: d.reference_number || '-',
            Acesso: d.access_type,
          })),
          sheetName: 'Documentos',
        };
      default:
        return { data: [], sheetName: 'Relatório' };
    }
  }, [transactions, accounts, profiles, cases, visits, aidRequests, fund, philanthropy, correspondence, documents, minutes, attendances, isInRange]);

  const handlePreview = (report: ReportDef) => {
    const { data, sheetName } = getReportData(report.id);
    if (data.length === 0) {
      toast.info('Nenhum dado encontrado para o período selecionado.');
      return;
    }
    const columns = Object.keys(data[0]);
    setPreviewData({ title: report.title, rows: data, columns });
    setPreviewOpen(true);
  };

  const generateXLSX = (reportId: string) => {
    const { data, sheetName } = getReportData(reportId);
    if (data.length === 0) {
      toast.info('Nenhum dado encontrado para o período selecionado.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${reportId}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Arquivo XLSX exportado com sucesso!');
  };

  const formatCellValue = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'number') {
      if (String(val).includes('.') || val >= 100) return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return String(val);
    }
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Buscar relatório..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os módulos</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Hospitalaria">Hospitalaria</SelectItem>
                <SelectItem value="Secretaria">Secretaria</SelectItem>
                <SelectItem value="Consolidado">Consolidado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={v => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="semestre">Semestre</SelectItem>
                <SelectItem value="ano">Ano</SelectItem>
                <SelectItem value="gestao">Gestão Atual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Período: {format(range.start, 'dd/MM/yyyy')} a {format(range.end, 'dd/MM/yyyy')}
          </p>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map(report => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{report.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
                <Badge className={moduleColors[report.module]}>{report.module}</Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => handlePreview(report)}>
                  <Eye className="w-3.5 h-3.5" />
                  Visualizar
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => generateXLSX(report.id)}>
                  <Download className="w-3.5 h-3.5" />
                  XLSX
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info('Exportação PDF em desenvolvimento.')}>
                  <FileText className="w-3.5 h-3.5" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {previewData?.title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Período: {format(range.start, 'dd/MM/yyyy')} a {format(range.end, 'dd/MM/yyyy')} — {previewData?.rows.length} registro(s)
            </p>
          </DialogHeader>
          <div className="overflow-auto flex-1 border rounded-md">
            {previewData && (
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData.columns.map(col => (
                      <TableHead key={col} className="whitespace-nowrap font-semibold">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.map((row, i) => (
                    <TableRow key={i}>
                      {previewData.columns.map(col => (
                        <TableCell key={col} className="whitespace-nowrap">{formatCellValue(row[col])}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagementReports;
