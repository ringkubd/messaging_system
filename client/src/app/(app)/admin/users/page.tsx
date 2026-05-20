'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { TableSkeleton } from '@/_components/shared/loading-skeleton';
import { Search, Shield, ShieldOff, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => apiClient.get(`/admin/users?search=${search}&role=${roleFilter}`).then(r => r.data),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => apiClient.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('Role updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const suspendUser = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/users/${id}/suspend`),
    onSuccess: () => { toast.success('User suspended'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const users = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="User Management" description="Manage all platform users." />

      <Card className="p-4 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v || '')}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Student</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? <TableSkeleton /> : (
        <Card>
          <div className="divide-y">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <Avatar><AvatarFallback className="text-xs">{user.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === 'super_admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'} className="text-[10px]">
                    {user.role?.replace('_', ' ')}
                  </Badge>
                  {user.round && <span className="text-xs text-muted-foreground">R{user.round}</span>}
                  {user.batch && <span className="text-xs text-muted-foreground">B{user.batch}</span>}
                </div>
                <div className="flex gap-1">
                  <Select defaultValue={user.role} onValueChange={(v) => updateRole.mutate({ id: user.id, role: v })}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Student</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => suspendUser.mutate(user.id)}>
                    <Ban className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
