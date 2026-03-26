const crypto = require("crypto");
const https = require("https");
const path = require("path");

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = String(process.env.MONGODB_URI || "").trim();
const SESSION_SECRET = String(process.env.SESSION_SECRET || "change-this-secret").trim();

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
const SHORTENER_BASE_URL = String(process.env.SHORTENER_BASE_URL || "https://linkshortify.com").trim();
const SHORTENER_API_TOKEN = String(process.env.SHORTENER_API_TOKEN || "").trim();
const TELEGRAM_BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
const TELEGRAM_BOT_USERNAME = normalizeTelegramBotUsername(process.env.TELEGRAM_BOT_USERNAME || "");
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
const TELEGRAM_POLL_TIMEOUT_SECONDS = Math.min(
  50,
  Math.max(1, Number(process.env.TELEGRAM_POLL_TIMEOUT_SECONDS || 25))
);

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
    telegramBotUsername: TELEGRAM_BOT_USERNAME,
    primaryButtonLabel: "Join Telegram",
    secondaryButtonLabel: "Browse Library",
    shortenerBaseUrl: SHORTENER_BASE_URL,
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

const siteStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    state: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    minimize: false,
    timestamps: true,
  }
);

const SiteState = mongoose.model("SiteState", siteStateSchema);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}-${Date.now().toString(36)}`;
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
    hasDownload: Boolean(String(movie.downloadUrl || "").trim()),
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
  base.settings.shortenerBaseUrl = String(base.settings.shortenerBaseUrl || SHORTENER_BASE_URL).trim();
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

function isSafeExternalUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function isTelegramUrl(value) {
  if (!isSafeExternalUrl(value)) {
    return false;
  }

  try {
    const parsed = new URL(String(value || "").trim());
    return /(^|\.)t\.me$/i.test(parsed.hostname) || /(^|\.)telegram\.me$/i.test(parsed.hostname);
  } catch (error) {
    return false;
  }
}

function buildShortenerAccessUrl(baseUrl, targetUrl) {
  const cleanBase = String(baseUrl || SHORTENER_BASE_URL || "").trim().replace(/\/+$/, "");
  const params = new URLSearchParams({
    api: SHORTENER_API_TOKEN,
    url: String(targetUrl || "").trim(),
  });
  return `${cleanBase}/st/?${params.toString()}`;
}

function buildMovieStartPayload(movieId) {
  const cleanMovieId = String(movieId || "").trim();
  return cleanMovieId ? `movie_${cleanMovieId}` : "";
}

function buildTelegramBotDeepLink(username, startPayload) {
  const cleanUsername = normalizeTelegramBotUsername(username);
  if (!cleanUsername) {
    return "";
  }

  const baseUrl = `https://t.me/${cleanUsername}`;
  return startPayload ? `${baseUrl}?start=${encodeURIComponent(startPayload)}` : baseUrl;
}

function getMovieBotDeepLink(movie, settings) {
  if (!movie || !isSafeExternalUrl(movie.downloadUrl)) {
    return "";
  }

  return buildTelegramBotDeepLink(settings?.telegramBotUsername, buildMovieStartPayload(movie.id));
}

function escapeTelegramHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function hashSecret(scope, identity, secret) {
  return crypto.scryptSync(String(secret || ""), `${scope}:${identity}`, 64).toString("hex");
}

function buildToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function readToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encoded)
    .digest("base64url");

  if (!signature || signature.length !== expectedSignature.length) {
    return null;
  }

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
}

function getBearerToken(req) {
  const header = String(req.get("Authorization") || "");
  if (!header.startsWith("Bearer ")) {
    return "";
  }
  return header.slice("Bearer ".length).trim();
}

function sanitizeAdmin(admin) {
  return {
    configured: Boolean(admin.configured),
    username: String(admin.username || "").trim(),
    updatedAt: String(admin.updatedAt || "").trim(),
  };
}

function sanitizeUser(user) {
  const normalized = normalizeUser(user, defaultState.membershipPlans[0]?.id || "free");
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

function sanitizePublicMovie(movie) {
  const normalized = normalizeMovie(movie);
  return {
    ...normalized,
    downloadUrl: "",
    hasDownload: isSafeExternalUrl(normalized.downloadUrl),
  };
}

function sanitizePublicState(state) {
  const normalized = normalizeState(state);
  return {
    version: normalized.version,
    settings: normalized.settings,
    membershipPlans: normalized.membershipPlans,
    catalog: normalized.catalog.map(sanitizePublicMovie),
    collections: normalized.collections,
    memberCount: normalized.users.length,
  };
}

function sanitizeAdminState(state) {
  const normalized = normalizeState(state);
  return {
    version: normalized.version,
    settings: normalized.settings,
    admin: sanitizeAdmin(normalized.admin),
    membershipPlans: normalized.membershipPlans,
    users: normalized.users.map(sanitizeUser),
    catalog: normalized.catalog,
    collections: normalized.collections,
  };
}

function mergeAdminState(existingState, incomingState) {
  const existing = normalizeState(existingState);
  const incoming = incomingState && typeof incomingState === "object" ? incomingState : {};
  const candidate = normalizeState({
    ...existing,
    ...incoming,
  });

  candidate.admin = {
    ...candidate.admin,
    configured: existing.admin.configured,
    username: existing.admin.username,
    passwordHash: existing.admin.passwordHash,
    updatedAt: existing.admin.updatedAt,
  };

  const fallbackPlanId = candidate.membershipPlans[0] ? candidate.membershipPlans[0].id : "free";
  candidate.users = candidate.users.map((user) => {
    const match =
      existing.users.find((item) => item.id === user.id) ||
      existing.users.find((item) => item.email === user.email);

    return normalizeUser(
      {
        ...match,
        ...user,
        passwordHash: match?.passwordHash || user.passwordHash,
      },
      fallbackPlanId
    );
  });

  return normalizeState(candidate);
}

async function getStateRecord() {
  let record = await SiteState.findOne({ key: "primary" });

  if (!record) {
    record = await SiteState.create({
      key: "primary",
      state: normalizeState(defaultState),
    });
  }

  if (!record.state || typeof record.state !== "object") {
    record.state = normalizeState(defaultState);
    await record.save();
  }

  return record;
}

async function readStateRecord() {
  const record = await getStateRecord();
  const state = normalizeState(record.state);
  return {
    record,
    state,
  };
}

async function saveStateRecord(record, nextState) {
  const normalized = normalizeState(nextState);
  record.state = normalized;
  await record.save();
  return normalized;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requestJson(method, urlString, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const payload = body === undefined ? "" : JSON.stringify(body);

    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method,
        headers: payload
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            }
          : undefined,
      },
      (response) => {
        let raw = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          try {
            resolve(raw ? JSON.parse(raw) : {});
          } catch (error) {
            reject(new Error("Telegram API returned an unreadable response."));
          }
        });
      }
    );

    request.on("error", reject);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

async function telegramRequest(methodName, payload) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("Telegram bot token is missing.");
  }

  const response = await requestJson(
    "POST",
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${methodName}`,
    payload
  );

  if (!response || response.ok !== true) {
    throw new Error(response?.description || `Telegram ${methodName} request failed.`);
  }

  return response.result;
}

function createTelegramKeyboard(rows) {
  return rows.length
    ? {
        inline_keyboard: rows,
      }
    : undefined;
}

async function sendTelegramMessage(chatId, text, rows) {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: createTelegramKeyboard(rows),
  });
}

function findCatalogMatches(state, query) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  if (!cleanQuery) {
    return [];
  }

  return state.catalog
    .filter((movie) =>
      [movie.titleHint, movie.imdbID, movie.tag, movie.note].some((value) =>
        String(value || "").toLowerCase().includes(cleanQuery)
      )
    )
    .slice(0, 6);
}

function getMovieChannelUrl(movie, settings) {
  const ctaUrl = String(movie?.ctaUrl || "").trim();
  if (isSafeExternalUrl(ctaUrl)) {
    return ctaUrl;
  }

  const telegramUrl = String(settings?.telegramUrl || "").trim();
  return isSafeExternalUrl(telegramUrl) ? telegramUrl : "";
}

function buildMovieTelegramRows(movie, settings) {
  const rows = [];

  if (isSafeExternalUrl(movie.downloadUrl)) {
    rows.push([
      {
        text: String(movie.downloadLabel || "Download").trim() || "Download",
        url: movie.downloadUrl,
      },
    ]);
  }

  const channelUrl = getMovieChannelUrl(movie, settings);
  if (channelUrl) {
    rows.push([
      {
        text: "Open Channel",
        url: channelUrl,
      },
    ]);
  }

  if (PUBLIC_BASE_URL) {
    rows.push([
      {
        text: "Open Website",
        url: PUBLIC_BASE_URL,
      },
    ]);
  }

  return rows;
}

async function sendTelegramWelcome(chatId, state) {
  const rows = [];

  if (isSafeExternalUrl(state.settings.telegramUrl)) {
    rows.push([
      {
        text: "Open Channel",
        url: state.settings.telegramUrl,
      },
    ]);
  }

  if (PUBLIC_BASE_URL) {
    rows.push([
      {
        text: "Open Website",
        url: PUBLIC_BASE_URL,
      },
    ]);
  }

  const message = [
    `<b>${escapeTelegramHtml(state.settings.siteName)}</b>`,
    "Send a movie title to search the catalog.",
    "",
    escapeTelegramHtml(state.settings.distributionNotice || DEFAULT_DISTRIBUTION_NOTICE),
  ].join("\n");

  await sendTelegramMessage(chatId, message, rows);
}

async function sendTelegramMovie(chatId, movieId, state) {
  const movie = state.catalog.find((item) => item.id === String(movieId || "").trim());

  if (!movie) {
    await sendTelegramMessage(chatId, "That movie was not found in the catalog.", []);
    return;
  }

  const lines = [
    `<b>${escapeTelegramHtml(movie.titleHint || movie.imdbID || "Movie")}</b>`,
    [movie.yearHint, movie.tag].filter(Boolean).map(escapeTelegramHtml).join(" - "),
  ].filter(Boolean);

  if (movie.note) {
    lines.push(escapeTelegramHtml(movie.note));
  }

  if (isSafeExternalUrl(movie.downloadUrl)) {
    lines.push("Tap the button below to open the licensed file link.");
  } else {
    lines.push("No licensed download URL has been configured for this title yet.");
  }

  lines.push("");
  lines.push(escapeTelegramHtml(state.settings.distributionNotice || DEFAULT_DISTRIBUTION_NOTICE));

  await sendTelegramMessage(chatId, lines.join("\n"), buildMovieTelegramRows(movie, state.settings));
}

async function sendTelegramSearchResults(chatId, matches, settings) {
  const rows = matches
    .map((movie) => {
      const botUrl = getMovieBotDeepLink(movie, settings);
      const fallbackUrl = getMovieChannelUrl(movie, settings);
      const targetUrl = botUrl || fallbackUrl;

      if (!targetUrl) {
        return null;
      }

      return [
        {
          text: `${String(movie.titleHint || movie.imdbID || "Movie").trim()}${
            movie.yearHint ? ` (${movie.yearHint})` : ""
          }`,
          url: targetUrl,
        },
      ];
    })
    .filter(Boolean);

  if (!rows.length) {
    await sendTelegramMessage(chatId, "Matches were found, but no Telegram or download link is configured yet.", []);
    return;
  }

  await sendTelegramMessage(chatId, "I found these titles. Tap one to open it.", rows);
}

async function handleTelegramMessage(message) {
  const chatId = message?.chat?.id;
  const text = String(message?.text || "").trim();

  if (!chatId || !text) {
    return;
  }

  const { state } = await readStateRecord();
  const startMatch = text.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);

  if (startMatch) {
    const payload = String(startMatch[1] || "").trim();
    if (payload.startsWith("movie_")) {
      await sendTelegramMovie(chatId, payload.slice("movie_".length), state);
      return;
    }

    await sendTelegramWelcome(chatId, state);
    return;
  }

  if (/^\/help(?:@\w+)?$/i.test(text)) {
    await sendTelegramWelcome(chatId, state);
    return;
  }

  const matches = findCatalogMatches(state, text);
  if (!matches.length) {
    await sendTelegramMessage(
      chatId,
      `No matching titles were found for "${escapeTelegramHtml(text)}". Send another movie title to search again.`,
      []
    );
    return;
  }

  await sendTelegramSearchResults(chatId, matches, state.settings);
}

let telegramPollingStarted = false;
let telegramUpdateOffset = 0;

async function startTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("Telegram bot polling is disabled because TELEGRAM_BOT_TOKEN is not set.");
    return;
  }

  if (telegramPollingStarted) {
    return;
  }

  telegramPollingStarted = true;
  console.log(
    `Telegram bot polling started${TELEGRAM_BOT_USERNAME ? ` for @${TELEGRAM_BOT_USERNAME}` : ""}.`
  );

  while (telegramPollingStarted) {
    try {
      const updates = await telegramRequest("getUpdates", {
        timeout: TELEGRAM_POLL_TIMEOUT_SECONDS,
        offset: telegramUpdateOffset,
        allowed_updates: ["message"],
      });

      for (const update of Array.isArray(updates) ? updates : []) {
        telegramUpdateOffset = Math.max(telegramUpdateOffset, Number(update.update_id || 0) + 1);
        if (update.message) {
          await handleTelegramMessage(update.message);
        }
      }
    } catch (error) {
      console.error("Telegram bot polling failed.");
      console.error(error);
      await sleep(5000);
    }
  }
}

function getAdminPayload(req, state) {
  const payload = readToken(getBearerToken(req));
  if (!payload || payload.type !== "admin") {
    return null;
  }

  if (!state.admin.configured || payload.username !== state.admin.username) {
    return null;
  }

  return payload;
}

function getCurrentUserFromRequest(req, state) {
  const payload = readToken(getBearerToken(req));
  if (!payload || payload.type !== "user") {
    return null;
  }

  return state.users.find((user) => user.id === payload.userId) || null;
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Add it to a .env file before starting the server.");
  process.exit(1);
}

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: "2mb" }));

app.get(
  "/api/public/bootstrap",
  asyncHandler(async (req, res) => {
    const { state } = await readStateRecord();
    const currentUser = getCurrentUserFromRequest(req, state);

    res.json({
      state: sanitizePublicState(state),
      currentUser: currentUser ? sanitizeUser(currentUser) : null,
    });
  })
);

app.post(
  "/api/links/resolve",
  asyncHandler(async (req, res) => {
    const targetUrl = String(req.body?.targetUrl || "").trim();
    const { state } = await readStateRecord();
    const currentUser = getCurrentUserFromRequest(req, state);

    if (!isSafeExternalUrl(targetUrl)) {
      res.status(400).json({ error: "A valid destination URL is required." });
      return;
    }

    const useShortener =
      !isTelegramUrl(targetUrl) &&
      Boolean(currentUser) &&
      currentUser.membershipId === "free" &&
      state.settings.freePlanShortenerEnabled !== false &&
      Boolean(SHORTENER_API_TOKEN) &&
      Boolean(String(state.settings.shortenerBaseUrl || SHORTENER_BASE_URL).trim());

    res.json({
      destinationUrl: useShortener
        ? buildShortenerAccessUrl(state.settings.shortenerBaseUrl, targetUrl)
        : targetUrl,
      usedShortener: useShortener,
    });
  })
);

app.get(
  "/api/admin/bootstrap",
  asyncHandler(async (req, res) => {
    const { state } = await readStateRecord();
    const adminPayload = getAdminPayload(req, state);

    res.json({
      state: adminPayload
        ? sanitizeAdminState(state)
        : {
            admin: sanitizeAdmin(state.admin),
            settings: state.settings,
            membershipPlans: state.membershipPlans,
            catalog: state.catalog,
            collections: state.collections,
            users: [],
          },
      authenticated: Boolean(adminPayload),
    });
  })
);

app.post(
  "/api/admin/setup",
  asyncHandler(async (req, res) => {
    const cleanUsername = String(req.body?.username || "").trim();
    const cleanPassword = String(req.body?.password || "");
    const { record, state } = await readStateRecord();

    if (state.admin.configured) {
      res.status(409).json({ error: "Admin has already been configured." });
      return;
    }

    if (!cleanUsername || cleanPassword.length < 6) {
      res.status(400).json({ error: "Use a username and a password with at least 6 characters." });
      return;
    }

    const nextState = {
      ...state,
      admin: {
        configured: true,
        username: cleanUsername,
        passwordHash: hashSecret("admin", cleanUsername, cleanPassword),
        updatedAt: new Date().toISOString(),
      },
    };

    const savedState = await saveStateRecord(record, nextState);

    res.json({
      token: buildToken({
        type: "admin",
        username: cleanUsername,
        issuedAt: new Date().toISOString(),
      }),
      state: sanitizeAdminState(savedState),
    });
  })
);

app.post(
  "/api/admin/login",
  asyncHandler(async (req, res) => {
    const cleanUsername = String(req.body?.username || "").trim();
    const cleanPassword = String(req.body?.password || "");
    const { state } = await readStateRecord();

    const isValid =
      state.admin.configured &&
      state.admin.username === cleanUsername &&
      state.admin.passwordHash === hashSecret("admin", cleanUsername, cleanPassword);

    if (!isValid) {
      res.status(401).json({ error: "Login failed. Check your username and password." });
      return;
    }

    res.json({
      token: buildToken({
        type: "admin",
        username: cleanUsername,
        issuedAt: new Date().toISOString(),
      }),
      state: sanitizeAdminState(state),
    });
  })
);

app.put(
  "/api/admin/state",
  asyncHandler(async (req, res) => {
    const { record, state } = await readStateRecord();

    if (!getAdminPayload(req, state)) {
      res.status(401).json({ error: "Admin sign-in required." });
      return;
    }

    const nextState = mergeAdminState(state, req.body?.state);
    const savedState = await saveStateRecord(record, nextState);

    res.json({
      state: sanitizeAdminState(savedState),
    });
  })
);

app.get(
  "/api/admin/export",
  asyncHandler(async (req, res) => {
    const { state } = await readStateRecord();

    if (!getAdminPayload(req, state)) {
      res.status(401).json({ error: "Admin sign-in required." });
      return;
    }

    res.json({
      state,
    });
  })
);

app.post(
  "/api/admin/reset",
  asyncHandler(async (req, res) => {
    const { record, state } = await readStateRecord();

    if (!getAdminPayload(req, state)) {
      res.status(401).json({ error: "Admin sign-in required." });
      return;
    }

    const savedState = await saveStateRecord(record, defaultState);

    res.json({
      state: {
        admin: sanitizeAdmin(savedState.admin),
        settings: savedState.settings,
        membershipPlans: savedState.membershipPlans,
        catalog: savedState.catalog,
        collections: savedState.collections,
        users: [],
      },
      authenticated: false,
    });
  })
);

app.post(
  "/api/users/register",
  asyncHandler(async (req, res) => {
    const cleanName = String(req.body?.displayName || "").trim();
    const cleanEmail = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const { record, state } = await readStateRecord();

    const chosenPlanId = state.membershipPlans.some((plan) => plan.id === req.body?.membershipId)
      ? String(req.body.membershipId)
      : state.membershipPlans[0]?.id || "free";

    if (!cleanName) {
      res.status(400).json({ error: "Display name is required." });
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      res.status(400).json({ error: "Use a valid email address." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }

    if (state.users.some((user) => user.email === cleanEmail)) {
      res.status(409).json({ error: "A member with this email already exists." });
      return;
    }

    const now = new Date().toISOString();
    const user = normalizeUser(
      {
        id: createId("user"),
        displayName: cleanName,
        email: cleanEmail,
        passwordHash: hashSecret("user", cleanEmail, password),
        membershipId: chosenPlanId,
        membershipStatus: "active",
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      },
      chosenPlanId
    );

    const nextState = deepClone(state);
    nextState.users.unshift(user);

    const savedState = await saveStateRecord(record, nextState);

    res.status(201).json({
      token: buildToken({
        type: "user",
        userId: user.id,
        email: user.email,
        issuedAt: now,
      }),
      currentUser: sanitizeUser(user),
      state: sanitizePublicState(savedState),
    });
  })
);

app.post(
  "/api/users/login",
  asyncHandler(async (req, res) => {
    const cleanEmail = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const { record, state } = await readStateRecord();

    const matchedUser = state.users.find(
      (user) => user.email === cleanEmail && user.passwordHash === hashSecret("user", cleanEmail, password)
    );

    if (!matchedUser) {
      res.status(401).json({ error: "Login failed. Check your email and password." });
      return;
    }

    const now = new Date().toISOString();
    const nextState = deepClone(state);
    const user = nextState.users.find((item) => item.id === matchedUser.id);

    if (user) {
      user.lastLoginAt = now;
      user.updatedAt = now;
    }

    const savedState = await saveStateRecord(record, nextState);
    const savedUser = savedState.users.find((item) => item.id === matchedUser.id);

    res.json({
      token: buildToken({
        type: "user",
        userId: matchedUser.id,
        email: matchedUser.email,
        issuedAt: now,
      }),
      currentUser: savedUser ? sanitizeUser(savedUser) : sanitizeUser(matchedUser),
      state: sanitizePublicState(savedState),
    });
  })
);

app.post(
  "/api/users/membership",
  asyncHandler(async (req, res) => {
    const { record, state } = await readStateRecord();
    const currentUser = getCurrentUserFromRequest(req, state);
    const membershipId = String(req.body?.membershipId || "").trim();
    const validPlan = state.membershipPlans.find((plan) => plan.id === membershipId);

    if (!currentUser) {
      res.status(401).json({ error: "Member sign-in required." });
      return;
    }

    if (!validPlan) {
      res.status(404).json({ error: "Membership plan not found." });
      return;
    }

    const nextState = deepClone(state);
    const user = nextState.users.find((item) => item.id === currentUser.id);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    user.membershipId = membershipId;
    user.membershipStatus = "active";
    user.updatedAt = new Date().toISOString();

    const savedState = await saveStateRecord(record, nextState);
    const savedUser = savedState.users.find((item) => item.id === currentUser.id);

    res.json({
      currentUser: savedUser ? sanitizeUser(savedUser) : sanitizeUser(currentUser),
      state: sanitizePublicState(savedState),
    });
  })
);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    error: error.message || "Something went wrong on the server.",
  });
});

async function start() {
  await mongoose.connect(MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`KNR MOVIEES is running on http://localhost:${PORT}`);
  });

  void startTelegramBot();
}

start().catch((error) => {
  console.error("Failed to start the server.");
  console.error(error);
  process.exit(1);
});
