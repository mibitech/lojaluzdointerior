import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: 'Erro ao enviar e-mail',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSent(true);
      }
    } catch {
      toast({
        title: 'Erro inesperado',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Recuperar Senha</CardTitle>
          <CardDescription>
            {sent
              ? 'Verifique sua caixa de entrada'
              : 'Informe seu e-mail para receber o link de redefinição'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de redefinição de senha para{' '}
                <strong>{email}</strong>. Verifique também a pasta de spam.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar link de redefinição
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link to="/auth">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
