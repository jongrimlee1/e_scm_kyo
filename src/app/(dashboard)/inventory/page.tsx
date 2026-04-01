import { createClient } from '@/lib/supabase/server';

export default async function InventoryPage() {
  const supabase = await createClient();
  
  const { data: inventories } = await supabase
    .from('inventories')
    .select('*, branch:branches(*), product:products(*)')
    .order('updated_at', { ascending: false });

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">재고 현황</h3>
        <div className="flex gap-2">
          <button className="btn-primary">+ 입고</button>
          <button className="btn-secondary">+ 출고</button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <select className="input w-48">
          <option value="">전체 지점</option>
          <option value="HQ">본사</option>
          <option value="PHA">한약국</option>
          <option value="DS-GN">백화점 강남점</option>
          <option value="DS-HD">백화점 홍대점</option>
          <option value="ONLINE">자사몬</option>
        </select>
        <input
          type="text"
          placeholder="제품명 또는 코드 검색..."
          className="input max-w-md"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" />
          재고 부족만 보기
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>지점</th>
            <th>제품코드</th>
            <th>제품명</th>
            <th>현재재고</th>
            <th>안전재고</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {inventories?.map((item: any) => {
            const isLow = item.quantity < item.safety_stock;
            return (
              <tr key={item.id}>
                <td>{item.branch?.name}</td>
                <td className="font-mono">{item.product?.code}</td>
                <td>{item.product?.name}</td>
                <td className={isLow ? 'text-red-600 font-semibold' : ''}>
                  {item.quantity}
                </td>
                <td>{item.safety_stock}</td>
                <td>
                  {isLow ? (
                    <span className="badge badge-error">부족</span>
                  ) : (
                    <span className="badge badge-success">정상</span>
                  )}
                </td>
                <td>
                  <button className="text-blue-600 hover:underline mr-2">입출고</button>
                </td>
              </tr>
            );
          })}
          {(!inventories || inventories.length === 0) && (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-8">
                재고 데이터가 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
