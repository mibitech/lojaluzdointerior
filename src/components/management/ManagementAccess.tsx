import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles, type MemberAccess } from '@/hooks/useUserRoles';

type AccessFilter = 'todos' | 'sem_acesso' | 'com_acesso' | 'admins' | 'diretoria';

const filterMember = (member: MemberAccess, filter: AccessFilter) => {
  switch (filter) {
    case 'sem_acesso':
      return member.roles.length === 0;
    case 'com_acesso':
      return member.roles.length > 0;
    case 'admins':
      return member.roles.includes('admin');
    case 'diretoria':
      return member.isDirectorMember;
    default:
      return true;
  }
};

const ManagementAccess: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { members, loading, grantRole, revokeRole, setDirectorMember } = useUserRoles();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AccessFilter>('todos');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const visibleMembers = members.filter((member) => {
    if (!filterMember(member, filter)) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      member.fullName.toLowerCase().includes(term) ||
      (member.email || '').toLowerCase().includes(term) ||
      (member.cim || '').includes(term)
    );
  });

  // Chave por switch (não por membro): travar a linha inteira faria os outros
  // dois switches piscarem como se tivessem sido alterados junto.
  const runAction = async (key: string, action: () => Promise<void>) => {
    setPendingId(key);
    try {
      await action();
    } catch {
      // toast já exibido pelo hook
    } finally {
      setPendingId(null);
    }
  };

  const withoutAccess = members.filter((m) => m.roles.length === 0).length;
  const adminCount = members.filter((m) => m.roles.includes('admin')).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Gestão de Acessos
          </CardTitle>
          <CardDescription>
            Controle quem é membro e quem faz parte da diretoria.
            {withoutAccess > 0 && ` ${withoutAccess} membro(s) ainda sem acesso.`}
            {` ${adminCount} administrador(es).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por nome, e-mail ou CIM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as AccessFilter)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sem_acesso">Sem acesso</SelectItem>
                <SelectItem value="com_acesso">Com acesso</SelectItem>
                <SelectItem value="admins">Administradores</SelectItem>
                <SelectItem value="diretoria">Membros da diretoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleMembers.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">Nenhum membro encontrado.</p>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">CIM</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="w-[150px]">Membro</TableHead>
                      <TableHead className="w-[130px]">Administrador</TableHead>
                      <TableHead className="w-[130px]">Diretoria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleMembers.map((member) => {
                      const hasMember = member.roles.includes('member');
                      const hasAdmin = member.roles.includes('admin');
                      const noAccount = !member.userId;
                      // Impede o admin de revogar o próprio acesso e se trancar para fora
                      const isSelf = !!user && member.userId === user.id;

                      return (
                        <TableRow key={member.profileId}>
                          <TableCell className="font-mono text-sm">{member.cim || '-'}</TableCell>
                          <TableCell>
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-xs text-muted-foreground">{member.email || 'Sem e-mail'}</div>
                          </TableCell>
                          <TableCell>
                            {noAccount ? (
                              <Badge variant="outline">Sem conta</Badge>
                            ) : hasAdmin ? (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                Administrador
                              </Badge>
                            ) : hasMember ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Liberado
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Sem acesso</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={hasMember}
                              disabled={!isAdmin || noAccount || (isSelf && hasMember) || pendingId === `${member.profileId}:member`}
                              aria-label={`Membro: ${member.fullName}`}
                              onCheckedChange={(checked) =>
                                runAction(`${member.profileId}:member`, () =>
                                  checked
                                    ? grantRole(member.userId!, 'member')
                                    : revokeRole(member.userId!, 'member')
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={hasAdmin}
                              disabled={!isAdmin || noAccount || (isSelf && hasAdmin) || pendingId === `${member.profileId}:admin`}
                              aria-label={`Administrador: ${member.fullName}`}
                              onCheckedChange={(checked) =>
                                runAction(`${member.profileId}:admin`, () =>
                                  checked
                                    ? grantRole(member.userId!, 'admin')
                                    : revokeRole(member.userId!, 'admin')
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={member.isDirectorMember}
                              disabled={!isAdmin || pendingId === `${member.profileId}:commission`}
                              aria-label={`Diretoria: ${member.fullName}`}
                              onCheckedChange={(checked) =>
                                runAction(`${member.profileId}:commission`, () =>
                                  setDirectorMember(member.profileId, checked)
                                )
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {visibleMembers.map((member) => {
                  const hasMember = member.roles.includes('member');
                  const hasAdmin = member.roles.includes('admin');
                  const noAccount = !member.userId;
                  const isSelf = !!user && member.userId === user.id;

                  return (
                    <Card key={member.profileId}>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          {member.cim && (
                            <p className="text-xs font-mono text-muted-foreground">CIM: {member.cim}</p>
                          )}
                          <h3 className="font-semibold">{member.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{member.email || 'Sem e-mail'}</p>
                        </div>

                        {noAccount && <Badge variant="outline">Sem conta de acesso</Badge>}

                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Membro</span>
                            <Switch
                              checked={hasMember}
                              disabled={!isAdmin || noAccount || (isSelf && hasMember) || pendingId === `${member.profileId}:member`}
                              aria-label={`Membro: ${member.fullName}`}
                              onCheckedChange={(checked) =>
                                runAction(`${member.profileId}:member`, () =>
                                  checked
                                    ? grantRole(member.userId!, 'member')
                                    : revokeRole(member.userId!, 'member')
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Administrador</span>
                            <Switch
                              checked={hasAdmin}
                              disabled={!isAdmin || noAccount || (isSelf && hasAdmin) || pendingId === `${member.profileId}:admin`}
                              aria-label={`Administrador: ${member.fullName}`}
                              onCheckedChange={(checked) =>
                                runAction(`${member.profileId}:admin`, () =>
                                  checked
                                    ? grantRole(member.userId!, 'admin')
                                    : revokeRole(member.userId!, 'admin')
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Membro da diretoria</span>
                            <Switch
                              checked={member.isDirectorMember}
                              disabled={!isAdmin || pendingId === `${member.profileId}:commission`}
                              aria-label={`Diretoria: ${member.fullName}`}
                              onCheckedChange={(checked) =>
                                runAction(`${member.profileId}:commission`, () =>
                                  setDirectorMember(member.profileId, checked)
                                )
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementAccess;
