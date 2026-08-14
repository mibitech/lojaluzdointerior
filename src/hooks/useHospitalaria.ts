import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface HospitalarCase {
  id: string;
  profile_id: string;
  situation_type: string;
  start_date: string;
  responsible_id: string | null;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null };
  responsible?: { full_name: string | null };
}

export interface HospitalarVisit {
  id: string;
  case_id: string | null;
  profile_id: string;
  visit_date: string;
  visit_type: string;
  report: string | null;
  needs_identified: string | null;
  actions_taken: string | null;
  next_visit_date: string | null;
  updated_situation: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
  case?: { situation_type: string; profiles?: { full_name: string | null } } | null;
}

export interface HospitalarAidRequest {
  id: string;
  requester_type: string;
  profile_id: string | null;
  aid_type: string;
  description: string;
  requested_amount: number | null;
  request_date: string;
  status: string;
  decision_date: string | null;
  approved_amount: number | null;
  decision_notes: string | null;
  authorized_by: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
}

export interface HospitalarPhilanthropy {
  id: string;
  name: string;
  action_type: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  goal: string | null;
  expected_beneficiaries: number | null;
  status: string;
  result: string | null;
  created_at: string;
}

export interface HospitalarBeneficenceFund {
  id: string;
  movement_type: string;
  origin: string;
  amount: number;
  movement_date: string;
  description: string | null;
  authorized_by: string | null;
  aid_request_id: string | null;
  created_at: string;
}

// Constants
export const SITUATION_TYPES = [
  'Enfermidade', 'Ausência Frequente', 'Dificuldade Financeira', 'Luto/Falecimento', 'Outro'
];
export const CASE_STATUSES = ['Ativo', 'Resolvido', 'Encerrado'];
export const PRIORITIES = ['Alta', 'Média', 'Baixa'];
export const VISIT_TYPES = ['Presencial', 'Remota', 'Telefônica'];
export const REQUESTER_TYPES = ['Obreiro', 'Dependente', 'Familiar'];
export const AID_TYPES = ['Financeiro', 'Alimentar', 'Médico/Hospitalar', 'Órteses e Próteses', 'Funeral', 'Psicológico', 'Outro'];
export const AID_STATUSES = ['Pendente', 'Em Análise', 'Aprovado', 'Negado', 'Entregue'];
export const PHILANTHROPY_TYPES = ['Doação de Alimentos', 'Campanha de Saúde', 'Apoio Educacional', 'Assistência Jurídica', 'Outra'];
export const PHILANTHROPY_STATUSES = ['Planejada', 'Em Andamento', 'Concluída', 'Cancelada'];
export const FUND_MOVEMENT_TYPES = ['Entrada', 'Saída'];
export const FUND_ORIGINS = ['Coleta em Sessão', 'Doação Avulsa', 'Auxílio Concedido', 'Repasse ao Tesoureiro', 'Outro'];

// Hooks
export function useHospitalarCases() {
  return useQuery({
    queryKey: ['hospitalar_cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitalar_cases')
        .select('*, profiles:profile_id(full_name), responsible:responsible_id(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as HospitalarCase[];
    },
  });
}

export function useHospitalarVisits() {
  return useQuery({
    queryKey: ['hospitalar_visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitalar_visits')
        .select('*, profiles:profile_id(full_name), case:case_id(situation_type, profiles:profile_id(full_name))')
        .order('visit_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as HospitalarVisit[];
    },
  });
}

export function useHospitalarAidRequests() {
  return useQuery({
    queryKey: ['hospitalar_aid_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitalar_aid_requests')
        .select('*, profiles:profile_id(full_name)')
        .order('request_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as HospitalarAidRequest[];
    },
  });
}

export function useHospitalarPhilanthropy() {
  return useQuery({
    queryKey: ['hospitalar_philanthropy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitalar_philanthropy')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as HospitalarPhilanthropy[];
    },
  });
}

export function useHospitalarFund() {
  return useQuery({
    queryKey: ['hospitalar_beneficence_fund'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitalar_beneficence_fund')
        .select('*')
        .order('movement_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as HospitalarBeneficenceFund[];
    },
  });
}

// Generic mutation helper
export function useHospitalarMutation(table: string, queryKey: string) {
  const queryClient = useQueryClient();

  const insert = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase.from(table as any).insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success('Registro salvo com sucesso');
    },
    onError: (e: Error) => toast.error(`Erro ao salvar: ${e.message}`),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase.from(table as any).update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success('Registro atualizado com sucesso');
    },
    onError: (e: Error) => toast.error(`Erro ao atualizar: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success('Registro excluído com sucesso');
    },
    onError: (e: Error) => toast.error(`Erro ao excluir: ${e.message}`),
  });

  return { insert, update, remove };
}
