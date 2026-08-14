import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCopoDagua, CopoDaguaEvent } from '@/hooks/useCopoDagua';
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
  Download,
  Upload,
} from 'lucide-react';
import { format, parse, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, parseDateSafe } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const eventSchema = z.object({
  event_date: z.date({ required_error: 'Data é obrigatória' }),
  session_type: z.string().min(1, 'Tipo de sessão é obrigatório'),
  session_degree: z.string().optional(),
  study_time: z.string().optional(),
  start_time: z.string().min(1, 'Horário de início é obrigatório'),
  water_glass_group: z.string().min(1, 'Grupo é obrigatório'),
});

type EventFormData = z.infer<typeof eventSchema>;
type SortField = 'event_date' | 'month' | 'session_type';
type SortOrder = 'asc' | 'desc';

const CommissionCopoDagua: React.FC = () => {
  const { isCommissionMember } = useAuth();
  const { events, loading, createEvent, updateEvent, deleteEvent, deleteMultiple, deleteAll, loadEvents } = useCopoDagua();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CopoDaguaEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [sortField, setSortField] = useState<SortField>('event_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const eventDate = watch('event_date');

  // Calcular automaticamente mês e dia da semana baseado na data
  const getMonthName = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'MMMM', { locale: ptBR });
  };

  const getDayOfWeek = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'EEEE', { locale: ptBR });
  };

  const calculatedMonth = getMonthName(eventDate);
  const calculatedDayOfWeek = getDayOfWeek(eventDate);

  const filteredAndSortedEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const matchesSearch =
        event.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.session_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.water_glass_group.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'event_date') {
        comparison = parseDateSafe(a.event_date).getTime() - parseDateSafe(b.event_date).getTime();
      } else if (sortField === 'month') {
        comparison = a.month.localeCompare(b.month);
      } else if (sortField === 'session_type') {
        comparison = a.session_type.localeCompare(b.session_type);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, searchTerm, sortField, sortOrder]);

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
    reset({
      event_date: new Date(),
      session_type: '',
      session_degree: '',
      study_time: '',
      start_time: '',
      water_glass_group: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: CopoDaguaEvent) => {
    setEditingEvent(event);
    reset({
      event_date: parseISO(event.event_date),
      session_type: event.session_type,
      session_degree: event.session_degree || '',
      study_time: event.study_time || '',
      start_time: event.start_time,
      water_glass_group: event.water_glass_group,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (eventId: string) => {
    setDeletingEventId(eventId);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      // Calcular mês e dia da semana automaticamente
      const month = format(data.event_date, 'MMMM', { locale: ptBR });
      const dayOfWeek = format(data.event_date, 'EEEE', { locale: ptBR });
      
      const eventData = {
        month: month,
        event_date: data.event_date.toISOString().split('T')[0],
        day_of_week: dayOfWeek,
        session_type: data.session_type,
        session_degree: data.session_degree || null,
        study_time: data.study_time || null,
        start_time: data.start_time,
        water_glass_group: data.water_glass_group,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await createEvent(eventData);
      }

      setIsDialogOpen(false);
      reset();
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

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Excluir ${selectedIds.length} evento(s) selecionado(s)?`)) {
      await deleteMultiple(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('Excluir TODOS os eventos? Esta ação não pode ser desfeita!')) {
      await deleteAll();
      setSelectedIds([]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === events.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(events.map(e => e.id));
    }
  };

  const exportToExcel = () => {
    const exportData = events.map(event => ({
      'MÊS': event.month,
      'DATA': format(parseISO(event.event_date), 'dd/MM/yyyy'),
      'DIA DA SEMANA': event.day_of_week,
      'TIPO DE SESSÃO': event.session_type,
      'GRAU DA SESSÃO': event.session_degree || '',
      'TEMPO DE ESTUDOS': event.study_time || '',
      'INÍCIO': event.start_time,
      'GRUPO SORTEIO - COPO D\'ÁGUA': event.water_glass_group,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Copo D\'água');
    XLSX.writeFile(wb, `copo_dagua_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const importFromExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            toast({
              title: 'Erro',
              description: 'Arquivo vazio ou formato inválido',
              variant: 'destructive',
            });
            return;
          }

          const eventsToImport = jsonData.map(row => {
            let eventDate = '';
            const dateValue = row['DATA'];
            
            if (dateValue) {
              if (typeof dateValue === 'number') {
                const date = XLSX.SSF.parse_date_code(dateValue);
                eventDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
              } else if (typeof dateValue === 'string') {
                const dateStr = String(dateValue).trim();
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  const month = String(parts[0]).padStart(2, '0');
                  const day = String(parts[1]).padStart(2, '0');
                  let year = String(parts[2]);
                  
                  if (year.length === 2) {
                    const yearNum = parseInt(year, 10);
                    year = yearNum >= 0 && yearNum <= 50 ? `20${year}` : `19${year}`;
                  }
                  
                  eventDate = `${year}-${month}-${day}`;
                }
              }
            }

            return {
              month: row['MÊS'] || '',
              event_date: eventDate,
              day_of_week: row['DIA DA SEMANA'] || '',
              session_type: row['TIPO DE SESSÃO'] || '',
              session_degree: row['GRAU DA SESSÃO'] || null,
              study_time: row['TEMPO DE ESTUDOS'] || null,
              start_time: row['INÍCIO'] || '',
              water_glass_group: row['GRUPO SORTEIO - COPO D\'ÁGUA'] || '',
            };
          }).filter(event => {
            return event.month && 
                   event.event_date && 
                   event.water_glass_group && 
                   event.session_type !== 'X' &&
                   event.water_glass_group !== 'X' &&
                   !event.month.toLowerCase().includes('recesso') &&
                   !event.month.toLowerCase().includes('feriado');
          });

          if (eventsToImport.length === 0) {
            toast({
              title: 'Erro',
              description: 'Nenhum evento válido encontrado no arquivo',
              variant: 'destructive',
            });
            return;
          }

          const { data: insertedData, error } = await supabase
            .from('copo_dagua_calendar')
            .insert(eventsToImport)
            .select();

          if (error) throw error;

          toast({ 
            title: 'Sucesso', 
            description: `${eventsToImport.length} evento(s) importado(s) com sucesso` 
          });
          
          await loadEvents();
          
          // Limpar input
          e.target.value = '';
        } catch (parseError) {
          console.error('Error parsing Excel:', parseError);
          toast({ 
            title: 'Erro', 
            description: 'Falha ao processar arquivo Excel', 
            variant: 'destructive' 
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing from Excel:', error);
      toast({ 
        title: 'Erro', 
        description: 'Falha ao importar arquivo', 
        variant: 'destructive' 
      });
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
          <h2 className="text-2xl font-bold">Gerenciar Copo D'água</h2>
          <p className="text-muted-foreground">
            Administre o calendário do Copo D'água
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {selectedIds.length > 0 && (
            <>
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir {selectedIds.length}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Todos
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="import-excel" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </label>
          </Button>
          <input
            id="import-excel"
            type="file"
            accept=".xlsx,.xls"
            onChange={importFromExcel}
            className="hidden"
          />
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por mês, tipo de sessão ou grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === events.length && events.length > 0}
                        onChange={toggleAllSelection}
                        className="cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('month')}
                        className="flex items-center font-semibold"
                      >
                        Mês
                        {getSortIcon('month')}
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
                    <TableHead>Dia</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('session_type')}
                        className="flex items-center font-semibold"
                      >
                        Sessão
                        {getSortIcon('session_type')}
                      </Button>
                    </TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead className="max-w-[200px]">Grupo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum evento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(event.id)}
                            onChange={() => toggleSelection(event.id)}
                            className="cursor-pointer"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.month}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(event.event_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-sm">{event.day_of_week}</TableCell>
                        <TableCell className="text-sm">{event.session_type}</TableCell>
                        <TableCell className="text-sm">{event.start_time}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate" title={event.water_glass_group}>
                          {event.water_glass_group}
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
            </div>
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
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(event.id)}
                      onChange={() => toggleSelection(event.id)}
                      className="mt-1 cursor-pointer"
                    />
                    <div>
                      <Badge variant="outline" className="mb-2">{event.month}</Badge>
                      <p className="font-semibold">{event.session_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(event.event_date), 'dd/MM/yyyy')} - {event.day_of_week}
                      </p>
                      <p className="text-sm text-muted-foreground">Início: {event.start_time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                </div>
                <p className="text-sm">
                  <strong>Grupo:</strong> {event.water_glass_group}
                </p>
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
              {editingEvent ? 'Editar Evento' : 'Novo Evento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data *</Label>
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
                      {eventDate ? format(eventDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={(date) => setValue('event_date', date as Date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.event_date && (
                  <p className="text-sm text-destructive mt-1">{errors.event_date.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="start_time">Horário *</Label>
                <Input
                  id="start_time"
                  {...register('start_time')}
                  placeholder="19:30"
                />
                {errors.start_time && (
                  <p className="text-sm text-destructive mt-1">{errors.start_time.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calculated_month">Mês (calculado)</Label>
                <Input
                  id="calculated_month"
                  value={calculatedMonth}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente pela data</p>
              </div>
              
              <div>
                <Label htmlFor="calculated_day">Dia da Semana (calculado)</Label>
                <Input
                  id="calculated_day"
                  value={calculatedDayOfWeek}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente pela data</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session_type">Tipo de Sessão *</Label>
                <Input
                  id="session_type"
                  {...register('session_type')}
                  placeholder="Ordinária"
                />
                {errors.session_type && (
                  <p className="text-sm text-destructive mt-1">{errors.session_type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="session_degree">Grau da Sessão</Label>
                <Select
                  value={watch('session_degree') || ''}
                  onValueChange={(value) => setValue('session_degree', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Qualquer Grau">Qualquer Grau</SelectItem>
                    <SelectItem value="Sessão Pública (Sem Grau)">Sessão Pública (Sem Grau)</SelectItem>
                    <SelectItem value="Aprendiz Maçom (A∴M∴)">Aprendiz Maçom (A∴M∴)</SelectItem>
                    <SelectItem value="Companheiro Maçom (C∴M∴)">Companheiro Maçom (C∴M∴)</SelectItem>
                    <SelectItem value="Mestre Maçom (M∴M∴)">Mestre Maçom (M∴M∴)</SelectItem>
                    <SelectItem value="Mestre Instalado (M∴I∴)">Mestre Instalado (M∴I∴)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="study_time">Tempo de Estudos</Label>
              <Textarea
                id="study_time"
                {...register('study_time')}
                placeholder="Tema e responsável"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="water_glass_group">Grupo Sorteio - Copo D'água *</Label>
              <Textarea
                id="water_glass_group"
                {...register('water_glass_group')}
                placeholder="Nomes dos membros do grupo"
                rows={2}
              />
              {errors.water_glass_group && (
                <p className="text-sm text-destructive mt-1">{errors.water_glass_group.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingEvent ? 'Atualizar' : 'Criar'}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionCopoDagua;
