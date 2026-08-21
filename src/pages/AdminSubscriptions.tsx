import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, MoreVertical, Calendar as CalendarIcon, Ban, Trash2, Plus, FilterX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

interface AdminSubscription {
  id: string;
  user_id: string;
  user_email: string;
  product_slug: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  manually_granted: boolean;
  grant_reason: string | null;
  created_at: string;
}

const AdminSubscriptions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFilter = searchParams.get('user_id');
  
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<AdminSubscription[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Extend/Shorten Modal
  const [editDateSub, setEditDateSub] = useState<AdminSubscription | null>(null);
  const [newEndDate, setNewEndDate] = useState('');
  
  // Delete Modal
  const [deleteSub, setDeleteSub] = useState<AdminSubscription | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Grant Modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantToolSlug, setGrantToolSlug] = useState('cpbot');
  const [grantEndDate, setGrantEndDate] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [grantStoreName, setGrantStoreName] = useState('');

  // Tools that support store-level subscriptions
  const MULTI_STORE_TOOLS = ['orderbot', 'listflow'];

  const { toast } = useToast();

  useEffect(() => {
    analytics.trackPageView('/admin/subscriptions');
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_subscriptions');
      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load subscriptions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Apply filters
  useEffect(() => {
    let result = [...subscriptions];
    
    if (userIdFilter) {
      result = result.filter(s => s.user_id === userIdFilter);
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    
    setFilteredSubs(result);
  }, [subscriptions, userIdFilter, statusFilter]);

  const clearUserIdFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('user_id');
    setSearchParams(params);
  };

  const handleDateEditSubmit = async () => {
    if (!editDateSub || !newEndDate) return;
    setIsActionLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('admin_execute_action', {
        p_action_type: 'extend_subscription',
        p_target_user_id: editDateSub.user_id,
        p_target_email: editDateSub.user_email,
        p_payload: {
          subscription_id: editDateSub.id,
          new_date: new Date(newEndDate).toISOString()
        }
      });
      
      if (error) throw error;
      
      setSubscriptions(subscriptions.map(s => 
        s.id === editDateSub.id ? { ...s, current_period_end: new Date(newEndDate).toISOString() } : s
      ));
      toast({ title: 'Success', description: 'Subscription date updated' });
      setEditDateSub(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRevoke = async (sub: AdminSubscription) => {
    if (!window.confirm(`Are you sure you want to revoke access to ${sub.product_slug} for ${sub.user_email}?`)) {
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('admin_execute_action', {
        p_action_type: 'revoke_access',
        p_target_user_id: sub.user_id,
        p_target_email: sub.user_email,
        p_payload: { subscription_id: sub.id }
      });
      
      if (error) throw error;
      
      setSubscriptions(subscriptions.map(s => s.id === sub.id ? { ...s, status: 'inactive' } : s));
      toast({ title: 'Success', description: 'Access revoked successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteSub || deleteConfirmation !== 'DELETE') return;
    setIsActionLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'delete_subscription',
          target_user_id: deleteSub.user_id,
          target_email: deleteSub.user_email,
          target_subscription_id: deleteSub.id
        })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete subscription');
      
      setSubscriptions(subscriptions.filter(s => s.id !== deleteSub.id));
      toast({ title: 'Deleted', description: `Subscription record removed permanently.` });
      setDeleteSub(null);
      setDeleteConfirmation('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGrantSubmit = async () => {
    if (!grantEmail || !grantToolSlug || !grantReason) {
      toast({ title: 'Error', description: 'Email, Tool, and Reason are required', variant: 'destructive' });
      return;
    }
    const isMultiStore = MULTI_STORE_TOOLS.includes(grantToolSlug);
    if (isMultiStore && !grantStoreName.trim()) {
      toast({ title: 'Error', description: 'Store Name is required for this tool', variant: 'destructive' });
      return;
    }
    setIsActionLoading(true);
    
    try {
      const { data: usersData, error: usersError } = await supabase.rpc('admin_get_users');
      if (usersError) throw usersError;
      
      const targetUser = usersData.find((u: any) => u.email.toLowerCase() === grantEmail.toLowerCase());
      if (!targetUser) {
        throw new Error(`User with email ${grantEmail} not found. They must register first.`);
      }

      const endDateISO = grantEndDate ? new Date(grantEndDate).toISOString() : null;
      const generatedStoreId = isMultiStore ? crypto.randomUUID() : null;

      const payload: Record<string, any> = {
        tool_slug: grantToolSlug,
        reason: grantReason,
        end_date: endDateISO
      };

      if (isMultiStore) {
        payload.store_id = generatedStoreId;
        payload.store_name = grantStoreName.trim();
      }

      const { data, error } = await supabase.rpc('admin_execute_action', {
        p_action_type: 'grant_access',
        p_target_user_id: targetUser.id,
        p_target_email: targetUser.email,
        p_payload: payload
      });
      
      if (error) throw error;

      // For multi-store tools, ensure the store exists in the stores registry
      if (isMultiStore && generatedStoreId) {
        const { data: existingStore } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', targetUser.id)
          .eq('store_name', grantStoreName.trim())
          .single();

        if (!existingStore) {
          await supabase.from('stores').insert({
            id: generatedStoreId,
            user_id: targetUser.id,
            email: targetUser.email,
            store_name: grantStoreName.trim(),
            connected_tools: [grantToolSlug],
            is_active: true
          });
        }
      }
      
      toast({ title: 'Success', description: 'Manual grant applied successfully' });
      setIsGrantModalOpen(false);
      setGrantEmail('');
      setGrantReason('');
      setGrantEndDate('');
      setGrantStoreName('');
      fetchSubscriptions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'canceled': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'past_due': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <AdminLayout title="Subscriptions" description="Manage user tool access and manual grants">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-text-main">
                <CreditCard className="h-6 w-6 text-primary" />
                Access Records
              </CardTitle>
              <CardDescription className="text-text-muted">
                {userIdFilter && (
                  <Badge variant="outline" className="mt-2 border-primary/30 text-primary flex items-center gap-1 w-fit">
                    Filtered by User
                    <FilterX className="h-3 w-3 ml-1 cursor-pointer hover:text-white" onClick={clearUserIdFilter} />
                  </Badge>
                )}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-background-dark border-primary/30">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-primary/20">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => setIsGrantModalOpen(true)} className="bg-primary hover:bg-primary/90 text-background-dark">
                <Plus className="h-4 w-4 mr-2" />
                Manual Grant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-lg border border-primary/20 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-primary/20 hover:bg-primary/5">
                      <TableHead className="text-text-muted">User Email</TableHead>
                      <TableHead className="text-text-muted">Tool</TableHead>
                      <TableHead className="text-text-muted">Status</TableHead>
                      <TableHead className="text-text-muted">Expires</TableHead>
                      <TableHead className="text-text-muted">Type</TableHead>
                      <TableHead className="text-text-muted text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-text-muted">
                          No subscriptions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubs.map((sub) => (
                        <TableRow key={sub.id} className="border-primary/20 hover:bg-primary/5">
                          <TableCell className="font-medium text-text-main">
                            {sub.user_email}
                          </TableCell>
                          <TableCell className="text-text-main">
                            {sub.product_slug}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(sub.status)}>
                              {sub.status.toUpperCase()}
                            </Badge>
                            {sub.cancel_at_period_end && (
                              <Badge variant="outline" className="ml-2 border-orange-500/30 text-orange-400">Cancels Soon</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-text-muted">
                            {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Lifetime'}
                          </TableCell>
                          <TableCell>
                            {sub.manually_granted ? (
                              <div className="flex flex-col">
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 w-fit">Manual</Badge>
                                <span className="text-xs text-text-muted mt-1 truncate max-w-[120px]" title={sub.grant_reason || ''}>
                                  {sub.grant_reason}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="border-primary/30 text-text-muted">Stripe</Badge>
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
                                  setEditDateSub(sub);
                                  setNewEndDate(sub.current_period_end ? new Date(sub.current_period_end).toISOString().split('T')[0] : '');
                                }} className="cursor-pointer">
                                  <CalendarIcon className="h-4 w-4 mr-2" /> Change Expiry Date
                                </DropdownMenuItem>
                                {sub.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleRevoke(sub)} className="cursor-pointer text-yellow-500 focus:text-yellow-500 focus:bg-yellow-500/10">
                                    <Ban className="h-4 w-4 mr-2" /> Revoke Access
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-primary/20" />
                                <DropdownMenuItem onClick={() => setDeleteSub(sub)} className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Record
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

      {/* Edit Date Modal */}
      <Dialog open={!!editDateSub} onOpenChange={(open) => !open && setEditDateSub(null)}>
        <DialogContent className="bg-surface-dark border-primary/20 text-text-main">
          <DialogHeader>
            <DialogTitle>Change Expiry Date</DialogTitle>
            <DialogDescription>
              Update the end date for {editDateSub?.user_email}'s access to {editDateSub?.product_slug}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Expiry Date</Label>
              <Input 
                type="date"
                value={newEndDate} 
                onChange={e => setNewEndDate(e.target.value)} 
                className="bg-background-dark border-primary/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDateSub(null)} className="border-primary/30 hover:bg-primary/10 text-white">Cancel</Button>
            <Button onClick={handleDateEditSubmit} disabled={isActionLoading || !newEndDate} className="bg-primary hover:bg-primary/90 text-background-dark">
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteSub} onOpenChange={(open) => !open && setDeleteSub(null)}>
        <DialogContent className="bg-surface-dark border-red-500/50 text-text-main">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Record
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              This will permanently delete the subscription record from the database. 
              If this is an active Stripe subscription, it will not cancel it in Stripe!
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
            <Button variant="outline" onClick={() => { setDeleteSub(null); setDeleteConfirmation(''); }} className="border-primary/30 hover:bg-primary/10 text-white">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSubmit} 
              disabled={deleteConfirmation !== 'DELETE' || isActionLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Grant Modal */}
      <Dialog open={isGrantModalOpen} onOpenChange={setIsGrantModalOpen}>
        <DialogContent className="bg-surface-dark border-primary/20 text-text-main sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manual Grant Access</DialogTitle>
            <DialogDescription>
              Grant a user free access to a tool.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User Email</Label>
              <Input 
                type="email"
                placeholder="user@example.com"
                value={grantEmail} 
                onChange={e => setGrantEmail(e.target.value)} 
                className="bg-background-dark border-primary/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Tool</Label>
              <Select value={grantToolSlug} onValueChange={setGrantToolSlug}>
                <SelectTrigger className="bg-background-dark border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-primary/20">
                  <SelectItem value="cpbot">CP Bot</SelectItem>
                  <SelectItem value="listflow">ListFlow</SelectItem>
                  <SelectItem value="orderbot">Order Bot</SelectItem>
                  <SelectItem value="invoicegen">Invoice Generator</SelectItem>
                  <SelectItem value="returnlabels">Return Labels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {MULTI_STORE_TOOLS.includes(grantToolSlug) && (
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input 
                  placeholder="e.g. My eBay Store 1"
                  value={grantStoreName} 
                  onChange={e => setGrantStoreName(e.target.value)} 
                  className="bg-background-dark border-primary/30 text-white"
                />
                <p className="text-xs text-text-muted">Required. A store_id UUID will be auto-generated.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input 
                type="date"
                value={grantEndDate} 
                onChange={e => setGrantEndDate(e.target.value)} 
                className="bg-background-dark border-primary/30 text-white text-muted-foreground"
              />
              <p className="text-xs text-text-muted">Leave empty for lifetime access.</p>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input 
                placeholder="e.g. VIP Client, Bug Compensation"
                value={grantReason} 
                onChange={e => setGrantReason(e.target.value)} 
                className="bg-background-dark border-primary/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrantModalOpen(false)} className="border-primary/30 hover:bg-primary/10 text-white">Cancel</Button>
            <Button onClick={handleGrantSubmit} disabled={isActionLoading} className="bg-primary hover:bg-primary/90 text-background-dark">
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
