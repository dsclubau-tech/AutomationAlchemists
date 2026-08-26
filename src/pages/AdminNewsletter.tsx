import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, Calendar, Trash2, FileDown, Loader2, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import AdminLayout from '@/components/AdminLayout';

interface NewsletterSubscriber {
    id: string;
    email: string;
    subscribed_at: string;
    is_active: boolean;
}

const AdminNewsletter = () => {
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [selectedSubscribers, setSelectedSubscribers] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchSubscribers = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('newsletter_subscribers')
                .select('*')
                .order('subscribed_at', { ascending: false });

            if (error) throw error;

            setSubscribers(data || []);
        } catch (error) {
            console.error('Error loading subscribers:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to load subscribers',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSubscribers();
    }, [fetchSubscribers]);

    const toggleSubscriberSelection = (subscriberId: string) => {
        const newSelected = new Set(selectedSubscribers);
        if (newSelected.has(subscriberId)) {
            newSelected.delete(subscriberId);
        } else {
            newSelected.add(subscriberId);
        }
        setSelectedSubscribers(newSelected);
    };

    const toggleAllSubscribers = () => {
        if (selectedSubscribers.size === subscribers.length) {
            setSelectedSubscribers(new Set());
        } else {
            setSelectedSubscribers(new Set(subscribers.map(s => s.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSubscribers.size === 0) return;

        try {
            const { error } = await supabase
                .from('newsletter_subscribers')
                .delete()
                .in('id', Array.from(selectedSubscribers));

            if (error) throw error;

            toast({
                title: 'Subscribers deleted',
                description: `${selectedSubscribers.size} subscriber(s) deleted successfully`,
            });

            setSubscribers(subscribers.filter(s => !selectedSubscribers.has(s.id)));
            setSelectedSubscribers(new Set());
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete subscribers',
                variant: 'destructive',
            });
        }
    };

    const handleExportCSV = () => {
        const dataToExport = selectedSubscribers.size > 0
            ? subscribers.filter(s => selectedSubscribers.has(s.id))
            : subscribers;

        if (dataToExport.length === 0) {
            toast({
                title: 'No data',
                description: 'No subscribers to export',
                variant: 'destructive',
            });
            return;
        }

        const csv = [
            ['Email', 'Subscribed Date', 'Subscribed Time', 'Status'].join(','),
            ...dataToExport.map(s => {
                const date = new Date(s.subscribed_at);
                return [
                    s.email,
                    date.toLocaleDateString(),
                    date.toLocaleTimeString(),
                    s.is_active ? 'Active' : 'Inactive'
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: 'Export successful',
            description: `${dataToExport.length} subscriber(s) exported`,
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };
    };

    return (
        <AdminLayout title="Newsletter" description="Manage newsletter subscribers">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                <Card className="border-teal-600/20 bg-white border border-teal-600/20 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-teal-900 font-display">
                            <Mail className="h-5 w-5 text-teal-600" />
                            Newsletter Subscribers
                        </CardTitle>
                        <CardDescription className="text-teal-900/70">
                            Total subscribers: {subscribers.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Action Bar */}
                        <div className="mb-4 flex items-center gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportCSV}
                                className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Export {selectedSubscribers.size > 0 ? 'Selected' : 'All'}
                            </Button>
                            {selectedSubscribers.size > 0 && (
                                <>
                                    <span className="text-sm font-medium text-white">
                                        {selectedSubscribers.size} selected
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                            </div>
                        ) : subscribers.length === 0 ? (
                            <div className="text-center py-12">
                                <Mail className="h-12 w-12 mx-auto text-teal-900/70 mb-4" />
                                <p className="text-teal-900/70">
                                    No newsletter subscribers yet
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-teal-600/30">
                                <Table>
                                    <TableHeader className="bg-mint-50/50">
                                        <TableRow className="border-b border-teal-600/10 hover:bg-teal-600/5 transition-colors">
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedSubscribers.size === subscribers.length}
                                                    onCheckedChange={toggleAllSubscribers}
                                                />
                                            </TableHead>
                                            <TableHead className="text-teal-900 font-bold">Email</TableHead>
                                            <TableHead className="text-teal-900 font-bold">Date</TableHead>
                                            <TableHead className="text-teal-900 font-bold">Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscribers.map((subscriber) => {
                                            const { date, time } = formatDateTime(subscriber.subscribed_at);
                                            return (
                                                <TableRow key={subscriber.id} className="border-teal-600/30 hover:bg-primary/5">
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedSubscribers.has(subscriber.id)}
                                                            onCheckedChange={() => toggleSubscriberSelection(subscriber.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <a
                                                            href={`mailto:${subscriber.email}`}
                                                            className="text-teal-600 hover:underline flex items-center gap-2"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                            {subscriber.email}
                                                        </a>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm text-teal-900/70">
                                                            <Calendar className="h-4 w-4" />
                                                            {date}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm text-teal-900/70">
                                                            <Clock className="h-4 w-4" />
                                                            {time}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
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

export default AdminNewsletter;
