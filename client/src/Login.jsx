import { useState } from "react";

const API = "http://localhost:3000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch {
      setError("Server not reachable");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow"
      >
        <h1 className="text-xl font-semibold mb-4 text-center">
          Login
        </h1>

        <input
          className="mb-3 w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="mb-4 w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        <button className="w-full rounded-xl bg-white text-slate-900 py-2 font-medium">
          Login
        </button>
      </form>
    </div>
  );
}
