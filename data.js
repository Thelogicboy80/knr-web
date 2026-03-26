(function () {
  const ADMIN_TOKEN_KEY = "knr-movies.admin-token";
  const SESSION_KEY = "knr-movies.admin-session";
  const USER_TOKEN_KEY = "knr-movies.user-token";
  const USER_SESSION_KEY = "knr-movies.user-session";
  const VERSION = 5;
  const CURRENT_SITE_NAME = "KNR MOVIEES";
  const LEGACY_SITE_NAME = "KNR MOVIES";
  const CURRENT_TELEGRAM_HANDLE = "@KNR_MOVIEES";
  const CURRENT_TELEGRAM_URL = "https://t.me/KNR_MOVIEES";
  const LEGACY_TELEGRAM_HANDLE = "@KNR_MOVIESSS";
  const LEGACY_TELEGRAM_URL = "https://t.me/KNR_MOVIESSS";
  const DEFAULT_DISTRIBUTION_NOTICE = "Share only movies and files you own or are licensed to distribute.";
  const LEGACY_PLAN_MAP = {
    free: "free",
    gold: "monthly",
    vip: "yearly",
  };
  const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";
  const IS_ADMIN_PAGE =
    /admin\.html/i.test(window.location.pathname) ||
    /\/admin$/i.test(window.location.pathname) ||
    /admin\.html/i.test(window.location.href);

  const starterCatalog = [
    {
      id: "movie-dark-knight",
      imdbID: "tt0468569",
      titleHint: "The Dark Knight",
      yearHint: "2008",
      tag: "Crime Epic",
      note: "A relentless, high-stakes thriller that still feels massive on every rewatch.",
      featured: true,
      ctaLabel: "Open on Telegram",
      ctaUrl: CURRENT_TELEGRAM_URL,
      trailerUrl: "",
      downloadLabel: "Download",
      downloadUrl: "",
      addedAt: "2026-03-25T00:00:00.000Z",
    },
    {
      id: "movie-inception",
      imdbID: "tt1375666",
      titleHint: "Inception",
      yearHint: "2010",
      tag: "Mind-Bending",
      note: "Layered storytelling, spectacle, and a soundtrack built for late-night marathons.",
      featured: true,
      ctaLabel: "Open on Telegram",
      ctaUrl: CURRENT_TELEGRAM_URL,
      trailerUrl: "",
      downloadLabel: "Download",
      downloadUrl: "",
      addedAt: "2026-03-25T00:00:00.000Z",
    },
    {
      id: "movie-interstellar",
      imdbID: "tt0816692",
      titleHint: "Interstellar",
      yearHint: "2014",
      tag: "Space Drama",
      note: "Big emotions, giant ideas, and cinematic scale that always lands.",
      featured: true,
      ctaLabel: "Open on Telegram",
      ctaUrl: CURRENT_TELEGRAM_URL,
      trailerUrl: "",
      downloadLabel: "Download",
      downloadUrl: "",
      addedAt: "2026-03-25T00:00:00.000Z",
    },
    {
      id: "movie-dune",
      imdbID: "tt1160419",
      titleHint: "Dune",
      yearHint: "2021",
      tag: "Sci-Fi Event",
      note: "For viewers who want prestige visuals, political tension, and world-building.",
      featured: false,
      ctaLabel: "Open on Telegram",
      ctaUrl: CURRENT_TELEGRAM_URL,
      trailerUrl: "",
      downloadLabel: "Download",
      downloadUrl: "",
      addedAt: "2026-03-25T00:00:00.000Z",
    },
    {
      id: "movie-top-gun",
      imdbID: "tt1745960",
      titleHint: "Top Gun: Maverick",
      yearHint: "2022",
      tag: "Adrenaline Rush",
      note: "Precision action, clean pacing, and blockbuster energy from start to finish.",
      featured: false,
      ctaLabel: "Open on Telegram",
      ctaUrl: CURRENT_TELEGRAM_URL,
      trailerUrl: "",
      downloadLabel: "Download",
      downloadUrl: "",
      addedAt: "2026-03-25T00:00:00.000Z",
    },
    {
      id: "movie-rrr",
      imdbID: "tt8178634",
      titleHint: "RRR",
      yearHint: "2022",
      tag: "Massive Spectacle",
      note: "A maximalist watch with crowd-pleasing moments and a huge visual identity.",
      featured: true,
      ctaLabel: "Open on Telegram",
      ctaUrl: CURRENT_TELEGRAM_URL,
      trailerUrl: "",
      downloadLabel: "Download",
      downloadUrl: "",
      addedAt: "2026-03-25T00:00:00.000Z",
    },
    {
      id: "movie-john-wick",
      imdbID: "tt2911666",
      titleHint: "John Wick",
      yearHint: "2014",
      tag: "Action Favorite",
      note: "Sharp choreography and fast replay value for action-first audiences.",
      featured: false,
      ctaLabel: "Open on Telegram",
      ctaUrl: CURRENT_TELEGRAM_URL,
      trailerUrl: "",
      downloadLabel: "Download",
      downloadUrl: "",
      addedAt: "2026-03-25T00:00:00.000Z",
    },
    {
      id: "movie-no-way-home",
      imdbID: "tt10872600",
      titleHint: "Spider-Man: No Way Home",
      yearHint: "2021",
      tag: "Fan Event",
      note: "A high-energy crowd favorite with strong nostalgia and momentum.",
      featured: true,
      ctaLabel: "Open on Telegram",
      ctaUrl: CURRENT_TELEGRAM_URL,
      trailerUrl: "",
      downloadLabel: "Download",
      downloadUrl: "",
      addedAt: "2026-03-25T00:00:00.000Z",
    },
  ];

  const starterCollections = [
    {
      id: "collection-spotlight",
      title: "Spotlight Premieres",
      description: "High-attention titles for the first thing visitors should notice.",
      movieIds: ["movie-dark-knight", "movie-rrr", "movie-no-way-home"],
    },
    {
      id: "collection-imdb-essentials",
      title: "IMDb Essentials",
      description: "Strong ratings, lasting rewatch value, and cinematic reputation.",
      movieIds: ["movie-inception", "movie-interstellar", "movie-top-gun"],
    },
    {
      id: "collection-weekend",
      title: "Weekend Marathon",
      description: "Long-form, satisfying picks for a complete binge session.",
      movieIds: ["movie-dune", "movie-john-wick", "movie-dark-knight", "movie-interstellar"],
    },
  ];

  const starterMembershipPlans = [
    {
      id: "free",
      name: "Free Plan",
      priceLabel: "Free",
      description: "Basic access for members who open protected destination links through LinkShortify.",
      perks: [
        "Create your KNR MOVIEES account",
        "Open member links through LinkShortify",
        "Upgrade anytime to bypass the shortener",
      ],
      featured: false,
    },
    {
      id: "daily",
      name: "Daily Plan",
      priceLabel: "Rs 10 / day",
      description: "Perfect for quick access when you want one full day of direct entry into KNR MOVIEES.",
      perks: [
        "Direct destination access",
        "Stay connected to @KNR_MOVIEES",
        "One-day membership access",
      ],
      featured: false,
    },
    {
      id: "monthly",
      name: "Monthly Plan",
      priceLabel: "Rs 99 / month",
      description: "The best balance for active viewers who want stable membership every month.",
      perks: [
        "Full month membership access",
        "Priority drop visibility",
        "Better long-term value",
      ],
      featured: true,
    },
    {
      id: "yearly",
      name: "Yearly Plan",
      priceLabel: "Rs 299 / year",
      description: "The strongest membership option for loyal members who want the longest access.",
      perks: [
        "Full year membership access",
        "Top value for long-term members",
        "Premium KNR MOVIEES status",
      ],
      featured: false,
    },
  ];

  const defaultState = {
    version: VERSION,
    settings: {
      siteName: CURRENT_SITE_NAME,
      tagline: "Telegram-first movie discovery with a premium streaming feel.",
      heroEyebrow: "Curated for your Telegram audience",
      heroTitle: "A cinematic home base for every movie drop.",
      heroCopy:
        "KNR MOVIEES blends Netflix-style presentation with OMDb-powered facts so visitors can browse, search, join, and upgrade their membership in one place.",
      announcement:
        "Fresh finds, member-ready access, and direct Telegram links without exposing personal details.",
      telegramHandle: CURRENT_TELEGRAM_HANDLE,
      telegramUrl: CURRENT_TELEGRAM_URL,
      telegramBotUsername: "",
      primaryButtonLabel: "Join Telegram",
      secondaryButtonLabel: "Browse Library",
      shortenerBaseUrl: "https://linkshortify.com",
      freePlanShortenerEnabled: true,
      apiKey: "38f9f86a",
      heroMovieId: "movie-dark-knight",
      distributionNotice: DEFAULT_DISTRIBUTION_NOTICE,
      footerNote: "Built for brand presence, discovery, member growth, and channel loyalty.",
    },
    admin: {
      configured: false,
      username: "",
      passwordHash: "",
      updatedAt: "",
    },
    membershipPlans: starterMembershipPlans,
    users: [],
    catalog: starterCatalog,
    collections: starterCollections,
  };

  let cachedState = {
    ...deepClone(defaultState),
    memberCount: 0,
  };
  let cachedCurrentUser = null;
  let adminAuthenticated = false;

  function deepClone(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
  }

  function normalizeTelegramUrl(url) {
    const cleanUrl = String(url || "").trim();
    if (!cleanUrl || cleanUrl === LEGACY_TELEGRAM_URL) {
      return CURRENT_TELEGRAM_URL;
    }
    return cleanUrl;
  }

  function normalizeTelegramHandle(handle) {
    const cleanHandle = String(handle || "").trim();
    if (!cleanHandle || cleanHandle === LEGACY_TELEGRAM_HANDLE) {
      return CURRENT_TELEGRAM_HANDLE;
    }
    return cleanHandle;
  }

  function normalizeTelegramBotUsername(username) {
    return String(username || "").trim().replace(/^@+/, "");
  }

  function normalizeSiteName(siteName) {
    const cleanName = String(siteName || "").trim();
    if (!cleanName || cleanName === LEGACY_SITE_NAME) {
      return CURRENT_SITE_NAME;
    }
    return cleanName;
  }

  function normalizeMovie(movie) {
    return {
      id: movie.id || createId("movie"),
      imdbID: String(movie.imdbID || "").trim(),
      titleHint: String(movie.titleHint || "").trim(),
      yearHint: String(movie.yearHint || "").trim(),
      tag: String(movie.tag || "").trim(),
      note: String(movie.note || "").trim(),
      featured: Boolean(movie.featured),
      ctaLabel: String(movie.ctaLabel || "Open on Telegram").trim() || "Open on Telegram",
      ctaUrl: normalizeTelegramUrl(movie.ctaUrl),
      trailerUrl: String(movie.trailerUrl || "").trim(),
      downloadLabel: String(movie.downloadLabel || "Download").trim() || "Download",
      downloadUrl: String(movie.downloadUrl || "").trim(),
      hasDownload: Boolean(String(movie.downloadUrl || "").trim() || movie.hasDownload),
      addedAt: movie.addedAt || new Date().toISOString(),
    };
  }

  function normalizeCollection(collection) {
    return {
      id: collection.id || createId("collection"),
      title: String(collection.title || "").trim() || "Untitled Collection",
      description: String(collection.description || "").trim(),
      movieIds: Array.isArray(collection.movieIds)
        ? collection.movieIds.filter(Boolean).map(String)
        : [],
    };
  }

  function normalizePlan(plan) {
    return {
      id: String(plan.id || createId("plan")).trim(),
      name: String(plan.name || "Membership").trim(),
      priceLabel: String(plan.priceLabel || "Contact Admin").trim(),
      description: String(plan.description || "").trim(),
      perks: Array.isArray(plan.perks)
        ? plan.perks.map((perk) => String(perk || "").trim()).filter(Boolean)
        : String(plan.perks || "")
            .split(",")
            .map((perk) => perk.trim())
            .filter(Boolean),
      featured: Boolean(plan.featured),
    };
  }

  function normalizeUser(user, fallbackPlanId) {
    return {
      id: String(user.id || createId("user")).trim(),
      displayName: String(user.displayName || "").trim(),
      email: String(user.email || "").trim().toLowerCase(),
      passwordHash: String(user.passwordHash || "").trim(),
      membershipId: String(user.membershipId || fallbackPlanId || "free").trim(),
      membershipStatus: String(user.membershipStatus || "active").trim() || "active",
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
      lastLoginAt: user.lastLoginAt || "",
    };
  }

  function normalizeState(rawState) {
    const base = deepClone(defaultState);
    const state = rawState && typeof rawState === "object" ? rawState : {};

    base.settings = {
      ...base.settings,
      ...(state.settings || {}),
    };
    base.settings.siteName = normalizeSiteName(base.settings.siteName);
    base.settings.telegramHandle = normalizeTelegramHandle(base.settings.telegramHandle);
    base.settings.telegramUrl = normalizeTelegramUrl(base.settings.telegramUrl);
    base.settings.telegramBotUsername = normalizeTelegramBotUsername(base.settings.telegramBotUsername);
    base.settings.shortenerBaseUrl = String(base.settings.shortenerBaseUrl || "https://linkshortify.com").trim();
    base.settings.freePlanShortenerEnabled = base.settings.freePlanShortenerEnabled !== false;
    base.settings.distributionNotice =
      String(base.settings.distributionNotice || DEFAULT_DISTRIBUTION_NOTICE).trim() ||
      DEFAULT_DISTRIBUTION_NOTICE;

    base.admin = {
      ...base.admin,
      ...(state.admin || {}),
    };

    const normalizedPlans =
      Array.isArray(state.membershipPlans) && state.membershipPlans.length
        ? state.membershipPlans.map(normalizePlan)
        : base.membershipPlans.map(normalizePlan);

    const shouldMigrateLegacyPlans =
      Number(state.version || 0) < VERSION &&
      normalizedPlans.length > 0 &&
      (
        normalizedPlans.every((plan) => Object.prototype.hasOwnProperty.call(LEGACY_PLAN_MAP, plan.id)) ||
        normalizedPlans.every((plan) => ["daily", "monthly", "yearly"].includes(plan.id))
      );

    base.membershipPlans = shouldMigrateLegacyPlans
      ? base.membershipPlans.map(normalizePlan)
      : normalizedPlans;

    const validPlanIds = new Set(base.membershipPlans.map((plan) => plan.id));
    const fallbackPlanId = base.membershipPlans[0] ? base.membershipPlans[0].id : "free";

    if (Array.isArray(state.users) && state.users.length) {
      base.users = state.users.map((user) => normalizeUser(user, fallbackPlanId));
    } else {
      base.users = [];
    }

    base.users = base.users.map((user) => {
      const mappedMembershipId = shouldMigrateLegacyPlans
        ? LEGACY_PLAN_MAP[user.membershipId] || user.membershipId
        : user.membershipId;

      return {
        ...user,
        membershipId: validPlanIds.has(mappedMembershipId) ? mappedMembershipId : fallbackPlanId,
      };
    });

    if (Array.isArray(state.catalog) && state.catalog.length) {
      base.catalog = state.catalog.map(normalizeMovie);
    } else {
      base.catalog = base.catalog.map(normalizeMovie);
    }

    if (Array.isArray(state.collections) && state.collections.length) {
      base.collections = state.collections.map(normalizeCollection);
    } else {
      base.collections = base.collections.map(normalizeCollection);
    }

    const validMovieIds = new Set(base.catalog.map((movie) => movie.id));
    base.collections = base.collections.map((collection) => ({
      ...collection,
      movieIds: collection.movieIds.filter((movieId) => validMovieIds.has(movieId)),
    }));

    if (!validMovieIds.has(base.settings.heroMovieId)) {
      base.settings.heroMovieId = base.catalog[0] ? base.catalog[0].id : "";
    }

    base.version = VERSION;
    return base;
  }

  function attachMemberCount(state, memberCount) {
    return {
      ...normalizeState(state),
      memberCount: Number.isFinite(Number(memberCount)) ? Number(memberCount) : 0,
    };
  }

  function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  }

  function getUserToken() {
    return localStorage.getItem(USER_TOKEN_KEY) || "";
  }

  function getToken(authMode) {
    if (authMode === "admin") {
      return getAdminToken();
    }

    if (authMode === "user") {
      return getUserToken();
    }

    if (authMode === "none") {
      return "";
    }

    return IS_ADMIN_PAGE ? getAdminToken() : getUserToken();
  }

  async function apiFetch(path, options) {
    const settings = options && typeof options === "object" ? options : {};
    const requestHeaders = new Headers(settings.headers || {});
    const authMode = settings.auth || (IS_ADMIN_PAGE ? "admin" : "user");

    if (settings.body !== undefined && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const token = getToken(authMode);
    if (token && !requestHeaders.has("Authorization")) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method: settings.method || "GET",
      headers: requestHeaders,
      body:
        settings.body === undefined
          ? undefined
          : requestHeaders.get("Content-Type") === "application/json"
            ? JSON.stringify(settings.body)
            : settings.body,
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      const error = new Error(typeof payload === "string" ? payload : payload.error || "Request failed.");
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function setSession(username, token) {
    const session = {
      username,
      loginAt: new Date().toISOString(),
    };

    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    adminAuthenticated = true;
    return session;
  }

  function clearSession() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    adminAuthenticated = false;
  }

  function getUserSession() {
    try {
      const raw = localStorage.getItem(USER_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function setUserSession(userId, token) {
    const session = {
      userId,
      loginAt: new Date().toISOString(),
    };

    if (token) {
      localStorage.setItem(USER_TOKEN_KEY, token);
    }

    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearUserSession() {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    cachedCurrentUser = null;
  }

  function sanitizeClientUser(user) {
    if (!user || typeof user !== "object") {
      return null;
    }

    const fallbackPlanId = defaultState.membershipPlans[0] ? defaultState.membershipPlans[0].id : "free";
    const normalized = normalizeUser(user, fallbackPlanId);

    return {
      id: normalized.id,
      displayName: normalized.displayName,
      email: normalized.email,
      membershipId: normalized.membershipId,
      membershipStatus: normalized.membershipStatus,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
      lastLoginAt: normalized.lastLoginAt,
    };
  }

  function applyPublicBootstrap(payload) {
    const publicState = payload && payload.state ? payload.state : {};

    cachedState = attachMemberCount(
      {
        ...defaultState,
        settings: publicState.settings || defaultState.settings,
        membershipPlans: publicState.membershipPlans || defaultState.membershipPlans,
        catalog: publicState.catalog || defaultState.catalog,
        collections: publicState.collections || defaultState.collections,
        admin: defaultState.admin,
        users: [],
      },
      publicState.memberCount || 0
    );

    cachedCurrentUser = sanitizeClientUser(payload.currentUser);
    if (cachedCurrentUser) {
      const existingSession = getUserSession();
      localStorage.setItem(
        USER_SESSION_KEY,
        JSON.stringify({
          userId: cachedCurrentUser.id,
          loginAt: existingSession?.loginAt || new Date().toISOString(),
        })
      );
    } else if (getUserToken()) {
      clearUserSession();
    }
  }

  function applyAdminBootstrap(payload) {
    const adminState = payload && payload.state ? payload.state : {};
    const memberCount = Array.isArray(adminState.users) ? adminState.users.length : cachedState.memberCount || 0;

    cachedState = attachMemberCount(
      {
        ...defaultState,
        ...adminState,
      },
      memberCount
    );

    adminAuthenticated = Boolean(payload && payload.authenticated);

    if (adminAuthenticated && cachedState.admin.username) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          username: cachedState.admin.username,
          loginAt: getSession()?.loginAt || new Date().toISOString(),
        })
      );
    } else if (getAdminToken()) {
      clearSession();
    }
  }

  async function init(mode) {
    const activeMode = mode || (IS_ADMIN_PAGE ? "admin" : "public");

    if (activeMode === "admin") {
      const payload = await apiFetch("/api/admin/bootstrap", {
        auth: "admin",
      });
      applyAdminBootstrap(payload);
      return loadState();
    }

    const payload = await apiFetch("/api/public/bootstrap", {
      auth: "user",
    });
    applyPublicBootstrap(payload);
    return loadState();
  }

  function loadState() {
    return deepClone(cachedState);
  }

  async function saveState(nextState) {
    const payload = await apiFetch("/api/admin/state", {
      method: "PUT",
      auth: "admin",
      body: {
        state: nextState,
      },
    });

    applyAdminBootstrap({
      state: payload.state,
      authenticated: true,
    });
    return loadState();
  }

  async function updateState(mutator) {
    const draft = deepClone(loadState());
    const result = mutator(draft);
    const nextState = result && typeof result === "object" ? result : draft;
    return saveState(nextState);
  }

  async function hashValue(value) {
    const buffer = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((part) => part.toString(16).padStart(2, "0"))
      .join("");
  }

  function getPlanById(planId) {
    const state = loadState();
    return (
      state.membershipPlans.find((plan) => plan.id === String(planId || "").trim()) ||
      state.membershipPlans[0] ||
      null
    );
  }

  function getCurrentUser() {
    return cachedCurrentUser ? deepClone(cachedCurrentUser) : null;
  }

  async function configureAdmin(username, password) {
    const payload = await apiFetch("/api/admin/setup", {
      method: "POST",
      auth: "none",
      body: {
        username,
        password,
      },
    });

    setSession(payload.state?.admin?.username || String(username || "").trim(), payload.token);
    applyAdminBootstrap({
      state: payload.state,
      authenticated: true,
    });
    return loadState();
  }

  async function verifyAdmin(username, password) {
    try {
      const payload = await apiFetch("/api/admin/login", {
        method: "POST",
        auth: "none",
        body: {
          username,
          password,
        },
      });

      setSession(payload.state?.admin?.username || String(username || "").trim(), payload.token);
      applyAdminBootstrap({
        state: payload.state,
        authenticated: true,
      });
      return true;
    } catch (error) {
      if (error.status === 401) {
        clearSession();
        return false;
      }
      throw error;
    }
  }

  async function registerUser(payload) {
    const response = await apiFetch("/api/users/register", {
      method: "POST",
      auth: "none",
      body: payload,
    });

    if (response.token && response.currentUser?.id) {
      setUserSession(response.currentUser.id, response.token);
    }
    applyPublicBootstrap(response);
    return getCurrentUser();
  }

  async function verifyUser(email, password) {
    try {
      const response = await apiFetch("/api/users/login", {
        method: "POST",
        auth: "none",
        body: {
          email,
          password,
        },
      });

      if (response.token && response.currentUser?.id) {
        setUserSession(response.currentUser.id, response.token);
      }
      applyPublicBootstrap(response);
      return getCurrentUser();
    } catch (error) {
      if (error.status === 401) {
        clearUserSession();
        return null;
      }
      throw error;
    }
  }

  async function updateUserMembership(userId, membershipId) {
    const response = await apiFetch("/api/users/membership", {
      method: "POST",
      auth: "user",
      body: {
        userId,
        membershipId,
      },
    });

    if (response.currentUser?.id) {
      const existingSession = getUserSession();
      localStorage.setItem(
        USER_SESSION_KEY,
        JSON.stringify({
          userId: response.currentUser.id,
          loginAt: existingSession?.loginAt || new Date().toISOString(),
        })
      );
    }
    applyPublicBootstrap(response);
    return loadState();
  }

  async function resolveDestinationUrl(targetUrl) {
    const response = await apiFetch("/api/links/resolve", {
      method: "POST",
      auth: getCurrentUser() ? "user" : "none",
      body: {
        targetUrl,
      },
    });

    return {
      destinationUrl: String(response.destinationUrl || targetUrl || "").trim(),
      usedShortener: Boolean(response.usedShortener),
    };
  }

  async function resetState() {
    const payload = await apiFetch("/api/admin/reset", {
      method: "POST",
      auth: "admin",
    });

    clearSession();
    clearUserSession();
    applyAdminBootstrap(payload);
    return loadState();
  }

  async function exportState() {
    const payload = await apiFetch("/api/admin/export", {
      auth: "admin",
    });

    return deepClone(payload.state);
  }

  window.KNRDefaults = {
    ADMIN_TOKEN_KEY,
    SESSION_KEY,
    USER_TOKEN_KEY,
    USER_SESSION_KEY,
    VERSION,
    CURRENT_TELEGRAM_HANDLE,
    CURRENT_TELEGRAM_URL,
    defaultState: deepClone(defaultState),
    deepClone,
    createId,
    normalizeTelegramBotUsername,
    normalizeState,
    normalizeMovie,
    normalizeCollection,
    normalizePlan,
    normalizeUser,
  };

  window.KNRStore = {
    init,
    loadState,
    saveState,
    updateState,
    getSession,
    setSession,
    clearSession,
    getUserSession,
    setUserSession,
    clearUserSession,
    hashValue,
    configureAdmin,
    verifyAdmin,
    registerUser,
    verifyUser,
    getCurrentUser,
    getPlanById,
    updateUserMembership,
    resolveDestinationUrl,
    resetState,
    exportState,
    isAdminAuthenticated: function () {
      return adminAuthenticated;
    },
  };
})();
