"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type UserRole = 'Reception' | 'Technician' | 'Admin' | null;

interface AuthContextType {
  user: { role: UserRole; username: string } | null;
  role: UserRole;
  login: (token: string, role: UserRole, username: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ role: UserRole; username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for token on mount
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') as UserRole;
    const username = localStorage.getItem('username'); // Optional if you store it

    if (token && role) {
      setUser({ role, username: username || 'User' });
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, role: UserRole, username: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role || '');
    localStorage.setItem('username', username);
    setUser({ role, username });
    
    // Redirect based on role
    if (role === 'Reception') {
      router.push('/reception/add-record');
    } else if (role === 'Technician') {
      router.push('/technician/pending');
    } else if (role === 'Admin') {
      router.push('/admin');
    } else {
        router.push('/');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

