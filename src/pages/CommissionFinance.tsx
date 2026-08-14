import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, BarChart3, FileSpreadsheet, Landmark, ArrowLeftRight, UserX } from 'lucide-react';
import FinanceDashboard from '@/components/finance/FinanceDashboard';
import FinanceTransactions from '@/components/finance/FinanceTransactions';
import FinanceAccounts from '@/components/finance/FinanceAccounts';
import FinanceReports from '@/components/finance/FinanceReports';
import FinanceDelinquency from '@/components/finance/FinanceDelinquency';

type TabKey = 'dashboard' | 'transactions' | 'accounts' | 'delinquency' | 'reports';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'transactions', label: 'Lançamentos', icon: <ArrowLeftRight className="w-4 h-4" /> },
  { key: 'accounts', label: 'Investimentos', icon: <Landmark className="w-4 h-4" /> },
  { key: 'delinquency', label: 'Inadimplência', icon: <UserX className="w-4 h-4" /> },
  { key: 'reports', label: 'Relatórios', icon: <FileSpreadsheet className="w-4 h-4" /> },
];

const CommissionFinance: React.FC = () => {
  const { user, isCommissionMember } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  if (!isCommissionMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              {user ? 'Acesso apenas para membros da comissão.' : 'Faça login para acessar esta área.'}
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
          <h1 className="text-3xl font-bold mb-2">Gestão Financeira</h1>
          <p className="text-muted-foreground">Controle completo de receitas, despesas e investimentos</p>
        </div>
        {/* Tab Navigation */}
        <div className="overflow-x-auto mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl w-max md:w-fit">
            {tabs.map(tab => (
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

        {/* Tab Content */}
        {activeTab === 'dashboard' && <FinanceDashboard />}
        {activeTab === 'transactions' && <FinanceTransactions />}
        {activeTab === 'accounts' && <FinanceAccounts />}
        {activeTab === 'delinquency' && <FinanceDelinquency />}
        {activeTab === 'reports' && <FinanceReports />}
      </div>
    </div>
  );
};

export default CommissionFinance;
