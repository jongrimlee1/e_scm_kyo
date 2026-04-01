import { createClient } from '@/lib/supabase/server';

export default async function CustomersPage() {
  const supabase = await createClient();
  
  const { data: customers } = await supabase
    .from('customers')
    .select('*, primary_branch:branches(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">고객 목록</h3>
        <button className="btn-primary">+ 고객 추가</button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="이름 또는 연락처 검색..."
          className="input max-w-md"
        />
        <select className="input w-40">
          <option value="">전체 등급</option>
          <option value="NORMAL">일반</option>
          <option value="VIP">VIP</option>
          <option value="VVIP">VVIP</option>
        </select>
        <select className="input w-40">
          <option value="">전체 지점</option>
          <option value="HQ">본사</option>
          <option value="PHA">한약국</option>
          <option value="DS-GN">백화점 강남점</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>이름</th>
            <th>연락처</th>
            <th>등급</th>
            <th>담당 지점</th>
            <th>적립포인트</th>
            <th>최근 구매</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {customers?.map((customer: any) => (
            <tr key={customer.id}>
              <td className="font-medium">{customer.name}</td>
              <td>{customer.phone}</td>
              <td>
                <span className={`badge ${
                  customer.grade === 'VVIP' ? 'badge-warning' :
                  customer.grade === 'VIP' ? 'badge-info' : ''
                }`}>
                  {customer.grade}
                </span>
              </td>
              <td>{customer.primary_branch?.name || '-'}</td>
              <td>{customer.total_points?.toLocaleString() || 0}P</td>
              <td>-</td>
              <td>
                <button className="text-blue-600 hover:underline mr-2">상세</button>
                <button className="text-blue-600 hover:underline">수정</button>
              </td>
            </tr>
          ))}
          {(!customers || customers.length === 0) && (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-8">
                등록된 고객이 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
