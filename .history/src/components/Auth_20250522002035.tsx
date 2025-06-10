import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    phone?: string;
  }>({});
  const [mode, setMode] = useState<'signin' | 'signup'>(
    location.state?.mode === 'signup' ? 'signup' : 'signin'
  );

  // Password validation requirements (removed special character requirement)
  const passwordRequirements = [
    { id: 'length', label: t('auth.passwordLength'), test: (pwd: string) => pwd.length >= 8 },
    { id: 'uppercase', label: t('auth.passwordUppercase'), test: (pwd: string) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: t('auth.passwordLowercase'), test: (pwd: string) => /[a-z]/.test(pwd) },
    { id: 'number', label: t('auth.passwordNumber'), test: (pwd: string) => /\d/.test(pwd) }
  ];

  // Check email existence when email input changes
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!email || mode !== 'signup') return;
      
      // Only check valid emails
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
      
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false
          }
        });
        
        // If we get a user back, it means the email exists
        if (!error && data) {
          setValidationErrors(prev => ({
            ...prev,
            email: t('errors.emailExists')
          }));
        } else {
          // Clear error if it was previously set
          setValidationErrors(prev => ({
            ...prev,
            email: undefined
          }));
        }
      } catch (error) {
        // Ignore errors here, we're just checking existence
      }
    };
    
    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(checkEmailExists, 500);
    return () => clearTimeout(timeoutId);
  }, [email, mode, t]);

  // Validate phone number format for Mauritania
  const validatePhone = (phoneNumber: string) => {
    // For Mauritanian numbers: should be +222 followed by 8 digits starting with 2, 3, or 4
    // Format check without country code first
    const phoneWithoutCode = phoneNumber.replace(/^\+222/, '');
    const phoneRegex = /^[234]\d{7}$/;
    
    if (!phoneRegex.test(phoneWithoutCode)) {
      setValidationErrors(prev => ({
        ...prev,
        phone: t('errors.invalidPhoneFormat')
      }));
      return false;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      phone: undefined
    }));
    return true;
  };

  // Format phone number with country code
  const formatPhoneNumber = (value: string) => {
    // Strip all non-digits and the country code if present
    let digitsOnly = value.replace(/\D/g, '');
    
    // Remove country code if present (222)
    if (digitsOnly.startsWith('222')) {
      digitsOnly = digitsOnly.substring(3);
    }
    
    // Only keep the last 8 digits if longer
    if (digitsOnly.length > 8) {
      digitsOnly = digitsOnly.substring(digitsOnly.length - 8);
    }
    
    // Always add the country code
    return `+222${digitsOnly}`;
  };

  // Check if all validation passes
  const isFormValid = () => {
    if (mode === 'signup') {
      // Clear previous errors
      setValidationErrors({});
      
      // Validate phone
      if (!validatePhone(phone)) return false;
      
      // Check if email exists
      if (validationErrors.email) return false;
      
      // Validate password
      const passesAllRequirements = passwordRequirements.every(req => req.test(password));
      if (!passesAllRequirements) {
        setValidationErrors(prev => ({
          ...prev,
          password: t('errors.passwordRequirements')
        }));
        return false;
      }
      
      // All checks passed
      return true;
    }
    
    // For sign in, basic validation
    return email.trim() !== '' && password.trim() !== '';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Run validation for signup
    if (mode === 'signup' && !isFormValid()) {
      return;
    }
    
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Check if phone already exists
        const { data: existingProfiles, error: profileQueryError } = await supabase
          .from('seller_profiles')
          .select('id')
          .eq('phone', phone.trim());
          
        if (profileQueryError) {
          throw new Error(t('errors.databaseError'));
        }
        
        if (existingProfiles && existingProfiles.length > 0) {
          throw new Error(t('errors.phoneExists'));
        }
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone
            }
          }
        });
        
        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : `+222${phone.trim().replace(/^\+?222/, '')}`;
          
          const { error: profileError } = await supabase
            .from('seller_profiles')
            .insert([
              {
                id: signUpData.user.id,
                name,
                phone: formattedPhone,
                created_at: new Date().toISOString(),
                rating: 5,
                total_sales: 0,
                response_rate: 100
              }
            ]);
          if (profileError) throw profileError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      if (location.state?.returnTo) {
        navigate(location.state.returnTo);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToHome')}
        </button>

        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
              {mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    {t('auth.name')}
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-400 focus:ring focus:ring-yellow-200 focus:ring-opacity-50"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    {t('auth.phone')}
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">+222</span>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone.replace(/^\+222/, '')}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '');
                        // Format with country code
                        const formattedValue = formatPhoneNumber(`+222${value}`);
                        setPhone(formattedValue);
                        if (formattedValue) validatePhone(formattedValue);
                      }}
                      className={`block w-full rounded-md pl-14 ${
                        validationErrors.phone 
                          ? 'border-red-300 pr-10 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-yellow-400 focus:ring focus:ring-yellow-200'
                      } shadow-sm focus:ring-opacity-50`}
                      required
                      maxLength={8}
                      placeholder="2XXXXXXX"
                    />
                    {validationErrors.phone && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <X className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.phone ? (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.phone}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      {t('auth.phoneFormatMauritania')}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full rounded-md ${
                    validationErrors.email 
                      ? 'border-red-300 pr-10 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-yellow-400 focus:ring focus:ring-yellow-200'
                  } shadow-sm focus:ring-opacity-50`}
                  required
                />
                {validationErrors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full rounded-md ${
                    validationErrors.password 
                      ? 'border-red-300 pr-10 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-yellow-400 focus:ring focus:ring-yellow-200'
                  } shadow-sm focus:ring-opacity-50`}
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

            {/* Show password requirements for signup */}
            {mode === 'signup' && password.length > 0 && (
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
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? t('common.loading') : mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                  setValidationErrors({});
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                {mode === 'signin' ? t('auth.signUp') : t('auth.signInInstead')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}