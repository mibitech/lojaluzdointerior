import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, Download, Calendar, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";

interface LibraryWork {
  id: string;
  work_title: string;
  file_path: string;
  created_at: string;
  description: string;
  category: string;
  masonic_degree: number;
  brother_name: string;
}

const Library: React.FC = () => {
  const { user } = useAuth();
  const [works, setWorks] = useState<LibraryWork[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<LibraryWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [userMasonicDegree, setUserMasonicDegree] = useState<number>(1);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userMasonicDegree > 0) {
      fetchWorks();
    }
  }, [userMasonicDegree]);

  useEffect(() => {
    filterWorks();
  }, [works, searchTerm, selectedCategory]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("masonic_degree")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        toast.error("Erro ao carregar perfil do usuário");
        return;
      }

      if (data) {
        setUserMasonicDegree(data.masonic_degree || 1);
      } else {
        setUserMasonicDegree(1);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      toast.error("Erro ao carregar perfil do usuário");
      setUserMasonicDegree(1);
    }
  };

  const fetchWorks = async () => {
    if (!user) return;

    try {
      const { data: worksData, error: worksError } = await supabase
        .from("study_works")
        .select("*")
        .eq("is_approved", true)
        .lte("masonic_degree", userMasonicDegree)
        .order("created_at", { ascending: false });

      if (worksError) throw worksError;

      setWorks(worksData || []);
    } catch (error) {
      console.error("Erro ao buscar trabalhos:", error);
      toast.error("Erro ao carregar biblioteca");
    } finally {
      setLoading(false);
    }
  };

  const filterWorks = () => {
    let filtered = works;

    if (searchTerm) {
      filtered = filtered.filter(
        (work) =>
          work.work_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          work.brother_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          work.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "todos") {
      filtered = filtered.filter((work) => work.category === selectedCategory);
    }

    setFilteredWorks(filtered);
  };

  const viewDocument = async (filePath: string) => {
    try {
      const { data } = await supabase.storage.from("user-works").createSignedUrl(filePath, 60);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Erro ao visualizar documento:", error);
      toast.error("Erro ao abrir documento");
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data } = await supabase.storage.from("user-works").download(filePath);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error("Erro ao baixar documento");
    }
  };

  const getDegreeLabel = (degree: number) => {
    switch (degree) {
      case 1:
        return "Aprendiz";
      case 2:
        return "Companheiro";
      case 3:
        return "Mestre";
      default:
        return "Aprendiz";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Acesso apenas para membros autorizados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BookOpen className="w-8 h-8 text-primary mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-primary">Biblioteca</h1>
              <p className="text-muted-foreground">Trabalhos aprovados e compartilhados pelos irmãos</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por título, autor ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="todos">Todas as Categorias</option>
              <option value="geral">Geral</option>
              <option value="historia">História Maçônica</option>
              <option value="filosofia">Filosofia</option>
              <option value="simbolismo">Simbolismo</option>
              <option value="ritual">Ritual</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        </div>

        {/* Works List */}
        <div className="grid gap-6">
          {filteredWorks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum trabalho encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory !== "todos"
                    ? "Tente ajustar os filtros de busca"
                    : "Ainda não há trabalhos aprovados na biblioteca"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredWorks.map((work) => (
              <Card key={work.id} className="shadow-soft hover:shadow-elegant transition-smooth">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-primary mb-2">{work.work_title}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-2">Por: {work.brother_name}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(work.created_at).toLocaleDateString("pt-BR")}
                        </div>
                        <Badge variant="secondary">{work.category}</Badge>
                        <Badge variant="outline">{getDegreeLabel(work.masonic_degree)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {work.description && <p className="text-muted-foreground mb-4">{work.description}</p>}

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => viewDocument(work.file_path)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(work.file_path, work.work_title + ".pdf")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Library;
