import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet } from 'lucide-react';
import { useHospitalarCases, useHospitalarVisits, useHospitalarAidRequests, useHospitalarFund } from '@/hooks/useHospitalaria';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const HospitalariaReports: React.FC = () => {
  const { data: cases = [] } = useHospitalarCases();
  const { data: visits = [] } = useHospitalarVisits();
  const { data: aidRequests = [] } = useHospitalarAidRequests();
  const { data: fund = [] } = useHospitalarFund();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const inRange = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return isWithinInterval(date, { start: startOfDay(parseISO(startDate)), end: endOfDay(parseISO(endDate)) });
    } catch { return false; }
  };

  const filteredVisits = useMemo(() => visits.filter(v => inRange(v.visit_date)), [visits, startDate, endDate]);
  const filteredAids = useMemo(() => aidRequests.filter(a => inRange(a.request_date)), [aidRequests, startDate, endDate]);
  const filteredFund = useMemo(() => fund.filter(f => inRange(f.movement_date)), [fund, startDate, endDate]);
  const activeCasesInPeriod = useMemo(() => cases.filter(c => inRange(c.start_date) || c.status === 'Ativo'), [cases, startDate, endDate]);

  const fundEntradas = useMemo(() => filteredFund.filter(f => f.movement_type === 'Entrada').reduce((s, f) => s + Number(f.amount), 0), [filteredFund]);
  const fundSaidas = useMemo(() => filteredFund.filter(f => f.movement_type === 'Saída').reduce((s, f) => s + Number(f.amount), 0), [filteredFund]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> Relatórios da Hospitalaria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Acompanhamentos</p>
            <p className="text-2xl font-bold">{activeCasesInPeriod.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Visitas no Período</p>
            <p className="text-2xl font-bold">{filteredVisits.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Auxílios no Período</p>
            <p className="text-2xl font-bold">{filteredAids.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saldo Tronco (período)</p>
            <p className={`text-2xl font-bold ${fundEntradas - fundSaidas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(fundEntradas - fundSaidas)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Entradas: {formatCurrency(fundEntradas)} · Saídas: {formatCurrency(fundSaidas)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visits Detail */}
      <Card>
        <CardHeader><CardTitle className="text-base">Visitas no Período</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Obreiro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Relato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhuma visita no período</TableCell></TableRow>
                ) : filteredVisits.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{format(parseISO(v.visit_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>{v.profiles?.full_name || '-'}</TableCell>
                    <TableCell><Badge variant="secondary">{v.visit_type}</Badge></TableCell>
                    <TableCell className="max-w-[300px] truncate">{v.report || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Fund Extract */}
      <Card>
        <CardHeader><CardTitle className="text-base">Extrato do Tronco no Período</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFund.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum lançamento no período</TableCell></TableRow>
                ) : filteredFund.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{format(parseISO(f.movement_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell><Badge variant={f.movement_type === 'Entrada' ? 'default' : 'destructive'}>{f.movement_type}</Badge></TableCell>
                    <TableCell>{f.origin}</TableCell>
                    <TableCell className={f.movement_type === 'Entrada' ? 'text-green-600' : 'text-red-600'}>{formatCurrency(Number(f.amount))}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{f.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HospitalariaReports;
