import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'fa-chart-pie' },
  { name: 'Upload Data', path: '/upload', icon: 'fa-upload' },
  { name: 'Products', path: '/products', icon: 'fa-tags' },
  { name: 'Analysis', path: '/analysis', icon: 'fa-chart-line' },
  { name: 'Forecasting', path: '/forecast', icon: 'fa-wand-magic-sparkles' },
  { name: 'Recommendations', path: '/recommendations', icon: 'fa-boxes-stacked' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          RetailFlow
        </h1>
        <p className="text-xs text-slate-400 mt-1">Analytics & Forecasting</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white border-r-4 border-indigo-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <i className={`fa-solid ${item.icon} w-6`}></i>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <div>
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-slate-400">admin@retailflow.app</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;