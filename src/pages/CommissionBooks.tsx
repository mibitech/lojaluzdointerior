import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Edit, Trash2, BookOpen, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  recommendation: string | null;
  cover_image_url: string | null;
  isbn: string | null;
}

interface BookLoan {
  id: string;
  book_id: string;
  borrower_id: string;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  profiles: { full_name: string };
  books: { title: string };
}

interface Profile {
  id: string;
  full_name: string;
}

const CommissionBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openBookDialog, setOpenBookDialog] = useState(false);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    recommendation: '',
    isbn: '',
  });
  const [loanData, setLoanData] = useState({
    book_id: '',
    borrower_id: '',
    due_date: '',
  });

  useEffect(() => {
    fetchBooks();
    fetchLoans();
    fetchProfiles();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({ title: 'Erro ao carregar livros', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('book_loans')
        .select('*, profiles(full_name), books(title)')
        .order('loan_date', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(formData)
          .eq('id', editingBook.id);

        if (error) throw error;
        toast({ title: 'Livro atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('books')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Livro cadastrado com sucesso!' });
      }

      setOpenBookDialog(false);
      resetForm();
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      toast({ title: 'Erro ao salvar livro', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este livro?')) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Livro excluído com sucesso!' });
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({ title: 'Erro ao excluir livro', variant: 'destructive' });
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('book_loans')
        .insert([loanData]);

      if (error) throw error;
      toast({ title: 'Empréstimo registrado com sucesso!' });
      setOpenLoanDialog(false);
      resetLoanForm();
      fetchLoans();
    } catch (error) {
      console.error('Error saving loan:', error);
      toast({ title: 'Erro ao registrar empréstimo', variant: 'destructive' });
    }
  };

  const handleReturnBook = async (loanId: string) => {
    try {
      const { error } = await supabase
        .from('book_loans')
        .update({ return_date: new Date().toISOString().split('T')[0], status: 'returned' })
        .eq('id', loanId);

      if (error) throw error;
      toast({ title: 'Devolução registrada com sucesso!' });
      fetchLoans();
    } catch (error) {
      console.error('Error returning book:', error);
      toast({ title: 'Erro ao registrar devolução', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      recommendation: '',
      isbn: '',
    });
    setEditingBook(null);
  };

  const resetLoanForm = () => {
    setLoanData({
      book_id: '',
      borrower_id: '',
      due_date: '',
    });
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description || '',
      recommendation: book.recommendation || '',
      isbn: book.isbn || '',
    });
    setOpenBookDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Livros</h2>
          <p className="text-muted-foreground">
            Controle o acervo e empréstimos da biblioteca
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Dialog open={openLoanDialog} onOpenChange={setOpenLoanDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetLoanForm}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Empréstimo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Empréstimo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLoanSubmit} className="space-y-4">
                <div>
                  <Label>Livro</Label>
                  <Select value={loanData.book_id} onValueChange={(value) => setLoanData({ ...loanData, book_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o livro" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Irmão</Label>
                  <Select value={loanData.borrower_id} onValueChange={(value) => setLoanData({ ...loanData, borrower_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o irmão" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data de Devolução</Label>
                  <Input
                    type="date"
                    value={loanData.due_date}
                    onChange={(e) => setLoanData({ ...loanData, due_date: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Registrar Empréstimo</Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={openBookDialog} onOpenChange={setOpenBookDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Livro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingBook ? 'Editar Livro' : 'Novo Livro'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Autor</Label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>ISBN</Label>
                  <Input
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Recomendação</Label>
                  <Textarea
                    value={formData.recommendation}
                    onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingBook ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Table View - Books */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Livros Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.isbn}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(book)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View - Books */}
      <div className="md:hidden space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : books.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum livro cadastrado
            </CardContent>
          </Card>
        ) : (
          books.map((book) => (
            <Card key={book.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{book.title}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(book)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(book.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Autor:</span> {book.author}</p>
                  {book.isbn && <p><span className="font-medium">ISBN:</span> {book.isbn}</p>}
                  {book.description && (
                    <p className="text-muted-foreground mt-2">{book.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View - Loans */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Empréstimos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Livro</TableHead>
                <TableHead>Irmão</TableHead>
                <TableHead>Empréstimo</TableHead>
                <TableHead>Devolução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.books.title}</TableCell>
                  <TableCell>{loan.profiles.full_name}</TableCell>
                  <TableCell>{new Date(loan.loan_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    {loan.return_date 
                      ? new Date(loan.return_date).toLocaleDateString('pt-BR')
                      : new Date(loan.due_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {loan.status === 'active' ? 'Ativo' : loan.status === 'returned' ? 'Devolvido' : 'Atrasado'}
                  </TableCell>
                  <TableCell className="text-right">
                    {loan.status === 'active' && (
                      <Button size="sm" onClick={() => handleReturnBook(loan.id)}>
                        Devolver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View - Loans */}
      <div className="md:hidden space-y-4">
        {loans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum empréstimo ativo
            </CardContent>
          </Card>
        ) : (
          loans.map((loan) => (
            <Card key={loan.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{loan.books.title}</h3>
                    <p className="text-sm text-muted-foreground">{loan.profiles.full_name}</p>
                  </div>
                  {loan.status === 'active' && (
                    <Button size="sm" onClick={() => handleReturnBook(loan.id)}>
                      Devolver
                    </Button>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Empréstimo:</span> {new Date(loan.loan_date).toLocaleDateString('pt-BR')}</p>
                  <p>
                    <span className="font-medium">
                      {loan.return_date ? 'Devolvido em:' : 'Previsão:'}
                    </span>{' '}
                    {loan.return_date 
                      ? new Date(loan.return_date).toLocaleDateString('pt-BR')
                      : new Date(loan.due_date).toLocaleDateString('pt-BR')}
                  </p>
                  <Badge variant={loan.status === 'returned' ? 'secondary' : 'default'}>
                    {loan.status === 'active' ? 'Ativo' : loan.status === 'returned' ? 'Devolvido' : 'Atrasado'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommissionBooks;
