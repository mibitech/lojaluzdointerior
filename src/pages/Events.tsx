import React, { useEffect, useState } from 'react';
import { parseDateSafe } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, MapPin, Clock, Users, Share2, Copy, Check } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface EventImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
  is_public: boolean;
  created_at: string;
  images?: EventImage[];
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    // Remove scroll lock if it exists
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });

        // If user is not authenticated, only show public events
        if (!user) {
          query = query.eq('is_public', true);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching events:', error);
          setEvents([]);
        } else {
          // Fetch images for each event
          const eventsWithImages = await Promise.all(
            (data || []).map(async (event) => {
              const { data: images } = await supabase
                .from('event_images')
                .select('*')
                .eq('event_id', event.id)
                .order('display_order', { ascending: true});
              
              return { ...event, images: images || [] };
            })
          );
          setEvents(eventsWithImages);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const getEventStatus = (eventDate: string) => {
    const now = new Date();
    const date = new Date(eventDate);
    
    if (isBefore(date, now)) {
      return { status: 'past', label: 'Realizado', variant: 'secondary' as const };
    } else if (isAfter(date, now)) {
      return { status: 'upcoming', label: 'Próximo', variant: 'default' as const };
    } else {
      return { status: 'today', label: 'Hoje', variant: 'destructive' as const };
    }
  };

  const upcomingEvents = events.filter(event => 
    isAfter(parseDateSafe(event.event_date), new Date())
  );
  
  const pastEvents = events.filter(event => 
    isBefore(parseDateSafe(event.event_date), new Date())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const eventStatus = getEventStatus(event.event_date);
    
    return (
      <Card className="shadow-soft hover:shadow-elegant transition-smooth h-full flex flex-col">
        <div className="relative">
        {event.images && event.images.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {event.images.map((img) => (
                  <CarouselItem key={img.id}>
                    <div className="w-full h-64 overflow-hidden rounded-t-lg bg-muted/30">
                      <img
                        src={img.image_url}
                        alt={event.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {event.images.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          ) : event.image_url ? (
            <div className="w-full h-64 overflow-hidden rounded-t-lg bg-muted/30">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-64 bg-muted/30 rounded-t-lg" />
          )}
          
          {event.is_public && (event.images?.[0]?.image_url || event.image_url) && (
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
                      value={event.images?.[0]?.image_url || event.image_url || ''}
                      readOnly
                      className="flex-1 p-2 border rounded text-sm"
                    />
                    <Button
                      size="icon"
                      onClick={() => copyImageUrl(event.images?.[0]?.image_url || event.image_url || '')}
                    >
                      {copiedUrl === (event.images?.[0]?.image_url || event.image_url) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <img
                    src={event.images?.[0]?.image_url || event.image_url || ''}
                    alt={event.title}
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
              {event.title}
            </CardTitle>
            <Badge variant={eventStatus.variant}>
              {eventStatus.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col">
          {event.description && (
            <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
              {event.description}
            </p>
          )}
          {!event.description && <div className="flex-grow" />}
          
          <div className="space-y-2 mt-auto">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              {format(parseDateSafe(event.event_date), "EEEE, dd 'de' MMMM 'de' yyyy", { 
                locale: ptBR 
              })}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2 text-primary" />
              {format(parseDateSafe(event.event_date), "HH:mm", { locale: ptBR })}
            </div>
            
            {event.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                {event.location}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-header text-header-foreground">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Eventos e Calendário
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Acompanhe nossas atividades e participe dos eventos abertos ao público
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 flex items-center">
              <Calendar className="w-8 h-8 mr-3" />
              Próximos Eventos
            </h2>
            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {upcomingEvents.map((event) => (
                  <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <EventCard event={event} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {upcomingEvents.length > 1 && (
                <>
                  <CarouselPrevious className="-left-4 md:-left-6" />
                  <CarouselNext className="-right-4 md:-right-6" />
                </>
              )}
            </Carousel>
          </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-primary mb-8 flex items-center">
              <Users className="w-8 h-8 mr-3" />
              Eventos Realizados
            </h2>
            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {pastEvents.map((event) => (
                  <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <EventCard event={event} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {pastEvents.length > 1 && (
                <>
                  <CarouselPrevious className="-left-4 md:-left-6" />
                  <CarouselNext className="-right-4 md:-right-6" />
                </>
              )}
            </Carousel>
          </section>
        )}

        {/* No Events */}
        {events.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-muted-foreground">
              Novos eventos serão divulgados em breve.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;