import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Phone, Mail, Globe, MapPin, Crown } from 'lucide-react';

interface LodgeInfo {
  id: string;
  name: string;
  description: string;
  mission: string;
  vision: string;
  values: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
}

interface Officer {
  id: string;
  name: string;
  position: string;
  bio: string;
  photo_url: string;
  sort_order: number;
}

interface WorshipfulMaster {
  id: string;
  name: string;
  photo_url: string;
  installation_year: number;
  term_start_date: string;
  term_end_date?: string;
  bio?: string;
  achievements?: string;
  is_active: boolean;
  sort_order: number;
}

const About: React.FC = () => {
  const [lodgeInfo, setLodgeInfo] = useState<LodgeInfo | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [worshipfulMasters, setWorshipfulMasters] = useState<WorshipfulMaster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lodge info
        const { data: lodge } = await supabase
          .from('lodge_info')
          .select('*')
          .single();

        // Fetch officers
        const { data: officersData } = await supabase
          .from('officers')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        // Fetch worshipful masters
        const { data: mastersData } = await supabase
          .from('worshipful_masters')
          .select('*')
          .order('sort_order');

        setLodgeInfo(lodge);
        setOfficers(officersData || []);
        setWorshipfulMasters(mastersData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden bg-white shadow-elegant flex items-center justify-center mb-6">
              <img
                src={lodgeInfo?.logo_url || "/lovable-uploads/555a306b-3510-4fe9-a1f9-b5df542462af.png"}
                alt="Logo da Loja Maçônica"
                className="w-44 h-44 md:w-52 md:h-52 object-contain rounded-full"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-center">
              {lodgeInfo?.name || "Augusta e Respeitável Loja Simbólica Luz do Interior"}
            </h1>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Description */}
        {lodgeInfo?.description && (
          <section className="mb-16">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Nossa História</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {lodgeInfo.description}
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Mission, Vision, Values */}
        <section className="grid md:grid-cols-3 gap-8 mb-16">
          {lodgeInfo?.mission && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Missão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{lodgeInfo.mission}</p>
              </CardContent>
            </Card>
          )}
          
          {lodgeInfo?.vision && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Visão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{lodgeInfo.vision}</p>
              </CardContent>
            </Card>
          )}
          
          {lodgeInfo?.values && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{lodgeInfo.values}</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Worshipful Masters Hall */}
        {worshipfulMasters.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center flex items-center justify-center gap-2">
              <Crown className="w-8 h-8" />
              Hall dos Veneráveis Mestres
            </h2>
            
            {/* Active Master Highlight */}
            {worshipfulMasters.find(m => m.is_active) && (
              <Card className="shadow-elegant mb-12 bg-header text-header-foreground">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div className="flex-shrink-0">
                      <Avatar className="w-40 h-40 border-4 border-header-foreground shadow-glow">
                        <AvatarImage 
                          src={worshipfulMasters.find(m => m.is_active)?.photo_url} 
                          alt={worshipfulMasters.find(m => m.is_active)?.name}
                        />
                        <AvatarFallback className="text-4xl bg-background text-foreground">
                          {worshipfulMasters.find(m => m.is_active)?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="max-w-2xl">
                      <Badge variant="secondary" className="mb-3 text-lg px-4 py-1">
                        Venerável Mestre Atual
                      </Badge>
                      <h3 className="text-3xl font-bold mb-2">
                        {worshipfulMasters.find(m => m.is_active)?.name}
                      </h3>
                      <p className="text-xl mb-4 opacity-90">
                        Ano: {worshipfulMasters.find(m => m.is_active)?.installation_year}
                      </p>
                      {worshipfulMasters.find(m => m.is_active)?.bio && (
                        <p className="text-base opacity-90 mb-3">
                          {worshipfulMasters.find(m => m.is_active)?.bio}
                        </p>
                      )}
                      {worshipfulMasters.find(m => m.is_active)?.achievements && (
                        <p className="text-sm opacity-80">
                          <strong>Realizações:</strong> {worshipfulMasters.find(m => m.is_active)?.achievements}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Masters Carousel */}
            <div className="px-12">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {worshipfulMasters.map((master) => (
                    <CarouselItem key={master.id} className="md:basis-1/2 lg:basis-1/3">
                      <Card className={`h-full shadow-soft hover:shadow-elegant transition-smooth ${master.is_active ? 'border-2 border-primary' : ''}`}>
                        <CardContent className="p-6 text-center h-full flex flex-col items-center">
                          <Avatar className="w-32 h-32 mx-auto mb-4 border-2 border-border flex-shrink-0">
                            <AvatarImage 
                              src={master.photo_url} 
                              alt={master.name}
                            />
                            <AvatarFallback className="text-2xl">
                              {master.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="text-xl font-semibold text-primary mb-2">
                            {master.name}
                          </h3>
                          <Badge variant={master.is_active ? "default" : "secondary"} className="mb-2">
                            {master.installation_year}
                          </Badge>
                          {master.bio && (
                            <p className="text-sm text-muted-foreground mt-3 flex-grow">
                              {master.bio}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </section>
        )}

        {/* Officers */}
        {officers.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">
              Oficiais da Loja
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {officers.map((officer) => (
                <Card key={officer.id} className="shadow-soft hover:shadow-elegant transition-smooth">
                  <CardContent className="p-6 text-center">
                    {officer.photo_url && (
                      <img
                        src={officer.photo_url}
                        alt={officer.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                      />
                    )}
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      {officer.name}
                    </h3>
                    <Badge variant="secondary" className="mb-3">
                      {officer.position}
                    </Badge>
                    {officer.bio && (
                      <p className="text-sm text-muted-foreground">
                        {officer.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default About;