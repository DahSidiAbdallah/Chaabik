import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { User, LogOut, Package, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ isOpen, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 text-yellow-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">{t('auth.confirmLogout')}</h3>
        </div>
        <p className="text-gray-600 mb-6">{t('auth.logoutMessage')}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('auth.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUserProducts() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user:', userError.message);
          // Clear any potentially expired session
          if (userError.message.includes('expired')) {
            await supabase.auth.signOut();
            return;
          }
        }
        
        if (user) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('Error fetching products:', error.message);
          } else {
            setUserProducts(data || []);
          }
        }
      } catch (err) {
        console.error('Error in fetchUserProducts:', err);
      }
    }

    fetchUserProducts();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setShowLogoutConfirm(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <User className="w-5 h-5 text-gray-600" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">{t('product.myListings')}</h3>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {userProducts.length > 0 ? (
                userProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      navigate(`/product/${product.id}`);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                  >
                    <Package className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {product.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.price.toLocaleString()} MRU
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  {t('product.noListings')}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 mt-2">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.signOut')}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onConfirm={handleSignOut}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}