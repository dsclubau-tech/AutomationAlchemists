import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Shield, 
  User, 
  Users, 
  Mail, 
  Search, 
  MoreVertical, 
  Edit, 
  CreditCard, 
  ShieldAlert, 
  Trash2, 
  History, 
  ArrowRight, 
  Clock, 
  UserCheck, 
  Bot, 
  UserPlus, 
  Eye, 
  EyeOff,
  Phone,
  KeyRound
} from 'lucide-react';
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

interface SubscriptionTimelineEvent {
  id: string;
  subscription_id: string;
  product_slug: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  old_period_end: string | null;
  new_period_end: string | null;
  changed_by_admin_id: string | null;
  changed_by_email: string | null;
  reason: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Create User Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createIsAdmin, setCreateIsAdmin] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Modals state
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Timeline Modal State
  const [timelineUser, setTimelineUser] = useState<AdminUser | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<SubscriptionTimelineEvent[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

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
      (u) =>
        u.email.toLowerCase().includes(query) ||
        (u.full_name && u.full_name.toLowerCase().includes(query)) ||
        (u.phone && u.phone.includes(query))
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Open Subscription Timeline Modal
  const openUserTimeline = async (userItem: AdminUser) => {
    setTimelineUser(userItem);
    setIsTimelineLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', userItem.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimelineEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching subscription timeline:', error);
      toast({
        title: 'Error loading timeline',
        description: error.message || 'Could not fetch history.',
        variant: 'destructive',
      });
    } finally {
      setIsTimelineLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim()) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    if (!createPassword || createPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsActionLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: 'create_user',
          email: createEmail.trim(),
          password: createPassword.trim(),
          full_name: createFullName.trim() || null,
          phone: createPhone.trim() || null,
          is_admin: createIsAdmin,
        }),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Failed to create user');
      }

      toast({ 
        title: 'Success', 
        description: `User ${createEmail} created successfully${createIsAdmin ? ' with Admin privileges' : ''}.` 
      });

      setIsCreateModalOpen(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateFullName('');
      setCreatePhone('');
      setCreateIsAdmin(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleAdmin = async (targetUser: AdminUser) => {
    const newStatus = !targetUser.is_admin;
    const actionLabel = newStatus ? 'make admin' : 'revoke admin';
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} for ${targetUser.email}?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_execute_action', {
        p_action_type: 'toggle_admin',
        p_target_user_id: targetUser.id,
        p_target_email: targetUser.email,
        p_payload: { is_admin: newStatus }
      });

      if (error) throw error;

      setUsers(users.map(u => u.id === targetUser.id ? { ...u, is_admin: newStatus } : u));
      toast({
        title: 'Success',
        description: `Admin privileges ${newStatus ? 'granted to' : 'revoked from'} ${targetUser.email}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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

      setUsers(users.map(u => u.id === editUser.id ? { 
        ...u, 
        full_name: editFullName,
        phone: editPhone
      } : u));

      toast({ title: 'Success', description: 'User profile updated successfully' });
      setEditUser(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteUser || deleteConfirmation !== 'DELETE') return;
    setIsActionLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: 'delete_user',
          target_user_id: deleteUser.id,
          target_email: deleteUser.email
        })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Failed to delete user');
      }

      toast({ title: 'Deleted', description: `User ${deleteUser.email} has been permanently deleted.` });
      setDeleteUser(null);
      setDeleteConfirmation('');
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'granted':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">GRANTED</Badge>;
      case 'renewed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">RENEWED</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">EXPIRED</Badge>;
      case 'revoked':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">REVOKED</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{eventType.toUpperCase()}</Badge>;
    }
  };

  return (
    <AdminLayout title="Users" description="Manage user accounts, admin privileges, and view subscriptions">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-teal-600/20 bg-white shadow-sm">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-teal-600/10">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-teal-900 font-display">
                <Users className="h-6 w-6 text-teal-600" />
                User Management
              </CardTitle>
              <CardDescription className="text-teal-900/70">
                Total {users.length} registered users
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-900/40" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-teal-600/20 text-teal-900 placeholder:text-teal-900/40 focus:border-teal-600 shadow-sm"
                />
              </div>

              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm flex items-center gap-2 shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <div className="rounded-xl border border-teal-600/20 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-mint-50/50">
                    <TableRow className="border-b border-teal-600/20">
                      <TableHead className="text-teal-900 font-bold">User</TableHead>
                      <TableHead className="text-teal-900 font-bold">Role</TableHead>
                      <TableHead className="text-teal-900 font-bold">Phone</TableHead>
                      <TableHead className="text-teal-900 font-bold">Registered</TableHead>
                      <TableHead className="text-teal-900 font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-teal-900/60 font-medium">
                          No users found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id} className="border-b border-teal-600/10 hover:bg-teal-600/5 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                                {userItem.full_name || 'No name provided'}
                              </span>
                              <span className="text-xs text-teal-900/60 flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3 text-teal-600" />
                                {userItem.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {userItem.is_admin ? (
                              <Badge className="bg-teal-600/10 text-teal-900 border border-teal-600/30 flex items-center gap-1 w-fit font-semibold">
                                <Shield className="h-3 w-3 text-teal-600" /> Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-teal-600/30 text-teal-900/70 flex items-center gap-1 w-fit">
                                <User className="h-3 w-3" /> User
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-teal-900/70 text-sm">
                            {userItem.phone || '—'}
                          </TableCell>
                          <TableCell className="text-teal-900/70 text-sm">
                            {new Date(userItem.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-teal-900 hover:bg-teal-600/10">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border-teal-600/20 text-teal-900 shadow-xl">
                                <DropdownMenuItem onClick={() => openUserTimeline(userItem)} className="cursor-pointer text-teal-600 focus:text-teal-700 focus:bg-teal-600/10 font-semibold">
                                  <History className="h-4 w-4 mr-2" /> Subscription Timeline
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/subscriptions?user_id=${userItem.id}`)} className="cursor-pointer hover:bg-teal-600/10">
                                  <CreditCard className="h-4 w-4 mr-2 text-teal-600" /> View Subscriptions
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setEditUser(userItem);
                                  setEditFullName(userItem.full_name || '');
                                  setEditPhone(userItem.phone || '');
                                }} className="cursor-pointer hover:bg-teal-600/10">
                                  <Edit className="h-4 w-4 mr-2 text-teal-600" /> Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleAdmin(userItem)} className="cursor-pointer hover:bg-teal-600/10">
                                  <ShieldAlert className="h-4 w-4 mr-2 text-teal-600" /> 
                                  {userItem.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-teal-600/10" />
                                <DropdownMenuItem onClick={() => setDeleteUser(userItem)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
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

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-white border border-teal-600/20 text-teal-900 sm:max-w-[460px] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-teal-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600" />
              Create New User
            </DialogTitle>
            <DialogDescription className="text-teal-900/70">
              Provision a new user account with login credentials. Profile and triggers will be created automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-email" className="text-teal-900 font-semibold flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-teal-600" />
                  Email Address *
                </Label>
                <Input 
                  id="create-email"
                  type="email"
                  placeholder="user@example.com"
                  value={createEmail} 
                  onChange={e => setCreateEmail(e.target.value)} 
                  required
                  className="bg-white border-teal-600/20 text-teal-900 focus:border-teal-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password" className="text-teal-900 font-semibold flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-teal-600" />
                  Initial Password *
                </Label>
                <div className="relative">
                  <Input 
                    id="create-password"
                    type={showCreatePassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={createPassword} 
                    onChange={e => setCreatePassword(e.target.value)} 
                    required
                    minLength={6}
                    className="bg-white border-teal-600/20 text-teal-900 focus:border-teal-600 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-900/50 hover:text-teal-900"
                  >
                    {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-fullname" className="text-teal-900 font-semibold flex items-center gap-1.5">
                  <User className="h-4 w-4 text-teal-600" />
                  Full Name (Optional)
                </Label>
                <Input 
                  id="create-fullname"
                  placeholder="e.g. Alex Johnson"
                  value={createFullName} 
                  onChange={e => setCreateFullName(e.target.value)} 
                  className="bg-white border-teal-600/20 text-teal-900 focus:border-teal-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-phone" className="text-teal-900 font-semibold flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-teal-600" />
                  Phone Number (Optional)
                </Label>
                <Input 
                  id="create-phone"
                  placeholder="e.g. +61 400 000 000"
                  value={createPhone} 
                  onChange={e => setCreatePhone(e.target.value)} 
                  className="bg-white border-teal-600/20 text-teal-900 focus:border-teal-600"
                />
              </div>

              <div className="pt-2 border-t border-teal-600/10">
                <div className="flex items-center justify-between p-3 bg-mint-50/50 rounded-xl border border-teal-600/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="create-is-admin" className="text-teal-900 font-semibold cursor-pointer flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-teal-600" />
                      Admin Privileges
                    </Label>
                    <p className="text-xs text-teal-900/60">Grant access to the entire admin panel</p>
                  </div>
                  <Switch
                    id="create-is-admin"
                    checked={createIsAdmin}
                    onCheckedChange={setCreateIsAdmin}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)} 
                className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isActionLoading} 
                className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm flex items-center gap-2"
              >
                {isActionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subscription Timeline Modal */}
      <Dialog open={!!timelineUser} onOpenChange={(open) => !open && setTimelineUser(null)}>
        <DialogContent className="bg-white border border-teal-600/20 text-teal-900 max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-teal-900 font-display font-bold">
              <History className="h-5 w-5 text-teal-600" />
              Subscription History Timeline
            </DialogTitle>
            <DialogDescription className="text-teal-900/70">
              Audit log of all entitlement and access events for <strong className="text-teal-900">{timelineUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isTimelineLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : timelineEvents.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-teal-600/30 rounded-xl text-teal-900/60 font-medium">
                No subscription history recorded yet for this customer.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-600/40">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="relative">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-teal-600 shadow-sm" />
                    
                    <div className="bg-mint-50/50 border border-teal-600/20 rounded-xl p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-900 uppercase tracking-wider text-sm">
                            {event.product_slug}
                          </span>
                          {getEventBadge(event.event_type)}
                        </div>
                        <span className="text-xs text-teal-900/60 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-teal-600" />
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Status Transition */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-teal-900/70">Status:</span>
                        <Badge variant="outline" className="border-teal-600/30 text-teal-900/70 text-xs">
                          {event.old_status ? event.old_status.toUpperCase() : 'NONE'}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-teal-900/40" />
                        <Badge className={
                          event.new_status === 'active' 
                            ? 'bg-green-500/10 text-green-700 border border-green-500/20 text-xs' 
                            : 'bg-red-500/10 text-red-700 border border-red-500/20 text-xs'
                        }>
                          {event.new_status ? event.new_status.toUpperCase() : 'UNKNOWN'}
                        </Badge>
                      </div>

                      {/* Period Expiration */}
                      <div className="text-xs text-teal-900/70">
                        <span>Expiry Date: </span>
                        <strong className="text-teal-900">
                          {event.new_period_end ? new Date(event.new_period_end).toLocaleDateString() : 'Lifetime'}
                        </strong>
                      </div>

                      {/* Changed By & Reason */}
                      <div className="pt-2 border-t border-teal-600/10 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 text-teal-900/70">
                          {event.changed_by_email ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                              <span>Admin: <span className="text-teal-900 font-semibold">{event.changed_by_email}</span></span>
                            </>
                          ) : (
                            <>
                              <Bot className="h-3.5 w-3.5 text-purple-600" />
                              <span className="text-purple-700 font-medium">System / Automatic Expiry</span>
                            </>
                          )}
                        </div>
                        {event.reason && (
                          <span className="text-teal-900/60 italic">
                            Reason: "{event.reason}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setTimelineUser(null)} className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-teal-900">Edit Profile</DialogTitle>
            <DialogDescription className="text-teal-900/70">
              Update user details for {editUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-teal-900 font-semibold">Full Name</Label>
              <Input 
                value={editFullName} 
                onChange={e => setEditFullName(e.target.value)} 
                className="bg-white border-teal-600/20 text-teal-900 focus:border-teal-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-teal-900 font-semibold">Phone</Label>
              <Input 
                value={editPhone} 
                onChange={e => setEditPhone(e.target.value)} 
                className="bg-white border-teal-600/20 text-teal-900 focus:border-teal-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10">Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={isActionLoading} className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm">
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <DialogContent className="bg-white border border-red-500/30 text-teal-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 text-xl font-display font-bold">
              <Trash2 className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-teal-900/70">
              Are you sure you want to delete <strong className="text-teal-900">{deleteUser?.email}</strong>? 
              This will cascade and remove their subscriptions and profile permanently.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-red-600 font-semibold">Type "DELETE" to confirm</Label>
              <Input 
                value={deleteConfirmation} 
                onChange={e => setDeleteConfirmation(e.target.value)} 
                className="bg-white border-red-500/30 text-teal-900 focus:border-red-500"
                placeholder="DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteUser(null); setDeleteConfirmation(''); }} className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSubmit} 
              disabled={deleteConfirmation !== 'DELETE' || isActionLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
