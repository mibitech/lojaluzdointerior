import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FileText } from 'lucide-react';

const MemberDocuments: React.FC = () => {
  const { user, isMember } = useAuth();

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
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Documentos Internos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Documentos em desenvolvimento...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberDocuments;