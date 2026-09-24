import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchItems, type Item } from "../api/itemsApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import ItemList from "./ItemList";

const LIMIT = 6;
const categories = [
  "Electronics",
  "Furniture",
  "Fitness",
  "Kitchen",
  "Lifestyle",
  "Office",
];
const inputStyle = {
  width: "100%",
  padding: "0.75rem 0.9rem",
  borderRadius: "0.6rem",
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
  background: "#fff",
  boxSizing: "border-box" as const,
};

function getNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function ItemCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const page = getNumber(searchParams.get("page"), 1);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "price-desc";
  const debouncedSearch = useDebouncedValue(search, 250);
  const [sortBy, sortOrder] =
    sort === "price-asc"
      ? ["price", "asc"]
      : sort === "rating-desc"
        ? ["rating", "desc"]
        : sort === "newest"
          ? ["createdAt", "desc"]
          : ["price", "desc"];

  const updateParams = (updates: Record<string, string | number>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) =>
      value ? next.set(key, String(value)) : next.delete(key),
    );
    setSearchParams(next);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchItems({
      page,
      limit: LIMIT,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
      search: debouncedSearch,
      category,
      minPrice,
      maxPrice,
      signal: controller.signal,
    })
      .then((data) => {
        setItems(data.items || []);
        setPagination(data.pagination);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Unexpected error while loading items",
          );
          setItems([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, sortBy, sortOrder, debouncedSearch, category, minPrice, maxPrice]);

  const categoryOptions = useMemo(
    () =>
      categories.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      )),
    [],
  );

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "1.5rem" }}>Items Catalog</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#f8fafc",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0",
        }}
      >
        <input
          aria-label="Search items"
          placeholder="Search by name or description"
          value={search}
          onChange={(event) =>
            updateParams({ search: event.target.value, page: 1 })
          }
          style={inputStyle}
        />
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) =>
            updateParams({ category: event.target.value, page: 1 })
          }
          style={inputStyle}
        >
          <option value="">All categories</option>
          {categoryOptions}
        </select>
        <input
          aria-label="Minimum price"
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(event) =>
            updateParams({ minPrice: event.target.value, page: 1 })
          }
          style={inputStyle}
        />
        <input
          aria-label="Maximum price"
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(event) =>
            updateParams({ maxPrice: event.target.value, page: 1 })
          }
          style={inputStyle}
        />
        <select
          aria-label="Sort items"
          value={sort}
          onChange={(event) =>
            updateParams({ sort: event.target.value, page: 1 })
          }
          style={inputStyle}
        >
          <option value="price-desc">Sort: Price High to Low</option>
          <option value="price-asc">Sort: Price Low to High</option>
          <option value="rating-desc">Sort: Rating High to Low</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>
      <ItemList items={items} loading={loading} error={error} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "1.5rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: "#475569" }}>
          Showing {items.length} of {pagination.totalItems} items
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => updateParams({ page: Math.max(page - 1, 1) })}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span
            style={{ minWidth: "90px", textAlign: "center", color: "#334155" }}
          >
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              updateParams({ page: Math.min(page + 1, pagination.totalPages) })
            }
            disabled={page >= pagination.totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
