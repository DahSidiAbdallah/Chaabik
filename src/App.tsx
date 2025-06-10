import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProductDetails } from './components/ProductDetails';
import { Auth } from './components/Auth';
import { AddProduct } from './components/AddProduct';
import { HomePage } from './components/HomePage';
import { SafetyTips } from './components/SafetyTips';
import { FAQ } from './components/FAQ';
import { Contact } from './components/Contact';
import { Rules } from './components/Rules';
import { Terms } from './components/Terms';
import { Privacy } from './components/Privacy';
import { UserProfile } from './components/UserProfile';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { EditListing } from './components/EditListing';
import { SellerProfile } from './components/SellerProfile';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans bg-white" dir={document.dir}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/edit-product/:id" element={<EditListing />} />
          <Route path="/safety" element={<SafetyTips />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/seller/:id" element={<SellerProfile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App