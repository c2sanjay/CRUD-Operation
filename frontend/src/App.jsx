import React, { useEffect, useRef, useState } from "react";

const API_BASE = "http://localhost:5000";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
  });
  const [loanForm, setLoanForm] = useState({
    borrower: "",
    amount: "",
    interestRate: "",
    termMonths: "",
    status: "pending",
  });
  const [loans, setLoans] = useState([]);
  const [editingLoanId, setEditingLoanId] = useState(null);

  // --- image upload state ---
  const [file, setFile] = useState(null); // File chosen by the user
  const [preview, setPreview] = useState(""); // local object URL for preview
  const [uploadPct, setUploadPct] = useState(0); // 0-100 while uploading
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ];

  // Release the object URL whenever it is replaced or the component unmounts,
  // otherwise every picked file leaks a blob.
  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError("Failed to load products");
    }
  }

  async function fetchCart() {
    try {
      const res = await fetch(`${API_BASE}/api/cart`);
      const data = await res.json();
      setCart(data);
    } catch (err) {
      setError("Failed to load cart");
    }
  }

  async function fetchLoans() {
    try {
      const res = await fetch(`${API_BASE}/api/loans`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load loans");
      setLoans(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCart(), fetchLoans()]);
      setLoading(false);
    })();
  }, []);

  function handleFileSelect(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate on the client for instant feedback; the server enforces the
    // same rules again because client checks can be bypassed.
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError(
        `Unsupported file type "${selected.type || "unknown"}". Use JPG, PNG, WEBP, GIF or AVIF.`,
      );
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError(
        `"${selected.name}" is ${(selected.size / 1024 / 1024).toFixed(1)} MB. Maximum is 5 MB.`,
      );
      e.target.value = "";
      return;
    }

    setError("");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setUploadPct(0);
  }

  function clearFile() {
    setFile(null);
    setPreview("");
    setUploadPct(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // XMLHttpRequest instead of fetch: it is the only way to get real upload
  // progress events for the progress bar.
  function uploadImage(selectedFile) {
    return new Promise((resolve, reject) => {
      const data = new FormData();
      data.append("file", selectedFile);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/uploads`);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setUploadPct(Math.round((evt.loaded / evt.total) * 100));
        }
      };
      xhr.onload = () => {
        let payload = {};
        try {
          payload = JSON.parse(xhr.responseText);
        } catch (err) {
          return reject(new Error("Unexpected response from upload server"));
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadPct(100);
          return resolve(payload);
        }
        reject(new Error(payload.message || `Upload failed (${xhr.status})`));
      };
      xhr.onerror = () =>
        reject(new Error("Network error while uploading image"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));

      xhr.send(data);
    });
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // A picked file wins over a typed URL: upload it, then store the URL the
      // server hands back on the product.
      let imageUrl = form.imageUrl;
      if (file) {
        const uploaded = await uploadImage(file);
        imageUrl = uploaded.url;
      }

      const body = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl,
        inStock: true,
      };
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create product");
      }
      setForm({ name: "", price: "", description: "", imageUrl: "" });
      clearFile();
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateLoan(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const method = editingLoanId ? "PUT" : "POST";
      const endpoint = editingLoanId
        ? `${API_BASE}/api/loans/${editingLoanId}`
        : `${API_BASE}/api/loans`;
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrower: loanForm.borrower,
          amount: Number(loanForm.amount),
          interestRate: Number(loanForm.interestRate),
          termMonths: Number(loanForm.termMonths),
          status: loanForm.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save loan");
      }

      await fetchLoans();
      setEditingLoanId(null);
      setLoanForm({
        borrower: "",
        amount: "",
        interestRate: "",
        termMonths: "",
        status: "pending",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEditingLoan(loan) {
    setError("");
    setEditingLoanId(loan._id);
    setLoanForm({
      borrower: loan.borrower,
      amount: String(loan.amount),
      interestRate: String(loan.interestRate),
      termMonths: String(loan.termMonths),
      status: loan.status,
    });
  }

  function cancelEditingLoan() {
    setEditingLoanId(null);
    setLoanForm({
      borrower: "",
      amount: "",
      interestRate: "",
      termMonths: "",
      status: "pending",
    });
  }

  async function handleDeleteLoan(id) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/loans/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete loan");
      if (editingLoanId === id) cancelEditingLoan();
      await fetchLoans();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteProduct(id) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to delete product");
      }
      await fetchProducts();
      await fetchCart();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddToCart(productId) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to add to cart");
      }
      const data = await res.json();
      setCart(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateCartItem(itemId, quantity) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update cart item");
      }
      const data = await res.json();
      setCart(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveCartItem(itemId) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/cart/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to remove cart item");
      }
      const data = await res.json();
      setCart(data);
    } catch (err) {
      setError(err.message);
    }
  }

  const cartItems = cart?.items || [];
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0,
  );

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "1.5rem",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
        MERN Shopping Cart
      </h1>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.375rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.3fr",
            gap: "1.5rem",
            alignItems: "flex-start",
          }}
        >
          <section>
            <h2>Products</h2>

            <form
              onSubmit={handleCreateProduct}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                padding: "1rem",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                style={{ padding: "0.5rem", borderRadius: "0.375rem" }}
              />
              <input
                required
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                style={{ padding: "0.5rem", borderRadius: "0.375rem" }}
              />
              <input
                placeholder={
                  file ? "Using uploaded file" : "Image URL (optional)"
                }
                value={file ? "" : form.imageUrl}
                disabled={!!file}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageUrl: e.target.value }))
                }
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  background: file ? "#f3f4f6" : "white",
                }}
              />
              <input
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                style={{ padding: "0.5rem", borderRadius: "0.375rem" }}
              />
              {/* ---- image file upload ---- */}
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  padding: "0.75rem",
                  border: "1px dashed #d1d5db",
                  borderRadius: "0.375rem",
                  background: "#f9fafb",
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Selected preview"
                    style={{
                      width: "64px",
                      height: "64px",
                      objectFit: "cover",
                      borderRadius: "0.375rem",
                      border: "1px solid #e5e7eb",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "0.375rem",
                      border: "1px solid #e5e7eb",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      color: "#9ca3af",
                      flexShrink: 0,
                    }}
                  >
                    &#128247;
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(",")}
                    onChange={handleFileSelect}
                    disabled={submitting}
                    style={{ fontSize: "0.875rem", maxWidth: "100%" }}
                  />
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginTop: "0.25rem",
                    }}
                  >
                    {file
                      ? `${file.name} - ${(file.size / 1024).toFixed(0)} KB`
                      : "JPG, PNG, WEBP, GIF or AVIF - up to 5 MB"}
                  </div>

                  {uploadPct > 0 && (
                    <div
                      style={{
                        marginTop: "0.4rem",
                        height: "6px",
                        background: "#e5e7eb",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${uploadPct}%`,
                          height: "100%",
                          background: uploadPct === 100 ? "#22c55e" : "#2563eb",
                          transition: "width 0.15s linear",
                        }}
                      />
                    </div>
                  )}
                </div>

                {file && (
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={submitting}
                    style={{
                      padding: "0.35rem 0.6rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #d1d5db",
                      background: "white",
                      cursor: submitting ? "not-allowed" : "pointer",
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  gridColumn: "1 / -1",
                  padding: "0.6rem 0.75rem",
                  background: submitting ? "#93c5fd" : "#2563eb",
                  color: "white",
                  borderRadius: "0.375rem",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting
                  ? file
                    ? `Uploading image... ${uploadPct}%`
                    : "Saving..."
                  : "Add Product"}
              </button>
            </form>

            {products.length === 0 ? (
              <p>No products yet. Add one above.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                {products.map((p) => (
                  <div
                    key={p._id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "140px",
                          objectFit: "cover",
                          borderRadius: "0.375rem",
                          marginBottom: "0.25rem",
                        }}
                      />
                    ) : null}
                    <strong>{p.name}</strong>
                    <span>₹ {p.price}</span>
                    {p.description && (
                      <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                        {p.description}
                      </span>
                    )}
                    <div
                      style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        onClick={() => handleAddToCart(p._id)}
                        style={{
                          flex: 1,
                          padding: "0.4rem 0.5rem",
                          background: "#22c55e",
                          color: "white",
                          borderRadius: "0.375rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        style={{
                          padding: "0.4rem 0.5rem",
                          background: "#ef4444",
                          color: "white",
                          borderRadius: "0.375rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2>Cart</h2>
            {cartItems.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                }}
              >
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {cartItems.map((item) => (
                    <li
                      key={item._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {item.product?.name || "Deleted product"}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                          ₹ {item.product?.price || 0} × {item.quantity}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleUpdateCartItem(
                              item._id,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #d1d5db",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            handleUpdateCartItem(item._id, item.quantity + 1)
                          }
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #d1d5db",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemoveCartItem(item._id)}
                          style={{
                            marginLeft: "0.5rem",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.375rem",
                            border: "none",
                            background: "#f97316",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <hr style={{ margin: "0.75rem 0" }} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                  }}
                >
                  <span>Total</span>
                  <span>₹ {cartTotal}</span>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <section
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
        }}
      >
        <h2>Apply for a Loan</h2>
        <form
          onSubmit={handleCreateLoan}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.75rem",
          }}
        >
          <input
            required
            placeholder="Borrower name"
            value={loanForm.borrower}
            onChange={(e) =>
              setLoanForm((f) => ({ ...f, borrower: e.target.value }))
            }
            style={{ padding: "0.5rem", borderRadius: "0.375rem" }}
          />
          <input
            required
            min="0"
            type="number"
            placeholder="Loan amount"
            value={loanForm.amount}
            onChange={(e) =>
              setLoanForm((f) => ({ ...f, amount: e.target.value }))
            }
            style={{ padding: "0.5rem", borderRadius: "0.375rem" }}
          />
          <input
            required
            min="0"
            step="0.01"
            type="number"
            placeholder="Interest rate (%)"
            value={loanForm.interestRate}
            onChange={(e) =>
              setLoanForm((f) => ({ ...f, interestRate: e.target.value }))
            }
            style={{ padding: "0.5rem", borderRadius: "0.375rem" }}
          />
          <input
            required
            min="1"
            step="1"
            type="number"
            placeholder="Term (months)"
            value={loanForm.termMonths}
            onChange={(e) =>
              setLoanForm((f) => ({ ...f, termMonths: e.target.value }))
            }
            style={{ padding: "0.5rem", borderRadius: "0.375rem" }}
          />
          <select
            value={loanForm.status}
            onChange={(e) =>
              setLoanForm((f) => ({ ...f, status: e.target.value }))
            }
            style={{ padding: "0.5rem", borderRadius: "0.375rem" }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            style={{
              gridColumn: "1 / -1",
              padding: "0.6rem 0.75rem",
              background: submitting ? "#93c5fd" : "#7c3aed",
              color: "white",
              borderRadius: "0.375rem",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting
              ? "Saving..."
              : editingLoanId
                ? "Update Loan"
                : "Submit Loan Application"}
          </button>
          {editingLoanId && (
            <button
              type="button"
              onClick={cancelEditingLoan}
              disabled={submitting}
              style={{
                gridColumn: "1 / -1",
                padding: "0.6rem 0.75rem",
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <h3 style={{ marginBottom: "0.5rem" }}>Loan Applications</h3>
        {loans.length === 0 ? (
          <p>No loan applications yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {loans.map((loan) => (
              <div
                key={loan._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                  padding: "0.75rem",
                  display: "grid",
                  gap: "0.25rem",
                }}
              >
                <strong>{loan.borrower}</strong>
                <span>
                  ₹ {loan.amount} at {loan.interestRate}% for {loan.termMonths}{" "}
                  months
                </span>
                <span style={{ color: "#4b5563" }}>Status: {loan.status}</span>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => startEditingLoan(loan)}
                    style={{
                      padding: "0.4rem 0.6rem",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLoan(loan._id)}
                    style={{
                      padding: "0.4rem 0.6rem",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
