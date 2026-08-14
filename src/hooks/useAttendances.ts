import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Attendance {
  id: string;
  session_id: string;
  profile_id: string;
  is_present: boolean;
  position_override: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithProfile extends Attendance {
  profiles: {
    id: string;
    cim: string | null;
    full_name: string | null;
    position: string | null;
  };
}

export const useAttendances = (sessionId?: string) => {
  const [attendances, setAttendances] = useState<AttendanceWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAttendances = async () => {
    try {
      let query = supabase
        .from("session_attendances")
        .select(`
          *,
          profiles (
            id,
            cim,
            full_name,
            position
          )
        `)
        .order("created_at", { ascending: false });

      if (sessionId) {
        query = query.eq("session_id", sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAttendances(data || []);
    } catch (error) {
      console.error("Error loading attendances:", error);
      toast.error("Erro ao carregar presenças");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Grava todas as presenças de uma vez (upsert em lote).
   * presence: mapa profileId → is_present
   * profileDefaults: posição padrão por profileId (usada somente em inserts novos)
   */
  const saveAllPresence = async (
    sid: string,
    presence: Record<string, boolean>,
    profileDefaults: Record<string, string | null>
  ) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("session_attendances")
        .select("id, profile_id, is_present")
        .eq("session_id", sid);

      if (fetchError) throw fetchError;

      const existingMap = new Map(existing?.map(e => [e.profile_id, e]) ?? []);

      const toUpdate: { id: string; is_present: boolean }[] = [];
      const toInsert: {
        session_id: string;
        profile_id: string;
        is_present: boolean;
        position_override: string | null;
      }[] = [];

      Object.entries(presence).forEach(([profileId, isPresent]) => {
        const rec = existingMap.get(profileId);
        if (rec) {
          if (rec.is_present !== isPresent) {
            toUpdate.push({ id: rec.id, is_present: isPresent });
          }
        } else if (isPresent) {
          // Só cria registro novo se o membro foi marcado como presente
          toInsert.push({
            session_id: sid,
            profile_id: profileId,
            is_present: true,
            position_override: profileDefaults[profileId] ?? null,
          });
        }
      });

      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(({ id, is_present }) =>
            supabase.from("session_attendances").update({ is_present }).eq("id", id)
          )
        );
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("session_attendances").insert(toInsert);
        if (error) throw error;
      }

      toast.success("Presenças gravadas com sucesso!");
      await loadAttendances();
    } catch (error) {
      console.error("Error saving attendances:", error);
      toast.error("Erro ao gravar presenças");
      throw error;
    }
  };

  const updatePosition = async (id: string, positionOverride: string | null) => {
    try {
      const { error } = await supabase
        .from("session_attendances")
        .update({ position_override: positionOverride })
        .eq("id", id);

      if (error) throw error;
      await loadAttendances();
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error("Erro ao atualizar posição");
      throw error;
    }
  };

  const removeAttendance = async (id: string) => {
    try {
      const { error } = await supabase
        .from("session_attendances")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Presença removida com sucesso!");
      await loadAttendances();
    } catch (error) {
      console.error("Error removing attendance:", error);
      toast.error("Erro ao remover presença");
      throw error;
    }
  };

  const clearAllAttendances = async (sid: string) => {
    try {
      const { error } = await supabase
        .from("session_attendances")
        .delete()
        .eq("session_id", sid);

      if (error) throw error;
      await loadAttendances();
    } catch (error) {
      console.error("Error clearing attendances:", error);
      toast.error("Erro ao zerar lista");
      throw error;
    }
  };

  useEffect(() => {
    loadAttendances();
  }, [sessionId]);

  return {
    attendances,
    loading,
    saveAllPresence,
    updatePosition,
    removeAttendance,
    clearAllAttendances,
    reload: loadAttendances,
  };
};
