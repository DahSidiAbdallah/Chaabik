import React from 'react';
import { Footer } from './Footer';
import { Outlet } from 'react-router-dom';

// If you create a Navbar later, import it here
// import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Add Navbar here if needed */}
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
