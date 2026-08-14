import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, AlertCircle } from 'lucide-react';

const PendingApproval: React.FC = () => {
  const { user, isMember, isCommissionMember, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is not logged in or already has roles
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (isMember || isCommissionMember) {
        navigate('/');
      }
    }
  }, [user, isMember, isCommissionMember, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Show nothing while checking auth status
  if (loading || !user || isMember || isCommissionMember) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Aguardando Aprovação</CardTitle>
          <CardDescription>
            Sua conta foi criada com sucesso
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Acesso Pendente</p>
                <p className="text-sm text-muted-foreground">
                  Sua conta está aguardando aprovação pela administração da Loja. 
                  Você receberá um email quando suas permissões forem ativadas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Email Cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Enquanto isso, você pode sair e retornar mais tarde.
            </p>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
