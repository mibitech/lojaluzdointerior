import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Handshake, FileText, Lock, Send, Plus, Eye, Loader2 } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useActiveMasterPeriod } from '@/hooks/useActiveMasterPeriod';
import { useFinancialTransactions, useFinancialAccounts } from '@/hooks/useFinancialData';
import { useHospitalarCases, useHospitalarAidRequests, useHospitalarFund, useHospitalarPhilanthropy } from '@/hooks/useHospitalaria';
import { useCorrespondence, useSecretaryDocuments, useCertificates } from '@/hooks/useSecretary';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const ManagementCargoDelivery: React.FC = () => {
  const { profiles } = useProfiles();
  const { period } = useActiveMasterPeriod();
  const { data: transactions = [] } = useFinancialTransactions();
  const { data: accounts = [] } = useFinancialAccounts();
  const { data: cases = [] } = useHospitalarCases();
  const { data: aidRequests = [] } = useHospitalarAidRequests();
  const { data: fund = [] } = useHospitalarFund();
  const { data: philanthropy = [] } = useHospitalarPhilanthropy();
  const { data: correspondence = [] } = useCorrespondence();
  const { data: documents = [] } = useSecretaryDocuments();
  const { data: certificates = [] } = useCertificates();
  const queryClient = useQueryClient();

  const { data: minutes = [] } = useQuery({
    queryKey: ['meeting_minutes_cargo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meeting_minutes').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    periodStart: period?.termStart ? format(period.termStart, 'yyyy-MM-dd') : '',
    periodEnd: period?.termEnd ? format(period.termEnd, 'yyyy-MM-dd') : '',
    vmSainteId: '',
    vmEntranteId: '',
    sessionDate: '',
    includeFinanceiro: true,
    includeHospitalaria: true,
    includeSecretaria: true,
    includeChancelaria: true,
    includeAuditLogs: false,
    observations: '',
    achievements: '',
  });

  const activeProfiles = profiles.filter(p => p.user_id);

  const snapshotData = useMemo(() => {
    const periodTxs = transactions.filter(t => {
      if (!formData.periodStart || !formData.periodEnd) return false;
      const d = new Date(t.transaction_date);
      return d >= new Date(formData.periodStart) && d <= new Date(formData.periodEnd);
    });

    const totalReceitas = periodTxs.filter(t => t.transaction_type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
    const totalDespesas = periodTxs.filter(t => t.transaction_type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);
    const fundBalance = fund.reduce((s, f) => f.movement_type === 'Entrada' ? s + Number(f.amount) : s - Number(f.amount), 0);

    return {
      financeiro: {
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        investimentos: accounts.reduce((s, a) => s + Number(a.balance), 0),
        inadimplentes: 0,
      },
      hospitalaria: {
        casosAtivos: cases.filter(c => c.status === 'Ativo').length,
        auxiliosPendentes: aidRequests.filter(a => a.status === 'Pendente').length,
        saldoTronco: fundBalance,
        acoesFIlantropicas: philanthropy.filter(p => p.status === 'Em Andamento').length,
      },
      secretaria: {
        atasRegistradas: minutes.length,
        correspondenciasPendentes: correspondence.filter(c => c.status === 'Recebida').length,
        documentosArquivados: documents.length,
        certidoesEmitidas: certificates.length,
      },
      quadroObreiros: activeProfiles.length,
    };
  }, [transactions, accounts, cases, aidRequests, fund, philanthropy, minutes, correspondence, documents, certificates, activeProfiles, formData.periodStart, formData.periodEnd]);

  const createReport = useMutation({
    mutationFn: async () => {
      setSaving(true);
      const { error } = await supabase.from('management_cargo_reports' as any).insert({
        period_start: formData.periodStart,
        period_end: formData.periodEnd,
        vm_sainte_id: formData.vmSainteId || null,
        vm_entrante_id: formData.vmEntranteId || null,
        session_date: formData.sessionDate || null,
        include_financeiro: formData.includeFinanceiro,
        include_hospitalaria: formData.includeHospitalaria,
        include_secretaria: formData.includeSecretaria,
        include_chancelaria: formData.includeChancelaria,
        include_audit_logs: formData.includeAuditLogs,
        observations: formData.observations || null,
        achievements: formData.achievements || null,
        snapshot_data: snapshotData,
        status: 'Em Elaboração',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management_cargo_reports'] });
      toast.success('Relatório de Entrega de Cargo criado com sucesso!');
      setShowForm(false);
      setSaving(false);
    },
    onError: (e: Error) => {
      toast.error(`Erro: ${e.message}`);
      setSaving(false);
    },
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Entrega de Cargo</h2>
          <p className="text-sm text-muted-foreground">Gere o relatório oficial de passagem de gestão</p>
        </div>
      </div>

      {!showForm ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Handshake className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Relatório de Entrega de Cargo</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              O relatório consolida a situação de todos os módulos e gera o documento oficial de passagem de gestão.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Iniciar Entrega
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações do Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período Início</Label>
                  <Input type="date" value={formData.periodStart} onChange={e => setFormData(p => ({ ...p, periodStart: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Período Fim</Label>
                  <Input type="date" value={formData.periodEnd} onChange={e => setFormData(p => ({ ...p, periodEnd: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>VM Sainte</Label>
                  <Select value={formData.vmSainteId} onValueChange={v => setFormData(p => ({ ...p, vmSainteId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar obreiro" /></SelectTrigger>
                    <SelectContent>
                      {activeProfiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>VM Entrante</Label>
                  <Select value={formData.vmEntranteId} onValueChange={v => setFormData(p => ({ ...p, vmEntranteId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar obreiro" /></SelectTrigger>
                    <SelectContent>
                      {activeProfiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data da Sessão de Posse</Label>
                  <Input type="date" value={formData.sessionDate} onChange={e => setFormData(p => ({ ...p, sessionDate: e.target.value }))} />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-3 block">Seções a incluir</Label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'includeFinanceiro', label: 'Financeiro' },
                    { key: 'includeHospitalaria', label: 'Hospitalaria' },
                    { key: 'includeSecretaria', label: 'Secretaria' },
                    { key: 'includeChancelaria', label: 'Chancelaria' },
                    { key: 'includeAuditLogs', label: 'Logs de Auditoria' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={(formData as any)[item.key]}
                        onCheckedChange={v => setFormData(p => ({ ...p, [item.key]: v }))}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Principais Realizações da Gestão</Label>
                <Textarea
                  rows={4}
                  placeholder="Descreva as principais realizações desta gestão..."
                  value={formData.achievements}
                  onChange={e => setFormData(p => ({ ...p, achievements: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Observações Adicionais</Label>
                <Textarea
                  rows={3}
                  placeholder="Pendências, compromissos futuros, recomendações..."
                  value={formData.observations}
                  onChange={e => setFormData(p => ({ ...p, observations: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Pré-visualização dos Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {formData.includeFinanceiro && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Financeiro</h4>
                    <p className="text-xs">Receitas: {formatCurrency(snapshotData.financeiro.totalReceitas)}</p>
                    <p className="text-xs">Despesas: {formatCurrency(snapshotData.financeiro.totalDespesas)}</p>
                    <p className="text-xs font-medium">Saldo: {formatCurrency(snapshotData.financeiro.saldo)}</p>
                  </div>
                )}
                {formData.includeHospitalaria && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Hospitalaria</h4>
                    <p className="text-xs">Casos ativos: {snapshotData.hospitalaria.casosAtivos}</p>
                    <p className="text-xs">Auxílios pendentes: {snapshotData.hospitalaria.auxiliosPendentes}</p>
                    <p className="text-xs">Saldo Tronco: {formatCurrency(snapshotData.hospitalaria.saldoTronco)}</p>
                  </div>
                )}
                {formData.includeSecretaria && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Secretaria</h4>
                    <p className="text-xs">Atas: {snapshotData.secretaria.atasRegistradas}</p>
                    <p className="text-xs">Corr. pendentes: {snapshotData.secretaria.correspondenciasPendentes}</p>
                    <p className="text-xs">Documentos: {snapshotData.secretaria.documentosArquivados}</p>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-medium text-sm">Quadro Geral</h4>
                  <p className="text-xs">Obreiros ativos: {snapshotData.quadroObreiros}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button className="gap-2" onClick={() => createReport.mutate()} disabled={saving || !formData.periodStart || !formData.periodEnd}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Criar Relatório
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementCargoDelivery;
