export interface Item {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating?: number;
  description?: string;
}

export interface ItemQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  signal?: AbortSignal;
}

export interface ItemsResponse {
  items: Item[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

const API_BASE = "http://localhost:5000";

export async function fetchItems({
  signal,
  ...query
}: ItemQuery): Promise<ItemsResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    search: query.search,
    category: query.category,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
  });

  const response = await fetch(`${API_BASE}/api/items?${params.toString()}`, {
    signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch items");
  }

  return response.json() as Promise<ItemsResponse>;
}
