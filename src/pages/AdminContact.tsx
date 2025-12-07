/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Clock, Save, Trash2, Eye, FileDown, Loader2, Settings, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/AdminLayout';

interface Contact {
    id: string;
    name: string;
    email: string;
    message: string;
    use_case: string | null;
    team_size: string | null;
    status: string;
    attachments: string[] | null;
    user_id: string | null;
    created_at: string;
}

interface ContactSettings {
    contact_address: { line1: string; line2: string };
    contact_email: string;
    contact_phone: string;
    business_hours: { weekdays: string; saturday: string; sunday: string; enterprise: string };
}

const defaultSettings: ContactSettings = {
    contact_address: { line1: '3/33-37 Warialda St', line2: 'Kogarah NSW 2217' },
    contact_email: 'dsclub.au@outlook.com',
    contact_phone: '+61 404 242 373',
    business_hours: {
        weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM AEST',
        saturday: 'Saturday: 10:00 AM - 4:00 PM AEST',
        sunday: 'Sunday: Closed',
        enterprise: '24/7 Support for Enterprise Clients'
    }
};

const AdminContact = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchSettings = useCallback(async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('site_settings')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                const settingsObj: any = {};
                data.forEach((item: any) => {
                    settingsObj[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
                });
                setSettings({ ...defaultSettings, ...settingsObj });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }, []);

    const fetchContacts = useCallback(async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContacts(data || []);
        } catch (error) {
            console.error('Error loading contacts:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to load contacts',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSettings();
        fetchContacts();
    }, [fetchSettings, fetchContacts]);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const settingsToSave = [
                { key: 'contact_address', value: settings.contact_address },
                { key: 'contact_email', value: settings.contact_email },
                { key: 'contact_phone', value: settings.contact_phone },
                { key: 'business_hours', value: settings.business_hours },
            ];

            for (const setting of settingsToSave) {
                const { error } = await (supabase as any)
                    .from('site_settings')
                    .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });

                if (error) throw error;
            }

            toast({
                title: 'Settings saved',
                description: 'Contact page settings have been updated.',
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to save settings',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const deleteContact = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('contacts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setContacts(contacts.filter(c => c.id !== id));
            toast({
                title: 'Contact deleted',
                description: 'The contact submission has been removed.',
            });
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete contact',
                variant: 'destructive',
            });
        }
    };

    const updateContactStatus = async (id: string, status: string) => {
        try {
            const { error } = await (supabase as any)
                .from('contacts')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            setContacts(contacts.map(c => c.id === id ? { ...c, status } : c));
            toast({
                title: 'Status updated',
                description: `Contact marked as ${status}.`,
            });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update status',
                variant: 'destructive',
            });
        }
    };

    const toggleContactSelection = (contactId: string) => {
        const newSelection = new Set(selectedContacts);
        if (newSelection.has(contactId)) {
            newSelection.delete(contactId);
        } else {
            newSelection.add(contactId);
        }
        setSelectedContacts(newSelection);
    };

    const toggleAllContacts = () => {
        if (selectedContacts.size === contacts.length) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(contacts.map(c => c.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedContacts.size === 0) return;

        try {
            for (const id of selectedContacts) {
                await (supabase as any).from('contacts').delete().eq('id', id);
            }

            setContacts(contacts.filter(c => !selectedContacts.has(c.id)));
            setSelectedContacts(new Set());
            toast({
                title: 'Contacts deleted',
                description: `${selectedContacts.size} contact(s) have been removed.`,
            });
        } catch (error) {
            console.error('Error deleting contacts:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete some contacts',
                variant: 'destructive',
            });
        }
    };

    const handleExport = () => {
        const dataToExport = selectedContacts.size > 0
            ? contacts.filter(c => selectedContacts.has(c.id))
            : contacts;

        const csv = [
            ['Name', 'Email', 'Message', 'Use Case', 'Team Size', 'Status', 'Date'].join(','),
            ...dataToExport.map(c => [
                `"${c.name}"`,
                `"${c.email}"`,
                `"${c.message.replace(/"/g, '""')}"`,
                `"${c.use_case || ''}"`,
                `"${c.team_size || ''}"`,
                `"${c.status || 'new'}"`,
                `"${new Date(c.created_at).toLocaleDateString()}"`,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: 'Export complete',
            description: `${dataToExport.length} contact(s) exported to CSV.`,
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            read: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            replied: 'bg-green-500/20 text-green-400 border-green-500/30',
            archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        };
        return variants[status] || variants.new;
    };

    return (
        <AdminLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-6"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Contact Management</h1>
                    <p className="text-gray-400">Manage contact page settings and form submissions</p>
                </div>

                <Tabs defaultValue="submissions" className="space-y-6">
                    <TabsList className="bg-gray-800/50 border border-gray-700">
                        <TabsTrigger value="submissions" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                            <Users className="w-4 h-4 mr-2" />
                            Submissions
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                            <Settings className="w-4 h-4 mr-2" />
                            Page Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="submissions">
                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardHeader>
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <CardTitle className="text-white">Contact Submissions</CardTitle>
                                        <CardDescription>View and manage form submissions from visitors</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedContacts.size > 0 && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleBulkDelete}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete ({selectedContacts.size})
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExport}
                                            className="border-primary/50 text-primary hover:bg-primary/10"
                                        >
                                            <FileDown className="w-4 h-4 mr-2" />
                                            Export CSV
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : contacts.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        No contact submissions yet.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-gray-800 hover:bg-transparent">
                                                    <TableHead className="w-10">
                                                        <Checkbox
                                                            checked={selectedContacts.size === contacts.length}
                                                            onCheckedChange={toggleAllContacts}
                                                        />
                                                    </TableHead>
                                                    <TableHead className="text-gray-400">Name</TableHead>
                                                    <TableHead className="text-gray-400">Email</TableHead>
                                                    <TableHead className="text-gray-400">Use Case</TableHead>
                                                    <TableHead className="text-gray-400">Status</TableHead>
                                                    <TableHead className="text-gray-400">Date</TableHead>
                                                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {contacts.map((contact) => (
                                                    <TableRow key={contact.id} className="border-gray-800 hover:bg-gray-800/50">
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedContacts.has(contact.id)}
                                                                onCheckedChange={() => toggleContactSelection(contact.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-white font-medium">{contact.name}</TableCell>
                                                        <TableCell className="text-gray-300">{contact.email}</TableCell>
                                                        <TableCell className="text-gray-300">{contact.use_case || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge className={getStatusBadge(contact.status || 'new')}>
                                                                {contact.status || 'new'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-gray-400">
                                                            {new Date(contact.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setSelectedContact(contact);
                                                                        setViewDialogOpen(true);
                                                                    }}
                                                                    className="h-8 w-8 text-gray-400 hover:text-white"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => deleteContact(contact.id)}
                                                                    className="h-8 w-8 text-gray-400 hover:text-red-400"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
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
                    </TabsContent>

                    <TabsContent value="settings">
                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white">Contact Page Settings</CardTitle>
                                <CardDescription>Edit the contact information displayed on the public contact page</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary mb-2">
                                            <MapPin className="w-5 h-5" />
                                            <Label className="text-lg font-semibold">Address</Label>
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                value={settings.contact_address.line1}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    contact_address: { ...settings.contact_address, line1: e.target.value }
                                                })}
                                                placeholder="Address Line 1"
                                                className="bg-gray-800 border-gray-700 text-white"
                                            />
                                            <Input
                                                value={settings.contact_address.line2}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    contact_address: { ...settings.contact_address, line2: e.target.value }
                                                })}
                                                placeholder="Address Line 2"
                                                className="bg-gray-800 border-gray-700 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary mb-2">
                                            <Mail className="w-5 h-5" />
                                            <Label className="text-lg font-semibold">Email</Label>
                                        </div>
                                        <Input
                                            type="email"
                                            value={settings.contact_email}
                                            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                                            placeholder="contact@example.com"
                                            className="bg-gray-800 border-gray-700 text-white"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary mb-2">
                                            <Phone className="w-5 h-5" />
                                            <Label className="text-lg font-semibold">Phone</Label>
                                        </div>
                                        <Input
                                            type="tel"
                                            value={settings.contact_phone}
                                            onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                                            placeholder="+1 234 567 890"
                                            className="bg-gray-800 border-gray-700 text-white"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary mb-2">
                                            <Clock className="w-5 h-5" />
                                            <Label className="text-lg font-semibold">Business Hours</Label>
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                value={settings.business_hours.weekdays}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    business_hours: { ...settings.business_hours, weekdays: e.target.value }
                                                })}
                                                placeholder="Weekdays hours"
                                                className="bg-gray-800 border-gray-700 text-white"
                                            />
                                            <Input
                                                value={settings.business_hours.saturday}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    business_hours: { ...settings.business_hours, saturday: e.target.value }
                                                })}
                                                placeholder="Saturday hours"
                                                className="bg-gray-800 border-gray-700 text-white"
                                            />
                                            <Input
                                                value={settings.business_hours.sunday}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    business_hours: { ...settings.business_hours, sunday: e.target.value }
                                                })}
                                                placeholder="Sunday hours"
                                                className="bg-gray-800 border-gray-700 text-white"
                                            />
                                            <Input
                                                value={settings.business_hours.enterprise}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    business_hours: { ...settings.business_hours, enterprise: e.target.value }
                                                })}
                                                placeholder="Enterprise support note"
                                                className="bg-gray-800 border-gray-700 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-800">
                                    <Button
                                        onClick={saveSettings}
                                        disabled={isSaving}
                                        className="bg-primary text-black hover:bg-primary/90"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Save Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* View Contact Dialog */}
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Contact Details</DialogTitle>
                            <DialogDescription>View and manage this contact submission</DialogDescription>
                        </DialogHeader>
                        {selectedContact && (
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-400">Name</Label>
                                        <p className="text-white font-medium">{selectedContact.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400">Email</Label>
                                        <p className="text-white">{selectedContact.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400">Use Case</Label>
                                        <p className="text-white">{selectedContact.use_case || '-'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400">Team Size</Label>
                                        <p className="text-white">{selectedContact.team_size || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-gray-400">Message</Label>
                                    <p className="text-white whitespace-pre-wrap bg-gray-800 p-4 rounded-lg mt-2">
                                        {selectedContact.message}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                    <div>
                                        <Label className="text-gray-400 mr-3">Status</Label>
                                        <Select
                                            value={selectedContact.status || 'new'}
                                            onValueChange={(value) => {
                                                updateContactStatus(selectedContact.id, value);
                                                setSelectedContact({ ...selectedContact, status: value });
                                            }}
                                        >
                                            <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">New</SelectItem>
                                                <SelectItem value="read">Read</SelectItem>
                                                <SelectItem value="replied">Replied</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        Submitted: {new Date(selectedContact.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </motion.div>
        </AdminLayout>
    );
};

export default AdminContact;
