// src/Pages/Items/Items.tsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

type Item = {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null;
  category_id?: number | null;
};

type Category = {
  id: number;
  name: string;
  items: Item[];
};

export default function Items() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
  });


  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormName, setCategoryFormName] = useState("");

  const API_BASE = "http://localhost:3000";

  const token = localStorage.getItem("token");
  //const location = useLocation();
  //const urlEndsWithItems = /\/items\/?$/.test(location.pathname);
  const isAdminAndOnItemsPage = Boolean(token) ;


  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCategories() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError("Could not load categories — showing demo data.");
      setCategories(mockCategories());
    } finally {
      setLoading(false);
      // reset scroll to first
      setTimeout(() => {
        const el = containerRef.current;
        if (el) el.scrollTo({ left: 0 });
        setActiveIndex(0);
      }, 0);
    }
  }

  // scroll listener to set activeIndex
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth || 1;
        const idx = Math.round(el.scrollLeft / w);
        setActiveIndex(
          Math.min(Math.max(idx, 0), Math.max(0, categories.length - 1))
        );
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [categories.length]);

  // keyboard left/right
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, categories.length]);

  // ITEM form helpers
  function openAddItem() {
    setEditingItem(null);
    setItemForm({
      name: "",
      description: "",
      price: "",
      category_id:
        (categories[activeIndex] && categories[activeIndex].id?.toString()) ||
        (categories[0]?.id?.toString() ?? ""),
    });
    setShowItemForm(true);
  }
  function openEditItem(it: Item) {
    setEditingItem(it);
    setItemForm({
      name: it.name,
      description: it.description ?? "",
      price: (it.price ?? 0).toString(),
      category_id:
        (it.category_id ?? categories[activeIndex]?.id ?? "").toString(),
    });
    setShowItemForm(true);
  }
  function closeItemForm() {
    setEditingItem(null);
    setShowItemForm(false);
  }

  async function submitItemForm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!itemForm.name.trim()) return alert("Name is required");
    const payload = {
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || null,
      price: Number(itemForm.price || 0),
      category_id: itemForm.category_id ? Number(itemForm.category_id) : null,
    };
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem
        ? `${API_BASE}/items/${editingItem!.id}`
        : `${API_BASE}/items`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      // reload categories to keep consistent grouping
      await loadCategories();
      closeItemForm();
    } catch (err: any) {
      alert("Save failed: " + (err.message || err));
    }
  }

  async function deleteItem(id: number) {
    if (!confirm("Delete item? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      await loadCategories();
    } catch (err: any) {
      alert("Delete failed: " + (err.message || err));
    }
  }

  // CATEGORY form helpers
  function openAddCategory() {
    setEditingCategory(null);
    setCategoryFormName("");
    setShowCategoryForm(true);
  }
  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setCategoryFormName(cat.name);
    setShowCategoryForm(true);
  }
  function closeCategoryForm() {
    setEditingCategory(null);
    setShowCategoryForm(false);
    setCategoryFormName("");
  }

  async function submitCategoryForm(e?: React.FormEvent) {
    e?.preventDefault();
    const name = categoryFormName.trim();
    if (!name) return alert("Category name required");
    try {
      if (editingCategory) {
        const res = await fetch(
          `${API_BASE}/categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ name }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error ?? `HTTP ${res.status}`);
        }
      } else {
        const res = await fetch(`${API_BASE}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error ?? `HTTP ${res.status}`);
        }
      }
      await loadCategories();
      closeCategoryForm();
    } catch (err: any) {
      alert("Category save failed: " + (err.message || err));
    }
  }

  async function deleteCategory(catId: number) {
    if (
      !confirm("Delete category? Items in this category will be uncategorized.")
    )
      return;
    try {
      const res = await fetch(`${API_BASE}/categories/${catId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      await loadCategories();
    } catch (err: any) {
      alert("Delete failed: " + (err.message || err));
    }
  }

  // scroll helpers
  function goToCategory(index: number) {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    el.scrollTo({ left: index * w, behavior: "smooth" });
    setActiveIndex(index);
  }
  function goPrev() {
    if (activeIndex <= 0) return;
    goToCategory(activeIndex - 1);
  }
  function goNext() {
    if (activeIndex >= Math.max(0, categories.length - 1)) return;
    goToCategory(activeIndex + 1);
  }
  const [adminMounted, setAdminMounted] = useState(false);
useEffect(() => {
  // small delay so the transition is visible on mount
  const t = setTimeout(() => setAdminMounted(true), 40);
  return () => clearTimeout(t);
}, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-gray-600">Loading menu…</div>
      </div>
    );

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-[rgba(250,248,245,1)] to-white">
      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; height: 0; }
      `}</style>

      <div className="max-w-7xl mx-auto p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[12px] uppercase tracking-widest text-gray-600 mb-1">
              Our Menu
            </div>
            <h1 className="text-4xl font-serif text-gray-900">Main course</h1>
            <div className="text-sm text-gray-500 mt-1">
              Swipe or use arrows to browse categories
            </div>
          </div>

          {isAdminAndOnItemsPage && (
            <div className="flex items-center gap-3">
              <button
                onClick={openAddCategory}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow"
              >
                + Category
              </button>
              <button
                onClick={openAddItem}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow"
              >
                + Add item
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-100 p-3 rounded">
            {error}
          </div>
        )}

        {/* Admin category manager: quick list with edit/delete */}
       {isAdminAndOnItemsPage && (
  <div
    className={`mb-6 transition-opacity duration-300 ${adminMounted ? "opacity-100" : "opacity-0"}`}
    aria-hidden={!adminMounted}
  >
    <div className="flex items-center justify-between mb-2">
      <div>
        <h3 className="text-sm font-medium text-gray-800">Manage categories</h3>
        <p className="text-xs text-gray-500 mt-0.5">Edit, delete or jump to a category.</p>
      </div>

      <div>
        <button
          onClick={openAddCategory}
          className="text-sm px-3 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-shadow duration-200"
          aria-label="Add category"
        >
          + Add
        </button>
      </div>
    </div>

    <div className="flex gap-3 overflow-x-auto py-1">
      {categories.map((c, idx) => {
        const delay = `${idx * 60}ms`;
        return (
          <div
            key={c.id}
            onClick={() => goToCategory(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") goToCategory(idx); }}
            className={`group flex-shrink-0 min-w-[180px] p-3 rounded-lg border border-gray-100 bg-white shadow-sm
              transform transition duration-300 ease-out
              ${adminMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            style={{ transitionDelay: delay }}
            title={`Jump to ${c.name}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                <div className="text-xs text-gray-500">{c.items.length} item{c.items.length !== 1 ? "s" : ""}</div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditCategory(c); }}
                  className="text-xs px-2 py-0.5 rounded-md border border-gray-200 hover:bg-gray-50 transition"
                  aria-label={`Edit ${c.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCategory(c.id); }}
                  className="text-xs px-2 py-0.5 rounded-md border border-gray-200 hover:bg-red-50 text-red-600 transition"
                  aria-label={`Delete ${c.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

        <div
          ref={containerRef}
          className="w-full overflow-x-auto snap-x snap-mandatory scroll-smooth relative no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex">
            {categories.map((cat, idx) => (
              <section
                key={cat.id}
                className="snap-start w-full flex-shrink-0 px-6 py-8"
                style={{ boxSizing: "border-box" }}
                aria-label={cat.name}
              >
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-semibold">{cat.name}</h2>
                      <div className="text-sm text-gray-500">
                        ({cat.items.length})
                      </div>
                    </div>

                    {/* category management icons (per-category) */}
                    {isAdminAndOnItemsPage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditCategory(cat)}
                          title="Edit category"
                          className="text-sm px-2 py-1 border rounded text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          title="Delete category"
                          className="text-sm px-2 py-1 border rounded text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <MenuColumn
                      items={cat.items.filter((_, i) => i % 2 === 0)}
                      onEdit={isAdminAndOnItemsPage ? openEditItem : undefined}
                      onDelete={isAdminAndOnItemsPage ? deleteItem : undefined}
                    />
                    <MenuColumn
                      items={cat.items.filter((_, i) => i % 2 === 1)}
                      onEdit={isAdminAndOnItemsPage ? openEditItem : undefined}
                      onDelete={isAdminAndOnItemsPage ? deleteItem : undefined}
                    />
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* dots */}
        <div className="mt-6 flex justify-center gap-3">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => goToCategory(i)}
              className={`w-3 h-3 rounded-full transition-transform ${
                i === activeIndex ? "scale-125" : ""
              }`}
              style={{ background: i === activeIndex ? "#111827" : "#d1d5db" }}
              aria-label={`Go to ${cat.name}`}
            />
          ))}
        </div>

        {/* arrows */}
        {categories.length > 1 && (
          <>
            <button
              onClick={goPrev}
              aria-label="Previous category"
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-opacity ${
                activeIndex <= 0
                  ? "opacity-40 pointer-events-none"
                  : "opacity-100"
              } bg-white/90`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goNext}
              aria-label="Next category"
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-opacity ${
                activeIndex >= categories.length - 1
                  ? "opacity-40 pointer-events-none"
                  : "opacity-100"
              } bg-white/90`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ITEM modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeItemForm}
          />
          <form
            onSubmit={submitItemForm}
            className="relative z-10 w-full max-w-lg bg-white rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-4">
              {editingItem ? "Edit item" : "Add item"}
            </h3>

            <label className="block mb-3">
              <div className="text-sm text-gray-600 mb-1">Name</div>
              <input
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </label>

            <label className="block mb-3">
              <div className="text-sm text-gray-600 mb-1">Description</div>
              <textarea
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm({ ...itemForm, description: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </label>

            <label className="block mb-3">
              <div className="text-sm text-gray-600 mb-1">Price</div>
              <input
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: e.target.value })
                }
                type="number"
                step="0.01"
                className="w-full border rounded px-3 py-2"
              />
            </label>

            <label className="block mb-4">
              <div className="text-sm text-gray-600 mb-1">Category</div>
              <select
                value={itemForm.category_id}
                onChange={(e) =>
                  setItemForm({ ...itemForm, category_id: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={closeItemForm}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeCategoryForm}
          />
          <form
            onSubmit={submitCategoryForm}
            className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-4">
              {editingCategory ? "Edit category" : "Add category"}
            </h3>

            <label className="block mb-4">
              <div className="text-sm text-gray-600 mb-1">Category name</div>
              <input
                value={categoryFormName}
                onChange={(e) => setCategoryFormName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </label>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={closeCategoryForm}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* Menu column component */
function MenuColumn({
  items,
  onEdit,
  onDelete,
}: {
  items: Item[];
  onEdit?: (it: Item) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <ul className="space-y-6">
      {items.map((it) => (
        <li key={it.id} className="group">
          <div className="flex items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="text-lg font-medium text-gray-800 truncate">
                  {it.name}
                </span>
                <span className="flex-1 border-b border-dotted border-gray-300 mx-4" />
                <span className="whitespace-nowrap text-base font-semibold text-rose-700">
                  {formatPrice(Number(it.price ?? 0))}
                </span>
              </div>
              {it.description && (
                <p className="mt-2 text-sm text-gray-500">{it.description}</p>
              )}
            </div>

            {onEdit && onDelete && (
              <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => onEdit(it)}
                  className="text-sm px-2 py-1 mr-2 border rounded text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(it.id)}
                  className="text-sm px-2 py-1 border rounded text-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatPrice(n: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

/* fallback demo categories */
function mockCategories(): Category[] {
  return [
    {
      id: 1,
      name: "Pasta",
      items: [
        {
          id: 1,
          name: "Cinghiale",
          description: "Demo",
          price: 95,
          category_id: 1,
        },
      ],
    },
    {
      id: 2,
      name: "Meat",
      items: [
        {
          id: 2,
          name: "Filetto",
          description: "Demo",
          price: 55,
          category_id: 2,
        },
      ],
    },
  ];
}
