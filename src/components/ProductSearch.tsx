import { useEffect, useRef, useState } from 'react';

export type Product = {
  id: string;
  name: string;
  caloriesPer100g: number;
};

type ProductSearchProps = {
  onSelect: (product: Product) => void;
  disabled?: boolean;
};

export default function ProductSearch({ onSelect, disabled }: ProductSearchProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setProducts([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(search)}`,
          { credentials: 'include' }
        );
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          setProducts(json.data || []);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [search]);

  function handleSelect(product: Product) {
    onSelect(product);
    setSearch('');
    setProducts([]);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search product..."
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: '1px solid #ccc',
          borderRadius: 4,
          fontSize: '1rem',
        }}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 240,
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            zIndex: 10,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          {loading && products.length === 0 && (
            <div style={{ padding: '0.75rem', color: '#666' }}>Loading...</div>
          )}
          {!loading && products.length === 0 && (
            <div style={{ padding: '0.75rem', color: '#666' }}>No products found</div>
          )}
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              {product.name}{' '}
              <span style={{ color: '#666' }}>
                ({product.caloriesPer100g} kcal/100g)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
