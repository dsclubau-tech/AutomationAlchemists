import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, User, Calendar, Paperclip, Download, Trash2, FileDown, Eye, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  use_case?: string | null;
  team_size?: string | null;
  status?: string;
  attachments: string[] | null;
  user_id: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    analytics.trackPageView('/admin');
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: contactsData, error: contactsError } = await (supabase as any)
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

  const deleteContact = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete contact',
        variant: 'destructive',
      });
    }
  };

  const updateContactStatus = async (id: string, status: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
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
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `${dataToExport.length} contact(s) exported`,
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
    <AdminLayout title="Dashboard" description="Manage contact form submissions">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-text-main">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Form Submissions
                </CardTitle>
                <CardDescription className="text-text-muted">
                  Total submissions: {contacts.length}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedContacts.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedContacts.size})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  className="border-primary/30 text-text-main hover:bg-primary/10"
                >
                  <FileDown className="h-4 w-4 mr-2" />
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
                      <TableHead className="text-text-muted">Use Case</TableHead>
                      <TableHead className="text-text-muted">Status</TableHead>
                      <TableHead className="text-text-muted">Attachments</TableHead>
                      <TableHead className="text-text-muted">Date</TableHead>
                      <TableHead className="text-text-muted text-right">Actions</TableHead>
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
                        <TableCell className="text-text-muted">
                          {contact.use_case || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(contact.status || 'new')}>
                            {contact.status || 'new'}
                          </Badge>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedContact(contact);
                                setViewDialogOpen(true);
                              }}
                              className="h-8 w-8 text-text-muted hover:text-text-main"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteContact(contact.id)}
                              className="h-8 w-8 text-text-muted hover:text-red-400"
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

        <Card className="border-primary/20 bg-surface-dark/50">
          <CardHeader>
            <CardTitle className="text-text-main">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-text-muted">
            <p>• Click on email addresses to compose a reply</p>
            <p>• Use the eye icon to view full details and update status</p>
            <p>• Use the attachment download buttons to view uploaded files</p>
            <p>• Export all or selected contacts to CSV for external use</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* View Contact Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-surface-dark border-primary/20 text-text-main max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription className="text-text-muted">View and manage this contact submission</DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-text-muted">Name</Label>
                  <p className="text-text-main font-medium">{selectedContact.name}</p>
                </div>
                <div>
                  <Label className="text-text-muted">Email</Label>
                  <p className="text-text-main">{selectedContact.email}</p>
                </div>
                <div>
                  <Label className="text-text-muted">Use Case</Label>
                  <p className="text-text-main">{selectedContact.use_case || '-'}</p>
                </div>
                <div>
                  <Label className="text-text-muted">Team Size</Label>
                  <p className="text-text-main">{selectedContact.team_size || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-text-muted">Message</Label>
                <p className="text-text-main whitespace-pre-wrap bg-background-dark p-4 rounded-lg mt-2 border border-primary/20">
                  {selectedContact.message}
                </p>
              </div>
              {selectedContact.attachments && selectedContact.attachments.length > 0 && (
                <div>
                  <Label className="text-text-muted">Attachments</Label>
                  <div className="flex gap-2 mt-2">
                    {selectedContact.attachments.map((path, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttachment(path)}
                        className="border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Download {idx + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                <div className="flex items-center gap-3">
                  <Label className="text-text-muted">Status</Label>
                  <Select
                    value={selectedContact.status || 'new'}
                    onValueChange={(value) => {
                      updateContactStatus(selectedContact.id, value);
                      setSelectedContact({ ...selectedContact, status: value });
                    }}
                  >
                    <SelectTrigger className="w-32 bg-background-dark border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-dark border-primary/20">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-text-muted text-sm">
                  Submitted: {new Date(selectedContact.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDashboard;