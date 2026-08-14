import { parseDateSafe } from '@/lib/utils';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { History, Eye, FileText, Lock, CheckCircle, Loader2, PenLine } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  'Em Elaboração': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'Entregue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Aceito': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const ManagementHistory: React.FC = () => {
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();
  const [signDialog, setSignDialog] = useState<{ open: boolean; reportId: string; action: 'sign' | 'accept' }>({ open: false, reportId: '', action: 'sign' });
  const [confirmEmail, setConfirmEmail] = useState('');
  const [previewReport, setPreviewReport] = useState<any>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['management_cargo_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_cargo_reports' as any)
        .select('*, vm_sainte:vm_sainte_id(full_name), vm_entrante:vm_entrante_id(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const signReport = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string; action: 'sign' | 'accept' }) => {
      if (action === 'sign') {
        const { error } = await supabase
          .from('management_cargo_reports' as any)
          .update({
            status: 'Entregue',
            signed_at: new Date().toISOString(),
            signed_by: user?.id || null,
            locked: true,
          } as any)
          .eq('id', reportId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('management_cargo_reports' as any)
          .update({
            status: 'Aceito',
            accepted_at: new Date().toISOString(),
            accepted_by: user?.id || null,
          } as any)
          .eq('id', reportId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['management_cargo_reports'] });
      const msg = action === 'sign' ? 'Relatório assinado e entregue com sucesso!' : 'Relatório aceito com sucesso!';
      toast.success(msg);
      logAction({
        module: 'Gestão',
        action: action === 'sign' ? 'Aprovou' : 'Aprovou',
        entityType: 'Entrega de Cargo',
        entityLabel: action === 'sign' ? 'Assinatura VM Sainte' : 'Aceite VM Entrante',
      });
      setSignDialog({ open: false, reportId: '', action: 'sign' });
      setConfirmEmail('');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const handleSignConfirm = () => {
    if (confirmEmail !== user?.email) {
      toast.error('O e-mail informado não confere com o seu e-mail cadastrado.');
      return;
    }
    signReport.mutate({ reportId: signDialog.reportId, action: signDialog.action });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Histórico de Gestões</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Nenhum relatório de entrega de cargo foi gerado ainda. Utilize a aba "Entrega de Cargo" para criar o primeiro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Relatórios de Entrega de Cargo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>VM Sainte</TableHead>
                <TableHead>VM Entrante</TableHead>
                <TableHead>Data de Entrega</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {format(parseDateSafe(report.period_start), 'MM/yyyy')} — {format(parseDateSafe(report.period_end), 'MM/yyyy')}
                  </TableCell>
                  <TableCell>{(report.vm_sainte as any)?.full_name || '—'}</TableCell>
                  <TableCell>{(report.vm_entrante as any)?.full_name || '—'}</TableCell>
                  <TableCell>{report.session_date ? format(parseDateSafe(report.session_date), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[report.status] || 'bg-muted'}>{report.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" title="Visualizar" onClick={() => setPreviewReport(report)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {report.status === 'Em Elaboração' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Assinar e Entregar"
                          className="text-blue-600"
                          onClick={() => setSignDialog({ open: true, reportId: report.id, action: 'sign' })}
                        >
                          <PenLine className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {report.status === 'Entregue' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Aceitar Entrega"
                          className="text-green-600"
                          onClick={() => setSignDialog({ open: true, reportId: report.id, action: 'accept' })}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {report.locked && (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground ml-1 mt-1.5" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sign/Accept Dialog */}
      <Dialog open={signDialog.open} onOpenChange={open => { if (!open) { setSignDialog(s => ({ ...s, open: false })); setConfirmEmail(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {signDialog.action === 'sign' ? 'Assinar Relatório de Entrega' : 'Aceitar Entrega de Cargo'}
            </DialogTitle>
            <DialogDescription>
              {signDialog.action === 'sign'
                ? 'Ao assinar, o relatório será bloqueado para edição e ficará disponível para o VM Entrante aceitar.'
                : 'Ao aceitar, você confirma o recebimento do cargo e das informações contidas no relatório.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Confirme seu e-mail para {signDialog.action === 'sign' ? 'assinar' : 'aceitar'}</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Esta ação é irreversível. O relatório será {signDialog.action === 'sign' ? 'bloqueado' : 'finalizado'}.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSignDialog(s => ({ ...s, open: false })); setConfirmEmail(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleSignConfirm} disabled={!confirmEmail || signReport.isPending}>
              {signReport.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {signDialog.action === 'sign' ? 'Assinar e Entregar' : 'Aceitar Entrega'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={open => { if (!open) setPreviewReport(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Relatório de Entrega de Cargo</DialogTitle>
            <DialogDescription>
              Período: {previewReport && format(parseDateSafe(previewReport.period_start), 'MM/yyyy')} — {previewReport && format(parseDateSafe(previewReport.period_end), 'MM/yyyy')}
            </DialogDescription>
          </DialogHeader>
          {previewReport && (
            <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">VM Sainte</p>
                  <p className="font-medium">{(previewReport.vm_sainte as any)?.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">VM Entrante</p>
                  <p className="font-medium">{(previewReport.vm_entrante as any)?.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data da Posse</p>
                  <p className="font-medium">{previewReport.session_date ? format(parseDateSafe(previewReport.session_date), 'dd/MM/yyyy') : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={statusColors[previewReport.status]}>{previewReport.status}</Badge>
                </div>
              </div>

              {previewReport.achievements && (
                <div>
                  <p className="text-muted-foreground mb-1">Realizações da Gestão</p>
                  <p className="p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">{previewReport.achievements}</p>
                </div>
              )}

              {previewReport.snapshot_data && (
                <div>
                  <p className="font-medium mb-2">Snapshot dos Dados</p>
                  <div className="grid grid-cols-2 gap-3">
                    {previewReport.snapshot_data.financeiro && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium text-xs mb-1">Financeiro</p>
                        <p className="text-xs">Receitas: {formatCurrency(previewReport.snapshot_data.financeiro.totalReceitas)}</p>
                        <p className="text-xs">Despesas: {formatCurrency(previewReport.snapshot_data.financeiro.totalDespesas)}</p>
                        <p className="text-xs">Saldo: {formatCurrency(previewReport.snapshot_data.financeiro.saldo)}</p>
                      </div>
                    )}
                    {previewReport.snapshot_data.hospitalaria && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium text-xs mb-1">Hospitalaria</p>
                        <p className="text-xs">Casos ativos: {previewReport.snapshot_data.hospitalaria.casosAtivos}</p>
                        <p className="text-xs">Saldo Tronco: {formatCurrency(previewReport.snapshot_data.hospitalaria.saldoTronco)}</p>
                      </div>
                    )}
                    {previewReport.snapshot_data.secretaria && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium text-xs mb-1">Secretaria</p>
                        <p className="text-xs">Atas: {previewReport.snapshot_data.secretaria.atasRegistradas}</p>
                        <p className="text-xs">Documentos: {previewReport.snapshot_data.secretaria.documentosArquivados}</p>
                      </div>
                    )}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-xs mb-1">Quadro</p>
                      <p className="text-xs">Obreiros ativos: {previewReport.snapshot_data.quadroObreiros}</p>
                    </div>
                  </div>
                </div>
              )}

              {previewReport.observations && (
                <div>
                  <p className="text-muted-foreground mb-1">Observações</p>
                  <p className="p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">{previewReport.observations}</p>
                </div>
              )}

              {previewReport.signed_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                  <Lock className="w-3.5 h-3.5" />
                  Assinado em {format(new Date(previewReport.signed_at), 'dd/MM/yyyy HH:mm')}
                  {previewReport.accepted_at && (
                    <span className="ml-4">• Aceito em {format(new Date(previewReport.accepted_at), 'dd/MM/yyyy HH:mm')}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagementHistory;
