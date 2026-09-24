import { Link, Route, Routes } from "react-router-dom";
import ItemCatalog from "./components/ItemCatalog";

function NotFound() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Page not found</h1>
      <Link to="/items">Return to items</Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ItemCatalog />} />
      <Route path="/items" element={<ItemCatalog />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
