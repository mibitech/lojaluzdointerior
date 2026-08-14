import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useMasters, WorshipfulMaster } from '@/hooks/useMasters';
import { ImageUpload, ImageItem } from '@/components/ImageUpload';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar as CalendarIcon,
  Crown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const masterSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(200, 'Nome muito longo'),
  installation_year: z.number().min(1900).max(2100),
  term_start_date: z.date({ required_error: 'Data de início é obrigatória' }),
  term_end_date: z.date().optional(),
  bio: z.string().optional(),
  achievements: z.string().optional(),
  is_active: z.boolean().default(false),
  sort_order: z.number().default(0),
});

type MasterFormData = z.infer<typeof masterSchema>;
type SortField = 'name' | 'installation_year' | 'is_active';
type SortOrder = 'asc' | 'desc';

const CommissionMasters: React.FC = () => {
  const { isCommissionMember } = useAuth();
  const { masters, loading, createMaster, updateMaster, deleteMaster, uploadMasterImage } = useMasters();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState<WorshipfulMaster | null>(null);
  const [deletingMasterId, setDeletingMasterId] = useState<string | null>(null);
  const [masterImages, setMasterImages] = useState<ImageItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [sortField, setSortField] = useState<SortField>('installation_year');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MasterFormData>({
    resolver: zodResolver(masterSchema),
    defaultValues: {
      is_active: false,
      sort_order: 0,
    },
  });

  const startDate = watch('term_start_date');
  const endDate = watch('term_end_date');

  const filteredAndSortedMasters = useMemo(() => {
    const filtered = masters.filter((master) => {
      const matchesSearch =
        master.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        master.installation_year.toString().includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && master.is_active) ||
        (statusFilter === 'inactive' && !master.is_active);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'installation_year') {
        comparison = a.installation_year - b.installation_year;
      } else if (sortField === 'is_active') {
        comparison = (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [masters, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  const openCreateDialog = () => {
    setEditingMaster(null);
    setMasterImages([]);
    reset({
      name: '',
      installation_year: new Date().getFullYear(),
      term_start_date: new Date(),
      term_end_date: undefined,
      bio: '',
      achievements: '',
      is_active: false,
      sort_order: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (master: WorshipfulMaster) => {
    setEditingMaster(master);
    setMasterImages(master.photo_url ? [master.photo_url] : []);
    reset({
      name: master.name,
      installation_year: master.installation_year,
      term_start_date: parseISO(master.term_start_date),
      term_end_date: master.term_end_date ? parseISO(master.term_end_date) : undefined,
      bio: master.bio || '',
      achievements: master.achievements || '',
      is_active: master.is_active,
      sort_order: master.sort_order,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (masterId: string) => {
    setDeletingMasterId(masterId);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: MasterFormData) => {
    try {
      // If no images, clear photo; if existing string URL kept, preserve it; if new File, upload later
      let photoUrl: string | null = null;
      if (masterImages.length > 0 && typeof masterImages[0] === 'string') {
        photoUrl = masterImages[0];
      }

      const masterData = {
        name: data.name,
        installation_year: data.installation_year,
        term_start_date: data.term_start_date.toISOString().split('T')[0],
        term_end_date: data.term_end_date ? data.term_end_date.toISOString().split('T')[0] : null,
        bio: data.bio || null,
        achievements: data.achievements || null,
        is_active: data.is_active,
        sort_order: data.sort_order,
        photo_url: photoUrl,
      };

      let masterId: string;
      
      if (editingMaster) {
        await updateMaster(editingMaster.id, masterData);
        masterId = editingMaster.id;
      } else {
        const newMaster = await createMaster(masterData);
        masterId = newMaster.id;
      }

      // Upload image if a new one was selected
      if (masterImages.length > 0 && masterImages[0] instanceof File) {
        photoUrl = await uploadMasterImage(masterId, masterImages[0]);
        await updateMaster(masterId, { photo_url: photoUrl });
      }

      setIsDialogOpen(false);
      reset();
      setMasterImages([]);
    } catch (error) {
      console.error('Error saving master:', error);
    }
  };

  const handleDelete = async () => {
    if (deletingMasterId) {
      try {
        await deleteMaster(deletingMasterId);
        setIsDeleteDialogOpen(false);
        setDeletingMasterId(null);
      } catch (error) {
        console.error('Error deleting master:', error);
      }
    }
  };

  if (!isCommissionMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Acesso apenas para membros da comissão.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Mestres Veneráveis</h2>
          <p className="text-muted-foreground">
            Administre histórico de mestres veneráveis
          </p>
        </div>
        <Button onClick={openCreateDialog} className="mt-4 md:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Novo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nome ou ano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className="flex-1"
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                  className="flex-1"
                >
                  Ativo
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('inactive')}
                  className="flex-1"
                >
                  Inativos
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="flex items-center font-semibold"
                    >
                      Nome
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('installation_year')}
                      className="flex items-center font-semibold"
                    >
                      Ano de Instalação
                      {getSortIcon('installation_year')}
                    </Button>
                  </TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('is_active')}
                      className="flex items-center font-semibold"
                    >
                      Status
                      {getSortIcon('is_active')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedMasters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum mestre encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedMasters.map((master) => (
                    <TableRow key={master.id}>
                      <TableCell className="font-medium">{master.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{master.installation_year}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(parseISO(master.term_start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        {master.term_end_date && (
                          <> até {format(parseISO(master.term_end_date), 'dd/MM/yyyy', { locale: ptBR })}</>
                        )}
                      </TableCell>
                      <TableCell>
                        {master.is_active ? (
                          <Badge variant="default" className="bg-green-600">
                            <Crown className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(master)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(master.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
        ) : filteredAndSortedMasters.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum mestre encontrado
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedMasters.map((master) => (
            <Card key={master.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{master.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Instalação: {master.installation_year}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(master)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(master.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  {format(parseISO(master.term_start_date), 'dd/MM/yyyy', { locale: ptBR })}
                  {master.term_end_date && (
                    <> até {format(parseISO(master.term_end_date), 'dd/MM/yyyy', { locale: ptBR })}</>
                  )}
                </div>
                {master.is_active && (
                  <Badge variant="default" className="bg-green-600">
                    <Crown className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaster ? 'Editar Mestre Venerável' : 'Novo Mestre Venerável'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Digite o nome completo"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="installation_year">Ano de Instalação *</Label>
              <Input
                id="installation_year"
                type="number"
                {...register('installation_year', { valueAsNumber: true })}
                placeholder="2024"
              />
              {errors.installation_year && (
                <p className="text-sm text-destructive mt-1">{errors.installation_year.message}</p>
              )}
            </div>

            <div>
              <Label>Data de Início do Mandato *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => setValue('term_start_date', date as Date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.term_start_date && (
                <p className="text-sm text-destructive mt-1">{errors.term_start_date.message}</p>
              )}
            </div>

            <div>
              <Label>Data de Término do Mandato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data (opcional)'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setValue('term_end_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="História e trajetória"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="achievements">Conquistas</Label>
              <Textarea
                id="achievements"
                {...register('achievements')}
                placeholder="Principais realizações durante o mandato"
                rows={3}
              />
            </div>

            <div>
              <Label>Foto do Mestre</Label>
              <ImageUpload
                images={masterImages}
                onImagesChange={setMasterImages}
                maxImages={1}
                maxSizeMB={5}
              />
            </div>

            <div>
              <Label htmlFor="sort_order">Ordem de Exibição</Label>
              <Input
                id="sort_order"
                type="number"
                {...register('sort_order', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Mestre Venerável Ativo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingMaster ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este mestre venerável? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionMasters;
