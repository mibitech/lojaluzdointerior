import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface SecretaryCorrespondence {
  id: string;
  protocol_number: string;
  correspondence_type: string;
  correspondence_date: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string | null;
  category: string;
  priority: string;
  status: string;
  related_correspondence_id: string | null;
  internal_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecretaryDocument {
  id: string;
  title: string;
  category: string;
  access_type: string;
  document_date: string;
  reference_number: string | null;
  linked_profile_id: string | null;
  linked_minute_id: string | null;
  linked_correspondence_id: string | null;
  tags: string[] | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecretaryConvocation {
  id: string;
  session_type: string;
  convocation_date: string;
  convocation_time: string | null;
  location: string | null;
  agenda_items: string[];
  recipients_type: string;
  send_channel: string;
  status: string;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecretaryCertificate {
  id: string;
  certificate_type: string;
  profile_id: string | null;
  issue_date: string;
  registration_number: string | null;
  purpose: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null };
}

// Constants
export const CORRESPONDENCE_TYPES = ['Entrada', 'Saída'];
export const CORRESPONDENCE_CATEGORIES = ['Administrativa', 'Obediência/Grande Loja', 'Obreiro', 'Externa', 'Jurídica', 'Filantrópica', 'Outra'];
export const CORRESPONDENCE_PRIORITIES = ['Normal', 'Urgente', 'Confidencial'];
export const CORRESPONDENCE_ENTRY_STATUSES = ['Recebida', 'Em Análise', 'Respondida', 'Arquivada'];
export const CORRESPONDENCE_EXIT_STATUSES = ['Rascunho', 'Enviada', 'Confirmada', 'Arquivada'];

export const DOCUMENT_CATEGORIES = [
  'Ata de Sessão', 'Diploma/Patente', 'Certificado', 'Regulamento/Constituição',
  'Contrato/Convênio', 'Correspondência Arquivada', 'Financeiro', 'Filantropia',
  'Registro de Obreiro', 'Histórico da Loja', 'Outro'
];
export const DOCUMENT_ACCESS_TYPES = ['Público (todos obreiros)', 'Restrito (Oficiais)', 'Confidencial (VM + Secretário)'];

export const SESSION_TYPES = ['Ordinária', 'Extraordinária', 'Magna', 'Fúnebre', 'Iniciação', 'Elevação', 'Exaltação'];
export const RECIPIENTS_TYPES = ['Todos os obreiros', 'Selecionados'];
export const SEND_CHANNELS = ['E-mail', 'WhatsApp', 'Ambos'];
export const CONVOCATION_STATUSES = ['Rascunho', 'Enviada', 'Confirmada'];

export const CERTIFICATE_TYPES = ['Certidão de Regularidade', 'Declaração de Grau', 'Declaração de Bom Comportamento', 'Transferência', 'Outra'];
export const CERTIFICATE_STATUSES = ['Emitida', 'Entregue', 'Cancelada'];

// Hooks
export function useCorrespondence() {
  return useQuery({
    queryKey: ['secretary_correspondence'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secretary_correspondence')
        .select('*')
        .order('correspondence_date', { ascending: false });
      if (error) throw error;
      return (data || []) as SecretaryCorrespondence[];
    },
  });
}

export function useSecretaryDocuments() {
  return useQuery({
    queryKey: ['secretary_documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secretary_documents')
        .select('*')
        .order('document_date', { ascending: false });
      if (error) throw error;
      return (data || []) as SecretaryDocument[];
    },
  });
}

export function useConvocations() {
  return useQuery({
    queryKey: ['secretary_convocations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secretary_convocations')
        .select('*')
        .order('convocation_date', { ascending: false });
      if (error) throw error;
      return (data || []) as SecretaryConvocation[];
    },
  });
}

export function useCertificates() {
  return useQuery({
    queryKey: ['secretary_certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secretary_certificates')
        .select('*, profiles:profile_id(full_name)')
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SecretaryCertificate[];
    },
  });
}

// Generic mutation helper
export function useSecretaryMutation(table: string, queryKey: string) {
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
