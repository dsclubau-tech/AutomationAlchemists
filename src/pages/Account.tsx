import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

const COUNTRIES = [
  "Australia", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
  "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Democratic Republic)", "Congo (Republic)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka",
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const REFERRAL_OPTIONS = [
  "Facebook / Instagram",
  "Reddit",
  "Google Search",
  "Friend or Referral",
  "Other"
];

type CountryDialCodeInfo = { code: string; digits: number | null };

const COUNTRY_DIAL_CODES: Record<string, CountryDialCodeInfo> = {
  'Australia': { code: '+61', digits: 9 },
  'Bangladesh': { code: '+880', digits: 10 },
  'United States': { code: '+1', digits: 10 },
  'United Kingdom': { code: '+44', digits: 10 },
  'India': { code: '+91', digits: 10 },
  'Canada': { code: '+1', digits: 10 },
  'Pakistan': { code: '+92', digits: 10 },
  'Singapore': { code: '+65', digits: 8 },
  'Malaysia': { code: '+60', digits: 9 },
  'New Zealand': { code: '+64', digits: 9 },
  'UAE': { code: '+971', digits: 9 },
  'Saudi Arabia': { code: '+966', digits: 9 },
};

const validatePhone = (phoneNumber: string, currentCountry: string) => {
  if (!phoneNumber) return '';
  const info = COUNTRY_DIAL_CODES[currentCountry] || { code: '', digits: null };
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  if (info.digits !== null) {
    if (digitsOnly.length !== info.digits) {
      if (currentCountry === 'Bangladesh') return 'Bangladesh numbers are 10 digits after the country code';
      if (currentCountry === 'Australia') return 'Australian numbers are 9 digits after the country code';
      if (currentCountry === 'United States') return 'US numbers are 10 digits after the country code';
      if (currentCountry === 'United Kingdom') return 'UK numbers are 10 digits after the country code';
      if (currentCountry === 'India') return 'Indian numbers are 10 digits after the country code';
      return `${currentCountry} numbers are ${info.digits} digits after the country code`;
    }
  } else {
    if (digitsOnly.length < 6) {
      return 'Please enter a valid phone number';
    }
  }
  return '';
};

const Account = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Australia');
  const [referralSource, setReferralSource] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Account Info State
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(null);
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Active section for gold border
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'none'>('none');

  useEffect(() => {
    if (loading) return; // wait for session check before redirecting
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, country, referral_source, created_at, terms_accepted_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFullName(data.full_name || '');
          setCountry(data.country || 'Australia');
          setReferralSource(data.referral_source || '');
          setCreatedAt(data.created_at);
          setTermsAcceptedAt(data.terms_accepted_at);

          // Strip country code from phone for display if it matches selected country
          let rawPhone = data.phone || '';
          if (rawPhone && data.country && COUNTRY_DIAL_CODES[data.country]) {
            const dialCode = COUNTRY_DIAL_CODES[data.country].code;
            if (rawPhone.startsWith(dialCode)) {
              rawPhone = rawPhone.substring(dialCode.length);
            }
          }
          setPhone(rawPhone);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user, loading, navigate]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (phone) {
      const pErr = validatePhone(phone, country);
      if (pErr) {
        setPhoneError(pErr);
        toast({ title: 'Validation Error', description: pErr, variant: 'destructive' });
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const fullPhone = phone ? `${COUNTRY_DIAL_CODES[country]?.code || ''}${phone}` : null;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          phone: fullPhone,
          country,
          referral_source: referralSource || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        className: 'bg-green-500 text-white border-none'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update — please try again',
        variant: 'destructive'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score < 3) return { text: 'Weak', color: 'text-red-500' };
    if (score < 5) return { text: 'Fair', color: 'text-amber-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setPasswordError(error.errors[0].message);
        return;
      }
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Success',
        description: 'Password updated successfully. You may need to sign in again on other devices.',
        className: 'bg-green-500 text-white border-none'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update password',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteRequest = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('contacts').insert({
        name: fullName || user?.email?.split('@')[0] || 'User',
        email: user?.email,
        message: `ACCOUNT DELETION REQUEST: User ${user?.email} has requested permanent account deletion.`,
        status: 'new'
      });

      if (error) throw error;

      toast({
        title: 'Request submitted',
        description: 'Deletion request submitted. We will process this within 48 hours.',
      });
      setShowDeleteModal(false);
      setDeleteInput('');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const labelClass = "text-[11px] text-[#888] uppercase tracking-[0.5px] font-display mb-1.5 block font-semibold";
  const inputClass = "w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-[#444] rounded-lg h-11 px-3 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors outline-none font-display";
  const selectClass = "w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-[#444] rounded-lg h-11 px-3 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors outline-none font-display appearance-none cursor-pointer";

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[#111] pt-[120px] flex items-center justify-center">
        <Navigation hideAuthButton={true} />
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-[100px] pb-24 font-display">
      <Navigation hideAuthButton={true} />

      <div className="max-w-[680px] mx-auto px-6 w-full">
        <Link to="/dashboard" className="inline-flex items-center text-[#888] hover:text-white mb-8 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to dashboard
        </Link>

        <div className="mb-10">
          <div className="text-sm text-[#888] mb-2">Account → Settings</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-[#888]">Manage your profile and security</p>
        </div>

        <div className="space-y-8">
          {/* SECTION 1 - PROFILE */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className={`bg-[#111] rounded-xl p-6 md:p-8 border ${activeSection === 'profile' ? 'border-[#D4AF37]' : 'border-[#2a2a2a]'} transition-colors`}
            onFocus={() => setActiveSection('profile')}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setActiveSection('none');
            }}
          >
            <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className={labelClass}>Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="country" className={labelClass}>Country</label>
                  <select id="country" value={country} onChange={(e) => { setCountry(e.target.value); setPhoneError(''); }} className={selectClass}>
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone (Optional)</label>
                  <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 flex items-center focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37] transition-colors overflow-hidden">
                    {COUNTRY_DIAL_CODES[country]?.code && (
                      <div className="flex items-center px-3 border-r border-[#2a2a2a] text-[#888] h-full whitespace-nowrap bg-[#1a1a1a]">
                        {COUNTRY_DIAL_CODES[country].code}
                      </div>
                    )}
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(''); }}
                      onBlur={(e) => setPhoneError(validatePhone(e.target.value, country))}
                      placeholder={(!country || !COUNTRY_DIAL_CODES[country]?.code) ? "+61 400 000 000" : ""}
                      className="flex-1 bg-transparent text-white placeholder-[#444] h-full px-3 outline-none min-w-0"
                    />
                  </div>
                  {phone.trim().startsWith('0') && (
                    <p className="text-[11px] text-amber-500 mt-1.5">Remove the leading 0 — dial codes already include it</p>
                  )}
                  {phoneError && (
                    <p className="text-[11px] text-destructive mt-1.5">{phoneError}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="referralSource" className={labelClass}>How did you hear about us?</label>
                  <select id="referralSource" value={referralSource} onChange={(e) => setReferralSource(e.target.value)} className={selectClass}>
                    <option value="">Select (optional)</option>
                    {REFERRAL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                />
                <p className="text-[11px] text-[#666] mt-1.5">Email cannot be changed. Contact support if needed.</p>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isSavingProfile} className="bg-primary hover:bg-primary-light text-black font-bold px-6">
                  {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </form>
          </motion.div>

          {/* SECTION 2 - CHANGE PASSWORD */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className={`bg-[#111] rounded-xl p-6 md:p-8 border ${activeSection === 'password' ? 'border-[#D4AF37]' : 'border-[#2a2a2a]'} transition-colors`}
            onFocus={() => setActiveSection('password')}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setActiveSection('none');
            }}
          >
            <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className={labelClass}>New Password</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordStrength && newPassword.length > 0 && (
                  <p className={`text-[11px] mt-1.5 font-bold ${passwordStrength.color}`}>
                    Password Strength: {passwordStrength.text}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-destructive mt-1.5">{passwordError}</p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isUpdatingPassword || !newPassword || !confirmPassword} className="bg-primary hover:bg-primary-light text-black font-bold px-6">
                  {isUpdatingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update password
                </Button>
              </div>
            </form>
          </motion.div>

          {/* SECTION 3 - ACCOUNT INFO & DANGER ZONE */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-[#111] rounded-xl p-6 md:p-8 border border-[#2a2a2a]"
          >
            <h2 className="text-xl font-bold text-white mb-6">Account Information</h2>
            
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center py-3 border-b border-[#2a2a2a]">
                <span className="text-[#888] text-sm">Member since</span>
                <span className="text-white font-medium">
                  {createdAt ? format(new Date(createdAt), 'MMMM yyyy') : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#2a2a2a]">
                <span className="text-[#888] text-sm">Account status</span>
                <span className="text-white font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#2a2a2a]">
                <span className="text-[#888] text-sm">Terms accepted</span>
                <span className="text-white font-medium">
                  {termsAcceptedAt ? `Accepted on ${format(new Date(termsAcceptedAt), 'dd MMMM yyyy')}` : 'Not accepted'}
                </span>
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="border border-red-900/50 bg-red-950/10 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-red-500 font-bold mb-1">Delete Account</h3>
                  <p className="text-[#888] text-sm">Permanently delete your account and all associated data. This cannot be undone.</p>
                </div>
                <Button variant="outline" onClick={() => setShowDeleteModal(true)} className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 whitespace-nowrap">
                  Request account deletion
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <ShieldAlert className="w-6 h-6" />
                <h2 className="text-xl font-bold">Are you sure?</h2>
              </div>
              
              <p className="text-[#bbb] mb-6 text-sm">
                This will submit a request to permanently delete your account. 
                Type <strong className="text-white select-none">DELETE</strong> to confirm.
              </p>
              
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className={`${inputClass} mb-6`}
              />
              
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteInput(''); }} className="text-[#888] hover:text-white">
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteRequest} 
                  disabled={deleteInput !== 'DELETE' || isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Permanently delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Account;
