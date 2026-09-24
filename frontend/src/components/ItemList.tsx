import type { Item } from "../api/itemsApi";

interface ItemListProps {
  items: Item[];
  loading: boolean;
  error: string;
}

export default function ItemList({ items, loading, error }: ItemListProps) {
  if (loading) return <p>Loading items...</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>{error}</p>;
  if (!items.length) return <p>No items found.</p>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      {items.map((item) => (
        <article
          key={item._id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1rem",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.4rem",
            }}
          >
            {item.category}
          </div>
          <h3 style={{ margin: "0 0 0.5rem" }}>{item.name}</h3>
          <p
            style={{
              margin: "0 0 0.5rem",
              color: "#4b5563",
              minHeight: "48px",
            }}
          >
            {item.description || "No description available."}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <strong>₹ {Number(item.price).toFixed(2)}</strong>
            <span style={{ color: "#16a34a" }}>
              ⭐ {Number(item.rating || 0).toFixed(1)}
            </span>
          </div>
          <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Stock: {item.stock}
          </div>
        </article>
      ))}
    </div>
  );
}
