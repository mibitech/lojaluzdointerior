import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, Landmark, Users, Crown, CalendarDays, GlassWater, Activity, CalendarRange, BookOpen, FileText, BookA, HelpCircle } from "lucide-react";
import CommissionEvents from "./CommissionEvents";
import CommissionActivities from "./CommissionActivities";
import CommissionProfiles from "./CommissionProfiles";
import CommissionMasters from "./CommissionMasters";
import CommissionCopoDagua from "./CommissionCopoDagua";
import CommissionBooks from "./CommissionBooks";
import CommissionArticles from "./CommissionArticles";
import CommissionGlossary from "./CommissionGlossary";
import CommissionFAQ from "./CommissionFAQ";
import CommissionLodgeInfo from "./CommissionLodgeInfo";
import CommissionSessions from "./CommissionSessions";

type CrudTabKey = 'lodge' | 'profiles' | 'masters' | 'sessions' | 'copo-dagua' | 'activities' | 'eventos' | 'books' | 'articles' | 'glossary' | 'faq';

const crudTabs: { key: CrudTabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'lodge', label: 'Loja', icon: <Landmark className="w-4 h-4" /> },
  { key: 'profiles', label: 'Irmãos', icon: <Users className="w-4 h-4" /> },
  { key: 'masters', label: 'Mestres', icon: <Crown className="w-4 h-4" /> },
  { key: 'sessions', label: 'Sessões', icon: <CalendarDays className="w-4 h-4" /> },
  { key: 'copo-dagua', label: "Copo D'água", icon: <GlassWater className="w-4 h-4" /> },
  { key: 'activities', label: 'Atividades', icon: <Activity className="w-4 h-4" /> },
  { key: 'eventos', label: 'Eventos', icon: <CalendarRange className="w-4 h-4" /> },
  { key: 'books', label: 'Livros', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'articles', label: 'Artigos', icon: <FileText className="w-4 h-4" /> },
  { key: 'glossary', label: 'Glossário', icon: <BookA className="w-4 h-4" /> },
  { key: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
];

const CommissionCRUD: React.FC = () => {
  const { user, isCommissionMember } = useAuth();
  const [activeTab, setActiveTab] = useState<CrudTabKey>('lodge');

  if (!isCommissionMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              {user ? "Acesso apenas para membros da comissão." : "Faça login para acessar esta área."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Cadastros</h1>
          <p className="text-muted-foreground">Gerenciamento de dados da loja</p>
        </div>
        <div className="overflow-x-auto mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl w-max md:w-fit">
            {crudTabs.map(tab => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                className={`gap-2 rounded-lg whitespace-nowrap ${activeTab === tab.key ? 'shadow-md' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {activeTab === 'lodge' && <CommissionLodgeInfo />}
        {activeTab === 'profiles' && <CommissionProfiles />}
        {activeTab === 'masters' && <CommissionMasters />}
        {activeTab === 'sessions' && <CommissionSessions />}
        {activeTab === 'copo-dagua' && <CommissionCopoDagua />}
        {activeTab === 'activities' && <CommissionActivities />}
        {activeTab === 'eventos' && <CommissionEvents />}
        {activeTab === 'books' && <CommissionBooks />}
        {activeTab === 'articles' && <CommissionArticles />}
        {activeTab === 'glossary' && <CommissionGlossary />}
        {activeTab === 'faq' && <CommissionFAQ />}
      </div>
    </div>
  );
};

export default CommissionCRUD;
