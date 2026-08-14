import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUpDown, FileSpreadsheet, Printer, Search, ClipboardCheck, CalendarIcon } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateSafe } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface AttendanceReportRow {
  id: string;
  name: string;
  type: 'Irmão' | 'Visitante';
  treatmentName: string;
  memberDegree: string;
  sessionDegree: string;
  sessionTitle: string;
  sessionDescription: string;
  sessionDate: string;
}

const DEGREE_LABELS: Record<number, string> = {
  1: 'Aprendiz',
  2: 'Companheiro',
  3: 'Mestre',
};

const ChancelleryAttendanceReport: React.FC = () => {
  const [rows, setRows] = useState<AttendanceReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [sortField, setSortField] = useState<'name' | 'sessionDate' | 'type' | 'sessionTitle' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [sessionsRes, attendancesRes, profilesRes, visitorsRes] = await Promise.all([
        supabase.from('sessions').select('id, title, session_degree, description, session_datetime'),
        supabase.from('session_attendances').select('id, session_id, profile_id, is_present'),
        supabase.from('profiles').select('id, full_name, position, masonic_degree'),
        supabase.from('visitors').select('id, session_id, visitor_name, masonic_degree, visit_date'),
      ]);

      const sessions = sessionsRes.data || [];
      const attendances = attendancesRes.data || [];
      const profiles = profilesRes.data || [];
      const visitors = visitorsRes.data || [];

      const sessionMap: Record<string, typeof sessions[0]> = {};
      sessions.forEach(s => { sessionMap[s.id] = s; });

      const profileMap: Record<string, typeof profiles[0]> = {};
      profiles.forEach(p => { profileMap[p.id] = p; });

      const reportRows: AttendanceReportRow[] = [];

      // Members (irmãos) from session_attendances
      attendances.filter(a => a.is_present).forEach(a => {
        const session = sessionMap[a.session_id];
        const profile = profileMap[a.profile_id];
        if (!session || !profile) return;

        const degree = profile.masonic_degree || 1;
        reportRows.push({
          id: `m-${a.id}`,
          name: profile.full_name || 'Sem nome',
          type: 'Irmão',
          treatmentName: profile.position || '-',
          memberDegree: DEGREE_LABELS[degree] || `Grau ${degree}`,
          sessionDegree: session.session_degree || '-',
          sessionTitle: session.title || '-',
          sessionDescription: session.description || '-',
          sessionDate: session.session_datetime || '',
        });
      });

      // Visitors
      visitors.forEach(v => {
        const session = sessionMap[v.session_id];
        if (!session) return;

        reportRows.push({
          id: `v-${v.id}`,
          name: v.visitor_name,
          type: 'Visitante',
          treatmentName: '-',
          memberDegree: v.masonic_degree || '-',
          sessionDegree: session.session_degree || '-',
          sessionTitle: session.title || '-',
          sessionDescription: session.description || '-',
          sessionDate: session.session_datetime || '',
        });
      });

      setRows(reportRows);
    } catch (error) {
      console.error('Error loading attendance report:', error);
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

    // Date filter
    if (selectedDate) {
      const selStr = format(selectedDate, 'yyyy-MM-dd');
      data = data.filter(r => {
        if (!r.sessionDate) return false;
        const rowDate = format(new Date(r.sessionDate), 'yyyy-MM-dd');
        return rowDate === selStr;
      });
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.sessionTitle.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.treatmentName.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortField) {
      data = [...data].sort((a, b) => {
        const valA = (a[sortField] || '').toString();
        const valB = (b[sortField] || '').toString();
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return data;
  }, [rows, search, selectedDate, sortField, sortDir]);

  const formatSessionDate = (d: string) => {
    if (!d) return '-';
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return '-'; }
  };

  const handleExportExcel = () => {
    const wsData = [
      ['Nome', 'Tipo', 'Cargo/Tratamento', 'Grau do Membro', 'Grau da Sessão', 'Título da Sessão', 'Descrição', 'Data da Sessão'],
      ...filtered.map(r => [
        r.name,
        r.type,
        r.treatmentName,
        r.memberDegree,
        r.sessionDegree,
        r.sessionTitle,
        r.sessionDescription,
        formatSessionDate(r.sessionDate),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Presença');

    const colWidths = wsData[0].map((_, colIdx) => {
      const maxLen = wsData.reduce((max, row) => {
        const val = String(row[colIdx] ?? '');
        return Math.max(max, val.length);
      }, 0);
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'relatorio_presenca_chancelaria.xlsx');
  };

  const handlePrint = () => {
    const printContent = tableRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Presença - Chancelaria</title>
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
          <h1>Relatório de Presença — Chancelaria</h1>
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
            <ClipboardCheck className="w-6 h-6" />
            Relatório de Presença
          </h2>
          <p className="text-muted-foreground text-sm">
            Registro de presença de irmãos e visitantes por sessão
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, sessão, tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-64"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2 min-w-[180px] justify-start", !selectedDate && "text-muted-foreground")}>
              <CalendarIcon className="h-4 w-4" />
              {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              captionLayout="dropdown-buttons"
              fromYear={2020}
              toYear={new Date().getFullYear() + 1}
            />
          </PopoverContent>
        </Popover>

        {selectedDate && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)} className="text-destructive hover:text-destructive">
            ✕ Limpar filtro
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Presenças ({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={tableRef} className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[180px] cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">Nome <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[100px] cursor-pointer select-none" onClick={() => handleSort('type')}>
                    <span className="flex items-center gap-1">Tipo <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[120px]">Cargo/Tratamento</TableHead>
                  <TableHead className="min-w-[100px]">Grau Membro</TableHead>
                  <TableHead className="min-w-[100px]">Grau Sessão</TableHead>
                  <TableHead className="min-w-[160px] cursor-pointer select-none" onClick={() => handleSort('sessionTitle')}>
                    <span className="flex items-center gap-1">Título Sessão <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[160px]">Descrição</TableHead>
                  <TableHead className="min-w-[110px] cursor-pointer select-none" onClick={() => handleSort('sessionDate')}>
                    <span className="flex items-center gap-1">Data Sessão <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">{r.name}</TableCell>
                    <TableCell>
                      <Badge variant={r.type === 'Irmão' ? 'default' : 'secondary'} className="text-xs">
                        {r.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.treatmentName}</TableCell>
                    <TableCell>{r.memberDegree}</TableCell>
                    <TableCell>{r.sessionDegree}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{r.sessionTitle}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{r.sessionDescription}</TableCell>
                    <TableCell>{formatSessionDate(r.sessionDate)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum registro de presença encontrado.
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

export default ChancelleryAttendanceReport;
