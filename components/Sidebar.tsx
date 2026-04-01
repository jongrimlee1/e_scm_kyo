'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './sidebar.css';

export default function Sidebar() {
  const pathname = usePathname();
  
  const menuItems = [
    { path: '/admin', label: '대시보드', icon: '📊', exact: true },
    { path: '/admin/products', label: '상품 관리', icon: '📦' },
    { path: '/admin/customers', label: '고객 관리', icon: '👥' },
    { path: '/admin/stores', label: '매장 관리', icon: '🏪' },
    { path: '/admin/inventory', label: '재고 관리', icon: '📋' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">관리자</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link 
            key={item.path}
            href={item.path}
            className={`sidebar-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Link href="/" className="sidebar-item">
          <span className="sidebar-icon">🏠</span>
          <span>메인으로</span>
        </Link>
      </div>
    </aside>
  );
}