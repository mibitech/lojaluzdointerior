import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Users, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CopoDaguaEvent {
  id: string;
  month: string;
  event_date: string;
  day_of_week: string;
  session_type: string;
  session_degree: string | null;
  study_time: string | null;
  start_time: string;
  water_glass_group: string;
}

const MemberAgenda: React.FC = () => {
  const { user, isMember } = useAuth();
  const [events, setEvents] = useState<CopoDaguaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMember) {
      loadCurrentMonthEvents();
    }
  }, [isMember]);

  const loadCurrentMonthEvents = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data, error } = await supabase
        .from("copo_dagua_calendar")
        .select("*")
        .gte("event_date", format(monthStart, "yyyy-MM-dd"))
        .lte("event_date", format(monthEnd, "yyyy-MM-dd"))
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            {user ? 'Acesso apenas para membros autorizados.' : 'Faça login para acessar esta área.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Agenda - Copo D'água</h1>
          <p className="text-muted-foreground">
            Eventos de {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-4 md:p-6">
              <p className="text-center text-muted-foreground">Carregando eventos...</p>
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-4 md:p-6 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento programado</h3>
              <p className="text-muted-foreground">Não há eventos para este mês.</p>
            </CardContent>
          </Card>
        ) : (
          <Carousel className="w-full px-10 md:px-0">
            <CarouselContent>
              {events.map((event) => (
                <CarouselItem key={event.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="shadow-soft hover:shadow-elegant transition-smooth h-full">
                    <CardContent className="p-4 md:p-6 space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-lg font-semibold">
                            {format(parse(event.event_date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">{event.day_of_week}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tipo de Sessão</p>
                          <p className="font-medium">{event.session_type}</p>
                        </div>
                      </div>
                      
                      {event.session_degree && (
                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Grau</p>
                            <p className="font-medium">{event.session_degree}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Horário</p>
                          <p className="font-medium">{event.start_time}</p>
                        </div>
                      </div>
                      
                      {event.study_time && (
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Tempo de Estudos</p>
                            <p className="font-medium">{event.study_time}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Grupo Sorteio</p>
                          <p className="font-medium">{event.water_glass_group}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 md:-left-12" />
            <CarouselNext className="right-0 md:-right-12" />
          </Carousel>
        )}
      </div>
    </div>
  );
};

export default MemberAgenda;