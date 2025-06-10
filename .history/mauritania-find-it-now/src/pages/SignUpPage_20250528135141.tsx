import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Phone, Image as ImageIcon, Users } from 'lucide-react'; // Added ImageIcon and Users for gender

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '', // Added password field for sign up
    confirmPassword: '', // Added confirm password
    sex: '',
    profilePhoto: null as File | null,
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, profilePhoto: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, profilePhoto: null });
      setProfilePhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement actual sign-up logic here
      // This would involve uploading the profilePhoto if present
      console.log('Signing up with:', formData);
      alert('Sign-up successful (simulation)!');
      navigate('/signin'); // Redirect to sign-in page after successful sign-up
    } catch (err) {
      setError('Failed to sign up. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-extrabold text-gray-900">Créez votre compte</CardTitle>
            <CardDescription className="mt-2">
              Rejoignez notre communauté dès aujourd'hui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input id="name" name="name" type="text" required className="pl-10" placeholder="Votre nom complet" value={formData.name} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input id="phone" name="phone" type="tel" required className="pl-10" placeholder="+222 XX XX XX XX" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              
              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                <div className="relative rounded-md shadow-sm">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <Select onValueChange={(value) => handleSelectChange('sex', value)} value={formData.sex}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Sélectionner votre sexe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Homme</SelectItem>
                      <SelectItem value="female">Femme</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <div className="relative rounded-md shadow-sm">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input id="password" name="password" type="password" required className="pl-10" placeholder="Créer un mot de passe" value={formData.password} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                 <div className="relative rounded-md shadow-sm">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required className="pl-10" placeholder="Confirmer le mot de passe" value={formData.confirmPassword} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700 mb-1">Photo de profil (optionnel)</label>
                <div className="mt-1 flex items-center">
                  <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100 border">
                    {profilePhotoPreview ? 
                      <img src={profilePhotoPreview} alt="Aperçu" className="h-full w-full object-cover" /> : 
                      <ImageIcon className="h-full w-full text-gray-300" />
                    }
                  </span>
                  <Input id="profilePhoto" name="profilePhoto" type="file" accept="image/*" onChange={handleFileChange} className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Création du compte...' : 'S\'inscrire'}
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte? {' '}
                <Link to="/signin" className="font-medium text-blue-600 hover:text-blue-500">
                  Connectez-vous
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage; 