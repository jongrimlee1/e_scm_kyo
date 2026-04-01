'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './nav.css';

export default function Navbar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    { path: '/pos', label: 'POS', icon: '💳' },
    { path: '/dashboard', label: '대시보드', icon: '📊' },
    { path: '/admin', label: '관리자', icon: '⚙️' },
    { path: '/mypage', label: '마이페이지', icon: '👤' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link href="/">경옥채</Link>
      </div>
      <div className="nav-menu">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="nav-user">
        <Link href="/login" className="login-link">로그인</Link>
      </div>
    </nav>
  );
}