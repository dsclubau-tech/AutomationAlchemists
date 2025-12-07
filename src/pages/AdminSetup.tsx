import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

import { Loader2 } from 'lucide-react';

const AdminSetup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [showSql, setShowSql] = useState(false);

    const sqlCommand = `INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'dsclub.au@outlook.com'
ON CONFLICT (user_id, role) DO NOTHING;`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sqlCommand);
        toast({
            title: 'Copied',
            description: 'SQL command copied to clipboard',
        });
    };

    const handleSetup = async () => {
        setIsLoading(true);
        setShowSql(false);
        const email = 'dsclub.au@outlook.com';
        const password = '123456789@@qwerty';
        const fullName = 'dsclub';

        try {
            // 1. Try to sign up
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            let userId = signUpData.user?.id;

            if (signUpError) {
                // If user already exists, try to sign in
                console.log('User might already exist, trying to sign in...');
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;
                userId = signInData.user.id;
            }

            if (!userId) throw new Error('Failed to get user ID');

            // 2. Assign admin role
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: userId,
                    role: 'admin',
                })
                .select()
                .single();

            // If error is duplicate key, it means user is already admin, which is fine
            if (roleError) {
                if (roleError.code === '23505') {
                    // Duplicate key, ignore
                } else if (roleError.code === '42501') {
                    // RLS policy violation
                    setShowSql(true);
                    toast({
                        title: 'Manual Action Required',
                        description: 'Security policy prevents automatic admin assignment. Please run the SQL command shown below in your Supabase Dashboard.',
                        duration: 10000,
                        variant: 'destructive',
                    });
                    return;
                } else {
                    throw roleError;
                }
            }

            // 3. Update profile name just in case
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', userId);

            if (profileError) throw profileError;

            toast({
                title: 'Success',
                description: 'Admin user setup complete. You can now log in.',
            });

        } catch (error) {
            console.error('Setup error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to setup admin user',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Admin Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Admin Email</Label>
                        <Input value="dsclub.au@outlook.com" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input value="123456789@@qwerty" disabled type="password" />
                    </div>

                    {showSql && (
                        <div className="p-4 bg-muted rounded-lg space-y-2 border border-destructive/50">
                            <div className="flex items-center justify-between">
                                <Label className="text-destructive font-semibold">Manual Action Required</Label>
                                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-6 text-xs">
                                    Copy SQL
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Run this in Supabase SQL Editor:
                            </p>
                            <pre className="text-xs bg-black/10 p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono">
                                {sqlCommand}
                            </pre>
                        </div>
                    )}

                    <Button
                        className="w-full"
                        onClick={handleSetup}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting up...
                            </>
                        ) : (
                            'Create/Update Admin User'
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSetup;
