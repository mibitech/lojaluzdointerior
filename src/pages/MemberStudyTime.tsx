import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, Eye, Download, Calendar, User, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface StudyWork {
  id: string;
  brother_name: string;
  work_title: string;
  file_path: string;
  created_at: string;
  description: string;
  category: string;
  is_approved: boolean;
  uploaded_by: string;
  masonic_degree: number;
}

const MemberStudyTime: React.FC = () => {
  const { user } = useAuth();
  const [studyWorks, setStudyWorks] = useState<StudyWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userMasonicDegree, setUserMasonicDegree] = useState<number>(1);
  const [degreeFilter, setDegreeFilter] = useState<string>('all');
  
  // Form data
  const [brotherName, setBrotherName] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('geral');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userMasonicDegree > 0) {
      fetchStudyWorks();
    }
  }, [userMasonicDegree]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('masonic_degree')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        toast.error('Erro ao carregar perfil do usuário');
        return;
      }
      
      if (data) {
        setUserMasonicDegree(data.masonic_degree || 1);
      } else {
        console.warn('Perfil não encontrado para o usuário');
        setUserMasonicDegree(1); // Default to Aprendiz
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      toast.error('Erro ao carregar perfil do usuário');
      setUserMasonicDegree(1); // Default to Aprendiz
    }
  };

  const fetchStudyWorks = async () => {
    try {
      // Get study works filtered by user's masonic degree access and only approved works
      const { data: worksData, error: worksError } = await supabase
        .from('study_works')
        .select('*')
        .lte('masonic_degree', userMasonicDegree)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (worksError) throw worksError;

      setStudyWorks(worksData || []);
    } catch (error) {
      console.error('Erro ao buscar trabalhos:', error);
      toast.error('Erro ao carregar trabalhos de estudo');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são permitidos');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !brotherName || !workTitle) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);
    try {
      // Sanitize file name by removing special characters and accents
      const sanitizedFileName = selectedFile.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_'); // Replace multiple underscores with single one
      
      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}_${sanitizedFileName}`;
      const { error: uploadError } = await supabase.storage
        .from('study-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('study_works')
        .insert({
          brother_name: brotherName,
          work_title: workTitle,
          file_path: fileName,
          description,
          category,
          uploaded_by: user.id,
          masonic_degree: userMasonicDegree
        });

      if (dbError) throw dbError;

      toast.success('Trabalho enviado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      fetchStudyWorks();
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar trabalho');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setBrotherName('');
    setWorkTitle('');
    setDescription('');
    setCategory('geral');
    setSelectedFile(null);
  };

  const viewDocument = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('study-documents')
        .createSignedUrl(filePath, 60);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      toast.error('Erro ao abrir documento');
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data } = await supabase.storage
        .from('study-documents')
        .download(filePath);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar documento');
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
      geral: 'Geral',
      historia: 'História Maçônica',
      filosofia: 'Filosofia',
      simbolismo: 'Simbolismo',
      ritual: 'Ritual',
      outros: 'Outros',
    };
    return categories[category] || category;
  };

  const filteredStudyWorks = studyWorks.filter(work => {
    if (degreeFilter === 'all') return true;
    return work.masonic_degree.toString() === degreeFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Tempo de Estudos</h2>
          <p className="text-muted-foreground">
            Gerenciamento de trabalhos dos irmãos
          </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brotherName">Nome do Irmão *</Label>
                  <Input
                    id="brotherName"
                    value={brotherName}
                    onChange={(e) => setBrotherName(e.target.value)}
                    placeholder="Nome completo"
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
                <Label htmlFor="workTitle">Título do Trabalho *</Label>
                <Input
                  id="workTitle"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="Título do trabalho"
                />
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
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
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


      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Label htmlFor="degreeFilter">Filtrar por Grau:</Label>
              <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Todos os graus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os graus</SelectItem>
                  <SelectItem value="1">Aprendiz (1º Grau)</SelectItem>
                  {userMasonicDegree >= 2 && <SelectItem value="2">Companheiro (2º Grau)</SelectItem>}
                  {userMasonicDegree >= 3 && <SelectItem value="3">Mestre (3º Grau)</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Seu grau: {userMasonicDegree === 1 ? 'Aprendiz' : userMasonicDegree === 2 ? 'Companheiro' : 'Mestre'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Trabalhos - layout único responsivo */}
      <div className="space-y-4">
        {filteredStudyWorks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum trabalho encontrado</h3>
              <p className="text-muted-foreground">
                Ainda não há tempos de estudo disponíveis para o seu grau ou filtro aplicado.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredStudyWorks.map((work) => (
            <Card key={work.id} className="shadow-soft hover:shadow-elegant transition-smooth">
              <CardContent className="p-4 md:p-6 space-y-3">
                {/* Título do trabalho */}
                <h3 className="text-lg md:text-xl font-semibold">{work.work_title}</h3>

                {/* Nome do irmão */}
                <p className="text-sm text-muted-foreground">{work.brother_name}</p>

                {/* Badges: categoria, grau e status */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{getCategoryLabel(work.category)}</Badge>
                  <Badge variant="secondary">{getDegreeLabel(work.masonic_degree)}</Badge>
                  {work.is_approved && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Aprovado
                    </Badge>
                  )}
                </div>

                {/* Data de upload */}
                <p className="text-sm text-muted-foreground">
                  Upload: {new Date(work.created_at).toLocaleDateString('pt-BR')}
                </p>

                {/* Descrição (se existir) */}
                {work.description && (
                  <p className="text-sm text-muted-foreground">{work.description}</p>
                )}

                {/* Botões de ação */}
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
                    onClick={() => downloadDocument(work.file_path, work.work_title + '.pdf')}
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
  );
};

export default MemberStudyTime;