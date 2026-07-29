import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { z } from 'zod';

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

  const selectClassName = "h-12 rounded-xl bg-input border-0 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary font-display w-full px-3 appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation hideAuthButton={true} />

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-primary/20 bg-surface-dark/50 singularity-shadow rounded-2xl backdrop-blur-sm">
              <CardHeader className="py-8">
                <CardTitle className="text-3xl text-center text-white font-display">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-center text-white/70 font-display">
                  {isSignUp
                    ? 'Sign up to get started with our services'
                    : 'Sign in to your account'}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8">

                <form onSubmit={handleSubmit} className="space-y-6">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white font-display">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={isSignUp}
                        placeholder="John Doe"
                        className="h-12 rounded-xl bg-input border-0 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary font-display"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-display">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="h-12 rounded-xl bg-input border-0 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary font-display"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-display">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="••••••••"
                      minLength={isSignUp ? 8 : 6}
                      className="h-12 rounded-xl bg-input border-0 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary font-display"
                    />
                    {isSignUp && passwordErrors.length > 0 && (
                      <div className="text-xs text-destructive space-y-1 mt-2">
                        {passwordErrors.map((error, idx) => (
                          <div key={idx}>• {error}</div>
                        ))}
                      </div>
                    )}
                    {isSignUp && password && passwordErrors.length === 0 && password.length >= 8 && (
                      <div className="text-xs text-green-600 mt-2">
                        ✓ Password meets all requirements
                      </div>
                    )}
                  </div>

                  {/* New Sign Up Fields */}
                  {isSignUp && (
                    <>
                      {/* Country Dropdown */}
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-white font-display">Country</Label>
                        <select
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          required
                          className={selectClassName}
                        >
                          <option value="" disabled>Select your country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white font-display">Phone Number (Optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+61 400 000 000"
                          className="h-12 rounded-xl bg-input border-0 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary font-display"
                        />
                      </div>

                      {/* How did you hear about us? */}
                      <div className="space-y-2">
                        <Label htmlFor="referralSource" className="text-white font-display">How did you hear about us?</Label>
                        <select
                          id="referralSource"
                          value={referralSource}
                          onChange={(e) => setReferralSource(e.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Select an option (optional)</option>
                          {REFERRAL_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      {/* Terms & Privacy Checkbox */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="termsAccepted"
                            checked={termsAccepted}
                            onChange={(e) => {
                              setTermsAccepted(e.target.checked);
                              if (e.target.checked) setTermsError('');
                            }}
                            className="mt-1 h-4 w-4 rounded border-white/20 bg-input text-primary focus:ring-primary cursor-pointer accent-[#d4af37]"
                          />
                          <Label htmlFor="termsAccepted" className="text-white/80 font-display text-sm leading-relaxed cursor-pointer">
                            I agree to the{' '}
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-light underline transition-colors">
                              Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-light underline transition-colors">
                              Privacy Policy
                            </a>
                          </Label>
                        </div>
                        {termsError && (
                          <p className="text-xs text-destructive mt-1">{termsError}</p>
                        )}
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full rounded-full gold-foil-outline relative flex h-12 cursor-pointer items-center justify-center overflow-hidden bg-background-dark px-4 text-base font-bold tracking-wider text-primary transition-all duration-300 hover:text-black group font-display"
                    disabled={isLoading || (isSignUp && !termsAccepted)}
                  >
                    <span className="absolute inset-0 z-0 h-full w-0 bg-gradient-to-r from-primary to-primary-light transition-all duration-300 group-hover:w-full"></span>
                    <span className="relative z-10 flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Please wait
                        </>
                      ) : (
                        <>{isSignUp ? 'Sign Up' : 'Sign In'}</>
                      )}
                    </span>
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    {isSignUp
                      ? 'Already have an account?'
                      : "Don't have an account?"}
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    variant="outline"
                    className="rounded-full border-primary/50 text-white hover:bg-primary/10 hover:border-primary transition-all h-12 px-8 font-display"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Auth;
