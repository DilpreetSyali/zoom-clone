"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import { User } from "@/types";

export function TopNav() {
  const [showProfile, setShowProfile] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("zoom_userId");
    if (userId) {
      api.getUser(parseInt(userId))
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("zoom_userId");
          setShowSignIn(true);
        });
    } else {
      setShowSignIn(true);
    }
  }, []);

  const handleSignOut = () => {
    setUser(null);
    setShowProfile(false);
    localStorage.removeItem("zoom_userId");
    setShowSignIn(true);
  };

  const handleAuth = () => {
    setError("");
    if (isSignUp) {
      api.signup({ name, email, password })
        .then((data) => {
          setUser(data);
          localStorage.setItem("zoom_userId", data.id.toString());
          setShowSignIn(false);
        })
        .catch((err) => setError(err.message || "Failed to sign up"));
    } else {
      api.login({ email, password })
        .then((data) => {
          setUser(data);
          localStorage.setItem("zoom_userId", data.id.toString());
          setShowSignIn(false);
        })
        .catch((err) => setError(err.message || "Failed to sign in"));
    }
  };

  return (
    <>
      <header className="topNav">
        <div className="brand">
          <div className="brandMark" />
          Zoom
        </div>
        <nav className="tabs">
          <span className="tab active">Home</span>
          <span className="tab">Chat</span>
          <span className="tab">Meetings</span>
          <span className="tab">Contacts</span>
        </nav>
        
        <div className="relativeMenuWrapper" style={{ marginLeft: "auto" }}>
          {user ? (
            <>
              <div 
                className="avatar cursor-pointer" 
                onClick={() => setShowProfile(!showProfile)}
                style={{ backgroundColor: user.avatar_color }}
              >
                {user.initials}
              </div>
              
              {showProfile && (
                <div className="popupMenu profileMenu">
                  <div className="profileHeader">
                    <div className="avatar" style={{ backgroundColor: user.avatar_color, position: 'relative' }}>
                      {user.initials}
                      <span style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        backgroundColor: '#10b981',
                        border: '2px solid white',
                        borderRadius: '50%'
                      }}></span>
                    </div>
                    <div className="profileInfo">
                      <div className="profileName">{user.name}</div>
                      <div className="profileEmail">{user.email}</div>
                    </div>
                  </div>
                  <div className="divider"></div>
                  <button className="menuItem" onClick={() => setShowProfile(false)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#4B5563"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    My Profile
                  </button>
                  <button className="menuItem" onClick={() => setShowProfile(false)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#9CA3AF"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 9.82a.504.504 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                    Settings
                  </button>
                  <button className="menuItem" onClick={() => setShowProfile(false)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#9CA3AF"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>
                    Keyboard Shortcuts
                  </button>
                  <button className="menuItem" onClick={() => setShowProfile(false)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#9CA3AF"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/></svg>
                    Help & Support
                  </button>
                  <div className="divider"></div>
                  <button className="menuItem text-red-500" onClick={handleSignOut} style={{ color: '#EF4444' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#EF4444"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Button onClick={() => setShowSignIn(true)}>Sign In</Button>
          )}
        </div>
      </header>

      {showSignIn && (
        <Modal title={isSignUp ? "Sign Up" : "Sign In"} onClose={() => {}}>
          {error && <div className="errorText" style={{ marginBottom: "12px" }}>{error}</div>}
          
          {isSignUp && (
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          <Button onClick={handleAuth} style={{ width: "100%", marginTop: "10px" }}>
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>
          
          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px" }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <span 
              className="cursor-pointer text-blue-600" 
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ color: '#2d8cff', textDecoration: 'underline' }}
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </span>
          </div>
        </Modal>
      )}
    </>
  );
}
