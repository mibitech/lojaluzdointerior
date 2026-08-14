import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseISO, isWithinInterval } from 'date-fns';

export interface MasterPeriod {
  masterName: string;
  termStart: Date;
  termEnd: Date;
  installationYear: number;
}

export const useActiveMasterPeriod = () => {
  const { data: activeMaster, isLoading } = useQuery({
    queryKey: ['active_master_period'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worshipful_masters')
        .select('*')
        .eq('is_active', true)
        .order('installation_year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const period: MasterPeriod | null = useMemo(() => {
    if (!activeMaster) return null;
    const termStart = parseISO(activeMaster.term_start_date);
    const termEnd = activeMaster.term_end_date
      ? parseISO(activeMaster.term_end_date)
      : new Date(termStart.getFullYear() + 1, termStart.getMonth(), termStart.getDate());

    return {
      masterName: activeMaster.name,
      termStart,
      termEnd,
      installationYear: activeMaster.installation_year,
    };
  }, [activeMaster]);

  const isWithinMasterPeriod = useMemo(() => {
    if (!period) return (_date: Date | string) => false;
    return (date: Date | string) => {
      const d = typeof date === 'string' ? parseISO(date) : date;
      return isWithinInterval(d, { start: period.termStart, end: period.termEnd });
    };
  }, [period]);

  return {
    period,
    isLoading,
    isWithinMasterPeriod,
    masterName: period?.masterName ?? '',
    periodLabel: period
      ? `${period.termStart.getFullYear()}/${period.termEnd.getFullYear()}`
      : '',
  };
};
