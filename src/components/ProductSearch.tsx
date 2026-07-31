import { useEffect, useRef, useState } from 'react';
import styles from './ProductSearch.module.css';

export type Product = {
  id: string;
  name: string;
  calories: number;
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
    <div ref={wrapperRef} className={styles.wrapper}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск продукта..."
        disabled={disabled}
        className={styles.input}
      />
      {open && (
        <div className={styles.dropdown}>
          {loading && products.length === 0 && (
            <div className={styles.hint}>Загрузка...</div>
          )}
          {!loading && products.length === 0 && (
            <div className={styles.hint}>Продукты не найдены</div>
          )}
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              className={styles.option}
            >
              {product.name}{' '}
              <span className={styles.calories}>
                ({product.calories} ккал/100г)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
