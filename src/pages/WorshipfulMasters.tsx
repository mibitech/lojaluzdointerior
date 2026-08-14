import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Calendar, Trophy, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import venerableMasterPortrait from '@/assets/venerable-master-portrait.jpg';

interface WorshipfulMaster {
  id: string;
  name: string;
  photo_url?: string;
  installation_year: number;
  term_start_date?: string;
  term_end_date?: string;
  bio?: string;
  achievements?: string;
  is_active: boolean;
  sort_order: number;
}

export default function WorshipfulMasters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [masters, setMasters] = useState<WorshipfulMaster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetchWorshipfulMasters();
  }, [user]);

  const fetchWorshipfulMasters = async () => {
    try {
      const { data, error } = await supabase
        .from('worshipful_masters')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      setMasters(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar o quadro de veneráveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(word => word.length > 2) // Skip small words like "da", "de", etc.
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const formatDateRange = (startDate?: string, endDate?: string, year?: number) => {
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`;
    }
    return year ? `${year}` : '';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <User className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Acesso restrito. Faça login para visualizar o conteúdo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentMaster = masters.find(master => master.is_active);
  const pastMasters = masters.filter(master => !master.is_active);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Quadro de Veneráveis
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça os Veneráveis Mestres que conduziram nossa loja ao longo dos anos, 
            preservando e transmitindo a sabedoria maçônica.
          </p>
        </div>

        {/* Current Master */}
        {currentMaster && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Trophy className="h-6 w-6 text-primary mr-2" />
              Venerável Mestre Atual
            </h2>
            <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                  <div className="flex-shrink-0">
                    <Avatar className="h-32 w-32 border-4 border-primary/20">
                      <AvatarImage src={currentMaster.photo_url?.startsWith('/src/') ? venerableMasterPortrait : currentMaster.photo_url} alt={currentMaster.name} />
                      <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                        {getInitials(currentMaster.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <h3 className="text-2xl font-bold text-foreground mb-2 lg:mb-0">
                        {currentMaster.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          <Crown className="h-3 w-3 mr-1" />
                          Venerável Atual
                        </Badge>
                        <Badge variant="outline" className="border-primary text-primary">
                          <Calendar className="h-3 w-3 mr-1" />
                          {currentMaster.installation_year}
                        </Badge>
                      </div>
                    </div>
                    {currentMaster.bio && (
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {currentMaster.bio}
                      </p>
                    )}
                    {currentMaster.achievements && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-primary mb-2">
                          Principais Realizações
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {currentMaster.achievements}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Past Masters */}
        {pastMasters.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Calendar className="h-6 w-6 text-primary mr-2" />
              Ex-Veneráveis Mestres
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastMasters.map((master) => (
                <Card key={master.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 border-2 border-muted group-hover:border-primary/30 transition-colors">
                        <AvatarImage src={master.photo_url?.startsWith('/src/') ? venerableMasterPortrait : master.photo_url} alt={master.name} />
                        <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {getInitials(master.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                          {master.name}
                        </CardTitle>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                          <span className="text-sm text-muted-foreground">
                            {formatDateRange(master.term_start_date, master.term_end_date, master.installation_year)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {master.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {master.bio}
                      </p>
                    )}
                    {master.achievements && (
                      <div className="bg-muted/30 rounded-md p-3">
                        <h4 className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">
                          Realizações
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {master.achievements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {masters.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum Venerável Cadastrado</h3>
              <p className="text-muted-foreground">
                O quadro de veneráveis ainda não foi preenchido.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}