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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities, Activity } from '@/hooks/useActivities';
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
  Eye,
  EyeOff,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import { ImageUpload, ImageItem, ExistingImage } from '@/components/ImageUpload';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const activitySchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200, 'Título muito longo'),
  description: z.string().optional(),
  content: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  is_public: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  partnerships: z.string().optional(),
  results: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;
type SortField = 'title' | 'category' | 'is_public' | 'is_featured' | 'created_at';
type SortOrder = 'asc' | 'desc';

const CommissionActivities: React.FC = () => {
  const { isCommissionMember } = useAuth();
  const { activities, loading, createActivity, updateActivity, deleteActivity, uploadActivityImage, getActivityImages, deleteActivityImage } = useActivities();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setFilterCategory] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'regular'>('all');
  
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [activityImages, setActivityImages] = useState<ImageItem[]>([]);
  const [existingActivityImages, setExistingActivityImages] = useState<ExistingImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      is_public: true,
      is_featured: false,
      category: '',
    },
  });

  const categoryOptions = [
    { value: 'social', label: 'Ações Sociais' },
    { value: 'philanthropic', label: 'Filantropia' },
    { value: 'public_event', label: 'Eventos Públicos' },
    { value: 'cultural', label: 'Cultura' },
    { value: 'educational', label: 'Educação' },
  ];

  const categories = useMemo(() => {
    const cats = new Set(activities.map(a => a.category));
    return ['all', ...Array.from(cats)];
  }, [activities]);

  const filteredAndSortedActivities = useMemo(() => {
    const filtered = activities.filter((activity) => {
      const matchesSearch =
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;

      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'public' && activity.is_public) ||
        (visibilityFilter === 'private' && !activity.is_public);

      const matchesFeatured =
        featuredFilter === 'all' ||
        (featuredFilter === 'featured' && activity.is_featured) ||
        (featuredFilter === 'regular' && !activity.is_featured);

      return matchesSearch && matchesCategory && matchesVisibility && matchesFeatured;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === 'is_public') {
        comparison = (a.is_public === b.is_public ? 0 : a.is_public ? -1 : 1);
      } else if (sortField === 'is_featured') {
        comparison = (a.is_featured === b.is_featured ? 0 : a.is_featured ? -1 : 1);
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [activities, searchTerm, categoryFilter, visibilityFilter, featuredFilter, sortField, sortOrder]);

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
    setEditingActivity(null);
    setActivityImages([]);
    setExistingActivityImages([]);
    reset({
      title: '',
      description: '',
      content: '',
      category: '',
      is_public: true,
      is_featured: false,
      partnerships: '',
      results: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = async (activity: Activity) => {
    setEditingActivity(activity);
    setActivityImages([]);
    
    // Load existing images
    const existingImages = await getActivityImages(activity.id);
    setExistingActivityImages(existingImages.map(img => ({ id: img.id, url: img.image_url })));
    
    reset({
      title: activity.title,
      description: activity.description || '',
      content: activity.content || '',
      category: activity.category,
      is_public: activity.is_public,
      is_featured: activity.is_featured,
      partnerships: activity.partnerships || '',
      results: activity.results || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteActivityImage = async (imageId: string, imageUrl: string) => {
    await deleteActivityImage(imageId, imageUrl);
    setExistingActivityImages(prev => prev.filter(img => img.id !== imageId));
  };

  const openDeleteDialog = (activityId: string) => {
    setDeletingActivityId(activityId);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: ActivityFormData) => {
    try {
      const activityData = {
        title: data.title,
        description: data.description || null,
        content: data.content || null,
        category: data.category,
        is_public: data.is_public,
        is_featured: data.is_featured,
        partnerships: data.partnerships || null,
        results: data.results || null,
      };

      let activityId: string;

      if (editingActivity) {
        await updateActivity(editingActivity.id, activityData);
        activityId = editingActivity.id;
      } else {
        const newActivity = await createActivity(activityData);
        activityId = newActivity.id;
      }

      // Upload images if any
      if (activityImages.length > 0) {
        setUploadingImages(true);
        for (let i = 0; i < activityImages.length; i++) {
          const item = activityImages[i];
          if (item instanceof File) {
            await uploadActivityImage(activityId, item, i);
          }
        }
        setUploadingImages(false);
      }

      setIsDialogOpen(false);
      reset();
      setActivityImages([]);
    } catch (error) {
      console.error('Error saving activity:', error);
      setUploadingImages(false);
    }
  };

  const handleDelete = async () => {
    if (deletingActivityId) {
      try {
        await deleteActivity(deletingActivityId);
        setIsDeleteDialogOpen(false);
        setDeletingActivityId(null);
      } catch (error) {
        console.error('Error deleting activity:', error);
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
          <h2 className="text-2xl font-bold">Gerenciar Atividades</h2>
          <p className="text-muted-foreground">
            Administre atividades e projetos da loja
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por título, descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category-filter">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setFilterCategory}>
                <SelectTrigger id="category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'Todas' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="visibility-filter">Visibilidade</Label>
              <Select value={visibilityFilter} onValueChange={(value: any) => setVisibilityFilter(value)}>
                <SelectTrigger id="visibility-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="public">Públicas</SelectItem>
                  <SelectItem value="private">Privadas</SelectItem>
                </SelectContent>
              </Select>
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
                      onClick={() => handleSort('title')}
                      className="flex items-center font-semibold"
                    >
                      Título
                      {getSortIcon('title')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('category')}
                      className="flex items-center font-semibold"
                    >
                      Categoria
                      {getSortIcon('category')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('is_featured')}
                      className="flex items-center font-semibold"
                    >
                      Destaque
                      {getSortIcon('is_featured')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('is_public')}
                      className="flex items-center font-semibold"
                    >
                      Visibilidade
                      {getSortIcon('is_public')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma atividade encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {activity.is_featured ? (
                          <div className="flex items-center text-sm">
                            <Star className="w-4 h-4 mr-2 fill-yellow-500 text-yellow-500" />
                            <span className="text-yellow-600">Destaque</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.is_public ? (
                          <div className="flex items-center text-sm">
                            <Eye className="w-4 h-4 mr-2 text-green-600" />
                            <span className="text-green-600">Público</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-sm">
                            <EyeOff className="w-4 h-4 mr-2 text-orange-600" />
                            <span className="text-orange-600">Privado</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(activity)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(activity.id)}
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
        ) : filteredAndSortedActivities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma atividade encontrada
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedActivities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{activity.title}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(activity)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(activity.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{activity.category}</Badge>
                  {activity.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1 fill-yellow-600" />
                      Destaque
                    </Badge>
                  )}
                  {activity.is_public ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Público
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Privado
                    </Badge>
                  )}
                </div>
                {activity.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {activity.description}
                  </p>
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
              {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Digite o título da atividade"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={watch('category')} 
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Breve descrição da atividade"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content">Conteúdo Completo</Label>
              <Textarea
                id="content"
                {...register('content')}
                placeholder="Descrição detalhada da atividade"
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="partnerships">Parcerias</Label>
              <Textarea
                id="partnerships"
                {...register('partnerships')}
                placeholder="Organizações parceiras"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="results">Resultados</Label>
              <Textarea
                id="results"
                {...register('results')}
                placeholder="Resultados alcançados"
                rows={2}
              />
            </div>

            {/* Imagens */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Imagens da Atividade
              </h3>
              <ImageUpload
                images={activityImages}
                onImagesChange={setActivityImages}
                existingImages={existingActivityImages}
                onDeleteExisting={handleDeleteActivityImage}
                maxImages={5}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={watch('is_public')}
                onCheckedChange={(checked) => setValue('is_public', checked)}
              />
              <Label htmlFor="is_public">Visível ao público</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={watch('is_featured')}
                onCheckedChange={(checked) => setValue('is_featured', checked)}
              />
              <Label htmlFor="is_featured">Destacar atividade</Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={uploadingImages}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploadingImages}>
                {uploadingImages ? 'Salvando...' : editingActivity ? 'Atualizar' : 'Criar'}
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
              Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
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

export default CommissionActivities;
