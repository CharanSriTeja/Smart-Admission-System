import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar onToggleSidebar={() => setMobileOpen(true)} />
      <div className="flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-4 lg:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
