// Simple front-end auth to simulate login before you add a real database.
// Default demo user.
const DEMO_USER = {
  email: "areen@example.com",
  password: "love123",
  name: "Areen"
};

const AUTH_KEY = "ourBudgetHub_auth";

function saveAuth(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function getAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

// Redirect logic used on both pages.
function requireAuthOnDashboard() {
  const auth = getAuth();
  if (!auth) {
    window.location.href = "index.html";
  }
}

function redirectIfLoggedInOnLogin() {
  const auth = getAuth();
  if (auth) {
    window.location.href = "dashboard.html";
  }
}

// Page-specific setup
document.addEventListener("DOMContentLoaded", () => {
  const isLoginPage = document.getElementById("login-form") !== null;
  const isDashboard = document.getElementById("logout-btn") !== null;

  if (isLoginPage) {
    redirectIfLoggedInOnLogin();
    const form = document.getElementById("login-form");
    const errorEl = document.getElementById("login-error");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      // Simple demo check. Replace this with real backend later.
      if (email.toLowerCase() === DEMO_USER.email && password === DEMO_USER.password) {
        saveAuth({ email: DEMO_USER.email, name: DEMO_USER.name });
        window.location.href = "dashboard.html";
      } else {
        errorEl.hidden = false;
      }
    });
  }

  if (isDashboard) {
    requireAuthOnDashboard();
    const auth = getAuth();
    const welcomeText = document.getElementById("welcome-text");
    if (auth && welcomeText) {
      welcomeText.textContent = `Logged in as ${auth.name || auth.email}`;
    }

    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.addEventListener("click", () => {
      clearAuth();
      window.location.href = "index.html";
    });
  }
});
