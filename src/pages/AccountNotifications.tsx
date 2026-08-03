import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Bell, Trash2, CheckCircle2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Notification {
  id: string;
  tool_slug: string;
  tool_name: string;
  notified: boolean;
  notified_at: string | null;
  seen_at: string | null;
  tool_description?: string;
}

const AccountNotifications = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Preferences state
  const [notifyLaunches, setNotifyLaunches] = useState(true);
  const [notifyActivity, setNotifyActivity] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState<'launches' | 'activity' | null>(null);
  const [savedPrefs, setSavedPrefs] = useState<'launches' | 'activity' | null>(null);

  useEffect(() => {
    if (!authLoading && user === null) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Fetch preferences
        const { data: profile } = await supabase
          .from('profiles')
          .select('notify_product_launches, notify_account_activity')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setNotifyLaunches(profile.notify_product_launches ?? true);
          setNotifyActivity(profile.notify_account_activity ?? true);
        }

        // Fetch notifications
        const { data: notifs, error: notifError } = await supabase
          .from('tool_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (notifError) throw notifError;

        if (notifs && notifs.length > 0) {
          // Fetch tool descriptions to enrich notifications
          const slugs = notifs.map(n => n.tool_slug);
          const { data: tools } = await supabase
            .from('tools')
            .select('slug, short_description')
            .in('slug', slugs);

          const toolMap = new Map(tools?.map(t => [t.slug, t.short_description]));
          
          const enrichedNotifs = notifs.map(n => ({
            ...n,
            tool_description: toolMap.get(n.tool_slug) || ''
          }));
          
          setNotifications(enrichedNotifs);

          // Mark as seen
          const unseenNotified = notifs.some(n => n.notified && !n.seen_at);
          if (unseenNotified) {
            await supabase
              .from('tool_notifications')
              .update({ seen_at: new Date().toISOString() })
              .eq('user_id', user.id)
              .eq('notified', true)
              .is('seen_at', null);
          }
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        toast({
          title: 'Error',
          description: 'Failed to load notifications.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, navigate, toast]);

  const handleCancelNotification = async (id: string, toolName: string) => {
    try {
      const { error } = await supabase
        .from('tool_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      
      toast({
        title: 'Removed',
        description: `Removed from waitlist for ${toolName}`,
      });
    } catch (err) {
      console.error('Error cancelling notification:', err);
      toast({
        title: 'Error',
        description: 'Failed to cancel notification.',
        variant: 'destructive'
      });
    }
  };

  const handleTogglePreference = async (type: 'launches' | 'activity', value: boolean) => {
    if (!user) return;
    
    // Update local state immediately for responsiveness
    if (type === 'launches') setNotifyLaunches(value);
    else setNotifyActivity(value);
    
    setSavingPrefs(type);
    
    try {
      const updates = type === 'launches' 
        ? { notify_product_launches: value }
        : { notify_account_activity: value };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      setSavedPrefs(type);
      setTimeout(() => setSavedPrefs(null), 2000);
    } catch (err) {
      console.error('Error saving preference:', err);
      // Revert on error
      if (type === 'launches') setNotifyLaunches(!value);
      else setNotifyActivity(!value);
      
      toast({
        title: 'Error',
        description: 'Failed to save preference.',
        variant: 'destructive'
      });
    } finally {
      setSavingPrefs(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#111] pt-[120px] flex items-center justify-center">
        <Navigation hideAuthButton={true} />
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-[100px] pb-24 font-display">
      <Navigation hideAuthButton={true} />

      <div className="max-w-[680px] mx-auto px-6 w-full">
        <Link to="/dashboard" className="inline-flex items-center text-[#888] hover:text-white mb-8 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to dashboard
        </Link>

        <div className="mb-10">
          <div className="text-sm text-[#888] mb-2">Account → Notifications</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-[#888]">Manage your launch alerts and communication preferences</p>
        </div>

        <div className="space-y-8">
          {/* SECTION 1 - LAUNCH NOTIFICATIONS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-bold text-white mb-2">Tool Launch Alerts</h2>
            <p className="text-[#888] mb-6">You'll be notified when these tools become available.</p>

            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="bg-[#111] rounded-xl p-8 border border-[#2a2a2a] text-center flex flex-col items-center justify-center">
                  <Bell className="w-12 h-12 text-[#444] mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">No launch alerts set up</h3>
                  <p className="text-[#888] mb-6 max-w-sm">
                    Go to your dashboard to sign up for notifications when new tools launch.
                  </p>
                  <Button onClick={() => navigate('/dashboard')} className="bg-primary hover:bg-primary/90 text-black font-bold">
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map(notif => (
                    <motion.div 
                      key={notif.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`bg-[#111] rounded-xl p-6 border-y border-r border-[#2a2a2a] border-l-4 ${notif.notified ? 'border-l-[#4caf50]' : 'border-l-[#D4AF37]'}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-white">{notif.tool_name}</h3>
                            {notif.notified && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[#888] text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Seen
                              </div>
                            )}
                          </div>
                          
                          {notif.notified ? (
                            <div className="mb-2">
                              <p className="text-[#4caf50] font-medium text-sm">🎉 This tool has launched!</p>
                              {notif.notified_at && (
                                <p className="text-[#888] text-xs mt-1">Notified on {format(new Date(notif.notified_at), 'dd MMM yyyy')}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[#888] text-sm mb-3">
                              {notif.tool_description || 'Get notified when this tool goes live.'}
                            </p>
                          )}
                          
                          {!notif.notified && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold border border-amber-500/20">
                              ⏳ Waiting for launch
                            </div>
                          )}
                        </div>
                        
                        <div>
                          {notif.notified ? (
                            <Button 
                              onClick={() => window.open(`/tools/${notif.tool_slug}`, '_blank')} 
                              className="bg-[#2a2a2a] hover:bg-[#333] text-white font-bold h-10 px-5 rounded-lg text-sm w-full sm:w-auto"
                            >
                              Open {notif.tool_name} →
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              onClick={() => handleCancelNotification(notif.id, notif.tool_name)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-10 px-4 rounded-lg text-sm w-full sm:w-auto"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel notification
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* SECTION 2 - PREFERENCES */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-[#111] rounded-xl p-6 md:p-8 border border-[#2a2a2a]"
          >
            <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-[#2a2a2a]">
                <div className="flex flex-col gap-1 pr-4">
                  <Label htmlFor="notify-launches" className="text-white font-medium text-base">Notify me when new tools launch</Label>
                  <span className="text-[#888] text-sm">Receive alerts about new features and product releases.</span>
                </div>
                <div className="flex items-center gap-3">
                  {savingPrefs === 'launches' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  {savedPrefs === 'launches' && <span className="text-green-500 text-xs font-bold transition-opacity">Saved</span>}
                  <Switch 
                    id="notify-launches" 
                    checked={notifyLaunches} 
                    onCheckedChange={(checked) => handleTogglePreference('launches', checked)} 
                    disabled={savingPrefs === 'launches'}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col gap-1 pr-4">
                  <Label htmlFor="notify-activity" className="text-white font-medium text-base">Notify me about account and billing activity</Label>
                  <span className="text-[#888] text-sm">Receive important alerts regarding your subscription and account security.</span>
                </div>
                <div className="flex items-center gap-3">
                  {savingPrefs === 'activity' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  {savedPrefs === 'activity' && <span className="text-green-500 text-xs font-bold transition-opacity">Saved</span>}
                  <Switch 
                    id="notify-activity" 
                    checked={notifyActivity} 
                    onCheckedChange={(checked) => handleTogglePreference('activity', checked)} 
                    disabled={savingPrefs === 'activity'}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AccountNotifications;
