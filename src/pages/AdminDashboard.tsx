import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, User, Calendar, Paperclip, Download, Trash2, FileDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  attachments: string[] | null;
  user_id: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    analytics.trackPageView('/admin');
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      setContacts(contactsData || []);
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
    fetchContacts();
  }, [fetchContacts]);

  const downloadAttachment = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('contact-attachments')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download attachment',
        variant: 'destructive',
      });
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
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
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', Array.from(selectedContacts));

      if (error) throw error;

      toast({
        title: 'Contacts deleted',
        description: `${selectedContacts.size} contact(s) deleted successfully`,
      });

      setContacts(contacts.filter(c => !selectedContacts.has(c.id)));
      setSelectedContacts(new Set());
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete contacts',
        variant: 'destructive',
      });
    }
  };

  const handleBulkExport = () => {
    if (selectedContacts.size === 0) return;

    const selectedData = contacts.filter(c => selectedContacts.has(c.id));
    const csv = [
      ['Name', 'Email', 'Message', 'Date'].join(','),
      ...selectedData.map(c => [
        c.name,
        c.email,
        `"${c.message.replace(/"/g, '""')}"`,
        new Date(c.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `${selectedContacts.size} contact(s) exported`,
    });
  };

  return (
    <AdminLayout title="Dashboard" description="Manage contact form submissions">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-main">
              <Mail className="h-5 w-5 text-primary" />
              Contact Form Submissions
            </CardTitle>
            <CardDescription className="text-text-muted">
              Total submissions: {contacts.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedContacts.size > 0 && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm font-medium text-text-main">
                  {selectedContacts.size} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  className="border-primary/30 text-text-main hover:bg-primary/10"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
            {contacts.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-text-muted mb-4" />
                <p className="text-text-muted">
                  No contact form submissions yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-primary/20">
                <Table>
                  <TableHeader>
                    <TableRow className="border-primary/20 hover:bg-primary/5">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedContacts.size === contacts.length}
                          onCheckedChange={toggleAllContacts}
                        />
                      </TableHead>
                      <TableHead className="text-text-muted">Name</TableHead>
                      <TableHead className="text-text-muted">Email</TableHead>
                      <TableHead className="text-text-muted">Message</TableHead>
                      <TableHead className="text-text-muted">Type</TableHead>
                      <TableHead className="text-text-muted">Attachments</TableHead>
                      <TableHead className="text-text-muted">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id} className="border-primary/20 hover:bg-primary/5">
                        <TableCell>
                          <Checkbox
                            checked={selectedContacts.has(contact.id)}
                            onCheckedChange={() => toggleContactSelection(contact.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-text-main">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-text-muted" />
                            {contact.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-primary hover:underline"
                          >
                            {contact.email}
                          </a>
                        </TableCell>
                        <TableCell className="max-w-md text-text-muted">
                          <p className="truncate" title={contact.message}>
                            {contact.message}
                          </p>
                        </TableCell>
                        <TableCell>
                          {contact.user_id ? (
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              Authenticated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-primary/30 text-text-muted">
                              Anonymous
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.attachments && contact.attachments.length > 0 ? (
                            <div className="space-y-1">
                              {contact.attachments.map((path, idx) => (
                                <Button
                                  key={idx}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadAttachment(path)}
                                  className="h-auto p-1 text-primary hover:bg-primary/10"
                                >
                                  <Paperclip className="h-3 w-3 mr-1" />
                                  <Download className="h-3 w-3" />
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-text-muted">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <Calendar className="h-4 w-4" />
                            {new Date(contact.created_at).toLocaleDateString()}
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

        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader>
            <CardTitle className="text-text-main">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-text-muted">
            <p>• Click on email addresses to compose a reply</p>
            <p>• Use the attachment download buttons to view uploaded files</p>
            <p>• Anonymous submissions don't have a user account associated</p>
            <p>• All attachments are stored securely in a private storage bucket</p>
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;