import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Eye, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserWork {
  id: string;
  user_id: string;
  work_title: string;
  file_path: string;
  description?: string;
  category: string;
  masonic_degree: number;
  is_approved: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

const CommissionStudyTime: React.FC = () => {
  const { user, isCommissionMember } = useAuth();
  const [userWorks, setUserWorks] = useState<UserWork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCommissionMember) {
      loadUserWorks();
    }
  }, [isCommissionMember]);

  if (!isCommissionMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              {user ? "Acesso apenas para membros da comissão." : "Faça login para acessar esta área."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadUserWorks = async () => {
    setLoading(true);
    try {
      // Load user works without join first
      const { data: worksData, error: worksError } = await supabase
        .from("user_works")
        .select("*")
        .order("created_at", { ascending: false });

      if (worksError) {
        toast({ title: "Erro", description: "Falha ao carregar trabalhos dos usuários", variant: "destructive" });
        console.error("Error loading user works:", worksError);
        return;
      }

      // Get unique user_ids
      const userIds = [...new Set(worksData.map((work: any) => work.user_id))];

      // Load profiles for those users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
      }

      // Merge the data
      const profilesMap = new Map(profilesData?.map((p: any) => [p.user_id, p]) || []);
      const mergedData = worksData.map((work: any) => ({
        ...work,
        profiles: profilesMap.get(work.user_id) || null,
      }));

      setUserWorks(mergedData);
    } catch (error) {
      console.error("Error loading user works:", error);
      toast({ title: "Erro", description: "Erro ao carregar trabalhos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const approveUserWork = async (id: string, approve: boolean) => {
    const { error } = await supabase
      .from("user_works")
      .update({
        is_approved: approve,
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      })
      .eq("id", id);

    if (error) {
      toast({ 
        title: "Erro", 
        description: `Falha ao ${approve ? 'aprovar' : 'reprovar'} trabalho`, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Sucesso", 
        description: `Trabalho ${approve ? 'aprovado' : 'reprovado'} com sucesso` 
      });
      loadUserWorks();
    }
  };

  const viewUserWorkDocument = async (filePath: string) => {
    try {
      const { data } = await supabase.storage.from("user-works").createSignedUrl(filePath, 60);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Erro ao visualizar documento:", error);
      toast({ title: "Erro", description: "Erro ao abrir documento", variant: "destructive" });
    }
  };

  const getDegreeLabel = (degree: number) => {
    switch (degree) {
      case 1: return 'Aprendiz';
      case 2: return 'Companheiro';
      case 3: return 'Mestre';
      default: return 'Aprendiz';
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'geral': 'Geral',
      'historia': 'História Maçônica',
      'filosofia': 'Filosofia',
      'simbolismo': 'Simbolismo',
      'ritual': 'Ritual',
      'outros': 'Outros'
    };
    return categories[category] || category;
  };

  const pendingWorks = userWorks.filter(work => work.is_approved === null);
  const approvedWorks = userWorks.filter(work => work.is_approved === true);
  const rejectedWorks = userWorks.filter(work => work.is_approved === false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Tempo de Estudos</h2>
          <p className="text-muted-foreground">Gerenciamento de trabalhos dos irmãos</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 md:grid md:grid-cols-3 md:h-10">
          <TabsTrigger value="pending" className="flex-1 min-w-[100px]">
            Pendentes
            {pendingWorks.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingWorks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 min-w-[100px]">
            Aprovados ({approvedWorks.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 min-w-[100px]">
            Reprovados ({rejectedWorks.length})
          </TabsTrigger>
        </TabsList>

          {/* Pending Works */}
          <TabsContent value="pending" className="space-y-4">
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-6 h-6 mr-2" />
                  Trabalhos Pendentes de Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingWorks.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum trabalho pendente de aprovação</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Irmão</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Grau</TableHead>
                        <TableHead>Data Upload</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingWorks.map((work) => (
                        <TableRow key={work.id}>
                          <TableCell className="font-medium">
                            {work.profiles?.full_name || "Usuário não encontrado"}
                          </TableCell>
                          <TableCell>{work.work_title}</TableCell>
                          <TableCell>{getCategoryLabel(work.category)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getDegreeLabel(work.masonic_degree)}</Badge>
                          </TableCell>
                          <TableCell>{new Date(work.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewUserWorkDocument(work.file_path)}
                                title="Visualizar documento"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => approveUserWork(work.id, true)}
                                title="Aprovar trabalho"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => approveUserWork(work.id, false)}
                                title="Reprovar trabalho"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))
              ) : pendingWorks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4" />
                    <p>Nenhum trabalho pendente de aprovação</p>
                  </CardContent>
                </Card>
              ) : (
                pendingWorks.map((work) => (
                  <Card key={work.id}>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg">{work.work_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {work.profiles?.full_name || "Usuário não encontrado"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{getCategoryLabel(work.category)}</Badge>
                        <Badge variant="outline">{getDegreeLabel(work.masonic_degree)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(work.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      {work.description && (
                        <p className="text-sm text-muted-foreground">{work.description}</p>
                      )}
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewUserWorkDocument(work.file_path)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => approveUserWork(work.id, true)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => approveUserWork(work.id, false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reprovar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Approved Works */}
          <TabsContent value="approved" className="space-y-4">
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Check className="w-6 h-6 mr-2 text-green-600" />
                  Trabalhos Aprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {approvedWorks.length === 0 ? (
                  <div className="text-center py-12">
                    <Check className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum trabalho aprovado ainda</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Irmão</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Grau</TableHead>
                        <TableHead>Data Upload</TableHead>
                        <TableHead>Data Aprovação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedWorks.map((work) => (
                        <TableRow key={work.id}>
                          <TableCell className="font-medium">
                            {work.profiles?.full_name || "Usuário não encontrado"}
                          </TableCell>
                          <TableCell>{work.work_title}</TableCell>
                          <TableCell>{getCategoryLabel(work.category)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getDegreeLabel(work.masonic_degree)}</Badge>
                          </TableCell>
                          <TableCell>{new Date(work.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            {work.approved_at ? new Date(work.approved_at).toLocaleDateString("pt-BR") : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewUserWorkDocument(work.file_path)}
                                title="Visualizar documento"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => approveUserWork(work.id, false)}
                                title="Reprovar trabalho"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {approvedWorks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Check className="w-12 h-12 mx-auto mb-4" />
                    <p>Nenhum trabalho aprovado ainda</p>
                  </CardContent>
                </Card>
              ) : (
                approvedWorks.map((work) => (
                  <Card key={work.id}>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg">{work.work_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {work.profiles?.full_name || "Usuário não encontrado"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{getCategoryLabel(work.category)}</Badge>
                        <Badge variant="outline">{getDegreeLabel(work.masonic_degree)}</Badge>
                        <Badge variant="default" className="bg-green-600">Aprovado</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Upload: {new Date(work.created_at).toLocaleDateString("pt-BR")}</p>
                        {work.approved_at && (
                          <p>Aprovado: {new Date(work.approved_at).toLocaleDateString("pt-BR")}</p>
                        )}
                      </div>
                      {work.description && (
                        <p className="text-sm text-muted-foreground">{work.description}</p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => viewUserWorkDocument(work.file_path)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => approveUserWork(work.id, false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Rejected Works */}
          <TabsContent value="rejected" className="space-y-4">
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <X className="w-6 h-6 mr-2 text-destructive" />
                  Trabalhos Reprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rejectedWorks.length === 0 ? (
                  <div className="text-center py-12">
                    <X className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum trabalho reprovado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Irmão</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Grau</TableHead>
                        <TableHead>Data Upload</TableHead>
                        <TableHead>Data Reprovação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedWorks.map((work) => (
                        <TableRow key={work.id}>
                          <TableCell className="font-medium">
                            {work.profiles?.full_name || "Usuário não encontrado"}
                          </TableCell>
                          <TableCell>{work.work_title}</TableCell>
                          <TableCell>{getCategoryLabel(work.category)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getDegreeLabel(work.masonic_degree)}</Badge>
                          </TableCell>
                          <TableCell>{new Date(work.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            {work.approved_at ? new Date(work.approved_at).toLocaleDateString("pt-BR") : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewUserWorkDocument(work.file_path)}
                                title="Visualizar documento"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => approveUserWork(work.id, true)}
                                title="Aprovar trabalho"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {rejectedWorks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <X className="w-12 h-12 mx-auto mb-4" />
                    <p>Nenhum trabalho reprovado</p>
                  </CardContent>
                </Card>
              ) : (
                rejectedWorks.map((work) => (
                  <Card key={work.id}>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg">{work.work_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {work.profiles?.full_name || "Usuário não encontrado"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{getCategoryLabel(work.category)}</Badge>
                        <Badge variant="outline">{getDegreeLabel(work.masonic_degree)}</Badge>
                        <Badge variant="destructive">Reprovado</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Upload: {new Date(work.created_at).toLocaleDateString("pt-BR")}</p>
                        {work.approved_at && (
                          <p>Reprovado: {new Date(work.approved_at).toLocaleDateString("pt-BR")}</p>
                        )}
                      </div>
                      {work.description && (
                        <p className="text-sm text-muted-foreground">{work.description}</p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => viewUserWorkDocument(work.file_path)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveUserWork(work.id, true)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default CommissionStudyTime;
