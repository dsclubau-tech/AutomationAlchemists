import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, User, Calendar, Paperclip, Download, Shield, LogOut, Trash2, FileDown, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { analytics } from '@/utils/analytics';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    analytics.trackPageView('/admin');
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAdminAndLoadContacts = async () => {
      if (!user) return;

      try {
        // Check if user has admin role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError) throw roleError;

        if (!roleData) {
          toast({
            title: 'Access Denied',
            description: 'You do not have admin privileges',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);

        // Load contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (contactsError) throw contactsError;

        setContacts(contactsData || []);
      } catch (error: any) {
        console.error('Error loading admin data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load contacts',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndLoadContacts();
  }, [user, toast, navigate]);

  const downloadAttachment = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('contact-attachments')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to download attachment',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete contacts',
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage contact form submissions
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/admin/users">
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                </Link>
                <Link to="/admin/content">
                  <Button variant="outline">
                    Manage Content
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Form Submissions
                </CardTitle>
                <CardDescription>
                  Total submissions: {contacts.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedContacts.size > 0 && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">
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
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                )}
                {contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No contact form submissions yet
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedContacts.size === contacts.length}
                              onCheckedChange={toggleAllContacts}
                            />
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Attachments</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedContacts.has(contact.id)}
                                onCheckedChange={() => toggleContactSelection(contact.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
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
                            <TableCell className="max-w-md">
                              <p className="truncate" title={contact.message}>
                                {contact.message}
                              </p>
                            </TableCell>
                            <TableCell>
                              {contact.user_id ? (
                                <Badge variant="secondary">
                                  Authenticated
                                </Badge>
                              ) : (
                                <Badge variant="outline">
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
                                      className="h-auto p-1"
                                    >
                                      <Paperclip className="h-3 w-3 mr-1" />
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

            <Card className="border-border mt-6">
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Click on email addresses to compose a reply</p>
                <p>• Use the attachment download buttons to view uploaded files</p>
                <p>• Anonymous submissions don't have a user account associated</p>
                <p>• All attachments are stored securely in a private storage bucket</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdminDashboard;