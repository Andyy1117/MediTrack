"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, 
  UserPlus, 
  Stethoscope, 
  Users, 
  LogOut, 
  FileText 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    { 
      href: '/reception/add-record', 
      label: 'Registration', 
      icon: UserPlus, 
      roles: ['receptionist', 'admin'] 
    },
    { 
      href: '/technician/dashboard', 
      label: 'Exam Queue', 
      icon: Stethoscope, 
      roles: ['technician', 'admin'] 
    },
    { 
      href: '/admin', 
      label: 'Admin Panel', 
      icon: Users, 
      roles: ['admin'] 
    },
    {
      href: '/admin/bonus-report',
      label: 'Bonus Report',
      icon: FileText,
      roles: ['admin']
    }
  ];

  const filteredLinks = links.filter(link => 
    link.roles.includes(user.role as string)
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="text-xl font-bold text-indigo-600">MediTrack</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4 px-4">
          <div>
            <p className="text-sm font-medium text-gray-900">{user.username}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

