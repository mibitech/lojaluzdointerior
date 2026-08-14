import { parseDateSafe } from '@/lib/utils';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Download, LayoutGrid, List } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useSecretaryDocuments, useSecretaryMutation, DOCUMENT_CATEGORIES, DOCUMENT_ACCESS_TYPES, SecretaryDocument } from '@/hooks/useSecretary';
import { useAuth } from '@/contexts/AuthContext';

const SecretaryDocuments: React.FC = () => {
  const { user } = useAuth();
  const { data: items = [] } = useSecretaryDocuments();
  const { insert, update, remove } = useSecretaryMutation('secretary_documents', 'secretary_documents');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<SecretaryDocument | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const openNew = () => {
    setEditing(null);
    setFile(null);
    setForm({
      category: 'Outro',
      access_type: 'Público (todos obreiros)',
      document_date: new Date().toISOString().split('T')[0],
    });
    setDialog(true);
  };

  const openEdit = (item: SecretaryDocument) => {
    setEditing(item);
    setFile(null);
    setForm({ ...item });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setUploading(true);
    try {
      let fileData: Record<string, any> = {};
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('secretary-documents').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('secretary-documents').getPublicUrl(path);
        fileData = { file_url: publicUrl, file_name: file.name, file_type: file.type, file_size: file.size };
      }

      const payload = {
        title: form.title,
        category: form.category,
        access_type: form.access_type,
        document_date: form.document_date,
        reference_number: form.reference_number || null,
        tags: form.tags_input ? form.tags_input.split(',').map((t: string) => t.trim()).filter(Boolean) : form.tags || null,
        description: form.description || null,
        ...fileData,
      };

      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
      } else {
        await insert.mutateAsync({ ...payload, uploaded_by: user?.id });
      }
      setDialog(false);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este documento?')) await remove.mutateAsync(id);
  };

  const filtered = items.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Arquivo Geral</CardTitle>
          <div className="flex gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')}><List className="w-4 h-4" /></Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}><LayoutGrid className="w-4 h-4" /></Button>
            </div>
            <Dialog open={dialog} onOpenChange={setDialog}>
              <DialogTrigger asChild>
                <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Documento</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título *</Label>
                    <Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={form.category || 'Outro'} onValueChange={v => setForm({ ...form, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo de Acesso</Label>
                      <Select value={form.access_type || ''} onValueChange={v => setForm({ ...form, access_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{DOCUMENT_ACCESS_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data do Documento</Label>
                      <Input type="date" value={form.document_date || ''} onChange={e => setForm({ ...form, document_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Número de Referência</Label>
                      <Input value={form.reference_number || ''} onChange={e => setForm({ ...form, reference_number: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Tags (separadas por vírgula)</Label>
                    <Input value={form.tags_input || (form.tags || []).join(', ')} onChange={e => setForm({ ...form, tags_input: e.target.value })} placeholder="ex: financeiro, 2025, ata" />
                  </div>
                  <div>
                    <Label>Arquivo</Label>
                    <Input type="file" accept=".pdf,.docx,.jpg,.png,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} />
                    {editing?.file_name && !file && <p className="text-sm text-muted-foreground mt-1">Arquivo atual: {editing.file_name}</p>}
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar'}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {viewMode === 'table' ? (
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum documento encontrado</TableCell></TableRow>
                  ) : filtered.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                      <TableCell>{format(parseDateSafe(item.document_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell><Badge variant="secondary">{item.access_type}</Badge></TableCell>
                      <TableCell>
                        {item.file_url ? (
                          <Button variant="ghost" size="sm" onClick={() => window.open(item.file_url!, '_blank')}><Download className="w-4 h-4" /></Button>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {viewMode === 'grid' || viewMode === 'table' ? (
            <div className={viewMode === 'table' ? 'md:hidden' : ''}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-8">Nenhum documento encontrado</p>
                ) : filtered.map(item => (
                  <Card key={item.id} className="shadow-soft hover:shadow-elegant transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant="secondary">{item.access_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{format(parseDateSafe(item.document_date), 'dd/MM/yyyy')}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">{item.tags.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}</div>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                        {item.file_url && <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(item.file_url!, '_blank')}><Download className="w-4 h-4 mr-1" />Baixar</Button>}
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecretaryDocuments;
