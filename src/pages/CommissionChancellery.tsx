import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Users, ClipboardCheck, LayoutDashboard, BarChart3, UserCheck } from 'lucide-react';
import CommissionVisitors from './CommissionVisitors';
import CommissionAttendances from './CommissionAttendances';
import ChancelleryDashboard from '@/components/chancellery/ChancelleryDashboard';
import ChancelleryMemberReport from '@/components/chancellery/ChancelleryMemberReport';
import ChancelleryVisitorReport from '@/components/chancellery/ChancelleryVisitorReport';
import ChancelleryAttendanceReport from '@/components/chancellery/ChancelleryAttendanceReport';

type TabKey = 'dashboard' | 'attendances' | 'visitors' | 'reports';
type ReportSubTab = 'members' | 'visitors' | 'attendance';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'attendances', label: 'Presenças', icon: <ClipboardCheck className="w-4 h-4" /> },
  { key: 'visitors', label: 'Visitantes', icon: <Users className="w-4 h-4" /> },
  { key: 'reports', label: 'Relatórios', icon: <BarChart3 className="w-4 h-4" /> },
];

const reportSubTabs: { key: ReportSubTab; label: string; icon: React.ReactNode }[] = [
  { key: 'members', label: 'Frequência', icon: <Users className="w-4 h-4" /> },
  { key: 'visitors', label: 'Visitantes', icon: <UserCheck className="w-4 h-4" /> },
  { key: 'attendance', label: 'Presença', icon: <ClipboardCheck className="w-4 h-4" /> },
];

const CommissionChancellery: React.FC = () => {
  const { user, isCommissionMember } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('members');

  if (!isCommissionMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold mb-2">Chancelaria</h1>
          <p className="text-muted-foreground">Gestão de presenças, visitantes e relatórios das sessões</p>
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

        {activeTab === 'dashboard' && <ChancelleryDashboard />}
        {activeTab === 'visitors' && <CommissionVisitors />}
        {activeTab === 'attendances' && <CommissionAttendances />}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 bg-muted/50 p-1.5 rounded-xl w-fit">
              {reportSubTabs.map(sub => (
                <Button
                  key={sub.key}
                  variant={reportSubTab === sub.key ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-2 rounded-lg ${reportSubTab === sub.key ? 'shadow-md' : ''}`}
                  onClick={() => setReportSubTab(sub.key)}
                >
                  {sub.icon}
                  {sub.label}
                </Button>
              ))}
            </div>

            {reportSubTab === 'members' && <ChancelleryMemberReport />}
            {reportSubTab === 'visitors' && <ChancelleryVisitorReport />}
            {reportSubTab === 'attendance' && <ChancelleryAttendanceReport />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionChancellery;
