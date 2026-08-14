import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Book, HelpCircle, BookOpen, Search, Archive, Download, Share2, User, Calendar } from 'lucide-react';
import educationImage from '@/assets/education.jpg';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  recommendation: string | null;
  isbn: string | null;
}

interface BookLoan {
  id: string;
  book_id: string;
  due_date: string;
  status: string;
  profiles: { full_name: string };
}

interface Article {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  profiles: { full_name: string };
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string | null;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

const Education: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [faq, setFaq] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('introduction');

  const categoryLabels = {
    introduction: 'Livros',
    articles: 'Artigos',
    glossary: 'Glossário',
    faq: 'FAQ',
    reading: 'Arquivo Morto'
  };

  const categoryIcons = {
    introduction: BookOpen,
    articles: Book,
    glossary: Search,
    faq: HelpCircle,
    reading: Archive
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBooks(),
        fetchArticles(),
        fetchGlossary(),
        fetchFAQ()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('title');

      if (booksError) throw booksError;

      const { data: loansData, error: loansError } = await supabase
        .from('book_loans')
        .select('*, profiles(full_name)')
        .eq('status', 'active');

      if (loansError) throw loansError;

      setBooks(booksData || []);
      setLoans(loansData || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchGlossary = async () => {
    try {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .order('term');

      if (error) throw error;
      setGlossary(data || []);
    } catch (error) {
      console.error('Error fetching glossary:', error);
    }
  };

  const fetchFAQ = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setFaq(data || []);
    } catch (error) {
      console.error('Error fetching FAQ:', error);
    }
  };

  const getLoanForBook = (bookId: string) => {
    return loans.find(loan => loan.book_id === bookId);
  };

  const handleShare = async (title: string, type: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Confira ${type}: ${title}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copiado!' });
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: 'Erro ao baixar arquivo', variant: 'destructive' });
    }
  };

  const filterData = (data: any[], fields: string[]) => {
    if (!searchTerm) return data;
    return data.filter(item =>
      fields.some(field =>
        item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

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
      <section className="relative py-20 px-4 text-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${educationImage})` }}
        >
          <div className="absolute inset-0 bg-header/90"></div>
        </div>
        <div className="relative container mx-auto max-w-4xl text-header-foreground">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Acervos Maçônicos
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Conhecimento e sabedoria maçônica ao alcance de todos
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 md:grid md:grid-cols-5 md:h-10">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons];
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2 flex-1 min-w-[100px]">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Books Tab */}
          <TabsContent value="introduction">
            {filterData(books, ['title', 'author']).length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  {searchTerm ? 'Nenhum livro encontrado' : 'Livros em breve'}
                </h3>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filterData(books, ['title', 'author']).map((book) => {
                  const loan = getLoanForBook(book.id);
                  return (
                    <Card key={book.id} className="shadow-soft hover:shadow-elegant transition-smooth">
                      <CardHeader>
                        <CardTitle className="text-lg text-primary flex items-start justify-between">
                          <span>{book.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShare(book.title, 'este livro')}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">por {book.author}</p>
                        {book.isbn && (
                          <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {book.description && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Descrição:</h4>
                            <p className="text-sm text-muted-foreground">{book.description}</p>
                          </div>
                        )}
                        {book.recommendation && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Recomendação:</h4>
                            <p className="text-sm text-muted-foreground">{book.recommendation}</p>
                          </div>
                        )}
                        {loan && (
                          <div className="bg-accent/50 p-3 rounded-md">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4" />
                              <span className="font-medium">Emprestado para:</span>
                              <span>{loan.profiles.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">Devolução:</span>
                              <span>{new Date(loan.due_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            {filterData(articles, ['title']).length === 0 ? (
              <div className="text-center py-16">
                <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  {searchTerm ? 'Nenhum artigo encontrado' : 'Artigos em breve'}
                </h3>
              </div>
            ) : (
              <div className="space-y-4">
                {filterData(articles, ['title']).map((article) => (
                  <Card key={article.id} className="shadow-soft hover:shadow-elegant transition-smooth">
                    <CardHeader>
                      <CardTitle className="text-lg text-primary flex items-start justify-between">
                        <span>{article.title}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShare(article.title, 'este artigo')}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Enviado por {article.profiles.full_name} em {new Date(article.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {article.description && (
                        <p className="text-sm text-muted-foreground">{article.description}</p>
                      )}
                      {article.file_url ? (
                        <Button
                          onClick={() => handleDownload(article.file_url, article.file_name)}
                          className="w-full"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Baixar Artigo
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground italic text-center py-2">
                          Este artigo não possui arquivo para download
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Glossary Tab */}
          <TabsContent value="glossary">
            {filterData(glossary, ['term', 'definition']).length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  {searchTerm ? 'Nenhum termo encontrado' : 'Glossário em breve'}
                </h3>
              </div>
            ) : (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Glossário Maçônico</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {filterData(glossary, ['term', 'definition']).map((term) => (
                      <AccordionItem key={term.id} value={term.id}>
                        <AccordionTrigger className="text-left">
                          <div>
                            <span className="font-semibold">{term.term}</span>
                            {term.category && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({term.category})
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">{term.definition}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            {filterData(faq, ['question', 'answer']).length === 0 ? (
              <div className="text-center py-16">
                <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  {searchTerm ? 'Nenhuma pergunta encontrada' : 'Perguntas em breve'}
                </h3>
              </div>
            ) : (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Perguntas Frequentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {filterData(faq, ['question', 'answer']).map((item) => (
                      <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger className="text-left">
                          <div>
                            <span className="font-semibold">{item.question}</span>
                            {item.category && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({item.category})
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground whitespace-pre-line">{item.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Archive Tab (Educational Content) */}
          <TabsContent value="reading">
            <div className="text-center py-16">
              <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                Arquivo Morto
              </h3>
              <p className="text-muted-foreground">
                Conteúdos históricos serão adicionados em breve.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="shadow-elegant bg-gradient-primary text-primary-foreground">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">
                Interessado em Saber Mais?
              </h2>
              <p className="text-lg opacity-90 mb-6">
                Entre em contato conosco para conhecer melhor nossa filosofia e trabalhos.
              </p>
              <Button variant="secondary" size="lg" asChild>
                <a href="/contact">
                  Fale Conosco
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Education;
