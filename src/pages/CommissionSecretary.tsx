import { parseDateSafe } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ClipboardList, FileText, Mail, Archive, Plus, Edit, Trash2, Download, Eye, LayoutDashboard, UserCheck, BellRing, Award, CheckCircle, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileUpload, FileItem } from '@/components/FileUpload';
import { useSessions } from '@/hooks/useSessions';
import SecretaryDashboard from '@/components/secretary/SecretaryDashboard';
import SecretaryCorrespondence from '@/components/secretary/SecretaryCorrespondence';
import SecretaryDocuments from '@/components/secretary/SecretaryDocuments';
import SecretaryConvocations from '@/components/secretary/SecretaryConvocations';
import SecretaryCertificates from '@/components/secretary/SecretaryCertificates';
import CommissionAttendances from '@/pages/CommissionAttendances';

interface MeetingMinute {
  id: string;
  title: string;
  description?: string;
  masonic_degree: number;
  meeting_date: string;
  session_id?: string;
  status: string;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface MeetingMinuteFile {
  id: string;
  minute_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  display_order: number;
  created_at: string;
}

type SecretaryTabKey = 'dashboard' | 'atas' | 'correspondencias' | 'arquivo' | 'presencas' | 'convocacoes' | 'certidoes';

const secretaryTabs: { key: SecretaryTabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'atas', label: 'Atas', icon: <FileText className="w-4 h-4" /> },
  { key: 'correspondencias', label: 'Correspondências', icon: <Mail className="w-4 h-4" /> },
  { key: 'arquivo', label: 'Arquivo', icon: <Archive className="w-4 h-4" /> },
  { key: 'presencas', label: 'Presenças', icon: <UserCheck className="w-4 h-4" /> },
  { key: 'convocacoes', label: 'Convocações', icon: <BellRing className="w-4 h-4" /> },
  { key: 'certidoes', label: 'Certidões', icon: <Award className="w-4 h-4" /> },
];

const CommissionSecretary: React.FC = () => {
  const { user, isCommissionMember } = useAuth();
  const { sessions } = useSessions();
  const [activeTab, setActiveTab] = useState<SecretaryTabKey>('dashboard');

  // Atas states
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [minuteForm, setMinuteForm] = useState<Partial<MeetingMinute>>({});
  const [minuteDialog, setMinuteDialog] = useState(false);
  const [editingMinute, setEditingMinute] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedMinuteFiles, setSelectedMinuteFiles] = useState<MeetingMinuteFile[]>([]);
  const [viewFilesDialog, setViewFilesDialog] = useState(false);
  const [existingFileRecords, setExistingFileRecords] = useState<MeetingMinuteFile[]>([]);

  useEffect(() => {
    if (isCommissionMember) {
      loadMinutes();
    }
  }, [isCommissionMember]);

  useEffect(() => {
    if (minuteForm.session_id && sessions.length > 0) {
      const selectedSession = sessions.find(s => s.id === minuteForm.session_id);
      if (selectedSession) {
        let degree = 3;
        if (selectedSession.session_degree.includes('Aprendiz')) degree = 1;
        else if (selectedSession.session_degree.includes('Companheiro')) degree = 2;
        else if (selectedSession.session_degree.includes('Mestre')) degree = 3;

        setMinuteForm(prev => ({
          ...prev,
          title: `Ata - ${selectedSession.title}`,
          masonic_degree: degree,
          meeting_date: selectedSession.session_datetime.split('T')[0],
        }));
      }
    }
  }, [minuteForm.session_id, sessions]);

  if (!isCommissionMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              {user ? 'Acesso apenas para membros da comissão.' : 'Faça login para acessar esta área.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadMinutes = async () => {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('*')
      .order('meeting_date', { ascending: false });
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao carregar atas', variant: 'destructive' });
    } else {
      setMinutes(data || []);
    }
  };

  const loadMinuteFiles = async (minuteId: string) => {
    const { data, error } = await supabase
      .from('meeting_minutes_files')
      .select('*')
      .eq('minute_id', minuteId)
      .order('display_order');
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao carregar arquivos', variant: 'destructive' });
      return [];
    }
    return data || [];
  };

  const saveMinute = async () => {
    if (!minuteForm.title || !minuteForm.meeting_date || !minuteForm.masonic_degree) {
      toast({ title: 'Erro', description: 'Título, data e grau são obrigatórios', variant: 'destructive' });
      return;
    }
    try {
      setUploading(true);
      const minuteData = {
        title: minuteForm.title,
        description: minuteForm.description,
        masonic_degree: minuteForm.masonic_degree,
        meeting_date: minuteForm.meeting_date,
        session_id: minuteForm.session_id || null,
        status: minuteForm.status || 'Pendente',
        approved_at: minuteForm.status === 'Aprovada' ? (minuteForm.approved_at || new Date().toISOString()) : null,
        created_by: user?.id,
      };
      let minuteId = editingMinute;
      if (editingMinute) {
        const { error } = await supabase.from('meeting_minutes').update(minuteData).eq('id', editingMinute);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('meeting_minutes').insert(minuteData).select().single();
        if (error) throw error;
        minuteId = data.id;
      }

      if (editingMinute && existingFileRecords.length > 0) {
        const currentFileUrls = uploadedFiles.filter((f): f is string => typeof f === 'string').map(url => url);
        const filesToDelete = existingFileRecords.filter(record => !currentFileUrls.includes(record.file_url));
        for (const fileRecord of filesToDelete) {
          const url = new URL(fileRecord.file_url);
          const filePath = url.pathname.split('/storage/v1/object/public/meeting-minutes/')[1];
          if (filePath) await supabase.storage.from('meeting-minutes').remove([filePath]);
          await supabase.from('meeting_minutes_files').delete().eq('id', fileRecord.id);
        }
      }

      if (uploadedFiles.length > 0 && minuteId) {
        const newFiles = uploadedFiles.filter((f): f is File => f instanceof File);
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${minuteId}/${Date.now()}_${i}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('meeting-minutes').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('meeting-minutes').getPublicUrl(fileName);
          const { error: fileError } = await supabase.from('meeting_minutes_files').insert({
            minute_id: minuteId,
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
            display_order: i,
          });
          if (fileError) throw fileError;
        }
      }

      toast({ title: 'Sucesso', description: editingMinute ? 'Ata atualizada com sucesso' : 'Ata criada com sucesso' });
      loadMinutes();
      setMinuteDialog(false);
      setMinuteForm({});
      setUploadedFiles([]);
      setEditingMinute(null);
      setExistingFileRecords([]);
    } catch (error) {
      console.error('Error saving minute:', error);
      toast({ title: 'Erro', description: 'Falha ao salvar ata', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const editMinute = async (minute: MeetingMinute) => {
    setMinuteForm(minute);
    setEditingMinute(minute.id);
    const existingFiles = await loadMinuteFiles(minute.id);
    if (existingFiles) {
      setExistingFileRecords(existingFiles);
      setUploadedFiles(existingFiles.map(f => f.file_url));
    }
    setMinuteDialog(true);
  };

  const deleteMinute = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ata?')) {
      const { error } = await supabase.from('meeting_minutes').delete().eq('id', id);
      if (error) {
        toast({ title: 'Erro', description: 'Falha ao excluir ata', variant: 'destructive' });
      } else {
        toast({ title: 'Sucesso', description: 'Ata excluída com sucesso' });
        loadMinutes();
      }
    }
  };

  const toggleApproval = async (minute: MeetingMinute) => {
    const newStatus = minute.status === 'Aprovada' ? 'Pendente' : 'Aprovada';
    const { error } = await supabase.from('meeting_minutes').update({
      status: newStatus,
      approved_at: newStatus === 'Aprovada' ? new Date().toISOString() : null,
    }).eq('id', minute.id);
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar status', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: newStatus === 'Aprovada' ? 'Ata aprovada' : 'Aprovação removida' });
      loadMinutes();
    }
  };

  const viewFiles = async (minute: MeetingMinute) => {
    const files = await loadMinuteFiles(minute.id);
    setSelectedMinuteFiles(files);
    setViewFilesDialog(true);
  };

  const getDegreeLabel = (degree: number) => {
    switch (degree) {
      case 1: return 'Aprendiz';
      case 2: return 'Companheiro';
      case 3: return 'Mestre';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Secretaria</h1>
          <p className="text-muted-foreground">Gestão administrativa da loja</p>
        </div>
        <div className="overflow-x-auto mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl w-max md:w-fit">
            {secretaryTabs.map(tab => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                className={`gap-2 rounded-lg whitespace-nowrap ${activeTab === tab.key ? 'shadow-md' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {activeTab === 'dashboard' && <SecretaryDashboard />}

        {activeTab === 'atas' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Atas de Reunião</CardTitle>
              <Dialog open={minuteDialog} onOpenChange={setMinuteDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setMinuteForm({}); setEditingMinute(null); setUploadedFiles([]); setExistingFileRecords([]); }}>
                    <Plus className="w-4 h-4 mr-2" />Nova Ata
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingMinute ? 'Editar Ata' : 'Nova Ata'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session_id">Sessão</Label>
                      <Select value={minuteForm.session_id || undefined} onValueChange={(value) => setMinuteForm({ ...minuteForm, session_id: value })}>
                        <SelectTrigger><SelectValue placeholder="Selecione uma sessão (opcional)" /></SelectTrigger>
                        <SelectContent>
                          {sessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.title} - {format(new Date(session.session_datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input id="title" value={minuteForm.title || ''} onChange={(e) => setMinuteForm({ ...minuteForm, title: e.target.value })} placeholder="Ex: Ata da Sessão Ordinária" />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" value={minuteForm.description || ''} onChange={(e) => setMinuteForm({ ...minuteForm, description: e.target.value })} placeholder="Descrição da reunião" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="degree">Grau *</Label>
                        <Select value={minuteForm.masonic_degree?.toString() || ''} onValueChange={(value) => setMinuteForm({ ...minuteForm, masonic_degree: parseInt(value) })}>
                          <SelectTrigger><SelectValue placeholder="Selecione o grau" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Aprendiz</SelectItem>
                            <SelectItem value="2">Companheiro</SelectItem>
                            <SelectItem value="3">Mestre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="meeting_date">Data da Reunião *</Label>
                        <Input id="meeting_date" type="date" value={minuteForm.meeting_date || ''} onChange={(e) => setMinuteForm({ ...minuteForm, meeting_date: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={minuteForm.status || 'Pendente'} onValueChange={(value) => setMinuteForm({ ...minuteForm, status: value, approved_at: value === 'Aprovada' ? (minuteForm.approved_at || new Date().toISOString().split('T')[0]) : null })}>
                          <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Aprovada">Aprovada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="approved_at">Data de Aprovação</Label>
                        <Input id="approved_at" type="date" value={minuteForm.approved_at ? minuteForm.approved_at.split('T')[0] : ''} onChange={(e) => setMinuteForm({ ...minuteForm, approved_at: e.target.value })} disabled={minuteForm.status !== 'Aprovada'} />
                      </div>
                    </div>
                    <div>
                      <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} maxFiles={10} maxSizeMB={10} accept="image/*,.pdf,.doc,.docx" acceptLabel="Imagens, PDF, DOC" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setMinuteDialog(false)}>Cancelar</Button>
                      <Button onClick={saveMinute} disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar'}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Sessão</TableHead>
                      <TableHead>Grau</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {minutes.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma ata cadastrada</TableCell></TableRow>
                    ) : minutes.map((minute) => {
                      const relatedSession = sessions.find(s => s.id === minute.session_id);
                      return (
                        <TableRow key={minute.id}>
                          <TableCell className="font-medium">{minute.title}</TableCell>
                          <TableCell>{relatedSession ? <span className="text-sm text-muted-foreground">{relatedSession.title}</span> : <span className="text-sm text-muted-foreground">-</span>}</TableCell>
                          <TableCell>{getDegreeLabel(minute.masonic_degree)}</TableCell>
                          <TableCell>{format(parseDateSafe(minute.meeting_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={minute.status === 'Aprovada' ? 'default' : 'destructive'} className="text-xs">
                              {minute.status || 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(minute.created_at), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => toggleApproval(minute)} title={minute.status === 'Aprovada' ? 'Remover aprovação' : 'Aprovar ata'}>
                                {minute.status === 'Aprovada' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => viewFiles(minute)}><Eye className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => editMinute(minute)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteMinute(minute.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-4">
                {minutes.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma ata cadastrada</CardContent></Card>
                ) : minutes.map((minute) => {
                  const relatedSession = sessions.find(s => s.id === minute.session_id);
                  return (
                    <Card key={minute.id} className="shadow-soft hover:shadow-elegant transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{minute.title}</h3>
                            <div className="space-y-1 text-sm">
                              {relatedSession && <p className="text-muted-foreground"><strong>Sessão:</strong> {relatedSession.title}</p>}
                              <p className="text-muted-foreground"><strong>Grau:</strong> {getDegreeLabel(minute.masonic_degree)}</p>
                              <p className="text-muted-foreground"><strong>Data da Reunião:</strong> {format(parseDateSafe(minute.meeting_date), 'dd/MM/yyyy')}</p>
                              <p className="text-muted-foreground flex items-center gap-2"><strong>Status:</strong> <Badge variant={minute.status === 'Aprovada' ? 'default' : 'destructive'} className="text-xs">{minute.status || 'Pendente'}</Badge></p>
                              <p className="text-muted-foreground"><strong>Criado em:</strong> {format(new Date(minute.created_at), 'dd/MM/yyyy')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm" onClick={() => toggleApproval(minute)} className="flex-1 min-w-[30%]">
                            {minute.status === 'Aprovada' ? <CheckCircle className="w-4 h-4 mr-1 text-green-600" /> : <Circle className="w-4 h-4 mr-1" />}
                            {minute.status === 'Aprovada' ? 'Aprovada' : 'Aprovar'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => viewFiles(minute)} className="flex-1 min-w-[30%]"><Eye className="w-4 h-4 mr-1" />Arquivos</Button>
                          <Button variant="outline" size="sm" onClick={() => editMinute(minute)} className="flex-1 min-w-[30%]"><Edit className="w-4 h-4 mr-1" />Editar</Button>
                          <Button variant="outline" size="sm" onClick={() => deleteMinute(minute.id)} className="flex-1 min-w-[30%]"><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'correspondencias' && <SecretaryCorrespondence />}
        {activeTab === 'arquivo' && <SecretaryDocuments />}
        {activeTab === 'presencas' && <CommissionAttendances />}
        {activeTab === 'convocacoes' && <SecretaryConvocations />}
        {activeTab === 'certidoes' && <SecretaryCertificates />}

        {/* View Files Dialog */}
        <Dialog open={viewFilesDialog} onOpenChange={setViewFilesDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Arquivos da Ata</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {selectedMinuteFiles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum arquivo anexado</p>
              ) : selectedMinuteFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{file.file_name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(file.file_url, '_blank')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CommissionSecretary;
