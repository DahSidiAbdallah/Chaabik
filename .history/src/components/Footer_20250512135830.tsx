import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-4 gap-8">
        <div>
          <div className="flex items-center mb-4">
            <span className="text-xl font-bold text-yellow-400">CHAABIK</span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Your number one site for selling and buying clothes, cosmetics and home goods.
          </p>
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Join our newsletter</h3>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Enter your e-mail" 
                className="p-2 text-sm border border-r-0 border-gray-300 flex-grow"
              />
              <button className="bg-blue-500 text-white p-2 rounded-r">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Buy</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">Create a profile</Link></li>
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">Set up payment type</Link></li>
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">Inbox</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Sell</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">Create a profile</Link></li>
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">List your items</Link></li>
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">Boost your items</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Help</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">FAQ</Link></li>
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">Customer service</Link></li>
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">How to guides</Link></li>
            <li><Link to="#" className="text-gray-600 hover:text-gray-900">Contact us</Link></li>
          </ul>
          
          <h3 className="font-medium mt-6 mb-4">Follow us</h3>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-pink-500">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-500">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 5.16c-.406.566-1.557 1.169-2.219 1.151v.003c-.008 0-.017-.003-.025-.003-1.836-.143-3.13.45-3.35 1.7-.113.675.131 1.594.294 2.151s1.083 1.598 1.083 1.598c.475.278.695 1.188.762 1.401.045.141-.533.294-1.2.436-1.275.273-1.39-.734-1.39-.734-.105-.241-1.084-3.53-3.859-3.455-2.774.075-4.255 1.222-5.968 3.634-1.713 2.41-3.335 3.746-4.204 3.863-.869.12-1.65-.241-1.726-.835-.075-.593.478-1.033 1.02-1.204.54-.173.457-.717.109-.956-1.177-.809-1.559-1.276-1.559-2.719 0-1.441 1.322-1.846 1.322-1.846s.524-2.834 1.814-3.773c1.291-.939 3.104.024 3.104.024s.353.6.549.826c.195.226.39.75.39.75s1.529-.75 2.227-1.264c.697-.511 1.322-1.013 1.322-1.013s.11-.34.39-1.388c.279-1.05 1.271-.96 1.271-.96s.732-.059 1.138.33c.405.39.479.84.405 1.049-.48.135-1.271.045-1.745.045 0 0-.22 1.395-1.291 2.498.706.165 1.271.226 2.661.075 1.396-.15 1.861.809 1.861 1.222s-.479.795-.869.96c-.395.166-.644.436-.738.601-.09.165.044.27.044.27s.989.299 1.138.839c.143.54-.346 1.124-.346 1.124l.374.029s.918-.734 1.679-3.003c0 0 .148-.374.224-.479.075-.104.284-.478.389-.509.104-.03.149-.284.253-.886z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-500">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between text-sm text-gray-500">
          <div>
            <span>Terms and conditions</span>
            <span className="mx-3">|</span>
            <span>Privacy policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}