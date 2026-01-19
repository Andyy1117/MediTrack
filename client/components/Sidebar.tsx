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
      label: 'Өвчтөн бүртгэх', 
      icon: UserPlus, 
      roles: ['Reception', 'Admin'] 
    },
    { 
      href: '/reception/schedule', 
      label: "Өнөөдрийн хуваарь", 
      icon: LayoutDashboard, 
      roles: ['Reception', 'Admin'] 
    },
    { 
      href: '/technician/pending', 
      label: 'Хүлээгдэж буй шинжилгээ', 
      icon: Stethoscope, 
      roles: ['Technician', 'Admin'] 
    },
    { 
      href: '/technician/reports', 
      label: 'Дүгнэлт удирдлага', 
      icon: FileText, 
      roles: ['Technician', 'Admin'] 
    },
    { 
      href: '/admin/doctors', 
      label: 'Эмчийн бүртгэл', 
      icon: Users, 
      roles: ['Admin'] 
    },
    { 
      href: '/admin/financials', 
      label: 'Санхүүгийн тайлан', 
      icon: FileText, 
      roles: ['Admin'] 
    },
    { 
      href: '/admin/audit-logs', 
      label: 'Аудитын бүртгэл', 
      icon: FileText, 
      roles: ['Admin'] 
    },
    { 
      href: '/admin/users', 
      label: 'Хэрэглэгчийн удирдлага', 
      icon: Users, 
      roles: ['Admin'] 
    }
  ];

  const filteredLinks = links.filter(link => 
    link.roles.includes(user.role as string)
  );

  const roleLabel = (role?: string) => {
    if (!role) return '';
    if (role === 'Reception') return 'Бүртгэл';
    if (role === 'Technician') return 'Техникч';
    if (role === 'Admin') return 'Админ';
    return role;
  };

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
            <p className="text-xs text-gray-500 capitalize">{roleLabel(user.role as string)}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Гарах
        </button>
      </div>
    </div>
  );
}



