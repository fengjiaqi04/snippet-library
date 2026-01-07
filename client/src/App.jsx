import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import Login from "./Login";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";

export default function App() {
  const path = window.location.pathname;

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [snippets, setSnippets] = useState([]);
  const [q, setQ] = useState("");

  // edit state: null means "create mode"
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    language: "javascript",
    tags: "",
    code: "",
  });

  useEffect(() => {
    Prism.highlightAll();
  }, [snippets]);

  async function loadSnippets() {
    const data = await apiFetch("/api/snippets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSnippets(data.snippets || []);
  }

  async function search() {
    const data = await apiFetch(
      `/api/snippets/search?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSnippets(data.snippets || []);
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      language: "javascript",
      tags: "",
      code: "",
    });
  }

  function startEdit(s) {
    setEditingId(s.id);
    setForm({
      title: s.title || "",
      description: s.description || "",
      language: s.language || "javascript",
      tags: Array.isArray(s.tags) ? s.tags.join(", ") : (s.tags || ""),
      code: s.code || "",
    });

    // optional: scroll to top so you see the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveSnippet(e) {
    e.preventDefault();

    const title = form.title.trim();
    const code = form.code.trim();
    if (!title || !code) {
      alert("Title and Code are required.");
      return;
    }

    const tagsArr = (form.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      description: form.description || "",
      language: form.language || "javascript",
      tags: tagsArr,
      code,
    };

    if (editingId) {
      // UPDATE
      await apiFetch(`/api/snippets/${editingId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
    } else {
      // CREATE
      await apiFetch("/api/snippets", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
    }

    resetForm();
    await loadSnippets();
  }

  async function deleteSnippet(id) {
    const ok = confirm("Delete this snippet? This cannot be undone.");
    if (!ok) return;

    await apiFetch(`/api/snippets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    // if you were editing this one, exit edit mode
    if (editingId === id) resetForm();

    await loadSnippets();
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setSnippets([]);
    resetForm();
    window.location.href = "/login";
  }

  useEffect(() => {
    if (token) loadSnippets();
  }, [token]);

  if (path === "/login") {
    return <Login />;
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow text-center">
          <h1 className="text-xl font-semibold">Snippet Library</h1>
          <p className="mt-2 text-slate-300">You need to log in first.</p>

          <a
            className="mt-6 inline-block w-full rounded-xl bg-white/90 px-4 py-2 text-slate-900 font-medium hover:bg-white"
            href="/login"
          >
            Go to Login
          </a>

          <p className="mt-3 text-xs text-slate-400">
            (Next step we’ll add the actual login page.)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={logout}
            className="text-sm rounded-lg border border-slate-700 px-3 py-1 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create/Edit */}
          <form
            onSubmit={saveSnippet}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3"
          >
            <h2 className="font-semibold">
              {editingId ? "Edit Snippet" : "New Snippet"}
            </h2>

            <input
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <input
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2"
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />

            <textarea
              className="w-full h-32 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 font-mono"
              placeholder="Code…"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />

            <button className="w-full rounded-xl bg-white/90 text-slate-900 py-2 font-medium">
              {editingId ? "Save Changes" : "Save Snippet"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl border border-slate-700 py-2 font-medium hover:bg-slate-800"
              >
                Cancel Edit
              </button>
            ) : null}
          </form>

          {/* List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2"
                placeholder="Search snippets…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                type="button"
                onClick={search}
                className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800"
              >
                Search
              </button>
              <button
                type="button"
                onClick={loadSnippets}
                className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800"
              >
                Reload
              </button>
            </div>

            <div className="space-y-3">
              {snippets.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold">{s.title}</h3>
                      <div className="text-xs text-slate-400 mt-1">
                        {s.language || "javascript"}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(s.code || "")
                        }
                        className="text-xs rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="text-xs rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSnippet(s.id)}
                        className="text-xs rounded-lg border border-red-700 px-2 py-1 hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <pre className="mt-3 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
                    <code className={`language-${s.language || "javascript"}`}>
                      {s.code}
                    </code>
                  </pre>

                  {s.tags?.length ? (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs rounded-full border border-slate-700 px-2 py-0.5"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {snippets.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No snippets yet. Create one on the left.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
