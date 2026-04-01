import { createClient } from '@/lib/supabase/server';

export default async function BranchesPage() {
  const supabase = await createClient();
  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">지점 목록</h3>
        <button className="btn-primary">+ 지점 추가</button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>지점코드</th>
            <th>지점명</th>
            <th>채널</th>
            <th>연락처</th>
            <th>주소</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {branches?.map((branch: any) => (
            <tr key={branch.id}>
              <td className="font-mono">{branch.code}</td>
              <td>{branch.name}</td>
              <td>
                <span className={`badge ${
                  branch.channel === 'STORE' ? 'badge-info' :
                  branch.channel === 'DEPT_STORE' ? 'badge-warning' :
                  branch.channel === 'ONLINE' ? 'badge-success' : 'badge-error'
                }`}>
                  {branch.channel}
                </span>
              </td>
              <td>{branch.phone || '-'}</td>
              <td>{branch.address || '-'}</td>
              <td>
                <span className={branch.is_active ? 'badge badge-success' : 'badge badge-error'}>
                  {branch.is_active ? '활성' : '비활성'}
                </span>
              </td>
              <td>
                <button className="text-blue-600 hover:underline mr-2">수정</button>
              </td>
            </tr>
          ))}
          {(!branches || branches.length === 0) && (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-8">
                등록된 지점이 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
