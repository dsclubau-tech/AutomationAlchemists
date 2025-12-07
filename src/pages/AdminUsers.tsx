import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, User, Mail } from 'lucide-react';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  isAdmin: boolean;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    analytics.trackPageView('/admin/users');
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Load all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRole[] = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id && r.role === 'admin');

        return {
          id: profile.id,
          email: 'user@example.com',
          full_name: profile.full_name,
          created_at: profile.created_at || '',
          isAdmin: !!userRole,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <AdminLayout title="User Management" description="Manage user roles and permissions">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-text-main">
              <Shield className="h-6 w-6 text-primary" />
              Registered Users
            </CardTitle>
            <CardDescription className="text-text-muted">
              Total users: {users.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-lg border border-primary/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-primary/20 hover:bg-primary/5">
                      <TableHead className="text-text-muted">User</TableHead>
                      <TableHead className="text-text-muted">Email</TableHead>
                      <TableHead className="text-text-muted">Created</TableHead>
                      <TableHead className="text-text-muted">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-text-muted">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((userItem) => (
                        <TableRow key={userItem.id} className="border-primary/20 hover:bg-primary/5">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-text-muted" />
                              <span className="font-medium text-text-main">
                                {userItem.full_name || 'No name'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-text-muted">
                              <Mail className="h-4 w-4" />
                              {userItem.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-text-muted">
                            {new Date(userItem.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {userItem.isAdmin ? (
                              <Badge className="bg-primary/20 text-primary border-primary/30">Admin</Badge>
                            ) : (
                              <Badge variant="outline" className="border-primary/30 text-text-muted">User</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminUsers;
