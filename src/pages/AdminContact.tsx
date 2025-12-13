/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Clock, Save, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

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
    const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

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

    if (isLoading) {
        return (
            <AdminLayout title="Contact Settings" description="Manage contact page information">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Contact Settings" description="Manage contact page information">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="bg-surface-dark/50 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-text-main">Contact Page Settings</CardTitle>
                        <CardDescription className="text-text-muted">Edit the contact information displayed on the public contact page</CardDescription>
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
                                        className="bg-background-dark border-primary/30 text-text-main"
                                    />
                                    <Input
                                        value={settings.contact_address.line2}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            contact_address: { ...settings.contact_address, line2: e.target.value }
                                        })}
                                        placeholder="Address Line 2"
                                        className="bg-background-dark border-primary/30 text-text-main"
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
                                    className="bg-background-dark border-primary/30 text-text-main"
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
                                    className="bg-background-dark border-primary/30 text-text-main"
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
                                        className="bg-background-dark border-primary/30 text-text-main"
                                    />
                                    <Input
                                        value={settings.business_hours.saturday}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            business_hours: { ...settings.business_hours, saturday: e.target.value }
                                        })}
                                        placeholder="Saturday hours"
                                        className="bg-background-dark border-primary/30 text-text-main"
                                    />
                                    <Input
                                        value={settings.business_hours.sunday}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            business_hours: { ...settings.business_hours, sunday: e.target.value }
                                        })}
                                        placeholder="Sunday hours"
                                        className="bg-background-dark border-primary/30 text-text-main"
                                    />
                                    <Input
                                        value={settings.business_hours.enterprise}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            business_hours: { ...settings.business_hours, enterprise: e.target.value }
                                        })}
                                        placeholder="Enterprise support note"
                                        className="bg-background-dark border-primary/30 text-text-main"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-primary/20">
                            <Button
                                onClick={saveSettings}
                                disabled={isSaving}
                                className="bg-primary text-background-dark hover:bg-primary/90"
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
            </motion.div>
        </AdminLayout>
    );
};

export default AdminContact;
