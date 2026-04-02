'use client';

import { useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await login(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium text-slate-700">로그인중...</p>
          </div>
        </div>
      )}
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">경옥채 사내 통합시스템</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login_id" className="block text-sm font-medium text-gray-700">
              아이디
            </label>
            <input
              id="login_id"
              name="login_id"
              type="text"
              required
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
              placeholder="아이디를 입력하세요"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  로그인중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
