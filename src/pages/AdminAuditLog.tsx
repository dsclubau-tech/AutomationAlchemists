import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ActivitySquare, Search, FileDown, Calendar, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

interface AuditLog {
  id: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  details: any;
  created_at: string;
}

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    analytics.trackPageView('/admin/audit-log');
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = logs.filter(
      l => (l.admin_email && l.admin_email.toLowerCase().includes(query)) || 
           (l.target_email && l.target_email.toLowerCase().includes(query)) ||
           (l.action && l.action.toLowerCase().includes(query))
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  const handleExportCSV = () => {
    const dataToExport = filteredLogs;
    
    if (dataToExport.length === 0) {
      toast({ title: 'Notice', description: 'No data to export' });
      return;
    }

    const csv = [
      ['Date', 'Admin Email', 'Action', 'Target Email', 'Details (JSON)'].join(','),
      ...dataToExport.map(l => [
        `"${new Date(l.created_at).toISOString()}"`,
        `"${l.admin_email}"`,
        `"${l.action}"`,
        `"${l.target_email || 'N/A'}"`,
        `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: 'Export successful', description: `Exported ${dataToExport.length} logs.` });
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('revoke')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (action.includes('grant') || action.includes('create')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <AdminLayout title="Audit Log" description="Immutable record of all administrative actions">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-text-main">
                <ActivitySquare className="h-6 w-6 text-primary" />
                Action History
              </CardTitle>
              <CardDescription className="text-text-muted">
                Showing {filteredLogs.length} of {logs.length} total records
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input 
                  placeholder="Search admin, target, action..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background-dark border-primary/30 text-white"
                />
              </div>
              
              <Button onClick={handleExportCSV} variant="outline" className="border-primary/30 text-text-main hover:bg-primary/10 flex-shrink-0">
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
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
                      <TableHead className="text-text-muted">Date</TableHead>
                      <TableHead className="text-text-muted">Admin</TableHead>
                      <TableHead className="text-text-muted">Action</TableHead>
                      <TableHead className="text-text-muted">Target</TableHead>
                      <TableHead className="text-text-muted text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-text-muted">
                          No audit logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id} className="border-primary/20 hover:bg-primary/5">
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span className="text-text-main flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-text-muted" />
                                {new Date(log.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-text-muted ml-4">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-text-main font-medium">
                            {log.admin_email}
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              {formatAction(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-text-muted">
                            {log.target_email || 'System'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedLog(log)}
                              className="text-primary hover:bg-primary/10 hover:text-primary"
                            >
                              View JSON
                            </Button>
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

      {/* JSON Viewer Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="bg-surface-dark border-primary/20 text-text-main max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Action Payload
            </DialogTitle>
            <DialogDescription>
              Technical details for {selectedLog && formatAction(selectedLog.action)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <pre className="bg-background-dark p-4 rounded-lg border border-primary/20 overflow-x-auto text-sm text-green-400 font-mono">
              {JSON.stringify(selectedLog?.details, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAuditLog;
