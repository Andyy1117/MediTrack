"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/', label: 'Нүүр', roles: ['all'] },
    { href: '/reception/add-record', label: 'Өвчтөн бүртгэх', roles: ['receptionist'] },
    { href: '/technician/dashboard', label: 'Техникчийн самбар', roles: ['technician'] },
    { href: '/view-records', label: 'Жагсаалт харах', roles: ['receptionist', 'technician', 'admin'] },
    { href: '/bonus-calculator', label: 'Урамшуулал', roles: ['receptionist', 'admin'] },
    { href: '/admin', label: 'Админ', roles: ['admin'] },
  ];

  // Filter links based on role
  const filteredLinks = links.filter(link => {
    if (link.roles.includes('all')) return true;
    if (!user) return false;
    return link.roles.includes(user.role as string);
  });

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-indigo-600">MediTrack</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                    pathname === link.href
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{user.username} ({user.role})</span>
                    <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Гарах</button>
                </div>
            ) : (
                <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-800">Нэвтрэх</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
