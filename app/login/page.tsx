'use client';

import './page.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoLogin = () => {
    setIsLoading(true);
    
    // In production, redirect to Kakao OAuth
    // For demo, simulate login
    setTimeout(() => {
      router.push('/mypage');
    }, 1000);
  };

  const handlePhoneLogin = async () => {
    if (!phone || phone.length < 10) {
      alert('올바른 전화번호를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate phone verification
    setTimeout(() => {
      router.push('/mypage');
    }, 1000);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0,3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0,3)}-${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo">경옥채</div>
        <p className="tagline">건강한 선택, 경옥채와 함께</p>
      </header>

      <div className="login-card">
        <h1 className="login-title">로그인</h1>
        <p className="login-subtitle">경옥채 멤버십에 가입하고 다양한 혜택을 받아보세요</p>

        <button className="kakao-btn" onClick={handleKakaoLogin} disabled={isLoading}>
          <span className="kakao-icon">🎈</span>
          카카오로 3초 만에 시작하기
        </button>

        <div className="divider">
          <span>또는</span>
        </div>

        <div className="phone-login">
          <input
            type="tel"
            className="phone-input"
            placeholder="전화번호 (- 없이 입력)"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={13}
          />
          <button 
            className="verify-btn"
            onClick={handlePhoneLogin}
            disabled={isLoading || phone.length < 10}
          >
            {isLoading ? '로그인 중...' : '전화번호로 시작'}
          </button>
        </div>

        <div className="terms">
          로그인 시 <a href="#">이용약관</a>과 <a href="#">개인정보처리방침</a>에 동의합니다.
        </div>

        <div className="footer-links">
          <a href="#">비밀번호 찾기</a>
          <span>|</span>
          <a href="#">회원가입</a>
        </div>
      </div>
    </div>
  );
}