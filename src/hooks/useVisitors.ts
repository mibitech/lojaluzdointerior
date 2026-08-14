import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Visitor {
  id: string;
  session_id: string;
  visitor_name: string;
  cim: string | null;
  visitor_lodge: string | null;
  city: string | null;
  state: string | null;
  potencia: string | null;
  masonic_degree: string | null;
  email: string | null;
  mobile_phone: string | null;
  landline_phone: string | null;
  visit_date: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useVisitors = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVisitors = async () => {
    try {
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error("Error loading visitors:", error);
      toast.error("Erro ao carregar visitantes");
    } finally {
      setLoading(false);
    }
  };

  const createVisitor = async (visitorData: Omit<Visitor, "id" | "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase
        .from("visitors")
        .insert(visitorData);

      if (error) throw error;
      
      toast.success("Visitante cadastrado com sucesso!");
      await loadVisitors();
    } catch (error) {
      console.error("Error creating visitor:", error);
      toast.error("Erro ao cadastrar visitante");
      throw error;
    }
  };

  const updateVisitor = async (id: string, visitorData: Partial<Visitor>) => {
    try {
      const { error } = await supabase
        .from("visitors")
        .update(visitorData)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Visitante atualizado com sucesso!");
      await loadVisitors();
    } catch (error) {
      console.error("Error updating visitor:", error);
      toast.error("Erro ao atualizar visitante");
      throw error;
    }
  };

  const deleteVisitor = async (id: string) => {
    try {
      const { error } = await supabase
        .from("visitors")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Visitante excluído com sucesso!");
      await loadVisitors();
    } catch (error) {
      console.error("Error deleting visitor:", error);
      toast.error("Erro ao excluir visitante");
      throw error;
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  return {
    visitors,
    loading,
    createVisitor,
    updateVisitor,
    deleteVisitor,
  };
};
