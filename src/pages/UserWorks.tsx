import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Upload, Eye, Download, Calendar, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWork {
  id: string;
  work_title: string;
  file_path: string;
  created_at: string;
  description: string;
  category: string;
  masonic_degree: number;
  is_approved: boolean | null;
}

const UserWorks: React.FC = () => {
  const { user } = useAuth();
  const [userWorks, setUserWorks] = useState<UserWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userMasonicDegree, setUserMasonicDegree] = useState<number>(1);
  const [deleteWorkId, setDeleteWorkId] = useState<string | null>(null);

  // Form data
  const [workTitle, setWorkTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userMasonicDegree > 0) {
      fetchUserWorks();
    }
  }, [userMasonicDegree]);

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

  const fetchUserWorks = async () => {
    if (!user) return;

    try {
      const { data: worksData, error: worksError } = await supabase
        .from("user_works")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (worksError) throw worksError;

      setUserWorks(worksData || []);
    } catch (error) {
      console.error("Erro ao buscar trabalhos:", error);
      toast.error("Erro ao carregar trabalhos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos PDF são permitidos");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !workTitle) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setUploading(true);
    try {
      const sanitizedFileName = selectedFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");

      const fileName = `${user.id}/${Date.now()}_${sanitizedFileName}`;
      const { error: uploadError } = await supabase.storage.from("user-works").upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("user_works").insert({
        user_id: user.id,
        work_title: workTitle,
        file_path: fileName,
        description,
        category,
        masonic_degree: userMasonicDegree,
      });

      if (dbError) throw dbError;

      toast.success("Trabalho enviado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      fetchUserWorks();
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar trabalho");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteWorkId) return;

    try {
      const work = userWorks.find((w) => w.id === deleteWorkId);
      if (!work) return;

      // Check if work is approved
      if (work.is_approved) {
        toast.error("Não é possível excluir trabalhos aprovados");
        setDeleteWorkId(null);
        return;
      }

      // Delete file from storage
      if (work.file_path) {
        const { error: storageError } = await supabase.storage.from("user-works").remove([work.file_path]);

        if (storageError) {
          console.error("Erro ao deletar arquivo:", storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase.from("user_works").delete().eq("id", deleteWorkId);

      if (dbError) throw dbError;

      toast.success("Trabalho excluído com sucesso!");
      setDeleteWorkId(null);
      fetchUserWorks();
    } catch (error) {
      console.error("Erro ao deletar trabalho:", error);
      toast.error("Erro ao excluir trabalho");
    }
  };

  const resetForm = () => {
    setWorkTitle("");
    setDescription("");
    setCategory("geral");
    setSelectedFile(null);
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
        <div className="space-y-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Trabalhos</h1>
            <p className="text-muted-foreground">Gerencie seus trabalhos de estudo e pesquisas</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Trabalho
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Enviar Novo Trabalho</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workTitle">Título do Trabalho *</Label>
                    <Input
                      id="workTitle"
                      value={workTitle}
                      onChange={(e) => setWorkTitle(e.target.value)}
                      placeholder="Título do trabalho"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="geral">Geral</option>
                      <option value="historia">História Maçônica</option>
                      <option value="filosofia">Filosofia</option>
                      <option value="simbolismo">Simbolismo</option>
                      <option value="ritual">Ritual</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do trabalho"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="file">Arquivo PDF *</Label>
                  <Input id="file" type="file" accept=".pdf" onChange={handleFileSelect} className="cursor-pointer" />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Works List */}
        <div className="space-y-4">
          {userWorks.length === 0 ? (
            <Card>
              <CardContent className="p-4 md:p-6 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum trabalho encontrado</h3>
                <p className="text-muted-foreground">Comece enviando seu primeiro trabalho de estudo!</p>
              </CardContent>
            </Card>
          ) : (
            userWorks.map((work) => (
              <Card key={work.id} className="shadow-soft hover:shadow-elegant transition-smooth">
                <CardContent className="p-4 md:p-6 space-y-3">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">{work.work_title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(work.created_at).toLocaleDateString("pt-BR")}
                      </div>
                      <Badge variant="outline">{work.category}</Badge>
                      <Badge variant="secondary">{getDegreeLabel(work.masonic_degree)}</Badge>
                      {work.is_approved !== null && (
                        <Badge variant={work.is_approved ? "default" : "destructive"}>
                          {work.is_approved ? "Aprovado" : "Reprovado"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {work.description && (
                    <p className="text-sm text-muted-foreground">{work.description}</p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => viewDocument(work.file_path)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadDocument(work.file_path, work.work_title + ".pdf")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setDeleteWorkId(work.id)}
                      disabled={work.is_approved}
                      title={work.is_approved ? "Não é possível excluir trabalhos aprovados" : "Excluir trabalho"}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteWorkId} onOpenChange={() => setDeleteWorkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este trabalho? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserWorks;
