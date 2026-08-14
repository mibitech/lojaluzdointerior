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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents, Event } from '@/hooks/useEvents';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  MapPin,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ImageUpload, ImageItem, ExistingImage } from '@/components/ImageUpload';

const eventSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200, 'Título muito longo'),
  description: z.string().optional(),
  event_date: z.date({ required_error: 'Data do evento é obrigatória' }),
  location: z.string().optional(),
  is_public: z.boolean().default(true),
});

type EventFormData = z.infer<typeof eventSchema>;

type SortField = 'title' | 'event_date' | 'location' | 'is_public';
type SortOrder = 'asc' | 'desc';

const CommissionEvents: React.FC = () => {
  const { isCommissionMember } = useAuth();
  const { events, loading, createEvent, updateEvent, deleteEvent, uploadEventImage, getEventImages, deleteEventImage } = useEvents();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  
  const [sortField, setSortField] = useState<SortField>('event_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [eventImages, setEventImages] = useState<ImageItem[]>([]);
  const [existingEventImages, setExistingEventImages] = useState<ExistingImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      is_public: true,
    },
  });

  const eventDate = watch('event_date');

  const getStatusBadge = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();

    if (isBefore(date, now)) {
      return <Badge variant="secondary">Realizado</Badge>;
    } else if (isAfter(date, now)) {
      return <Badge variant="default">Próximo</Badge>;
    } else {
      return <Badge variant="destructive">Hoje</Badge>;
    }
  };

  const filteredAndSortedEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const eventDate = parseISO(event.event_date);
      const now = new Date();
      const isPast = isBefore(eventDate, now);
      const isUpcoming = isAfter(eventDate, now);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'past' && isPast) ||
        (statusFilter === 'upcoming' && isUpcoming);

      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'public' && event.is_public) ||
        (visibilityFilter === 'private' && !event.is_public);

      return matchesSearch && matchesStatus && matchesVisibility;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'event_date') {
        comparison = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      } else if (sortField === 'location') {
        comparison = (a.location || '').localeCompare(b.location || '');
      } else if (sortField === 'is_public') {
        comparison = (a.is_public === b.is_public ? 0 : a.is_public ? -1 : 1);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, searchTerm, statusFilter, visibilityFilter, sortField, sortOrder]);

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
    setEditingEvent(null);
    setEventImages([]);
    setExistingEventImages([]);
    reset({
      title: '',
      description: '',
      event_date: new Date(),
      location: '',
      is_public: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = async (event: Event) => {
    setEditingEvent(event);
    setEventImages([]);
    
    // Load existing images
    const existingImages = await getEventImages(event.id);
    setExistingEventImages(existingImages.map(img => ({ id: img.id, url: img.image_url })));
    
    reset({
      title: event.title,
      description: event.description || '',
      event_date: parseISO(event.event_date),
      location: event.location || '',
      is_public: event.is_public,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEventImage = async (imageId: string, imageUrl: string) => {
    await deleteEventImage(imageId, imageUrl);
    setExistingEventImages(prev => prev.filter(img => img.id !== imageId));
  };

  const openDeleteDialog = (eventId: string) => {
    setDeletingEventId(eventId);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventData = {
        title: data.title,
        description: data.description || null,
        event_date: data.event_date.toISOString(),
        location: data.location || null,
        is_public: data.is_public,
      };

      let eventId: string;

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        eventId = editingEvent.id;
      } else {
        const newEvent = await createEvent(eventData);
        eventId = newEvent.id;
      }

      // Upload images if any
      if (eventImages.length > 0) {
        setUploadingImages(true);
        for (let i = 0; i < eventImages.length; i++) {
          const item = eventImages[i];
          if (item instanceof File) {
            await uploadEventImage(eventId, item, i);
          }
        }
        setUploadingImages(false);
      }

      setIsDialogOpen(false);
      reset();
      setEventImages([]);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async () => {
    if (deletingEventId) {
      try {
        await deleteEvent(deletingEventId);
        setIsDeleteDialogOpen(false);
        setDeletingEventId(null);
      } catch (error) {
        console.error('Error deleting event:', error);
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
          <h2 className="text-2xl font-bold">Gerenciar Eventos</h2>
          <p className="text-muted-foreground">
            Administre eventos e atividades da loja
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
                    placeholder="Buscar por título, descrição ou local..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="upcoming">Próximos</SelectItem>
                    <SelectItem value="past">Realizados</SelectItem>
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
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="public">Públicos</SelectItem>
                    <SelectItem value="private">Privados</SelectItem>
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
                        onClick={() => handleSort('event_date')}
                        className="flex items-center font-semibold"
                      >
                        Data
                        {getSortIcon('event_date')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('location')}
                        className="flex items-center font-semibold"
                      >
                        Local
                        {getSortIcon('location')}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
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
                  {filteredAndSortedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum evento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                            {format(parseISO(event.event_date), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.location ? (
                            <div className="flex items-center text-sm">
                              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                              {event.location}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(event.event_date)}</TableCell>
                        <TableCell>
                          {event.is_public ? (
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
                              onClick={() => openEditDialog(event)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(event.id)}
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
          ) : filteredAndSortedEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhum evento encontrado
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    {getStatusBadge(event.event_date)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                      {format(parseISO(event.event_date), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      {event.is_public ? (
                        <>
                          <Eye className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-green-600">Público</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-2 text-orange-600" />
                          <span className="text-orange-600">Privado</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(event)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(event.id)}
                      className="flex-1 text-destructive hover:text-destructive"
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Editar Evento' : 'Adicionar Novo Evento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações Básicas</h3>
                <div>
                  <Label htmlFor="title">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Nome do evento"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Descrição detalhada do evento"
                    rows={4}
                  />
                </div>
              </div>

              {/* Data e Local */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Data e Local</h3>
                <div>
                  <Label>
                    Data do Evento <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !eventDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? (
                          format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={(date) => setValue('event_date', date as Date)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.event_date && (
                    <p className="text-sm text-destructive mt-1">{errors.event_date.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    {...register('location')}
                    placeholder="Local do evento"
                  />
                </div>
              </div>

              {/* Imagens */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Imagens do Evento
                </h3>
                
                {/* Preview Carousel */}
                {(existingEventImages.length > 0 || eventImages.length > 0) && (
                  <div className="mb-4">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {existingEventImages.map((img) => (
                          <CarouselItem key={img.id}>
                            <div className="aspect-video w-full overflow-hidden rounded-lg">
                              <img
                                src={img.url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                        {eventImages.map((img, idx) => (
                          <CarouselItem key={`new-${idx}`}>
                            <div className="aspect-video w-full overflow-hidden rounded-lg">
                              <img
                                src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                )}
                
                <ImageUpload
                  images={eventImages}
                  onImagesChange={setEventImages}
                  existingImages={existingEventImages}
                  onDeleteExisting={handleDeleteEventImage}
                  maxImages={5}
                />
              </div>

              {/* Configurações */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Configurações</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_public">Evento Público</Label>
                    <p className="text-sm text-muted-foreground">
                      Tornar visível para visitantes não autenticados
                    </p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={watch('is_public')}
                    onCheckedChange={(checked) => setValue('is_public', checked)}
                  />
                </div>
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
                  {uploadingImages ? 'Salvando...' : editingEvent ? 'Atualizar' : 'Criar'}
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
                Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default CommissionEvents;
