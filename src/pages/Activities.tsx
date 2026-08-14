import { parseDateSafe } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Users, Heart, Award, BookOpen, Eye, Share2, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import charityImage from '@/assets/charity-work.jpg';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface ActivityImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  image_url: string;
  results: string;
  partnerships: string;
  event_date: string;
  is_featured: boolean;
  is_public: boolean;
  created_at: string;
  images?: ActivityImage[];
}

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { user } = useAuth();

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast({
      title: 'Link copiado!',
      description: 'O link da imagem foi copiado para a área de transferência.',
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const categoryLabels = {
    all: 'Todas',
    social: 'Ações Sociais',
    philanthropic: 'Filantropia',
    public_event: 'Eventos Públicos',
    cultural: 'Cultura',
    educational: 'Educação'
  };

  const categoryIcons = {
    social: Heart,
    philanthropic: Users,
    public_event: Calendar,
    cultural: Award,
    educational: BookOpen
  };

  useEffect(() => {
    // Remove scroll lock if it exists
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false });

        // If user is not authenticated, only show public activities
        if (!user) {
          query = query.eq('is_public', true);
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
          query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching activities:', error);
          setActivities([]);
        } else {
          // Fetch images for each activity
          const activitiesWithImages = await Promise.all(
            (data || []).map(async (activity) => {
              const { data: images } = await supabase
                .from('activity_images')
                .select('*')
                .eq('activity_id', activity.id)
                .order('display_order', { ascending: true });
              
              return { ...activity, images: images || [] };
            })
          );
          setActivities(activitiesWithImages);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-header text-header-foreground">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Atividades e Projetos
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Nosso compromisso com a sociedade através de ações concretas
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const isActive = selectedCategory === key;
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className="transition-smooth"
              >
                {label}
              </Button>
            );
          })}
        </div>

        {/* Activities Grid */}
        {activities.length === 0 ? (
          <div className="text-center py-16">
            <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Nenhuma atividade encontrada
            </h3>
            <p className="text-muted-foreground">
              Não há atividades na categoria selecionada.
            </p>
          </div>
        ) : (
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
            {activities.map((activity) => {
              const CategoryIcon = categoryIcons[activity.category as keyof typeof categoryIcons];
              
              return (
                <CarouselItem key={activity.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Card 
                  className={`shadow-soft hover:shadow-elegant transition-smooth h-full ${
                    activity.is_featured ? 'ring-2 ring-masonic-gold/50' : ''
                  }`}
                >
                  <div className="relative">
                    {activity.images && activity.images.length > 0 ? (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {activity.images.map((img) => (
                            <CarouselItem key={img.id}>
                              <div className="w-full h-64 overflow-hidden rounded-t-lg bg-muted/30">
                                <img
                                  src={img.image_url}
                                  alt={activity.title}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {activity.images.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                          </>
                        )}
                      </Carousel>
                    ) : (
                      <div className="w-full h-64 overflow-hidden rounded-t-lg bg-muted/30">
                        <img
                          src={activity.image_url || charityImage}
                          alt={activity.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {activity.is_featured && (
                      <Badge className="absolute top-3 right-3 bg-masonic-gold text-masonic-navy z-10">
                        Destaque
                      </Badge>
                    )}
                    {activity.is_public && (activity.images?.[0]?.image_url || activity.image_url) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-3 left-3 z-10"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Compartilhar Imagem</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={activity.images?.[0]?.image_url || activity.image_url || ''}
                                readOnly
                                className="flex-1 p-2 border rounded text-sm"
                              />
                              <Button
                                size="icon"
                                onClick={() => copyImageUrl(activity.images?.[0]?.image_url || activity.image_url || '')}
                              >
                                {copiedUrl === (activity.images?.[0]?.image_url || activity.image_url) ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <img
                              src={activity.images?.[0]?.image_url || activity.image_url || ''}
                              alt={activity.title}
                              className="w-full rounded-lg"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-primary pr-2">
                        {activity.title}
                      </CardTitle>
                      {CategoryIcon && (
                        <CategoryIcon className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {categoryLabels[activity.category as keyof typeof categoryLabels]}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {activity.description}
                    </p>
                    
                    {activity.event_date && (
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(parseDateSafe(activity.event_date), "dd 'de' MMMM 'de' yyyy", { 
                          locale: ptBR 
                        })}
                      </div>
                    )}
                    
                    {activity.partnerships && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-primary mb-2">Parcerias:</h4>
                        <p className="text-sm text-muted-foreground">
                          {activity.partnerships}
                        </p>
                      </div>
                    )}
                    
                    {activity.results && (
                      <div className="bg-accent/50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-primary mb-1">Resultados:</h4>
                        <p className="text-sm text-muted-foreground">
                          {activity.results}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </CarouselItem>
              );
            })}
            </CarouselContent>
            {activities.length > 1 && (
              <>
                <CarouselPrevious className="-left-4 md:-left-6" />
                <CarouselNext className="-right-4 md:-right-6" />
              </>
            )}
          </Carousel>
        )}
      </div>
    </div>
  );
};

export default Activities;