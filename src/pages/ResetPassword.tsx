import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
      }
    });

    // Verificar se já há sessão de recovery ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsRecoverySession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast({
        title: 'Senhas não coincidem',
        description: 'Confirme a nova senha corretamente.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast({
          title: 'Erro ao redefinir senha',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Senha redefinida com sucesso',
          description: 'Faça login com a nova senha.',
        });
        await supabase.auth.signOut();
        navigate('/auth');
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

  if (!isRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">
              Link inválido ou expirado. Solicite um novo link de redefinição.
            </p>
            <Button className="w-full bg-gradient-primary" onClick={() => navigate('/forgot-password')}>
              Solicitar novo link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Nova Senha</CardTitle>
          <CardDescription>Escolha uma senha segura para sua conta</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirm">Confirmar nova senha</Label>
              <Input
                id="password-confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redefinir senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
