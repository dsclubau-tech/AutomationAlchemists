import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { z } from 'zod';
import logo from '@/assets/logo.png';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional()
});

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

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('Australia');
  const [phone, setPhone] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validatePassword = (pwd: string) => {
    if (!isSignUp) {
      setPasswordErrors([]);
      return true;
    }

    try {
      passwordSchema.parse(pwd);
      setPasswordErrors([]);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setPasswordErrors(error.errors.map(e => e.message));
      }
      return false;
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (isSignUp && newPassword) {
      validatePassword(newPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data for sign up
    if (isSignUp) {
      try {
        authSchema.parse({ email, password, fullName: fullName || undefined });
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: 'Validation Error',
            description: error.errors[0].message,
            variant: 'destructive',
          });
          return;
        }
      }

      // Validate country
      if (!country) {
        toast({
          title: 'Validation Error',
          description: 'Please select your country.',
          variant: 'destructive',
        });
        return;
      }

      // Validate terms
      if (!termsAccepted) {
        setTermsError('Please agree to the Terms of Service and Privacy Policy to continue');
        toast({
          title: 'Validation Error',
          description: 'Please agree to the Terms of Service and Privacy Policy to continue',
          variant: 'destructive',
        });
        return;
      }
      setTermsError('');
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName, {
          country,
          phone: phone || undefined,
          referral_source: referralSource || undefined,
          terms_accepted: true,
        });
        if (error) throw error;
        toast({
          title: 'Success!',
          description: 'Your account has been created successfully.',
        });
        navigate('/');
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;

        // Check if user is admin
        if (data?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (roleData) {
            toast({
              title: 'Welcome Admin',
              description: 'Redirecting to admin dashboard...',
            });
            navigate('/admin');
            return;
          }
        }

        toast({
          title: 'Welcome back!',
          description: 'You have been signed in successfully.',
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = "text-[11px] text-[#888] uppercase tracking-[0.5px] font-display mb-1.5 block font-semibold";
  const inputClass = "w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-[#444] rounded-lg h-11 px-3 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors outline-none font-display";
  const selectClass = "w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-[#444] rounded-lg h-11 px-3 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors outline-none font-display appearance-none cursor-pointer";

  return (
    <div className="min-h-screen w-full flex bg-[#111] overflow-hidden flex-col md:flex-row pt-[80px]">
      <Navigation hideAuthButton={true} />
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-[45%] flex-col relative overflow-hidden bg-black border-r border-[#2a2a2a] p-12 justify-center pb-20">
        {/* Radial gold glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[rgba(212,175,55,0.12)] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 max-w-md mx-auto w-full">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 mb-12 group w-fit">
            <img src={logo} alt="Automation Alchemists" className="w-12 h-12 object-contain group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-bold text-white font-display tracking-tight group-hover:text-[#D4AF37] transition-colors">Automation Alchemists</span>
          </Link>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 font-display leading-tight tracking-tight">Turn ideas into<br/>working software</h1>
          
          <p className="text-[#888] mb-12 text-lg font-display">Alchemy for the automation era: ideas → apps → passive cashflow</p>
          
          <div className="space-y-5 font-display">
            <div className="flex items-center gap-4 text-[#ddd]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="font-medium">Web & App Development</span>
            </div>
            <div className="flex items-center gap-4 text-[#ddd]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="font-medium">Flutter & Android</span>
            </div>
            <div className="flex items-center gap-4 text-[#ddd]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="font-medium">SaaS Products</span>
            </div>
            <div className="flex items-center gap-4 text-[#ddd]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="font-medium">Workflow Automation</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-[55%] flex flex-col items-center justify-center p-6 sm:p-12 min-h-[calc(100vh-80px)] overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-3 mb-10">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={logo} alt="Automation Alchemists" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-white font-display tracking-tight">Automation Alchemists</span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[#2a2a2a]">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`px-5 py-2 rounded-md text-[13px] transition-all font-display ${
                  !isSignUp 
                    ? 'bg-[#D4AF37] text-[#0a0a0a] font-bold' 
                    : 'bg-transparent text-[#666] hover:text-white font-medium'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`px-5 py-2 rounded-md text-[13px] transition-all font-display ${
                  isSignUp 
                    ? 'bg-[#D4AF37] text-[#0a0a0a] font-bold' 
                    : 'bg-transparent text-[#666] hover:text-white font-medium'
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp ? (
                // SIGN UP FORM
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="fullName" className={labelClass}>Full Name</label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className={labelClass}>Country</label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        className={selectClass}
                      >
                        <option value="" disabled>Select your country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className={labelClass}>Password</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        placeholder="••••••••"
                        minLength={8}
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.length > 0 && (
                      <div className="text-xs text-destructive space-y-1 mt-2 font-display">
                        {passwordErrors.map((error, idx) => (
                          <div key={idx}>• {error}</div>
                        ))}
                      </div>
                    )}
                    {password && passwordErrors.length === 0 && password.length >= 8 && (
                      <div className="text-xs text-green-500 mt-2 font-display font-medium">
                        ✓ Password meets all requirements
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="phone" className={labelClass}>Phone (Optional)</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+61 400 000 000"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="referralSource" className={labelClass}>How did you hear?</label>
                      <select
                        id="referralSource"
                        value={referralSource}
                        onChange={(e) => setReferralSource(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select (optional)</option>
                        {REFERRAL_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="termsAccepted"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          if (e.target.checked) setTermsError('');
                        }}
                        className="mt-1 h-4 w-4 rounded border-[#2a2a2a] bg-[#1a1a1a] text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0 cursor-pointer accent-[#D4AF37]"
                      />
                      <label htmlFor="termsAccepted" className="text-[#888] font-display text-sm leading-relaxed cursor-pointer select-none mt-[-2px]">
                        I agree to the{' '}
                        <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#D4AF37] transition-colors">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#D4AF37] transition-colors">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    {termsError && (
                      <p className="text-xs text-destructive mt-2 font-display">{termsError}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0a0a0a] font-bold h-11 rounded-lg text-[14px] transition-colors font-display mt-2"
                    disabled={isLoading || !termsAccepted}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Please wait...</span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-[13px] text-[#888] hover:text-white transition-colors font-display"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </>
              ) : (
                // SIGN IN FORM
                <>
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="password" className={`${labelClass} mb-0`}>Password</label>
                      <button 
                        type="button" 
                        onClick={() => {/* forgot password logic */}}
                        className="text-[11px] text-[#555] hover:text-[#D4AF37] transition-colors font-display"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0a0a0a] font-bold h-11 rounded-lg text-[14px] transition-colors font-display mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Please wait...</span>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-[13px] text-[#888] hover:text-white transition-colors font-display"
                    >
                      Don't have an account? Create one
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
