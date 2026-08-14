import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, Upload, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Article {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  profiles: { full_name: string };
}

const CommissionArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchArticles();
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfileId(data?.id || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({ title: 'Erro ao carregar artigos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;

    setUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Upload arquivo apenas se foi selecionado
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileNameGenerated = `${Math.random()}.${fileExt}`;
        const filePath = `${fileNameGenerated}`;

        const { error: uploadError } = await supabase.storage
          .from('articles')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('articles')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = selectedFile.name;
        fileType = selectedFile.type;
      }

      const { error: dbError } = await supabase
        .from('articles')
        .insert([{
          title: formData.title,
          description: formData.description,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          uploaded_by: profileId,
        }]);

      if (dbError) throw dbError;

      toast({ title: 'Artigo enviado com sucesso!' });
      setOpenDialog(false);
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error('Error uploading article:', error);
      toast({ title: 'Erro ao enviar artigo', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string | null) => {
    if (!confirm('Deseja realmente excluir este artigo?')) return;

    try {
      // Remove arquivo do storage apenas se existir
      if (fileUrl) {
        const filePath = fileUrl.split('/').pop();
        if (filePath) {
          await supabase.storage.from('articles').remove([filePath]);
        }
      }

      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Artigo excluído com sucesso!' });
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({ title: 'Erro ao excluir artigo', variant: 'destructive' });
    }
  };

  const handleDownload = async (fileUrl: string | null, fileName: string | null) => {
    if (!fileUrl || !fileName) {
      toast({ title: 'Este artigo não possui arquivo para download', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: 'Erro ao baixar arquivo', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '' });
    setSelectedFile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Artigos</h2>
          <p className="text-muted-foreground">
            Administre artigos e publicações da loja
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Artigo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Artigo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Arquivo (Opcional)</Label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Você pode enviar apenas a descrição ou anexar um arquivo
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Artigo
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Artigos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Enviado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.profiles.full_name}</TableCell>
                  <TableCell>{new Date(article.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {article.file_url && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDownload(article.file_url, article.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(article.id, article.file_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum artigo cadastrado
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{article.title}</h3>
                  <div className="flex gap-2">
                    {article.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(article.file_url, article.file_name)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(article.id, article.file_url)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Enviado por:</span> {article.profiles.full_name}</p>
                  <p><span className="font-medium">Data:</span> {new Date(article.created_at).toLocaleDateString('pt-BR')}</p>
                  {article.description && (
                    <p className="text-muted-foreground mt-2">{article.description}</p>
                  )}
                  {article.file_url && (
                    <Badge variant="secondary" className="mt-2">Possui arquivo</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommissionArticles;
