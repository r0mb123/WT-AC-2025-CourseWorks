/**
 * Layout Component
 * 
 * Основной layout приложения с Header и Footer
 */

import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app">
      <Header />
      <main className="main">
        {children}
      </main>
      <Footer />
    </div>
  );
};
