import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ShieldOff, User, Mail } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { analytics } from '@/utils/analytics';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    analytics.trackPageView('/admin/users');
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAdminAndLoadUsers = async () => {
      if (!user) return;

      try {
        // Check if user has admin role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError) throw roleError;

        if (!roleData) {
          toast({
            title: 'Access Denied',
            description: 'You do not have admin privileges',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);

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

        // Combine data - create users list from profiles
        const usersWithRoles: UserWithRole[] = (profilesData || []).map(profile => {
          const userRole = rolesData?.find(r => r.user_id === profile.id && r.role === 'admin');
          
          return {
            id: profile.id,
            email: 'user@example.com', // Email not available without admin API
            full_name: profile.full_name,
            created_at: profile.created_at || '',
            isAdmin: !!userRole,
          };
        });

        setUsers(usersWithRoles);
      } catch (error: any) {
        console.error('Error loading users:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndLoadUsers();
  }, [user, toast, navigate]);

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    try {
      if (userId === user?.id) {
        toast({
          title: 'Cannot modify own role',
          description: 'You cannot remove your own admin privileges',
          variant: 'destructive',
        });
        return;
      }

      if (currentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        toast({
          title: 'Admin role removed',
          description: 'User admin privileges have been revoked',
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;

        toast({
          title: 'Admin role granted',
          description: 'User now has admin privileges',
        });
      }

      analytics.trackEvent('admin_role_changed', { userId, granted: !currentlyAdmin });

      // Refresh users list
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isAdmin: !currentlyAdmin } : u
      ));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <section className="pt-32 pb-20 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl flex items-center gap-2">
                      <Shield className="h-8 w-8" />
                      User Management
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Manage user roles and permissions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((userItem) => (
                          <TableRow key={userItem.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {userItem.full_name || 'No name'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {userItem.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(userItem.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {userItem.isAdmin ? (
                                <Badge className="bg-primary">Admin</Badge>
                              ) : (
                                <Badge variant="secondary">User</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant={userItem.isAdmin ? "destructive" : "default"}
                                size="sm"
                                onClick={() => toggleAdminRole(userItem.id, userItem.isAdmin)}
                                disabled={userItem.id === user?.id}
                              >
                                {userItem.isAdmin ? (
                                  <>
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Remove Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Make Admin
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdminUsers;
