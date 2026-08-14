import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

const Contact: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock submission until Supabase types are regenerated
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Mensagem enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-header text-header-foreground">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Entre em Contato
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Estamos sempre prontos para esclarecer dúvidas e fornecer informações
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center">
                <Send className="w-6 h-6 mr-2" />
                Envie uma Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Assunto da sua mensagem"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Escreva sua mensagem aqui..."
                    rows={6}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Mensagem
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-muted-foreground">contato@loja-exemplo.org.br</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Telefone</p>
                    <p className="text-muted-foreground">(11) 99999-9999</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Endereço</p>
                    <p className="text-muted-foreground">
                      Rua Exemplo, 123<br />
                      Centro - São Paulo/SP<br />
                      CEP: 01000-000
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Horários de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segunda a Sexta</span>
                  <span className="font-medium">19:00 - 22:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sábados</span>
                  <span className="font-medium">14:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domingos</span>
                  <span className="font-medium">Fechado</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft bg-accent/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-primary mb-3">
                  Interessado em se Tornar um Maçom?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Para ingressar na Maçonaria, é necessário ser apresentado por um maçom ativo. 
                  Entre em contato conosco para mais informações sobre o processo.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Ser maior de 21 anos</p>
                  <p>• Ter boa reputação moral</p>
                  <p>• Acreditar em um Ser Supremo</p>
                  <p>• Ter meios de subsistência lícitos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;