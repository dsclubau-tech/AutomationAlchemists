import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, CreditCard, Wrench, Activity, Calendar } from 'lucide-react';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

interface AuditLog {
    id: string;
    action: string;
    target_email: string | null;
    created_at: string;
    admin_email: string;
}

const AdminOverview = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubs: 0,
        manualGrants: 0,
        maintenanceTools: 0,
    });
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        analytics.trackPageView('/admin/overview');
    }, []);

    const fetchOverviewData = useCallback(async () => {
        try {
            // Fetch Total Users
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Fetch Active Subscriptions
            const { count: activeSubs } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Fetch Manual Grants
            const { count: manualGrants } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('manually_granted', true);

            // Fetch Tools on Maintenance
            const { count: maintenanceTools } = await supabase
                .from('tools')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'maintenance');

            setStats({
                totalUsers: totalUsers || 0,
                activeSubs: activeSubs || 0,
                manualGrants: manualGrants || 0,
                maintenanceTools: maintenanceTools || 0,
            });

            // Fetch recent audit logs
            const { data: logsData, error: logsError } = await supabase
                .from('admin_audit_log')
                .select('id, action, target_email, admin_email, created_at')
                .order('created_at', { ascending: false })
                .limit(10);

            if (logsError) {
                console.error('Error fetching audit logs:', logsError);
            } else {
                setAuditLogs(logsData || []);
            }
        } catch (error) {
            console.error('Error loading overview data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOverviewData();
    }, [fetchOverviewData]);

    const formatAction = (action: string) => {
        return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getActionColor = (action: string) => {
        if (action.includes('delete') || action.includes('revoke')) return 'bg-red-500/10 text-red-600 border border-red-500/20';
        if (action.includes('grant') || action.includes('create')) return 'bg-green-500/10 text-green-600 border border-green-500/20';
        return 'bg-teal-600/10 text-teal-600 border border-teal-600/20';
    };

    return (
        <AdminLayout title="Overview" description="Platform statistics and recent activity">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border border-teal-600/20 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <div className="p-3 bg-teal-600/10 rounded-2xl mb-3 text-teal-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium text-teal-900/70 mb-1">Total Users</p>
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                            ) : (
                                <h3 className="text-3xl font-bold text-teal-900 font-display">{stats.totalUsers}</h3>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-teal-600/20 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <div className="p-3 bg-green-500/10 rounded-2xl mb-3 text-green-600">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium text-teal-900/70 mb-1">Active Subscriptions</p>
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                            ) : (
                                <h3 className="text-3xl font-bold text-teal-900 font-display">{stats.activeSubs}</h3>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-teal-600/20 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <div className="p-3 bg-teal-600/10 rounded-2xl mb-3 text-teal-600">
                                <Activity className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium text-teal-900/70 mb-1">Manual Grants</p>
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                            ) : (
                                <h3 className="text-3xl font-bold text-teal-900 font-display">{stats.manualGrants}</h3>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-teal-600/20 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <div className="p-3 bg-amber-500/10 rounded-2xl mb-3 text-amber-600">
                                <Wrench className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium text-teal-900/70 mb-1">Tools in Maintenance</p>
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                            ) : (
                                <h3 className="text-3xl font-bold text-teal-900 font-display">{stats.maintenanceTools}</h3>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card className="border border-teal-600/20 bg-white shadow-sm">
                    <CardHeader className="border-b border-teal-600/10 pb-4">
                        <CardTitle className="text-xl font-bold text-teal-900 font-display">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                            </div>
                        ) : auditLogs.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="h-12 w-12 mx-auto text-teal-900/40 mb-4" />
                                <p className="text-teal-900/70 font-medium">No recent activity logged.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-teal-600/20">
                                <Table>
                                    <TableHeader className="bg-mint-50/50">
                                        <TableRow className="border-b border-teal-600/20">
                                            <TableHead className="text-teal-900 font-bold">Action</TableHead>
                                            <TableHead className="text-teal-900 font-bold">Target</TableHead>
                                            <TableHead className="text-teal-900 font-bold">Admin</TableHead>
                                            <TableHead className="text-teal-900 font-bold">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {auditLogs.map((log) => (
                                            <TableRow key={log.id} className="border-b border-teal-600/10 hover:bg-teal-600/5 transition-colors">
                                                <TableCell>
                                                    <Badge className={getActionColor(log.action)}>
                                                        {formatAction(log.action)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium text-teal-900">
                                                    {log.target_email || 'System'}
                                                </TableCell>
                                                <TableCell className="text-teal-900/70">
                                                    {log.admin_email}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-teal-900/70">
                                                        <Calendar className="h-4 w-4 text-teal-600" />
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
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

export default AdminOverview;
