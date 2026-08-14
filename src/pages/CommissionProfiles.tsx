import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useCommemorationDates } from '@/hooks/useCommemorationDates';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import {
  Edit,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Shield,
  User,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Pencil,
  X,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const profileSchema = z.object({
  cim: z.string().regex(/^\d{6}$/, 'CIM deve ter exatamente 6 dígitos numéricos').optional().or(z.literal('')),
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(200, 'Nome muito longo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
  commission: z.string().optional(),
  masonic_degree: z.number().min(1).max(33),
  is_director_member: z.boolean().default(false),
  member_status: z.string().default('Ativo'),
  graduation: z.string().default('Aprendiz'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type SortField = 'full_name' | 'masonic_degree' | 'is_director_member';
type SortOrder = 'asc' | 'desc';

const DATE_TYPES = [
  "Aniversário do Irmão",
  "Aniversário da Cunhada",
  "Aniversário da Sobrinha",
  "Aniversário do Sobrinho",
  "Aniversário da Iniciação",
  "Aniversário da Elevação",
  "Aniversário da Exaltação",
  "Outros"
] as const;

const CommissionProfiles: React.FC = () => {
  const { isCommissionMember } = useAuth();
  const { profiles, loading, updateProfile } = useProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const { dates, loadDates, createDate, updateDate, deleteDate } = useCommemorationDates(editingProfile?.id || undefined);
  
  // States for commemoration dates
  const [newDateType, setNewDateType] = useState('');
  const [newDateValue, setNewDateValue] = useState<Date>();
  const [newDateDescription, setNewDateDescription] = useState('');
  const [newDateInput, setNewDateInput] = useState('');
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  // Helper function to parse YYYY-MM-DD to local noon (avoids timezone shift)
  const parseYMDToLocalNoon = (ymd: string) => {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [degreeFilter, setDegreeFilter] = useState<string>('all');
  const [commissionFilter, setCommissionFilter] = useState<'all' | 'commission' | 'regular'>('all');
  
  const [sortField, setSortField] = useState<SortField>('full_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      is_director_member: false,
      member_status: 'Ativo',
      graduation: 'Aprendiz',
      masonic_degree: 1,
    },
  });

  const degrees = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
  
  const masonicPositions = [
    'Venerável Mestre',
    'Primeiro Vigilante',
    'Segundo Vigilante',
    'Orador',
    'Secretário',
    'Tesoureiro',
    'Chanceler',
    'Mestre de Cerimônias',
    'Experto',
    'Diáconos',
    'Cobridor Interno',
    'Cobridor Externo',
    'Guarda do Templo',
    'Porta Estandarte',
    'Porta Espadas',
    'Bibliotecário',
    'Mestre de Harmonia',
  ];

  const filteredAndSortedProfiles = useMemo(() => {
    const filtered = profiles.filter((profile) => {
      const matchesSearch =
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.position?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDegree = degreeFilter === 'all' || profile.masonic_degree.toString() === degreeFilter;

      const matchesCommission =
        commissionFilter === 'all' ||
        (commissionFilter === 'commission' && profile.is_director_member) ||
        (commissionFilter === 'regular' && !profile.is_director_member);

      return matchesSearch && matchesDegree && matchesCommission;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'full_name') {
        comparison = (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortField === 'masonic_degree') {
        comparison = a.masonic_degree - b.masonic_degree;
      } else if (sortField === 'is_director_member') {
        comparison = (a.is_director_member === b.is_director_member ? 0 : a.is_director_member ? -1 : 1);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [profiles, searchTerm, degreeFilter, commissionFilter, sortField, sortOrder]);

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

  const openEditDialog = (profile: Profile) => {
    setEditingProfile(profile);
    reset({
      cim: profile.cim || '',
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      position: profile.position || '',
      commission: profile.commission || '',
      masonic_degree: profile.masonic_degree,
      is_director_member: profile.is_director_member,
      member_status: profile.member_status ?? 'Ativo',
      graduation: (profile as any).graduation ?? 'Aprendiz',
    });
    
    // Load commemoration dates for this profile
    loadDates(profile.id);
    
    // Reset commemoration date form
    setNewDateType('');
    setNewDateValue(undefined);
    setNewDateDescription('');
    setNewDateInput('');
    setEditingDateId(null);
    
    setIsDialogOpen(true);
  };

  const handleCancelDateEdit = () => {
    setEditingDateId(null);
    setNewDateType('');
    setNewDateValue(undefined);
    setNewDateDescription('');
    setNewDateInput('');
  };

  // Clear description when date type changes (allow user to type their own)
  const handleDateTypeChange = (value: string) => {
    setNewDateType(value);
    setNewDateDescription('');
  };

  const handleEditCommemorationDate = (date: { id: string; date_type: string; description: string; date: string }) => {
    setEditingDateId(date.id);
    setNewDateType(date.date_type);
    setNewDateDescription(date.description);
    const dateObj = parseYMDToLocalNoon(date.date);
    setNewDateValue(dateObj);
    setNewDateInput(format(dateObj, 'dd/MM/yyyy'));
  };

  const handleUpdateCommemorationDate = async () => {
    if (!editingDateId || !newDateType || !newDateDescription || !newDateValue) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos da data comemorativa',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateDate(editingDateId, {
        date_type: newDateType,
        description: newDateDescription,
        date: format(newDateValue, 'yyyy-MM-dd'),
      });
      handleCancelDateEdit();
    } catch (error) {
      console.error('Error updating date:', error);
    }
  };

  const handleAddCommemorationDate = async () => {
    const parsedFromInput = newDateInput && newDateInput.length === 10
      ? parse(newDateInput, 'dd/MM/yyyy', new Date())
      : undefined;
    const dateToUse = newDateValue || parsedFromInput;

    if (!editingProfile || !dateToUse || !newDateType || !newDateDescription) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos da data comemorativa',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createDate({
        profile_id: editingProfile.id,
        date: format(dateToUse, 'yyyy-MM-dd'),
        date_type: newDateType,
        description: newDateDescription,
      });
      // Reset form
      setNewDateType('');
      setNewDateValue(undefined);
      setNewDateDescription('');
      setNewDateInput('');
    } catch (error) {
      console.error('Error adding date:', error);
    }
  };

  const handleDeleteCommemorationDate = async (dateId: string) => {
    try {
      await deleteDate(dateId);
    } catch (error) {
      console.error('Error deleting date:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!editingProfile) return;

    try {
      await updateProfile(editingProfile.id, {
        cim: data.cim || null,
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position || null,
        commission: data.commission || null,
        masonic_degree: data.masonic_degree,
        is_director_member: data.is_director_member,
        member_status: data.member_status,
        graduation: data.graduation,
      } as any);

      setIsDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getDegreeLabel = (degree: number) => {
    if (degree === 1) return 'Grau 1';
    if (degree === 2) return 'Grau 2';
    if (degree === 3) return 'Grau 3';
    return `Grau ${degree}`;
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
      <div>
        <h2 className="text-2xl font-bold">Gerenciar Irmãos</h2>
        <p className="text-muted-foreground">
          Administre perfis dos membros da loja
        </p>
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
                  placeholder="Buscar por nome, email ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="degree-filter">Grau</Label>
              <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                <SelectTrigger id="degree-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {degrees.map((deg) => (
                    <SelectItem key={deg} value={deg.toString()}>
                      {getDegreeLabel(deg)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="commission-filter">Tipo</Label>
              <Select value={commissionFilter} onValueChange={(value: any) => setCommissionFilter(value)}>
                <SelectTrigger id="commission-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="commission">Comissão</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
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
                  <TableHead className="w-[100px]">CIM</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('full_name')}
                      className="flex items-center font-semibold"
                    >
                      Nome
                      {getSortIcon('full_name')}
                    </Button>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('masonic_degree')}
                      className="flex items-center font-semibold"
                    >
                      Grau
                      {getSortIcon('masonic_degree')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('is_director_member')}
                      className="flex items-center font-semibold"
                    >
                      Tipo
                      {getSortIcon('is_director_member')}
                    </Button>
                  </TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum perfil encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-mono text-sm">{profile.cim || '-'}</TableCell>
                      <TableCell className="font-medium">{profile.full_name || '-'}</TableCell>
                      <TableCell className="text-sm">{profile.email || '-'}</TableCell>
                      <TableCell className="text-sm">{profile.position || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getDegreeLabel(profile.masonic_degree)}</Badge>
                      </TableCell>
                      <TableCell>
                        {profile.is_director_member ? (
                          <div className="flex items-center text-sm">
                            <Shield className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="text-blue-600">Comissão</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-sm">
                            <User className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Regular</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          profile.member_status === 'Ativo' ? 'default' :
                          profile.member_status === 'Adormecido' ? 'secondary' : 'outline'
                        }>
                          {profile.member_status || 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(profile)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
        ) : filteredAndSortedProfiles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum perfil encontrado
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedProfiles.map((profile) => (
            <Card key={profile.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    {profile.cim && (
                      <p className="text-xs font-mono text-muted-foreground mb-1">CIM: {profile.cim}</p>
                    )}
                    <h3 className="font-semibold text-lg">{profile.full_name || 'Nome não informado'}</h3>
                    <p className="text-sm text-muted-foreground">{profile.position || 'Cargo não informado'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(profile)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{getDegreeLabel(profile.masonic_degree)}</Badge>
                  {profile.is_director_member && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Comissão
                    </Badge>
                  )}
                </div>
                {profile.email && (
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="cim">CIM — Código de Identificação Maçônica</Label>
              <Input
                id="cim"
                {...register('cim')}
                placeholder="000000"
                maxLength={6}
                className="font-mono"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.value = el.value.replace(/\D/g, '').slice(0, 6);
                }}
              />
              {errors.cim && (
                <p className="text-sm text-destructive mt-1">{errors.cim.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">6 dígitos numéricos</p>
            </div>

            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Digite o nome completo"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="position">Cargo</Label>
              <Select
                value={watch('position') || undefined}
                onValueChange={(value) => setValue('position', value === 'none' ? '' : value)}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {masonicPositions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="commission">Comissão</Label>
              <Input
                id="commission"
                {...register('commission')}
                placeholder="Ex: Comissão de Educação, Comissão de Finanças, etc."
              />
            </div>

            {/* Situação do Irmão */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-base font-semibold">Situação do Irmão</Label>
              <Select
                value={watch('member_status') || 'Ativo'}
                onValueChange={(value) => setValue('member_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Adormecido">Adormecido</SelectItem>
                  <SelectItem value="Remido">Remido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="graduation">Graduação</Label>
              <Select
                value={watch('graduation') || 'Aprendiz'}
                onValueChange={(value) => setValue('graduation', value)}
              >
                <SelectTrigger id="graduation">
                  <SelectValue placeholder="Selecione a graduação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                  <SelectItem value="Companheiro">Companheiro</SelectItem>
                  <SelectItem value="Mestre">Mestre</SelectItem>
                  <SelectItem value="Mestre Instalado">Mestre Instalado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="masonic_degree">Grau Maçônico *</Label>
              <Select
                value={watch('masonic_degree')?.toString()}
                onValueChange={(value) => setValue('masonic_degree', parseInt(value))}
              >
                <SelectTrigger id="masonic_degree">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {degrees.map((deg) => (
                    <SelectItem key={deg} value={deg.toString()}>
                      {getDegreeLabel(deg)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.masonic_degree && (
                <p className="text-sm text-destructive mt-1">{errors.masonic_degree.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_director_member"
                checked={watch('is_director_member')}
                onCheckedChange={(checked) => setValue('is_director_member', checked)}
              />
              <Label htmlFor="is_director_member">Membro da Comissão</Label>
            </div>

            {/* Commemoration Dates Section */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="text-lg font-semibold mb-4">Datas Comemorativas</h3>
                
                {/* Existing Dates List */}
                {dates.length > 0 && (
                  <div className="space-y-1 mb-4">
                    {dates.map((date) => (
                      <div key={date.id} className={`flex items-center justify-between px-2 py-1 rounded ${editingDateId === date.id ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted'}`}>
                        <p className="text-sm flex-1">
                          <span className="text-muted-foreground">{date.date_type}:</span>
                          <span className="font-medium ml-1">{date.description}</span>
                          <span className="text-muted-foreground"> - </span>
                          {format(parseYMDToLocalNoon(date.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleEditCommemorationDate(date)}
                            aria-label={`Editar ${date.description}`}
                            disabled={editingDateId !== null}
                          >
                            <Pencil className="w-3 h-3 text-primary" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteCommemorationDate(date.id)}
                            aria-label={`Remover ${date.description}`}
                            disabled={editingDateId !== null}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/Edit Date Form */}
                <div className={`space-y-3 p-4 rounded-lg ${editingDateId ? 'bg-primary/5 border border-primary' : 'bg-muted/50'}`}>
                  <Label className="flex items-center gap-2">
                    {editingDateId ? (
                      <>
                        <Pencil className="w-4 h-4" />
                        Editar Data Comemorativa
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Adicionar Nova Data
                      </>
                    )}
                  </Label>
                  
                  <div>
                    <Label htmlFor="date_type">Tipo de Data *</Label>
                    <Select value={newDateType} onValueChange={handleDateTypeChange}>
                      <SelectTrigger id="date_type">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date_description">Descrição *</Label>
                    <Input
                      id="date_description"
                      value={newDateDescription}
                      onChange={(e) => setNewDateDescription(e.target.value)}
                      placeholder="Ex: Nome do aniversariante, etc"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date_value">Data *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="date_value"
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={newDateInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          const digits = value.replace(/\D/g, '');
                          let formatted = '';
                          if (digits.length > 0) {
                            formatted = digits.substring(0, 2);
                            if (digits.length > 2) {
                              formatted += '/' + digits.substring(2, 4);
                            }
                            if (digits.length > 4) {
                              formatted += '/' + digits.substring(4, 8);
                            }
                          }
                          setNewDateInput(formatted);

                          if (digits.length === 8) {
                            const day = parseInt(digits.substring(0, 2));
                            const month = parseInt(digits.substring(2, 4)) - 1;
                            const year = parseInt(digits.substring(4, 8));
                            const date = new Date(year, month, day, 12, 0, 0);
                            if (!isNaN(date.getTime())) {
                              setNewDateValue(date);
                            }
                          }
                        }}
                        maxLength={10}
                        className="flex-1"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newDateValue}
                            onSelect={(date) => {
                              if (date) {
                                const adjustedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                                setNewDateValue(adjustedDate);
                                setNewDateInput(format(adjustedDate, 'dd/MM/yyyy'));
                              } else {
                                setNewDateValue(undefined);
                              }
                            }}
                            locale={ptBR}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingDateId ? (
                      <>
                        <Button
                          type="button"
                          variant="default"
                          onClick={handleUpdateCommemorationDate}
                          disabled={!newDateType || !newDateDescription || !newDateValue}
                          className="flex-1"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelDateEdit}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddCommemorationDate}
                          disabled={!newDateType || !newDateDescription || !newDateValue}
                          className="flex-1"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Data
                        </Button>
                        {(newDateType || newDateDescription || newDateValue) && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelDateEdit}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionProfiles;
