import { useState, useEffect } from 'react';
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

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signUp, signIn, signInWithGoogle, user } = useAuth();
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
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({
          title: 'Success!',
          description: 'Your account has been created successfully.',
        });
        navigate('/');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: 'Welcome back!',
          description: 'You have been signed in successfully.',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                <div className="mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full h-12 border-white/20 bg-white/5 hover:bg-white/10 hover:text-white text-white font-display flex items-center justify-center gap-2 transition-all"
                    onClick={() => signInWithGoogle()}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-surface-dark px-2 text-muted-foreground font-display">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </div>

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

                  <Button
                    type="submit"
                    className="w-full rounded-full gold-foil-outline relative flex h-12 cursor-pointer items-center justify-center overflow-hidden bg-background-dark px-4 text-base font-bold tracking-wider text-primary transition-all duration-300 hover:text-black group font-display"
                    disabled={isLoading}
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
