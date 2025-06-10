import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Eye, EyeOff, Check, X, Lock } from 'lucide-react';

export function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Password validation requirements
  const passwordRequirements = [
    { id: 'length', label: t('auth.passwordLength'), test: (pwd: string) => pwd.length >= 8 },
    { id: 'uppercase', label: t('auth.passwordUppercase'), test: (pwd: string) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: t('auth.passwordLowercase'), test: (pwd: string) => /[a-z]/.test(pwd) },
    { id: 'number', label: t('auth.passwordNumber'), test: (pwd: string) => /\d/.test(pwd) }
  ];

  // Check if all password requirements are met
  const passwordMeetsRequirements = passwordRequirements.every(req => req.test(password));

  // Check if we have a hash in the URL (for password reset)
  useEffect(() => {
    const checkHash = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        // We have a recovery token in the URL
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        if (!data.session) {
          // If no session, we need to exchange the recovery token
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(hash.substring(1));
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            setError('Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.');
          }
        }
      } else {
        // No recovery token, check if user is authenticated
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          // If not authenticated and no recovery token, redirect to login
          navigate('/auth');
        }
      }
    };

    checkHash();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Validate passwords
    if (!passwordMeetsRequirements) {
      setValidationErrors(prev => ({
        ...prev,
        password: t('errors.passwordRequirements')
      }));
      return;
    }

    if (password !== confirmPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: 'Les mots de passe ne correspondent pas'
      }));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }

      setSuccess(true);
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToHome')}
        </Link>

        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
              Définir un nouveau mot de passe
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <p className="text-sm">Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border ${
                      validationErrors.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border ${
                      validationErrors.confirmPassword 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                    required
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Show password requirements */}
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('auth.passwordRequirements')}</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((requirement) => (
                    <li key={requirement.id} className="flex items-center text-sm">
                      {requirement.test(password) ? (
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                      )}
                      <span className={requirement.test(password) ? 'text-green-700' : 'text-red-600'}>
                        {requirement.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !passwordMeetsRequirements || password !== confirmPassword}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Chargement...' : 'Réinitialiser le mot de passe'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Add this component for the success message
function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}