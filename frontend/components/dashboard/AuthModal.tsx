"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import type { User } from "@/types";

interface AuthModalProps {
  open: boolean;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ open, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (isSignUp) {
        const data = await api.register(name, email, password);
        saveSession(data.token, data.user);
        onSuccess(data.user);
      } else {
        const data = await api.login(email, password);
        saveSession(data.token, data.user);
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {}} // Cannot close without logging in
      title={isSignUp ? "Sign Up" : "Sign In"}
      maxWidth={400}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div style={{ color: "#DC2626", fontSize: 13, padding: "8px", background: "#FEF2F2", borderRadius: 6 }}>
            {error}
          </div>
        )}
        
        {isSignUp && (
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB" }}
            />
          </div>
        )}
        
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Email</label>
          <input 
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB" }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Password</label>
          <input 
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8,
            background: "var(--zoom-blue)",
            color: "white",
            padding: "10px",
            borderRadius: 8,
            fontWeight: 600,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 8 }}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            style={{ color: "var(--zoom-blue)", fontWeight: 500, border: "none", background: "none", cursor: "pointer" }}
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
