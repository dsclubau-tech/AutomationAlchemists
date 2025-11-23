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
            <Card className="border-border">
              <CardHeader className="py-8">
                <CardTitle className="text-3xl text-center">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-center">
                  {isSignUp
                    ? 'Sign up to get started with our services'
                    : 'Sign in to your account'}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={isSignUp}
                        placeholder="John Doe"
                        className="h-12"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="••••••••"
                      minLength={isSignUp ? 8 : 6}
                      className="h-12"
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
                    className="w-full h-12 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      <>{isSignUp ? 'Sign Up' : 'Sign In'}</>
                    )}
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
                    className="border-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all h-12 px-8"
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
