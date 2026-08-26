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

const MULTI_STORE_TOOLS = ['orderbot', 'listflow'];

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
  const [registeredUsers, setRegisteredUsers] = useState<Array<{ id: string; email: string; full_name: string | null }>>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  useEffect(() => {
    if (isGrantModalOpen) {
      supabase.rpc('admin_get_users').then(({ data }) => {
        if (data) setRegisteredUsers(data);
      });
    } else {
      setShowEmailSuggestions(false);
    }
  }, [isGrantModalOpen]);

  const emailSuggestions = grantEmail.trim()
    ? registeredUsers.filter(u =>
        u.email.toLowerCase().includes(grantEmail.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(grantEmail.toLowerCase()))
      )
    : [];


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
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'delete_subscription',
          target_user_id: deleteSub.user_id,
          target_email: deleteSub.user_email,
          target_subscription_id: deleteSub.id
        }
      });
      
      if (error) throw new Error(error.message || 'Failed to delete subscription');
      
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
          .maybeSingle();

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
      fetchSubscriptions(); // Refresh to get the new record with its ID
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
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
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
        <Card className="border border-teal-600/20 bg-white shadow-sm">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-teal-600/10">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-teal-900 font-display">
                <CreditCard className="h-6 w-6 text-teal-600" />
                Access Records
              </CardTitle>
              <CardDescription className="text-teal-900/70">
                {userIdFilter && (
                  <Badge variant="outline" className="mt-2 border-teal-600/30 text-teal-900 flex items-center gap-1 w-fit">
                    Filtered by User
                    <FilterX className="h-3 w-3 ml-1 cursor-pointer hover:text-teal-600" onClick={clearUserIdFilter} />
                  </Badge>
                )}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white border-teal-600/20 text-teal-900 shadow-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-teal-600/20 text-teal-900 shadow-xl">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => setIsGrantModalOpen(true)} className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Manual Grant
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
                      <TableHead className="text-teal-900 font-bold">User Email</TableHead>
                      <TableHead className="text-teal-900 font-bold">Tool</TableHead>
                      <TableHead className="text-teal-900 font-bold">Status</TableHead>
                      <TableHead className="text-teal-900 font-bold">Expires</TableHead>
                      <TableHead className="text-teal-900 font-bold">Type</TableHead>
                      <TableHead className="text-teal-900 font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-teal-900/60 font-medium">
                          No subscriptions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubs.map((sub) => (
                        <TableRow key={sub.id} className="border-b border-teal-600/10 hover:bg-teal-600/5 transition-colors">
                          <TableCell className="font-medium text-teal-900">
                            {sub.user_email}
                          </TableCell>
                          <TableCell className="text-teal-900 font-medium">
                            {sub.product_slug}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(sub.status)}>
                              {sub.status.toUpperCase()}
                            </Badge>
                            {sub.cancel_at_period_end && (
                              <Badge variant="outline" className="ml-2 border-orange-500/30 text-orange-600 bg-orange-50">Cancels Soon</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-teal-900/70">
                            {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Lifetime'}
                          </TableCell>
                          <TableCell>
                            {sub.manually_granted ? (
                              <div className="flex flex-col">
                                <Badge className="bg-purple-500/10 text-purple-700 border border-purple-500/20 w-fit">Manual</Badge>
                                <span className="text-xs text-teal-900/60 mt-1 truncate max-w-[120px]" title={sub.grant_reason || ''}>
                                  {sub.grant_reason}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="border-teal-600/30 text-teal-900/70">Stripe</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-900 hover:bg-teal-600/10">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border-teal-600/20 text-teal-900 shadow-xl">
                                <DropdownMenuItem onClick={() => {
                                  setEditDateSub(sub);
                                  setNewEndDate(sub.current_period_end ? new Date(sub.current_period_end).toISOString().split('T')[0] : '');
                                }} className="cursor-pointer hover:bg-teal-600/10">
                                  <CalendarIcon className="h-4 w-4 mr-2 text-teal-600" /> Change Expiry Date
                                </DropdownMenuItem>
                                {sub.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleRevoke(sub)} className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                                    <Ban className="h-4 w-4 mr-2" /> Revoke Access
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-teal-600/10" />
                                <DropdownMenuItem onClick={() => setDeleteSub(sub)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
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
        <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-teal-900">Change Expiry Date</DialogTitle>
            <DialogDescription className="text-teal-900/70">
              Update the end date for {editDateSub?.user_email}'s access to {editDateSub?.product_slug}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-teal-900 font-semibold">New Expiry Date</Label>
              <Input 
                type="date"
                value={newEndDate} 
                onChange={e => setNewEndDate(e.target.value)} 
                className="bg-white border-teal-600/20 text-teal-900 focus:border-teal-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDateSub(null)} className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10">Cancel</Button>
            <Button onClick={handleDateEditSubmit} disabled={isActionLoading || !newEndDate} className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm">
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteSub} onOpenChange={(open) => !open && setDeleteSub(null)}>
        <DialogContent className="bg-white border border-red-500/30 text-teal-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 font-display text-xl">
              <Trash2 className="h-5 w-5" />
              Delete Record
            </DialogTitle>
            <DialogDescription className="text-teal-900/70">
              This will permanently delete the subscription record from the database. 
              If this is an active Stripe subscription, it will not cancel it in Stripe!
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
            <Button variant="outline" onClick={() => { setDeleteSub(null); setDeleteConfirmation(''); }} className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSubmit} 
              disabled={deleteConfirmation !== 'DELETE' || isActionLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Grant Modal */}
      <Dialog open={isGrantModalOpen} onOpenChange={setIsGrantModalOpen}>
        <DialogContent className="bg-white border border-teal-600/20 text-teal-900 sm:max-w-[425px] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-teal-900">Manual Grant Access</DialogTitle>
            <DialogDescription className="text-teal-900/70">
              Grant a user free access to a tool.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 relative">
              <Label className="text-teal-900 font-semibold">User Email</Label>
              <Input 
                type="email"
                placeholder="Search user email (e.g. fa...)"
                value={grantEmail} 
                onChange={e => {
                  setGrantEmail(e.target.value);
                  setShowEmailSuggestions(true);
                }} 
                onFocus={() => setShowEmailSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowEmailSuggestions(false), 200);
                }} 
                className="bg-white border-teal-600/20 text-teal-900 focus:border-teal-600"
                autoComplete="off"
              />
              {showEmailSuggestions && grantEmail.trim().length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-xl bg-white border border-teal-600/30 shadow-2xl py-1">
                  {emailSuggestions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-teal-900/60 italic">
                      No matching registered users found
                    </div>
                  ) : (
                    emailSuggestions.map(u => (
                      <div
                        key={u.id}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-teal-600/10 flex flex-col transition-colors border-b border-teal-600/10 last:border-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setGrantEmail(u.email);
                          setShowEmailSuggestions(false);
                        }}
                      >
                        <span className="font-semibold text-teal-900">{u.email}</span>
                        {u.full_name && (
                          <span className="text-xs text-teal-900/60">{u.full_name}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-teal-900 font-semibold">Tool</Label>
              <Select value={grantToolSlug} onValueChange={setGrantToolSlug}>
                <SelectTrigger className="bg-white border-teal-600/20 text-teal-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-teal-600/20 text-teal-900 shadow-xl">
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
                <Label className="text-teal-900 font-semibold">Store Name</Label>
                <Input 
                  placeholder="e.g. My eBay Store 1"
                  value={grantStoreName} 
                  onChange={e => setGrantStoreName(e.target.value)} 
                  className="bg-white border-teal-600/20 text-teal-900"
                />
                <p className="text-xs text-teal-900/60">Required. A store_id UUID will be auto-generated.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-teal-900 font-semibold">Expiry Date (Optional)</Label>
              <Input 
                type="date"
                value={grantEndDate} 
                onChange={e => setGrantEndDate(e.target.value)} 
                className="bg-white border-teal-600/20 text-teal-900"
              />
              <p className="text-xs text-teal-900/60">Leave empty for lifetime access.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-teal-900 font-semibold">Reason</Label>
              <Input 
                placeholder="e.g. VIP Client, Bug Compensation"
                value={grantReason} 
                onChange={e => setGrantReason(e.target.value)} 
                className="bg-white border-teal-600/20 text-teal-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrantModalOpen(false)} className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10">Cancel</Button>
            <Button onClick={handleGrantSubmit} disabled={isActionLoading} className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm">
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
