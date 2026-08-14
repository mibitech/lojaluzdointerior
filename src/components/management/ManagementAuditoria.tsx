import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const actionColors: Record<string, string> = {
  'Criou': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Editou': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Excluiu': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Aprovou': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  'Negou': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'Exportou': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Visualizou': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
};

const ManagementAuditoria: React.FC = () => {
  const [moduleFilter, setModuleFilter] = useState<string>('todos');
  const [actionFilter, setActionFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredLogs = (logs as any[]).filter(log => {
    if (moduleFilter !== 'todos' && log.module !== moduleFilter) return false;
    if (actionFilter !== 'todos' && log.action !== actionFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (log.user_name || '').toLowerCase().includes(s) ||
        (log.entity_label || '').toLowerCase().includes(s) ||
        (log.entity_type || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por usuário ou entidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Hospitalaria">Hospitalaria</SelectItem>
                <SelectItem value="Secretaria">Secretaria</SelectItem>
                <SelectItem value="Chancelaria">Chancelaria</SelectItem>
                <SelectItem value="Gestão">Gestão</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="Criou">Criou</SelectItem>
                <SelectItem value="Editou">Editou</SelectItem>
                <SelectItem value="Excluiu">Excluiu</SelectItem>
                <SelectItem value="Aprovou">Aprovou</SelectItem>
                <SelectItem value="Negou">Negou</SelectItem>
                <SelectItem value="Exportou">Exportou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Log de Auditoria
            <Badge variant="secondary" className="ml-2">{filteredLogs.length} registros</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum registro de auditoria encontrado.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os logs serão registrados automaticamente conforme ações são realizadas no sistema.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm">{log.user_name || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.user_position || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{log.module}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || 'bg-muted'}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{log.entity_type}</span>
                        {log.entity_label && <span className="ml-1 font-medium">{log.entity_label}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementAuditoria;
