import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Gauge } from 'lucide-react';
import ManagementExecutiveDashboard from '@/components/management/ManagementExecutiveDashboard';
import ManagementAreaIndicators from '@/components/management/ManagementAreaIndicators';
import ManagementReports from '@/components/management/ManagementReports';
import ManagementCargoDelivery from '@/components/management/ManagementCargoDelivery';
import ManagementHistory from '@/components/management/ManagementHistory';
import ManagementAuditoria from '@/components/management/ManagementAuditoria';
import ManagementAccess from '@/components/management/ManagementAccess';

type TabKey = 'executive' | 'indicators' | 'reports' | 'auditoria' | 'cargo' | 'history' | 'access';

const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
  { key: 'executive', label: 'Painel Executivo' },
  { key: 'indicators', label: 'Indicadores por Área' },
  { key: 'reports', label: 'Relatórios' },
  { key: 'auditoria', label: 'Auditoria' },
  { key: 'cargo', label: 'Entrega de Cargo' },
  { key: 'history', label: 'Histórico de Gestões' },
  { key: 'access', label: 'Acessos' },
];

const CommissionManagement: React.FC = () => {
  const { user, isCommissionMember, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('executive');

  // A aba de acessos concede e revoga papéis — exclusiva de administradores.
  const visibleTabs = tabs.filter(tab => tab.key !== 'access' || isAdmin);

  if (!isCommissionMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Gauge className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold mb-2">Gestão</h1>
          <p className="text-muted-foreground">Painel executivo, indicadores consolidados e relatórios gerenciais</p>
        </div>
        <div className="overflow-x-auto mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl w-max md:w-fit">
            {visibleTabs.map(tab => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                className={`gap-2 rounded-lg whitespace-nowrap ${activeTab === tab.key ? 'shadow-md' : ''}`}
                onClick={() => !tab.disabled && setActiveTab(tab.key)}
                disabled={tab.disabled}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {activeTab === 'executive' && <ManagementExecutiveDashboard />}
        {activeTab === 'indicators' && <ManagementAreaIndicators />}
        {activeTab === 'reports' && <ManagementReports />}
        {activeTab === 'auditoria' && <ManagementAuditoria />}
        {activeTab === 'cargo' && <ManagementCargoDelivery />}
        {activeTab === 'history' && <ManagementHistory />}
        {activeTab === 'access' && isAdmin && <ManagementAccess />}
      </div>
    </div>
  );
};

export default CommissionManagement;
