import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Briefcase, Camera, Calendar, Trash2, Plus, Pencil, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload, ImageItem } from '@/components/ImageUpload';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProfileData {
  id: string;
  cim: string;
  full_name: string;
  position: string;
  phone: string;
  email: string;
  photo_url: string;
  is_director_member: boolean;
  commission: string;
}

interface CommemorationDate {
  id: string;
  profile_id: string;
  date: string;
  date_type: string;
  description: string;
}

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

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profileImages, setProfileImages] = useState<ImageItem[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    cim: '',
    full_name: '',
    position: '',
    phone: '',
    email: '',
    photo_url: '',
    is_director_member: false,
    commission: ''
  });

  // Commemorative dates state
  const [commemorativeDates, setCommemorativeDates] = useState<CommemorationDate[]>([]);
  const [newDateType, setNewDateType] = useState<string>('');
  const [newDateDescription, setNewDateDescription] = useState('');
  const [newDateValue, setNewDateValue] = useState<Date | undefined>(undefined);
  const [newDateInput, setNewDateInput] = useState('');
  const [addingDate, setAddingDate] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  const parseYMDToLocalNoon = (ymd: string) => {
    // Avoid timezone shift when rendering dates stored as YYYY-MM-DD
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

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

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, cim, full_name, position, phone, email, photo_url, is_director_member, commission')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasProfile(true);
        setProfileData({
          id: data.id || '',
          cim: data.cim || '',
          full_name: data.full_name || '',
          position: data.position || '',
          phone: data.phone || '',
          email: data.email || '',
          photo_url: data.photo_url || '',
          is_director_member: data.is_director_member || false,
          commission: data.commission || ''
        });
        // Load existing photo if available
        if (data.photo_url) {
          setProfileImages([data.photo_url]);
        }
        // Load commemorative dates
        if (data.id) {
          loadCommemorativeDates(data.id);
        }
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setHasProfile(false);
      toast({
        variant: "destructive",
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar os dados do perfil."
      });
    }
  };

  const loadCommemorativeDates = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('commemorative_dates')
        .select('*')
        .eq('profile_id', profileId)
        .order('date', { ascending: true });

      if (error) throw error;
      setCommemorativeDates(data || []);
    } catch (error) {
      console.error('Erro ao carregar datas comemorativas:', error);
    }
  };

  const handleAddCommemorativeDate = async () => {
    if (!newDateType || !newDateDescription || !newDateValue || !profileData.id) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos da data comemorativa."
      });
      return;
    }

    setAddingDate(true);
    try {
      const { error } = await supabase
        .from('commemorative_dates')
        .insert({
          profile_id: profileData.id,
          date_type: newDateType,
          description: newDateDescription,
          date: format(newDateValue, 'yyyy-MM-dd')
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Data comemorativa adicionada."
      });

      // Reset form
      setNewDateType('');
      setNewDateDescription('');
      setNewDateValue(undefined);
      setNewDateInput('');

      // Reload dates
      loadCommemorativeDates(profileData.id);
    } catch (error) {
      console.error('Erro ao adicionar data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao adicionar data comemorativa."
      });
    } finally {
      setAddingDate(false);
    }
  };

  const handleDeleteCommemorativeDate = async (dateId: string) => {
    try {
      const { error } = await supabase
        .from('commemorative_dates')
        .delete()
        .eq('id', dateId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Data comemorativa removida."
      });

      loadCommemorativeDates(profileData.id);
    } catch (error) {
      console.error('Erro ao remover data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao remover data comemorativa."
      });
    }
  };

  const handleEditCommemorativeDate = (date: CommemorationDate) => {
    setEditingDateId(date.id);
    setNewDateType(date.date_type);
    setNewDateDescription(date.description);
    // Parse date and set to noon to avoid timezone issues
    const [year, month, day] = date.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    setNewDateValue(dateObj);
    setNewDateInput(format(dateObj, 'dd/MM/yyyy'));
  };

  const handleUpdateCommemorativeDate = async () => {
    if (!editingDateId || !newDateType || !newDateDescription || !newDateValue) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos da data comemorativa."
      });
      return;
    }

    setAddingDate(true);
    try {
      const { error } = await supabase
        .from('commemorative_dates')
        .update({
          date_type: newDateType,
          description: newDateDescription,
          date: format(newDateValue, 'yyyy-MM-dd')
        })
        .eq('id', editingDateId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Data comemorativa atualizada."
      });

      // Reset form
      handleCancelEdit();

      // Reload dates
      loadCommemorativeDates(profileData.id);
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar data comemorativa."
      });
    } finally {
      setAddingDate(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingDateId(null);
    setNewDateType('');
    setNewDateDescription('');
    setNewDateValue(undefined);
    setNewDateInput('');
  };

  const handleDateTypeChange = (value: string) => {
    setNewDateType(value);
    setNewDateDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = profileData.photo_url;

      // Upload new photo if a File is selected
      if (profileImages.length > 0 && profileImages[0] instanceof File) {
        const file = profileImages[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        // Delete old photo if exists
        if (profileData.photo_url) {
          const oldPath = profileData.photo_url.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('profiles')
              .remove([`${user.id}/${oldPath}`]);
          }
        }

        // Upload new photo
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          position: profileData.position,
          phone: profileData.phone,
          email: profileData.email,
          photo_url: photoUrl
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfileData({ ...profileData, photo_url: photoUrl });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: "Não foi possível atualizar suas informações."
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasProfile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Acesso apenas para membros autorizados.
          </p>
        </div>
      </div>
    );
  }

  const getAvatarUrl = () => {
    if (profileImages.length > 0) {
      if (profileImages[0] instanceof File) {
        return URL.createObjectURL(profileImages[0]);
      }
      return profileImages[0];
    }
    return profileData.photo_url;
  };

  const getInitials = () => {
    const names = profileData.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return profileData.full_name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>

          <Card className="overflow-hidden shadow-elegant">
            {/* Profile Header with Photo */}
            <div className="relative h-32 bg-gradient-primary">
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-glow">
                    <AvatarImage src={getAvatarUrl()} alt={profileData.full_name} />
                    <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-2 right-2 bg-background rounded-full p-1.5 shadow-soft cursor-pointer hover:bg-accent transition-colors">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <CardContent className="pt-20 pb-8 px-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Name and Position Section */}
                <div className="text-center space-y-1 pb-6 border-b border-border">
                  <h2 className="text-2xl font-bold text-foreground">
                    {profileData.full_name || 'Nome do Irmão'}
                  </h2>
                  {profileData.position && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {profileData.position}
                    </p>
                  )}
                </div>

                {/* Information Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="cim" className="text-base font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      CIM — Código de Identificação Maçônica
                    </Label>
                    <Input
                      id="cim"
                      value={profileData.cim || '—'}
                      disabled
                      className="h-11 font-mono text-lg tracking-widest opacity-70 cursor-not-allowed max-w-[160px]"
                    />
                    <p className="text-xs text-muted-foreground">Atribuído pela Secretaria da Loja</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="full_name" className="text-base font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nome Completo
                    </Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      required
                      className="h-11"
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="position" className="text-base font-semibold flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Cargo
                    </Label>
                    <Select
                      value={profileData.position || 'none'}
                      onValueChange={(value) => setProfileData({ ...profileData, position: value === 'none' ? '' : value })}
                      disabled
                    >
                      <SelectTrigger id="position" className="h-11 opacity-60 cursor-not-allowed">
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

                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telefone de Contato
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="h-11"
                    />
                  </div>

                   <div className="space-y-3">
                    <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email de Contato
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="seuemail@exemplo.com"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Commission Information - Read Only */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground">Informações da Comissão</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-muted-foreground">
                        Membro da Comissão
                      </Label>
                      <div className="h-11 px-3 py-2 bg-muted/50 rounded-md border border-border flex items-center">
                        <span className="text-foreground">
                          {profileData.is_director_member ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>

                    {profileData.is_director_member && profileData.commission && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-muted-foreground">
                          Comissão
                        </Label>
                        <div className="h-11 px-3 py-2 bg-muted/50 rounded-md border border-border flex items-center">
                          <span className="text-foreground">
                            {profileData.commission}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Commemorative Dates Section */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Datas Comemorativas
                  </h3>

                  {/* Existing Dates List */}
                  {commemorativeDates.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {commemorativeDates.map((date) => (
                        <div key={date.id} className={`flex items-center justify-between px-3 py-2 rounded-md ${editingDateId === date.id ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/50'}`}>
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
                              className="h-8 w-8"
                              onClick={() => handleEditCommemorativeDate(date)}
                              aria-label={`Editar ${date.description}`}
                              disabled={editingDateId !== null}
                            >
                              <Pencil className="w-4 h-4 text-primary" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteCommemorativeDate(date.id)}
                              aria-label={`Remover ${date.description}`}
                              disabled={editingDateId !== null}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add/Edit Date Form */}
                  <div className={`space-y-4 p-4 rounded-lg border ${editingDateId ? 'bg-primary/5 border-primary' : 'bg-muted/30 border-border'}`}>
                    <Label className="text-base font-medium flex items-center gap-2">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
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

                      <div className="space-y-2">
                        <Label htmlFor="date_description">Descrição *</Label>
                        <Input
                          id="date_description"
                          value={newDateDescription}
                          onChange={(e) => setNewDateDescription(e.target.value)}
                          placeholder="Ex: Nome do aniversariante, etc"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
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
                              className="h-10 w-10"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                              mode="single"
                              selected={newDateValue}
                              onSelect={(date) => {
                                if (date) {
                                  // Set to noon to avoid timezone issues
                                  const adjustedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                                  setNewDateValue(adjustedDate);
                                  setNewDateInput(format(adjustedDate, 'dd/MM/yyyy'));
                                } else {
                                  setNewDateValue(undefined);
                                }
                              }}
                              locale={ptBR}
                              initialFocus
                              className="pointer-events-auto"
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
                            onClick={handleUpdateCommemorativeDate}
                            disabled={addingDate || !newDateType || !newDateDescription || !newDateValue}
                            className="w-full md:w-auto"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            {addingDate ? 'Salvando...' : 'Salvar Alterações'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="w-full md:w-auto"
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
                            onClick={handleAddCommemorativeDate}
                            disabled={addingDate || !newDateType || !newDateDescription || !newDateValue}
                            className="w-full md:w-auto"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {addingDate ? 'Adicionando...' : 'Adicionar Data'}
                          </Button>
                          {(newDateType || newDateDescription || newDateValue) && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="w-full md:w-auto"
                            >
                              Cancelar
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div className="space-y-3 pt-6 border-t border-border">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Foto do Perfil
                  </Label>
                  <ImageUpload
                    images={profileImages}
                    onImagesChange={setProfileImages}
                    maxImages={1}
                    maxSizeMB={5}
                    accept="image/png,image/jpeg,image/jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: imagem quadrada de pelo menos 400x400px
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-6 border-t border-border">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-11 px-8 shadow-soft"
                    size="lg"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Profile;
