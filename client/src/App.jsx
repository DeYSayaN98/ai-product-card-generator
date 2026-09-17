import { useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const CATEGORIES = [
  "Home & Kitchen",
  "Fashion & Apparel",
  "Electronics",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Toys & Games",
  "Books & Stationery",
  "Other",
];

// Deterministically turn a product name into a two-tone gradient + monogram,
// so the "no photo" state looks designed rather than broken.
function coverFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 42) % 360;
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return {
    background: `linear-gradient(135deg, hsl(${hue1} 46% 40%), hsl(${hue2} 52% 30%))`,
    initial,
  };
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 12.5v-8A1.5 1.5 0 0 1 6 3h8" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <path d="M4 10.5l3.5 3.5L16 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
      <path
        d="M12.6 2.6 3 12.2v6.7c0 1.2 1 2.1 2.1 2.1h6.7l9.6-9.6a3 3 0 0 0 0-4.2L16.8 2.6a3 3 0 0 0-4.2 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

function App() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [card, setCard] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setCopied(false);

    if (!productName.trim()) {
      setError("Enter a product name first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: productName.trim(), category }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setCard(data);
    } catch (err) {
      setError(err.message || "Failed to generate details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!card) return;
    const text = `${card.title}\n\n${card.description}\n\nTags: ${card.tags.join(", ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy — your browser may be blocking clipboard access.");
    }
  }

  const cover = card ? coverFromName(card.productName || productName) : null;

  return (
    <div className="shell">
      <header className="topbar">
        <span className="logo-mark" aria-hidden="true">◆</span>
        <span className="logo-text">Shelfmark</span>
      </header>

      <div className="layout">
        <section className="form-pane">
          <h1>Write the listing for you</h1>
          <p className="lede">
            Tell it what you're selling. It writes the title, description, and tags —
            you just review and ship.
          </p>

          <form onSubmit={handleGenerate} className="gen-form">
            <label>
              Product name
              <input
                type="text"
                placeholder="e.g. Ceramic pour-over coffee dripper"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                disabled={loading}
              />
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={loading} className="generate-btn">
              <span className={loading ? "btn-label is-hidden" : "btn-label"}>
                Generate details
              </span>
              {loading && (
                <span className="btn-loader" aria-hidden="true">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              )}
            </button>
          </form>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
        </section>

        <section className="preview-pane">
          {loading && (
            <div className="skeleton-card" role="status" aria-live="polite">
              <div className="skeleton-thumb">
                <div className="stamp-ring" />
              </div>
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
              <div className="skeleton-tags">
                <span className="skeleton-tag" />
                <span className="skeleton-tag" />
                <span className="skeleton-tag" />
              </div>
            </div>
          )}

          {!loading && !card && (
            <div className="empty-state">
              <TagIcon />
              <p>Your generated product card will show up here.</p>
            </div>
          )}

          {!loading && card && (
            <article className="product-card">
              <div className="card-thumb" style={{ background: cover.background }}>
                <span className="cover-monogram">{cover.initial}</span>
                <span className="cover-badge">No photo — auto cover</span>
              </div>

              <div className="card-body">
                <div className="card-top-row">
                  <span className="card-category">{card.category || category}</span>
                  <button
                    type="button"
                    className={copied ? "copy-btn is-copied" : "copy-btn"}
                    onClick={handleCopy}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <h2>{card.title}</h2>
                <p className="card-desc">{card.description}</p>
                <div className="card-tags">
                  {card.tags.map((tag, i) => (
                    <span
                      className="tag-chip"
                      key={tag}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          )}
        </section>
      </div>

      <footer className="footer">React · Express · Groq</footer>
    </div>
  );
}

export default App;
