import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Book, Calendar, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Members: React.FC = () => {
  const { user, isMember } = useAuth();

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              {user ? 'Acesso apenas para membros autorizados.' : 'Faça login para acessar esta área.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { href: '/members/documents', label: 'Documentos Internos', icon: FileText, description: 'Atas, circulares e documentos oficiais' },
    { href: '/members/agenda', label: 'Agenda Reservada', icon: Calendar, description: 'Sessões e eventos internos' },
    { href: '/members/messages', label: 'Mensagens', icon: Users, description: 'Comunicação entre irmãos' },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="py-20 px-4 text-center bg-header text-header-foreground">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Área dos Irmãos</h1>
          <p className="text-xl opacity-90">Bem-vindo, Ir.'. {user.email?.split('@')[0]}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="shadow-soft hover:shadow-elegant transition-smooth h-full">
                <CardHeader className="text-center">
                  <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Members;