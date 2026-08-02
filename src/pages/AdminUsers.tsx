import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, User, Mail, Search, MoreVertical, Edit, CreditCard, ShieldAlert, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';
import { useNavigate } from 'react-router-dom';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    analytics.trackPageView('/admin/users');
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_users');

      if (error) throw error;
      
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      u => (u.full_name && u.full_name.toLowerCase().includes(query)) || 
           (u.email && u.email.toLowerCase().includes(query))
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleEditSubmit = async () => {
    if (!editUser) return;
    setIsActionLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('admin_execute_action', {
        p_action_type: 'edit_profile',
        p_target_user_id: editUser.id,
        p_target_email: editUser.email,
        p_payload: {
          full_name: editFullName,
          phone: editPhone
        }
      });
      
      if (error) throw error;
      
      setUsers(users.map(u => u.id === editUser.id ? { ...u, full_name: editFullName, phone: editPhone } : u));
      toast({ title: 'Success', description: 'User profile updated' });
      setEditUser(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleAdmin = async (user: AdminUser) => {
    if (!window.confirm(`Are you sure you want to ${user.is_admin ? 'remove admin rights from' : 'make'} ${user.email} ${user.is_admin ? '?' : 'an admin?'}`)) {
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('admin_execute_action', {
        p_action_type: 'toggle_admin',
        p_target_user_id: user.id,
        p_target_email: user.email,
        p_payload: { is_admin: !user.is_admin }
      });
      
      if (error) throw error;
      
      setUsers(users.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
      toast({ title: 'Success', description: `Admin status updated for ${user.email}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteUser || deleteConfirmation !== 'DELETE') return;
    setIsActionLoading(true);
    
    try {
      // Call Edge Function
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'delete_user',
          target_user_id: deleteUser.id,
          target_email: deleteUser.email
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      
      setUsers(users.filter(u => u.id !== deleteUser.id));
      toast({ title: 'User Deleted', description: `${deleteUser.email} has been permanently deleted.` });
      setDeleteUser(null);
      setDeleteConfirmation('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AdminLayout title="User Management" description="Manage all users and access roles">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-text-main">
                <Users className="h-6 w-6 text-primary" />
                Registered Users
              </CardTitle>
              <CardDescription className="text-text-muted">
                Total users: {users.length}
              </CardDescription>
            </div>
            
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input 
                placeholder="Search name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background-dark border-primary/30"
              />
            </div>
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
                      <TableHead className="text-text-muted text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-text-muted">
                          No users found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id} className="border-primary/20 hover:bg-primary/5">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-text-main flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                {userItem.full_name || 'No name'}
                              </span>
                              {userItem.phone && (
                                <span className="text-xs text-text-muted ml-6">{userItem.phone}</span>
                              )}
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
                            {userItem.is_admin ? (
                              <Badge className="bg-primary/20 text-primary border-primary/30">Admin</Badge>
                            ) : (
                              <Badge variant="outline" className="border-primary/30 text-text-muted">User</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4 text-text-muted" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-surface-dark border-primary/20">
                                <DropdownMenuItem onClick={() => {
                                  setEditUser(userItem);
                                  setEditFullName(userItem.full_name || '');
                                  setEditPhone(userItem.phone || '');
                                }} className="cursor-pointer">
                                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/subscriptions?user_id=${userItem.id}`)} className="cursor-pointer">
                                  <CreditCard className="h-4 w-4 mr-2" /> View Subscriptions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-primary/20" />
                                <DropdownMenuItem onClick={() => handleToggleAdmin(userItem)} className="cursor-pointer text-yellow-500 focus:text-yellow-500 focus:bg-yellow-500/10">
                                  <ShieldAlert className="h-4 w-4 mr-2" /> 
                                  {userItem.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-primary/20" />
                                <DropdownMenuItem onClick={() => setDeleteUser(userItem)} className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="bg-surface-dark border-primary/20 text-text-main">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Updating details for {editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={editFullName} 
                onChange={e => setEditFullName(e.target.value)} 
                className="bg-background-dark border-primary/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={editPhone} 
                onChange={e => setEditPhone(e.target.value)} 
                className="bg-background-dark border-primary/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} className="border-primary/30 hover:bg-primary/10 text-white">Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={isActionLoading} className="bg-primary hover:bg-primary/90 text-background-dark">
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <DialogContent className="bg-surface-dark border-red-500/50 text-text-main">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              This action cannot be undone. This will permanently delete 
              <strong className="text-white mx-1">{deleteUser?.email}</strong> 
              along with all of their subscriptions and profile data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-red-400">Type "DELETE" to confirm</Label>
              <Input 
                value={deleteConfirmation} 
                onChange={e => setDeleteConfirmation(e.target.value)} 
                className="bg-background-dark border-red-500/50 text-white"
                placeholder="DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteUser(null); setDeleteConfirmation(''); }} className="border-primary/30 hover:bg-primary/10 text-white">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSubmit} 
              disabled={deleteConfirmation !== 'DELETE' || isActionLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
