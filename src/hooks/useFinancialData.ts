import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FinancialTransaction {
  id: string;
  transaction_type: 'receita' | 'despesa';
  category: string;
  subcategory: string | null;
  description: string | null;
  amount: number;
  transaction_date: string;
  reference_month: string | null;
  profile_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialAccount {
  id: string;
  account_name: string;
  account_type: string;
  institution: string | null;
  balance: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialAccountMovement {
  id: string;
  account_id: string;
  movement_type: string;
  amount: number;
  movement_date: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const REVENUE_CATEGORIES = [
  { value: 'mensalidade', label: 'Mensalidade dos Irmãos' },
  { value: 'tronco_beneficencia', label: 'Tronco de Beneficência' },
  { value: 'joia', label: 'Jóia de Iniciação/Filiação' },
  { value: 'taxa_expediente', label: 'Taxa de Expediente' },
  { value: 'doacao', label: 'Doação' },
  { value: 'evento', label: 'Receita de Evento' },
  { value: 'rendimento', label: 'Rendimento de Investimento' },
  { value: 'outros_receita', label: 'Outros' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'copo_dagua', label: 'Copo D\'Água' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'agua', label: 'Água' },
  { value: 'internet', label: 'Internet/Telefone' },
  { value: 'reparos', label: 'Reparos e Manutenção' },
  { value: 'material', label: 'Material de Consumo' },
  { value: 'festa', label: 'Festas e Confraternização' },
  { value: 'potencia', label: 'Taxa da Potência' },
  { value: 'seguro', label: 'Seguros' },
  { value: 'limpeza', label: 'Limpeza e Conservação' },
  { value: 'beneficencia', label: 'Ação Beneficente' },
  { value: 'outros_despesa', label: 'Outros' },
];

export const MOVEMENT_TYPES = [
  { value: 'aplicacao', label: 'Aplicação' },
  { value: 'resgate', label: 'Resgate' },
  { value: 'rendimento', label: 'Rendimento' },
];

export function useFinancialTransactions() {
  return useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data as FinancialTransaction[];
    },
  });
}

export function useFinancialAccounts() {
  return useQuery({
    queryKey: ['financial-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .order('account_name');
      if (error) throw error;
      return data as FinancialAccount[];
    },
  });
}

export function useAccountMovements(accountId?: string) {
  return useQuery({
    queryKey: ['account-movements', accountId],
    queryFn: async () => {
      let query = supabase
        .from('financial_account_movements')
        .select('*')
        .order('movement_date', { ascending: false });
      if (accountId) query = query.eq('account_id', accountId);
      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialAccountMovement[];
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('financial_transactions').insert(tx as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({ title: 'Lançamento registrado com sucesso!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao registrar', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...tx }: Partial<FinancialTransaction> & { id: string }) => {
      const { data, error } = await supabase.from('financial_transactions').update(tx as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({ title: 'Lançamento atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({ title: 'Lançamento excluído!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (acc: Omit<FinancialAccount, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('financial_accounts').insert(acc as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial-accounts'] });
      toast({ title: 'Conta criada com sucesso!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao criar conta', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...acc }: Partial<FinancialAccount> & { id: string }) => {
      const { data, error } = await supabase.from('financial_accounts').update(acc as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial-accounts'] });
      toast({ title: 'Conta atualizada!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial-accounts'] });
      toast({ title: 'Conta excluída!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mov: Omit<FinancialAccountMovement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('financial_account_movements').insert(mov as any).select().single();
      if (error) throw error;
      // Update account balance
      const account = await supabase.from('financial_accounts').select('balance').eq('id', mov.account_id).single();
      if (account.data) {
        let newBalance = Number(account.data.balance);
        if (mov.movement_type === 'aplicacao' || mov.movement_type === 'rendimento') {
          newBalance += Number(mov.amount);
        } else if (mov.movement_type === 'resgate') {
          newBalance -= Number(mov.amount);
        }
        await supabase.from('financial_accounts').update({ balance: newBalance } as any).eq('id', mov.account_id);
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-movements'] });
      qc.invalidateQueries({ queryKey: ['financial-accounts'] });
      toast({ title: 'Movimentação registrada!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
