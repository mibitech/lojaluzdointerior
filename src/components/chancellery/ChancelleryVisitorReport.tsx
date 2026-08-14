import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUpDown, FileSpreadsheet, Printer, Search, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateSafe } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface VisitorReportRow {
  id: string;
  visitor_name: string;
  visitor_lodge: string | null;
  city: string | null;
  state: string | null;
  potencia: string | null;
  masonic_degree: string | null;
  visit_date: string | null;
  birth_date: string | null;
  session_title: string;
  session_date: string;
  email: string | null;
  mobile_phone: string | null;
}

const ChancelleryVisitorReport: React.FC = () => {
  const [rows, setRows] = useState<VisitorReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'visitor_name' | 'visit_date' | 'session_date' | 'visitor_lodge' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [visitorsRes, sessionsRes] = await Promise.all([
        supabase.from('visitors').select('*').order('created_at', { ascending: false }),
        supabase.from('sessions').select('id, title, session_datetime'),
      ]);

      const visitors = visitorsRes.data || [];
      const sessions = sessionsRes.data || [];
      const sessionMap: Record<string, { title: string; datetime: string }> = {};
      sessions.forEach(s => { sessionMap[s.id] = { title: s.title, datetime: s.session_datetime }; });

      const reportRows: VisitorReportRow[] = visitors.map(v => {
        const session = sessionMap[v.session_id];
        return {
          id: v.id,
          visitor_name: v.visitor_name,
          visitor_lodge: v.visitor_lodge,
          city: v.city,
          state: v.state,
          potencia: v.potencia,
          masonic_degree: v.masonic_degree,
          visit_date: v.visit_date,
          birth_date: v.birth_date,
          session_title: session?.title || '-',
          session_date: session?.datetime || '',
          email: v.email,
          mobile_phone: v.mobile_phone,
        };
      });

      setRows(reportRows);
    } catch (error) {
      console.error('Error loading visitor report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let data = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.visitor_name.toLowerCase().includes(q) ||
        (r.visitor_lodge || '').toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q) ||
        r.session_title.toLowerCase().includes(q)
      );
    }
    if (sortField) {
      data = [...data].sort((a, b) => {
        const valA = (a[sortField] || '').toString();
        const valB = (b[sortField] || '').toString();
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [rows, search, sortField, sortDir]);

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    try { return format(parseDateSafe(d), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return '-'; }
  };

  const handleExportExcel = () => {
    const wsData = [
      ['Nome', 'Data Visita', 'Nascimento', 'Sessão', 'Data Sessão', 'Loja', 'Graduação', 'Email', 'Celular'],
      ...filtered.map(r => [
        r.visitor_name,
        formatDate(r.visit_date),
        formatDate(r.birth_date),
        r.session_title,
        r.session_date ? format(new Date(r.session_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        r.visitor_lodge || '-',
        r.masonic_degree || '-',
        r.email || '-',
        r.mobile_phone || '-',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Visitantes');

    const colWidths = wsData[0].map((_, colIdx) => {
      const maxLen = wsData.reduce((max, row) => {
        const val = String(row[colIdx] ?? '');
        return Math.max(max, val.length);
      }, 0);
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'relatorio_visitantes_chancelaria.xlsx');
  };

  const handlePrint = () => {
    const printContent = tableRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Visitantes - Chancelaria</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 10px; margin: 16px; }
            h1 { font-size: 16px; margin-bottom: 4px; }
            p { font-size: 11px; color: #666; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; white-space: nowrap; }
            th { background: #f0f0f0; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Relatório de Visitantes — Chancelaria</h1>
          <p>Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            Relatório de Visitantes
          </h2>
          <p className="text-muted-foreground text-sm">
            Registro completo de visitantes por sessão
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar por nome, loja, cidade ou sessão..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Visitantes ({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={tableRef} className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[180px] cursor-pointer select-none" onClick={() => handleSort('visitor_name')}>
                    <span className="flex items-center gap-1">Nome <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[100px] cursor-pointer select-none" onClick={() => handleSort('visit_date')}>
                    <span className="flex items-center gap-1">Data Visita <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[100px]">Nascimento</TableHead>
                  <TableHead className="min-w-[100px] cursor-pointer select-none" onClick={() => handleSort('session_date')}>
                    <span className="flex items-center gap-1">Sessão <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[120px] cursor-pointer select-none" onClick={() => handleSort('visitor_lodge')}>
                    <span className="flex items-center gap-1">Loja <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[100px]">Graduação</TableHead>
                  <TableHead className="min-w-[100px]">Celular</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">{r.visitor_name}</TableCell>
                    <TableCell>{formatDate(r.visit_date)}</TableCell>
                    <TableCell>{formatDate(r.birth_date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {r.session_date ? format(new Date(r.session_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </span>
                        <span className="truncate max-w-[150px]">{r.session_title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{r.visitor_lodge || '-'}</TableCell>
                    <TableCell>{r.masonic_degree || '-'}</TableCell>
                    <TableCell>{r.mobile_phone || '-'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum visitante encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChancelleryVisitorReport;
