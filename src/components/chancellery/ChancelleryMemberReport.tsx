import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUpDown, FileSpreadsheet, Printer, Search, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface MemberReportRow {
  id: string;
  name: string;
  position: string;
  birthDate: string | null;
  initiationDate: string | null;
  elevationDate: string | null;
  exaltationDate: string | null;
  attendanceByDegree: Record<string, number>;
  totalAttendance: number;
  totalSessions: number;
}

const DATE_TYPE_MAP: Record<string, 'birth' | 'initiation' | 'elevation' | 'exaltation'> = {
  'Aniversário do Irmão': 'birth',
  'Aniversário da Iniciação': 'initiation',
  'Aniversário da Elevação': 'elevation',
  'Aniversário da Exaltação': 'exaltation',
};

const ChancelleryMemberReport: React.FC = () => {
  const [rows, setRows] = useState<MemberReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'birthDate' | 'initiationDate' | 'elevationDate' | 'exaltationDate' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [profilesRes, datesRes, attendancesRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, position'),
        supabase.from('commemorative_dates').select('profile_id, date, date_type'),
        supabase.from('session_attendances').select('profile_id, session_id, is_present'),
        supabase.from('sessions').select('id, session_degree'),
      ]);

      const profiles = profilesRes.data || [];
      const dates = datesRes.data || [];
      const attendances = attendancesRes.data || [];
      const sessions = sessionsRes.data || [];

      const sessionDegreeMap: Record<string, string> = {};
      sessions.forEach(s => { sessionDegreeMap[s.id] = s.session_degree; });

      const totalSessionsCount = sessions.length;

      const reportRows: MemberReportRow[] = profiles.map(p => {
        const profileDates = dates.filter(d => d.profile_id === p.id);
        let birthDate: string | null = null;
        let initiationDate: string | null = null;
        let elevationDate: string | null = null;
        let exaltationDate: string | null = null;

        profileDates.forEach(d => {
          const mapped = DATE_TYPE_MAP[d.date_type];
          if (mapped === 'birth') birthDate = d.date;
          else if (mapped === 'initiation') initiationDate = d.date;
          else if (mapped === 'elevation') elevationDate = d.date;
          else if (mapped === 'exaltation') exaltationDate = d.date;
        });

        const profileAttendances = attendances.filter(a => a.profile_id === p.id && a.is_present);
        const attendanceByDegree: Record<string, number> = { 'Aprendiz': 0, 'Companheiro': 0, 'Mestre': 0, 'Outras': 0 };
        let totalAttendance = 0;

        profileAttendances.forEach(a => {
          const rawDegree = (sessionDegreeMap[a.session_id] || '').toLowerCase();
          let classified = 'Outras';
          if (rawDegree.includes('aprendiz') || rawDegree.includes('a∴') || rawDegree === '1') classified = 'Aprendiz';
          else if (rawDegree.includes('companheir') || rawDegree.includes('c∴') || rawDegree === '2') classified = 'Companheiro';
          else if (rawDegree.includes('mestr') || rawDegree.includes('m∴') || rawDegree === '3') classified = 'Mestre';
          attendanceByDegree[classified] = (attendanceByDegree[classified] || 0) + 1;
          totalAttendance++;
        });

        return {
          id: p.id,
          name: p.full_name || 'Sem nome',
          position: p.position || '-',
          birthDate,
          initiationDate,
          elevationDate,
          exaltationDate,
          attendanceByDegree,
          totalAttendance,
          totalSessions: totalSessionsCount,
        };
      });

      reportRows.sort((a, b) => a.name.localeCompare(b.name));
      setRows(reportRows);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixedDegrees = ['Aprendiz', 'Companheiro', 'Mestre', 'Outras'];

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
      data = data.filter(r => r.name.toLowerCase().includes(q) || r.position.toLowerCase().includes(q));
    }
    if (sortField) {
      data = [...data].sort((a, b) => {
        if (sortField === 'name') {
          const cmp = a.name.localeCompare(b.name);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [rows, search, sortField, sortDir]);

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return '-'; }
  };


  const handleExportExcel = () => {
    const wsData = [
      [
        'Nome', 'Data Nascimento', 'Data Iniciação',
        'Data Elevação', 'Data Exaltação',
        ...fixedDegrees.map(d => `Presenças (${d})`),
        'Total Presenças', 'Total Sessões', '% Frequência',
      ],
      ...filtered.map(r => [
        r.name,
        formatDate(r.birthDate),
        formatDate(r.initiationDate),
        formatDate(r.elevationDate),
        formatDate(r.exaltationDate),
        ...fixedDegrees.map(d => r.attendanceByDegree[d] || 0),
        r.totalAttendance,
        r.totalSessions,
        r.totalSessions > 0 ? `${Math.round((r.totalAttendance / r.totalSessions) * 100)}%` : '0%',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Membros');

    // Auto-width columns
    const colWidths = wsData[0].map((_, colIdx) => {
      const maxLen = wsData.reduce((max, row) => {
        const val = String(row[colIdx] ?? '');
        return Math.max(max, val.length);
      }, 0);
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'relatorio_membros_chancelaria.xlsx');
  };

  const handlePrint = () => {
    const printContent = tableRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Membros - Chancelaria</title>
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
          <h1>Relatório de Membros — Chancelaria</h1>
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
            <Users className="w-6 h-6" />
            Relatório de Frequência
          </h2>
          <p className="text-muted-foreground text-sm">
            Dados cadastrais, datas maçônicas e frequência por grau
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
          placeholder="Filtrar por nome ou cargo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Membros ({filtered.length})</span>
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
                  <TableHead className="min-w-[110px] cursor-pointer select-none" onClick={() => handleSort('birthDate')}>
                    <span className="flex items-center gap-1">Nascimento <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[110px] cursor-pointer select-none" onClick={() => handleSort('initiationDate')}>
                    <span className="flex items-center gap-1">Iniciação <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[110px] cursor-pointer select-none" onClick={() => handleSort('elevationDate')}>
                    <span className="flex items-center gap-1">Elevação <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="min-w-[110px] cursor-pointer select-none" onClick={() => handleSort('exaltationDate')}>
                    <span className="flex items-center gap-1">Exaltação <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  {fixedDegrees.map(d => (
                    <TableHead key={d} className="min-w-[80px] text-center">{d}</TableHead>
                  ))}
                  <TableHead className="min-w-[80px] text-center">Total</TableHead>
                  <TableHead className="min-w-[80px] text-center">% Freq.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const freqPct = r.totalSessions > 0
                    ? Math.round((r.totalAttendance / r.totalSessions) * 100)
                    : 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">{r.name}</TableCell>
                      <TableCell>{formatDate(r.birthDate)}</TableCell>
                      <TableCell>{formatDate(r.initiationDate)}</TableCell>
                      <TableCell>{formatDate(r.elevationDate)}</TableCell>
                      <TableCell>{formatDate(r.exaltationDate)}</TableCell>
                      {fixedDegrees.map(d => (
                        <TableCell key={d} className="text-center">
                          {r.attendanceByDegree[d] || 0}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">{r.totalAttendance}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={freqPct >= 60 ? 'default' : 'destructive'} className="text-xs">
                          {freqPct}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5 + fixedDegrees.length + 2} className="text-center py-8 text-muted-foreground">
                      Nenhum membro encontrado.
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

export default ChancelleryMemberReport;
