import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { HeartHandshake, LayoutDashboard, Users, Stethoscope, Inbox, Wallet, Sparkles, FileSpreadsheet } from 'lucide-react';
import HospitalariaDashboard from '@/components/hospitalaria/HospitalariaDashboard';
import HospitalariaCases from '@/components/hospitalaria/HospitalariaCases';
import HospitalariaVisits from '@/components/hospitalaria/HospitalariaVisits';
import HospitalariaAidRequests from '@/components/hospitalaria/HospitalariaAidRequests';
import HospitalariaPhilanthropy from '@/components/hospitalaria/HospitalariaPhilanthropy';
import HospitalariaFund from '@/components/hospitalaria/HospitalariaFund';
import HospitalariaReports from '@/components/hospitalaria/HospitalariaReports';

type TabKey = 'dashboard' | 'cases' | 'visits' | 'aid' | 'philanthropy' | 'fund' | 'reports';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'cases', label: 'Acompanhamentos', icon: <Users className="w-4 h-4" /> },
  { key: 'visits', label: 'Visitas', icon: <Stethoscope className="w-4 h-4" /> },
  { key: 'aid', label: 'Pedidos de Auxílio', icon: <Inbox className="w-4 h-4" /> },
  { key: 'philanthropy', label: 'Ações Filantrópicas', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'fund', label: 'Tronco de Beneficência', icon: <Wallet className="w-4 h-4" /> },
  { key: 'reports', label: 'Relatórios', icon: <FileSpreadsheet className="w-4 h-4" /> },
];

const CommissionHospitalaria: React.FC = () => {
  const { user, isCommissionMember } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  if (!isCommissionMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <HeartHandshake className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold mb-2">Hospitalaria</h1>
          <p className="text-muted-foreground">Gestão de beneficência, visitas e ações filantrópicas</p>
        </div>
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

        {activeTab === 'dashboard' && <HospitalariaDashboard />}
        {activeTab === 'cases' && <HospitalariaCases />}
        {activeTab === 'visits' && <HospitalariaVisits />}
        {activeTab === 'aid' && <HospitalariaAidRequests />}
        {activeTab === 'philanthropy' && <HospitalariaPhilanthropy />}
        {activeTab === 'fund' && <HospitalariaFund />}
        {activeTab === 'reports' && <HospitalariaReports />}
      </div>
    </div>
  );
};

export default CommissionHospitalaria;
