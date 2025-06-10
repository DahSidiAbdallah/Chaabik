import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Extract hash parameters from URL
  useEffect(() => {
    // The hash will be in the format #access_token=...&refresh_token=...&...
    const hash = location.hash.substring(1);
    if (!hash) return;

    // Parse the hash parameters
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      // Store the access token in session storage for later use
      sessionStorage.setItem('resetPasswordToken', accessToken);
    }
  }, [location]);

  const validateForm = () => {
    const errors: {
      password?: string;
      confirmPassword?: string;
    } = {};

    // Validate password
    const passesAllRequirements = passwordRequirements.every(req => req.test(password));
    if (!passesAllRequirements) {
      errors.password = t('errors.passwordRequirements');
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      errors.confirmPassword = t('auth.passwordsDoNotMatch');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the access token from session storage
      const accessToken = sessionStorage.getItem('resetPasswordToken');
      
      if (!accessToken) {
        throw new Error(t('auth.invalidResetLink'));
      }

      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password 
      }, {
        accessToken
      });

      if (error) {
        throw error;
      }

      // Clear the access token from session storage
      sessionStorage.removeItem('resetPasswordToken');
      
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : t('errors.unknown'));
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
              {t('auth.setNewPassword')}
            </h2>
          </div>

          {success ? (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {t('auth.passwordResetSuccess')}
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{t('auth.passwordResetSuccessMessage')}</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      to="/auth"
                      className="text-sm font-medium text-green-600 hover:text-green-500"
                    >
                      {t('auth.signIn')} &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400\" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('auth.newPassword')}
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
                    {t('auth.confirmPassword')}
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
                {password.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('auth.passwordRequirements')}</p>
                    <ul className="space-y-1">
                      {passwordRequirements.map((requirement) => (
                        <li key={requirement.id} className="flex items-center text-sm">
                          {requirement.test(password) ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                          )}
                          <span className={requirement.test(password) ? 'text-green-700' : 'text-red-600'}>
                            {requirement.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : t('auth.resetPassword')}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}