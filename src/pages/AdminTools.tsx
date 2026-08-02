import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PenTool, Edit, Wrench, EyeOff, CheckCircle2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

interface Tool {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  status: 'coming_soon' | 'available' | 'maintenance' | 'hidden';
  price_monthly: number;
  maintenance_message: string | null;
}

const AdminTools = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit Modal State
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [editStatus, setEditStatus] = useState<Tool['status']>('available');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editMessage, setEditMessage] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    analytics.trackPageView('/admin/tools');
  }, []);

  const fetchTools = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error('Error loading tools:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load tools',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleEditSubmit = async () => {
    if (!editTool) return;
    setIsActionLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('admin_execute_action', {
        p_action_type: 'change_tool_status',
        p_target_user_id: null,
        p_target_email: null,
        p_payload: {
          tool_slug: editTool.slug,
          status: editStatus,
          price: editPrice,
          maintenance_message: editStatus === 'maintenance' ? editMessage : null
        }
      });
      
      if (error) throw error;
      
      setTools(tools.map(t => t.id === editTool.id ? { 
        ...t, 
        status: editStatus, 
        price_monthly: editPrice,
        maintenance_message: editStatus === 'maintenance' ? editMessage : null
      } : t));
      
      toast({ title: 'Success', description: `${editTool.name} status updated successfully.` });
      setEditTool(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: Tool['status']) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Available</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1 w-fit"><Wrench className="w-3 h-3"/> Maintenance</Badge>;
      case 'coming_soon':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Coming Soon</Badge>;
      case 'hidden':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center gap-1 w-fit"><EyeOff className="w-3 h-3"/> Hidden</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Tools & Status" description="Manage the status and pricing of your platform tools">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-text-main">
              <PenTool className="h-6 w-6 text-primary" />
              Platform Tools
            </CardTitle>
            <CardDescription className="text-text-muted">
              Changing a tool's status will immediately affect how it appears on user dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <Card key={tool.id} className="border-primary/20 bg-background-dark">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-text-main font-display mb-1">{tool.name}</h3>
                          <p className="text-sm text-text-muted">{tool.short_description}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditTool(tool);
                            setEditStatus(tool.status);
                            setEditPrice(tool.price_monthly);
                            setEditMessage(tool.maintenance_message || '');
                          }}
                          className="border-primary/30 text-text-main hover:bg-primary/10 flex-shrink-0"
                        >
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Status:</span>
                          {getStatusBadge(tool.status)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Monthly Price:</span>
                          <span className="text-sm font-medium text-text-main">£{tool.price_monthly.toFixed(2)}</span>
                        </div>

                        {tool.status === 'maintenance' && tool.maintenance_message && (
                          <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                            <span className="text-xs font-semibold text-yellow-500 block mb-1">Maintenance Message:</span>
                            <span className="text-sm text-yellow-400/90">{tool.maintenance_message}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Tool Modal */}
      <Dialog open={!!editTool} onOpenChange={(open) => !open && setEditTool(null)}>
        <DialogContent className="bg-surface-dark border-primary/20 text-text-main">
          <DialogHeader>
            <DialogTitle>Edit Tool Settings</DialogTitle>
            <DialogDescription>
              Configure settings for <strong className="text-white">{editTool?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v: Tool['status']) => setEditStatus(v)}>
                <SelectTrigger className="bg-background-dark border-primary/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-primary/20">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {editStatus === 'maintenance' && (
              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Textarea 
                  placeholder="e.g. We are currently upgrading our servers. Back in 1 hour."
                  value={editMessage} 
                  onChange={e => setEditMessage(e.target.value)} 
                  className="bg-background-dark border-yellow-500/50 text-white focus:border-yellow-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Monthly Price (£)</Label>
              <Input 
                type="number"
                step="0.01"
                min="0"
                value={editPrice} 
                onChange={e => setEditPrice(parseFloat(e.target.value) || 0)} 
                className="bg-background-dark border-primary/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTool(null)} className="border-primary/30 hover:bg-primary/10 text-white">Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={isActionLoading} className="bg-primary hover:bg-primary/90 text-background-dark">
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTools;
