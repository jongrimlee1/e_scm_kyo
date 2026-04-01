import { Suspense } from 'react';
import SignupForm from './SignupForm';

function Loading() {
  return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>로딩 중...</p></div>;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignupForm />
    </Suspense>
  );
}
