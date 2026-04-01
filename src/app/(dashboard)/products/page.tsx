import { createClient } from '@/lib/supabase/server';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: true });

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">제품 목록</h3>
        <button className="btn-primary">+ 제품 추가</button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="제품명 또는 코드 검색..."
          className="input max-w-md"
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>제품코드</th>
            <th>제품명</th>
            <th>카테고리</th>
            <th>판매가</th>
            <th>원가</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {products?.map((product: any) => (
            <tr key={product.id}>
              <td className="font-mono">{product.code}</td>
              <td>{product.name}</td>
              <td>{product.category?.name || '-'}</td>
              <td>{product.price?.toLocaleString()}원</td>
              <td>{product.cost?.toLocaleString() || '-'}원</td>
              <td>
                <span className={product.is_active ? 'badge badge-success' : 'badge badge-error'}>
                  {product.is_active ? '활성' : '비활성'}
                </span>
              </td>
              <td>
                <button className="text-blue-600 hover:underline mr-2">수정</button>
              </td>
            </tr>
          ))}
          {(!products || products.length === 0) && (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-8">
                등록된 제품이 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
