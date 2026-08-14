import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Session {
  id: string;
  title: string;
  session_degree: string;
  show_description: boolean;
  description?: string;
  session_datetime: string;
  created_at: string;
  updated_at: string;
}

export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("session_datetime", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Erro ao carregar sessões");
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: Omit<Session, "id" | "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase.from("sessions").insert([sessionData]);

      if (error) throw error;
      toast.success("Sessão criada com sucesso!");
      await loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Erro ao criar sessão");
      throw error;
    }
  };

  const updateSession = async (id: string, sessionData: Partial<Session>) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update(sessionData)
        .eq("id", id);

      if (error) throw error;
      toast.success("Sessão atualizada com sucesso!");
      await loadSessions();
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Erro ao atualizar sessão");
      throw error;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase.from("sessions").delete().eq("id", id);

      if (error) throw error;
      toast.success("Sessão excluída com sucesso!");
      await loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Erro ao excluir sessão");
      throw error;
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    loadSessions,
  };
};
