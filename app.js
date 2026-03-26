(function () {
  let state = window.KNRStore.loadState();
  let selectedGuestPlanId = "";
  const cache = new Map();
  const detailModal = document.getElementById("detailModal");
  const heroPoster = document.getElementById("heroPoster");
  const heroMeta = document.getElementById("heroMeta");
  const heroTrailerLink = document.getElementById("heroTrailerLink");
  const featuredRail = document.getElementById("featuredRail");
  const trendingMount = document.getElementById("trendingMount");
  const latestMount = document.getElementById("latestMount");
  const genreShelfMount = document.getElementById("genreShelfMount");
  const collectionMount = document.getElementById("collectionMount");
  const directoryMount = document.getElementById("directoryMount");
  const searchResults = document.getElementById("searchResults");
  const searchStatus = document.getElementById("searchStatus");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const membershipPlansMount = document.getElementById("membershipPlans");
  const signupForm = document.getElementById("signupForm");
  const userLoginForm = document.getElementById("userLoginForm");
  const signupPlanSelect = document.getElementById("signupPlan");
  const memberGuestView = document.getElementById("memberGuestView");
  const memberActiveView = document.getElementById("memberActiveView");
  const memberStatus = document.getElementById("memberStatus");
  const memberGreeting = document.getElementById("memberGreeting");
  const memberCurrentPlanCopy = document.getElementById("memberCurrentPlanCopy");
  const memberMeta = document.getElementById("memberMeta");
  const memberPlanTitle = document.getElementById("memberPlanTitle");
  const memberPlanCopy = document.getElementById("memberPlanCopy");
  const memberAccountMeta = document.getElementById("memberAccountMeta");
  const memberBenefitsList = document.getElementById("memberBenefitsList");
  const memberTelegramLink = document.getElementById("memberTelegramLink");
  const memberNavText = document.getElementById("memberNavText");
  const liveVisitorsCount = document.getElementById("liveVisitorsCount");
  const liveViewsCount = document.getElementById("liveViewsCount");
  const pulseMovieTitle = document.getElementById("pulseMovieTitle");
  const pulseMovieCopy = document.getElementById("pulseMovieCopy");
  const pulseMovieMeta = document.getElementById("pulseMovieMeta");
  const pulseTelegramLink = document.getElementById("pulseTelegramLink");
  const contactTelegramLink = document.getElementById("contactTelegramLink");
  const contactTelegramHandle = document.getElementById("contactTelegramHandle");

  function refreshState() {
    state = window.KNRStore.loadState();
    return state;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safePoster(detail) {
    return !detail || !detail.Poster || detail.Poster === "N/A" ? "" : detail.Poster;
  }

  function isSafeUrl(value) {
    try {
      const parsed = new URL(String(value || "").trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function setDirectLink(element, url, label) {
    if (!element) {
      return;
    }

    element.href = url;
    if (label) {
      element.textContent = label;
    }
    element.removeAttribute("data-action");
    element.removeAttribute("data-destination-url");
    element.setAttribute("target", "_blank");
    element.setAttribute("rel", "noreferrer");
  }

  function getCurrentUser() {
    return window.KNRStore.getCurrentUser();
  }

  function getMovieById(movieId) {
    return state.catalog.find((movie) => movie.id === movieId) || null;
  }

  function getPlanById(planId) {
    return (
      state.membershipPlans.find((plan) => plan.id === String(planId || "").trim()) ||
      state.membershipPlans[0] ||
      null
    );
  }

  function getTelegramBotUsername() {
    return window.KNRDefaults.normalizeTelegramBotUsername(state.settings.telegramBotUsername);
  }

  function buildMovieStartPayload(movieId) {
    const cleanMovieId = String(movieId || "").trim();
    return cleanMovieId ? `movie_${cleanMovieId}` : "";
  }

  function buildTelegramBotUrl(startPayload) {
    const botUsername = getTelegramBotUsername();
    if (!botUsername) {
      return "";
    }

    const baseUrl = `https://t.me/${botUsername}`;
    return startPayload ? `${baseUrl}?start=${encodeURIComponent(startPayload)}` : baseUrl;
  }

  function resolveMovieActionLabel(movie, usesBot) {
    const customLabel = String(movie?.ctaLabel || "").trim();
    if (usesBot && (!customLabel || /^open on telegram$/i.test(customLabel))) {
      return "Get in Telegram Bot";
    }

    return customLabel || (usesBot ? "Get in Telegram Bot" : "Open on Telegram");
  }

  function getMoviePrimaryAction(movie) {
    const hasBotDelivery = Boolean(
      getTelegramBotUsername() && (movie?.hasDownload || String(movie?.downloadUrl || "").trim())
    );
    const fallbackUrl = String(movie?.ctaUrl || state.settings.telegramUrl || "").trim();

    return {
      destinationUrl: hasBotDelivery ? buildTelegramBotUrl(buildMovieStartPayload(movie.id)) : fallbackUrl,
      label: resolveMovieActionLabel(movie, hasBotDelivery),
    };
  }

  function getFallbackPrimaryAction() {
    return {
      destinationUrl: String(state.settings.telegramUrl || "").trim(),
      label: String(state.settings.primaryButtonLabel || "Join Telegram").trim() || "Join Telegram",
    };
  }

  function getFeaturedPlan() {
    return state.membershipPlans.find((plan) => plan.featured) || state.membershipPlans[0] || null;
  }

  function getFeaturedMovies() {
    const featured = state.catalog.filter((movie) => movie.featured);
    return featured.length ? featured : state.catalog.slice(0, 6);
  }

  function getLatestMovies(limit) {
    const ordered = [...state.catalog].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
  }

  function makeSeed(value) {
    return Array.from(String(value || ""))
      .reduce((total, char, index) => total + char.charCodeAt(0) * (index + 17), 0);
  }

  function formatCompactNumber(value) {
    return new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Math.max(0, Number(value || 0)));
  }

  function getGenreTokens(movie, detail) {
    const source =
      detail?.Genre && detail.Genre !== "N/A"
        ? detail.Genre
        : String(movie?.tag || "Featured")
            .replace(/\b(movie|featured|favorite|favourite|epic|event|rush|drama|spectacle)\b/gi, "")
            .trim() || "Featured";

    return source
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2);
  }

  function getPrimaryGenre(movie, detail) {
    return getGenreTokens(movie, detail)[0] || movie?.tag || "Movie";
  }

  function getMovieMetrics(movie, detail) {
    const seed = makeSeed(`${movie?.id}:${detail?.Title || movie?.titleHint}:${detail?.Year || movie?.yearHint}`);
    const addedAt = new Date(movie?.addedAt || 0).getTime();
    const dayDiff = Number.isFinite(addedAt) ? Math.max(0, Math.floor((Date.now() - addedAt) / 86400000)) : 14;
    const freshnessBoost = Math.max(0, 18 - Math.min(18, dayDiff)) * 1800;
    const featuredBoost = movie?.featured ? 26000 : 0;
    const views = 28000 + (seed % 640000) + freshnessBoost + featuredBoost;
    const live = 48 + (seed % 720) + (movie?.featured ? 36 : 0);
    const likes = 900 + (seed % 5800);
    const score = views + likes * 7 + live * 80;

    return {
      views,
      live,
      likes,
      score,
    };
  }

  function getTrendingMovies(limit) {
    const sorted = [...state.catalog].sort((left, right) => {
      const leftMetrics = getMovieMetrics(left, cache.get(left.imdbID));
      const rightMetrics = getMovieMetrics(right, cache.get(right.imdbID));
      return rightMetrics.score - leftMetrics.score;
    });

    return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  }

  function getGenreShelfBlueprint(label) {
    const shelves = {
      Action: {
        title: "Action Rush",
        description: "Explosive picks built for fast starts, strong momentum, and blockbuster energy.",
      },
      Adventure: {
        title: "Adventure Worlds",
        description: "Big-screen quests, expansive settings, and larger-than-life storytelling.",
      },
      Crime: {
        title: "Crime Files",
        description: "Sharp tension, criminal mind games, and dark urban atmosphere.",
      },
      Drama: {
        title: "Drama Room",
        description: "Character-driven stories with emotion, conflict, and memorable performances.",
      },
      Fantasy: {
        title: "Fantasy Realms",
        description: "Mythic settings, magical stakes, and cinematic world-building.",
      },
      Mystery: {
        title: "Mystery Signal",
        description: "Unpredictable turns and puzzle-box stories that reward attention.",
      },
      Romance: {
        title: "Romance Spotlight",
        description: "Warm chemistry, emotional stakes, and rewatch-friendly comfort picks.",
      },
      "Sci-Fi": {
        title: "Sci-Fi Futures",
        description: "Visionary concepts, scale, and a premium sense of wonder.",
      },
      Thriller: {
        title: "Thriller Mode",
        description: "High-pressure stories that keep the pulse up from scene to scene.",
      },
      Animation: {
        title: "Animated Favorites",
        description: "Stylized worlds, family-friendly charm, and visual craft.",
      },
    };

    return (
      shelves[label] || {
        title: `${label} Shelf`,
        description: `A streaming-style row curated around ${label.toLowerCase()} stories.`,
      }
    );
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getGenreShelves() {
    const buckets = new Map();

    getLatestMovies().forEach((movie) => {
      const detail = cache.get(movie.imdbID);
      getGenreTokens(movie, detail).forEach((label) => {
        if (!buckets.has(label)) {
          buckets.set(label, []);
        }

        const bucket = buckets.get(label);
        if (!bucket.some((item) => item.id === movie.id)) {
          bucket.push(movie);
        }
      });
    });

    return [...buckets.entries()]
      .filter(([, movies]) => movies.length >= 2)
      .sort((left, right) => {
        const leftScore = left[1].reduce((total, movie) => total + getMovieMetrics(movie, cache.get(movie.imdbID)).score, 0);
        const rightScore = right[1].reduce((total, movie) => total + getMovieMetrics(movie, cache.get(movie.imdbID)).score, 0);
        return rightScore - leftScore;
      })
      .slice(0, 4)
      .map(([label, movies]) => {
        const blueprint = getGenreShelfBlueprint(label);
        return {
          id: `genre-${slugify(label) || "featured"}`,
          eyebrow: "Netflix-Style Category",
          title: blueprint.title,
          description: blueprint.description,
          movies: [...movies]
            .sort(
              (left, right) =>
                getMovieMetrics(right, cache.get(right.imdbID)).score - getMovieMetrics(left, cache.get(left.imdbID)).score
            )
            .slice(0, 4),
        };
      });
  }

  function getApiKey() {
    return String(state.settings.apiKey || "").trim();
  }

  function setRoutedLink(element, destinationUrl, label) {
    if (!element) {
      return;
    }

    element.href = destinationUrl;
    element.setAttribute("data-action", "open-destination");
    element.setAttribute("data-destination-url", destinationUrl);
    element.setAttribute("data-destination-label", label || "destination");
  }

  async function openDestination(destinationUrl, target) {
    const cleanTargetUrl = String(destinationUrl || "").trim();
    if (!cleanTargetUrl) {
      return;
    }

    try {
      const result = await window.KNRStore.resolveDestinationUrl(cleanTargetUrl);
      const nextUrl = result.destinationUrl || cleanTargetUrl;

      if (result.usedShortener) {
        setMemberStatus("Free plan access is opening through LinkShortify.");
      }

      if (target === "_blank") {
        window.open(nextUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = nextUrl;
      }
    } catch (error) {
      setMemberStatus(error.message || "Could not open the destination right now.");
    }
  }

  function formatDate(value) {
    if (!value) {
      return "Today";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Today";
    }

    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function buildYoutubeTrailerSearchUrl(movie, detail) {
    const title = detail?.Title || movie?.titleHint || movie?.imdbID || "movie";
    const year = detail?.Year || movie?.yearHint || "";

    return `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${title} ${year} official trailer`.trim()
    )}`;
  }

  function getMovieTrailerUrl(movie, detail) {
    const manualUrl = String(movie?.trailerUrl || "").trim();
    return isSafeUrl(manualUrl) ? manualUrl : buildYoutubeTrailerSearchUrl(movie, detail);
  }

  function getYoutubeEmbedUrl(url) {
    if (!isSafeUrl(url)) {
      return "";
    }

    try {
      const parsed = new URL(url);
      let videoId = "";

      if (parsed.hostname.includes("youtu.be")) {
        videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      } else if (parsed.hostname.includes("youtube.com")) {
        if (parsed.pathname === "/watch") {
          videoId = parsed.searchParams.get("v") || "";
        } else if (parsed.pathname.startsWith("/embed/")) {
          videoId = parsed.pathname.split("/embed/")[1].split("/")[0];
        } else if (parsed.pathname.startsWith("/shorts/")) {
          videoId = parsed.pathname.split("/shorts/")[1].split("/")[0];
        }
      }

      return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : "";
    } catch (error) {
      return "";
    }
  }

  function createFactList(detail, movie) {
    return [
      { label: "Released", value: detail?.Released && detail.Released !== "N/A" ? detail.Released : formatDate(movie?.addedAt) },
      { label: "Genre", value: detail?.Genre && detail.Genre !== "N/A" ? detail.Genre : movie?.tag || "Movie" },
      { label: "Language", value: detail?.Language && detail.Language !== "N/A" ? detail.Language : "Not listed" },
      { label: "Country", value: detail?.Country && detail.Country !== "N/A" ? detail.Country : "Not listed" },
      { label: "Director", value: detail?.Director && detail.Director !== "N/A" ? detail.Director : "Not listed" },
      { label: "Cast", value: detail?.Actors && detail.Actors !== "N/A" ? detail.Actors : "Not listed" },
      { label: "Writer", value: detail?.Writer && detail.Writer !== "N/A" ? detail.Writer : "Not listed" },
      { label: "Awards", value: detail?.Awards && detail.Awards !== "N/A" ? detail.Awards : "Not listed" },
      { label: "Runtime", value: detail?.Runtime && detail.Runtime !== "N/A" ? detail.Runtime : "Runtime TBA" },
      { label: "Rated", value: detail?.Rated && detail.Rated !== "N/A" ? detail.Rated : "Not listed" },
      { label: "Box Office", value: detail?.BoxOffice && detail.BoxOffice !== "N/A" ? detail.BoxOffice : "Not listed" },
      { label: "IMDb", value: detail?.imdbRating && detail.imdbRating !== "N/A" ? `${detail.imdbRating} / 10` : "Not listed" },
    ];
  }

  async function fetchMovieByImdbId(imdbID) {
    if (!imdbID) {
      throw new Error("Missing IMDb ID.");
    }

    if (cache.has(imdbID)) {
      return cache.get(imdbID);
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("OMDb API key is missing. Add it from the admin panel.");
    }

    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&plot=full&i=${encodeURIComponent(imdbID)}`
    );
    const data = await response.json();

    if (data.Response === "False") {
      throw new Error(data.Error || "Movie data could not be loaded.");
    }

    cache.set(imdbID, data);
    return data;
  }

  async function searchOmdb(query) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("OMDb API key is missing. Add it from the admin panel.");
    }

    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&type=movie&s=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.Response === "False" ? [] : Array.isArray(data.Search) ? data.Search : [];
  }

  async function hydrateCatalogDetails() {
    const uniqueImdbIds = [...new Set(state.catalog.map((movie) => movie.imdbID).filter(Boolean))];
    await Promise.all(
      uniqueImdbIds.map(async (imdbID) => {
        try {
          await fetchMovieByImdbId(imdbID);
        } catch (error) {
          return null;
        }
        return null;
      })
    );
  }

  function setMemberStatus(message) {
    memberStatus.textContent = message;
  }

  function buildMetricMeta(movie, detail) {
    const metrics = getMovieMetrics(movie, detail);
    return `
      <span>${escapeHtml(formatCompactNumber(metrics.views))} demo views</span>
      <span>${escapeHtml(String(metrics.live))} live demo</span>
      <span>${escapeHtml(formatCompactNumber(metrics.likes))} likes</span>
    `;
  }

  function getPulseSnapshot(step) {
    const trending = getTrendingMovies(5);
    const leadMovie = trending.length ? trending[step % trending.length] : getFeaturedMovies()[0] || state.catalog[0] || null;
    const leadDetail = leadMovie ? cache.get(leadMovie.imdbID) : null;
    const totalViews = getTrendingMovies(6).reduce(
      (total, movie) => total + getMovieMetrics(movie, cache.get(movie.imdbID)).views,
      0
    );
    const liveVisitors =
      140 +
      state.catalog.length * 9 +
      state.memberCount * 3 +
      getFeaturedMovies().length * 14 +
      ((step * 17 + 11) % 67);

    return {
      leadMovie,
      leadDetail,
      totalViews: totalViews + step * 137,
      liveVisitors,
    };
  }

  function renderCommunityPulse(step) {
    if (!liveVisitorsCount || !liveViewsCount || !pulseMovieTitle || !pulseMovieCopy || !pulseMovieMeta) {
      return;
    }

    const snapshot = getPulseSnapshot(step || 0);
    const leadMovie = snapshot.leadMovie;
    const leadDetail = snapshot.leadDetail;

    liveVisitorsCount.textContent = formatCompactNumber(snapshot.liveVisitors);
    liveViewsCount.textContent = formatCompactNumber(snapshot.totalViews);

    if (!leadMovie) {
      pulseMovieTitle.textContent = "Catalog activity will appear here";
      pulseMovieCopy.textContent = "Add a few movies in the admin panel to activate the premium activity board.";
      pulseMovieMeta.innerHTML = "";
      return;
    }

    pulseMovieTitle.textContent = leadDetail?.Title || leadMovie.titleHint || "Trending title";
    pulseMovieCopy.textContent =
      leadMovie.note || leadDetail?.Plot || "This section rotates through the catalog to create a dynamic premium feel.";
    pulseMovieMeta.innerHTML = buildMetricMeta(leadMovie, leadDetail);
  }

  function startCommunityPulse() {
    let step = 0;
    renderCommunityPulse(step);
    window.setInterval(() => {
      step += 1;
      renderCommunityPulse(step);
    }, 4000);
  }

  function renderShellText() {
    const botHomeUrl = buildTelegramBotUrl("");
    const memberLinkUrl = botHomeUrl || state.settings.telegramUrl;
    const memberLinkLabel = botHomeUrl ? "Open Telegram Bot" : "Open Telegram";

    document.title = `${state.settings.siteName} | Movie Hub`;
    document.getElementById("siteName").textContent = state.settings.siteName;
    document.getElementById("navBrandText").textContent = state.settings.siteName;
    document.getElementById("announcement").textContent = state.settings.announcement;
    document.getElementById("heroEyebrow").textContent = state.settings.heroEyebrow;
    document.getElementById("heroTitle").textContent = state.settings.heroTitle;
    document.getElementById("heroCopy").textContent = state.settings.heroCopy;
    document.getElementById("telegramLink").textContent = state.settings.primaryButtonLabel;
    setRoutedLink(document.getElementById("telegramLink"), state.settings.telegramUrl, "Telegram");
    document.getElementById("footerNote").textContent = state.settings.footerNote;
    document.getElementById("ctaTelegramHandle").textContent = state.settings.telegramHandle;
    document.getElementById("ctaTelegramLink").textContent = `${state.settings.primaryButtonLabel} Now`;
    setRoutedLink(document.getElementById("ctaTelegramLink"), state.settings.telegramUrl, "Telegram");
    document.getElementById("browseLink").textContent = state.settings.secondaryButtonLabel;
    if (contactTelegramHandle) {
      contactTelegramHandle.textContent = state.settings.telegramHandle;
    }
    memberTelegramLink.textContent = memberLinkLabel;
    setRoutedLink(memberTelegramLink, memberLinkUrl, memberLinkLabel);
    if (pulseTelegramLink) {
      pulseTelegramLink.textContent = state.settings.primaryButtonLabel;
      setRoutedLink(pulseTelegramLink, state.settings.telegramUrl, "Telegram");
    }
    if (contactTelegramLink) {
      contactTelegramLink.textContent = state.settings.primaryButtonLabel;
      setRoutedLink(contactTelegramLink, state.settings.telegramUrl, "Telegram");
    }
    setDirectLink(heroTrailerLink, "https://www.youtube.com", "Watch Trailer");
  }

  function renderStats() {
    const demoViewTotal = getTrendingMovies(6).reduce(
      (total, movie) => total + getMovieMetrics(movie, cache.get(movie.imdbID)).views,
      0
    );
    const streamingRows = state.collections.length + getGenreShelves().length + 3;

    document.getElementById("statGrid").innerHTML = [
      { value: state.catalog.length, label: "Movies Indexed" },
      { value: streamingRows, label: "Streaming Rows" },
      { value: state.memberCount || 0, label: "Members Joined" },
      { value: formatCompactNumber(demoViewTotal), label: "Demo Views" },
    ]
      .map(
        (item) => `
          <div class="stat-card">
            <strong>${item.value}</strong>
            <span>${item.label}</span>
          </div>
        `
      )
      .join("");
  }

  function compactMovieMarkup(movie, detail, eyebrow) {
    const action = getMoviePrimaryAction(movie);
    const trailerUrl = getMovieTrailerUrl(movie, detail);
    const metrics = getMovieMetrics(movie, detail);
    return `
      <article class="movie-card compact-card">
        <div class="card-copy">
          <span class="pill">${escapeHtml(eyebrow || movie.tag || "Featured")}</span>
          <h3>${escapeHtml(detail?.Title || movie.titleHint || movie.imdbID)}</h3>
          <p>${escapeHtml(movie.note || detail?.Plot || "Movie detail available from the library.")}</p>
          <div class="meta-row subtle">
            <span>${escapeHtml(detail?.Year || movie.yearHint || "Year TBA")}</span>
            <span>${escapeHtml(detail?.Runtime || movie.tag || "Movie")}</span>
            <span>${escapeHtml(
              detail?.imdbRating && detail.imdbRating !== "N/A" ? `${detail.imdbRating} IMDb` : "IMDb pending"
            )}</span>
            <span>${escapeHtml(formatCompactNumber(metrics.views))} demo views</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="ghost-button small" data-action="open-movie" data-movie-id="${movie.id}">Details</button>
          <a class="ghost-button small" href="${escapeHtml(trailerUrl)}" target="_blank" rel="noreferrer">Trailer</a>
          <a class="text-link" href="${escapeHtml(action.destinationUrl)}" data-action="open-destination" data-destination-url="${escapeHtml(
            action.destinationUrl
          )}" target="_blank" rel="noreferrer">${escapeHtml(action.label)}</a>
        </div>
      </article>
    `;
  }

  function renderFeaturedRail() {
    featuredRail.innerHTML = getFeaturedMovies()
      .map((movie) => compactMovieMarkup(movie, cache.get(movie.imdbID), "Featured Right Now"))
      .join("");
  }

  function renderTrendingRail() {
    if (!trendingMount) {
      return;
    }

    const trending = getTrendingMovies(6);
    trendingMount.innerHTML = trending.length
      ? trending
          .map((movie) =>
            movieCardMarkup(movie, cache.get(movie.imdbID), {
              badge: "Trending Now",
              note: "Momentum score powered by demo counters",
            })
          )
          .join("")
      : `
          <div class="empty-state">
            <h3>No trending titles yet</h3>
            <p>Add movies to the catalog to activate the trending row.</p>
          </div>
        `;
  }

  async function renderHeroMovie() {
    const heroMovie = getMovieById(state.settings.heroMovieId) || getFeaturedMovies()[0];
    if (!heroMovie) {
      return;
    }

    try {
      const detail = await fetchMovieByImdbId(heroMovie.imdbID);
      const poster = safePoster(detail);

      heroPoster.innerHTML = poster
        ? `<img src="${poster}" alt="${escapeHtml(detail.Title)} poster" />`
        : `<div class="poster-fallback">${escapeHtml(heroMovie.titleHint || "KNR MOVIEES")}</div>`;

      heroMeta.innerHTML = `
        <p class="eyebrow">Tonight's Spotlight</p>
        <h3>${escapeHtml(detail.Title)}</h3>
        <div class="meta-row">
          <span>${escapeHtml(detail.Year || heroMovie.yearHint)}</span>
          <span>${escapeHtml(detail.Runtime || "Runtime TBA")}</span>
          <span>${escapeHtml(getPrimaryGenre(heroMovie, detail))}</span>
          <span>${escapeHtml(detail.imdbRating || "N/A")} IMDb</span>
          <span>${escapeHtml(formatCompactNumber(getMovieMetrics(heroMovie, detail).views))} demo views</span>
        </div>
        <p>${escapeHtml(heroMovie.note || detail.Plot)}</p>
      `;

      setDirectLink(heroTrailerLink, getMovieTrailerUrl(heroMovie, detail), "Watch Trailer");
    } catch (error) {
      heroPoster.innerHTML = `<div class="poster-fallback">${escapeHtml(heroMovie.titleHint || "KNR MOVIEES")}</div>`;
      heroMeta.innerHTML = `
        <p class="eyebrow">Tonight's Spotlight</p>
        <h3>${escapeHtml(heroMovie.titleHint)}</h3>
        <div class="meta-row">
          <span>${escapeHtml(heroMovie.yearHint || "Year TBA")}</span>
          <span>OMDb pending</span>
          <span>${escapeHtml(heroMovie.tag || "Featured")}</span>
          <span>${escapeHtml(formatCompactNumber(getMovieMetrics(heroMovie).views))} demo views</span>
        </div>
        <p>${escapeHtml(heroMovie.note)}</p>
      `;

      setDirectLink(heroTrailerLink, getMovieTrailerUrl(heroMovie), "Watch Trailer");
    }
  }

  function movieCardMarkup(movie, detail, options) {
    const settings = options && typeof options === "object" ? options : {};
    const action = getMoviePrimaryAction(movie);
    const title = detail?.Title || movie.titleHint || "Untitled";
    const poster = safePoster(detail);
    const trailerUrl = getMovieTrailerUrl(movie, detail);
    const genre = getPrimaryGenre(movie, detail);
    const language = detail?.Language && detail.Language !== "N/A" ? detail.Language.split(",")[0] : "Language TBA";
    const rating = detail?.imdbRating && detail.imdbRating !== "N/A" ? `${detail.imdbRating} IMDb` : movie.tag || "Curated";
    const metrics = getMovieMetrics(movie, detail);

    return `
      <article class="movie-card poster-card ${settings.variant === "directory" ? "directory-card" : ""}">
        <div class="poster-wrap">
          ${
            poster
              ? `<img src="${poster}" alt="${escapeHtml(title)} poster" loading="lazy" />`
              : `<div class="poster-fallback">${escapeHtml(title)}</div>`
          }
          <span class="poster-badge">${escapeHtml(settings.badge || movie.tag || genre)}</span>
        </div>
        <div class="card-copy">
          <div class="meta-row">
            <span>${escapeHtml(detail?.Year || movie.yearHint || "Year TBA")}</span>
            <span>${escapeHtml(detail?.Runtime || movie.tag || "Movie")}</span>
            <span>${escapeHtml(genre)}</span>
          </div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(movie.note || detail?.Plot || "Movie details available in the info center.")}</p>
          <div class="info-grid section-spacing">
            <div class="info-chip"><strong>IMDb</strong><span>${escapeHtml(rating)}</span></div>
            <div class="info-chip"><strong>Language</strong><span>${escapeHtml(language)}</span></div>
            <div class="info-chip"><strong>Released</strong><span>${escapeHtml(
              detail?.Released && detail.Released !== "N/A" ? detail.Released : formatDate(movie.addedAt)
            )}</span></div>
            <div class="info-chip"><strong>Updated</strong><span>${escapeHtml(formatDate(movie.addedAt))}</span></div>
            <div class="info-chip"><strong>Demo Views</strong><span>${escapeHtml(formatCompactNumber(metrics.views))}</span></div>
            <div class="info-chip"><strong>Live Demo</strong><span>${escapeHtml(String(metrics.live))} watching</span></div>
          </div>
          <div class="card-actions section-spacing">
            <button class="primary-button small" data-action="open-movie" data-movie-id="${movie.id}">View Details</button>
            <a class="ghost-button small" href="${escapeHtml(trailerUrl)}" target="_blank" rel="noreferrer">Watch Trailer</a>
            <a class="text-link" href="${escapeHtml(action.destinationUrl)}" data-action="open-destination" data-destination-url="${escapeHtml(
              action.destinationUrl
            )}" target="_blank" rel="noreferrer">${escapeHtml(action.label)}</a>
          </div>
          <div class="meta-row subtle">
            <span>${escapeHtml(detail?.Director && detail.Director !== "N/A" ? detail.Director : "Director TBA")}</span>
            <span>${escapeHtml(
              detail?.Actors && detail.Actors !== "N/A" ? detail.Actors.split(",")[0] : "Cast info pending"
            )}</span>
            <span>${escapeHtml(settings.note || "Premium detail layout")}</span>
          </div>
        </div>
      </article>
    `;
  }

  async function renderLatestUpdates() {
    const latestMovies = getLatestMovies(6);
    latestMount.innerHTML = latestMovies.length
      ? latestMovies
          .map((movie) =>
            movieCardMarkup(movie, cache.get(movie.imdbID), {
              badge: "New Movie",
              note: "Freshly added to the library",
            })
          )
          .join("")
      : `
          <div class="empty-state">
            <h3>No recent movie updates yet</h3>
            <p>Add a new title in the admin panel to show the latest movie details here.</p>
          </div>
        `;
  }

  async function renderGenreShelves() {
    if (!genreShelfMount) {
      return;
    }

    const shelves = getGenreShelves();
    genreShelfMount.innerHTML = shelves.length
      ? shelves
          .map(
            (shelf) => `
              <section class="content-block" id="${escapeHtml(shelf.id)}">
                <div class="block-header">
                  <div>
                    <p class="eyebrow">${escapeHtml(shelf.eyebrow)}</p>
                    <h2>${escapeHtml(shelf.title)}</h2>
                  </div>
                  <p>${escapeHtml(shelf.description)}</p>
                </div>
                <div class="card-grid">
                  ${shelf.movies
                    .map((movie) =>
                      movieCardMarkup(movie, cache.get(movie.imdbID), {
                        badge: shelf.title,
                        note: "Auto-grouped from movie genres",
                      })
                    )
                    .join("")}
                </div>
              </section>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            <h3>Genre shelves are waiting</h3>
            <p>Add more titles to the catalog and genre-based categories will appear here automatically.</p>
          </div>
        `;
  }

  async function renderCollections() {
    if (!state.collections.length) {
      collectionMount.innerHTML = `
        <div class="empty-state">
          <h3>No collections yet</h3>
          <p>Open the admin panel to add your first curated section.</p>
        </div>
      `;
      return;
    }

    collectionMount.innerHTML = state.collections
      .map((collection) => {
        const cards = collection.movieIds
          .map((movieId) => getMovieById(movieId))
          .filter(Boolean)
          .map((movie) =>
            movieCardMarkup(movie, cache.get(movie.imdbID), {
              badge: collection.title,
              note: "Hand-picked by the site owner",
            })
          )
          .join("");

        return `
          <section class="content-block" id="${escapeHtml(collection.id)}">
            <div class="block-header">
              <div>
                <p class="eyebrow">Curated Collection</p>
                <h2>${escapeHtml(collection.title)}</h2>
              </div>
              <p>${escapeHtml(collection.description || "Hand-built picks for your audience.")}</p>
            </div>
            <div class="card-grid">
              ${cards || '<div class="empty-state"><p>Add movies from the admin panel to populate this row.</p></div>'}
            </div>
          </section>
        `;
      })
      .join("");
  }

  async function renderDirectory() {
    const movies = getLatestMovies();
    directoryMount.innerHTML = movies.length
      ? movies
          .map((movie) =>
            movieCardMarkup(movie, cache.get(movie.imdbID), {
              badge: "Info Center",
              variant: "directory",
              note: "Complete movie facts, posters, and trailer access",
            })
          )
          .join("")
      : `
          <div class="empty-state">
            <h3>No movies in the info center yet</h3>
            <p>Start adding titles from the admin panel to build your movie database.</p>
          </div>
        `;
  }

  function searchResultMarkup(item) {
    const trailerUrl = buildYoutubeTrailerSearchUrl({ titleHint: item.Title, yearHint: item.Year }, item);

    return `
      <article class="movie-card search-card">
        <div class="poster-wrap search-poster">
          ${
            item.Poster && item.Poster !== "N/A"
              ? `<img src="${item.Poster}" alt="${escapeHtml(item.Title)} poster" loading="lazy" />`
              : `<div class="poster-fallback">${escapeHtml(item.Title)}</div>`
          }
        </div>
        <div class="card-copy">
          <div class="meta-row">
            <span>${escapeHtml(item.Year)}</span>
            <span>${escapeHtml(item.Type || "movie")}</span>
          </div>
          <h3>${escapeHtml(item.Title)}</h3>
          <p>Open detailed movie information or jump straight to a YouTube trailer search for this title.</p>
          <div class="card-actions">
            <button class="primary-button small" data-action="open-external" data-imdb-id="${item.imdbID}">View Details</button>
            <a class="ghost-button small" href="${escapeHtml(trailerUrl)}" target="_blank" rel="noreferrer">Watch Trailer</a>
            <a class="text-link" href="${escapeHtml(state.settings.telegramUrl)}" data-action="open-destination" data-destination-url="${escapeHtml(
              state.settings.telegramUrl
            )}" target="_blank" rel="noreferrer">${escapeHtml(state.settings.primaryButtonLabel)}</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderSearchResults(items) {
    searchResults.innerHTML = items.length
      ? items.map(searchResultMarkup).join("")
      : `
          <div class="empty-state">
            <h3>No results found</h3>
            <p>Try another movie title or check your OMDb key in the admin panel.</p>
          </div>
        `;
  }

  function renderMembershipPlans() {
    const currentUser = getCurrentUser();
    membershipPlansMount.innerHTML = state.membershipPlans
      .map((plan) => {
        const isCurrent = currentUser && currentUser.membershipId === plan.id;
        return `
          <article class="feature-card plan-card ${plan.featured ? "featured-plan" : ""}">
            <p class="eyebrow">${plan.featured ? "Recommended" : "Membership"}</p>
            <h3>${escapeHtml(plan.name)}</h3>
            <p class="plan-price">${escapeHtml(plan.priceLabel)}</p>
            <p>${escapeHtml(plan.description)}</p>
            <div class="picker-grid section-spacing">
              ${plan.perks.map((perk) => `<div class="picker-item"><span>${escapeHtml(perk)}</span></div>`).join("")}
            </div>
            <div class="panel-actions section-spacing">
              <button class="primary-button" data-action="choose-plan" data-plan-id="${plan.id}" type="button">
                ${isCurrent ? "Current Plan" : currentUser ? "Switch Plan" : "Choose Plan"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderMemberSummary() {
    const currentUser = getCurrentUser();
    const activePlan = currentUser
      ? getPlanById(currentUser.membershipId)
      : getPlanById(selectedGuestPlanId) || getFeaturedPlan();

    if (!activePlan) {
      memberPlanTitle.textContent = "Membership";
      memberPlanCopy.textContent = "Add membership plans from the data file to enable this section.";
      memberAccountMeta.innerHTML = "";
      memberBenefitsList.innerHTML = "";
      return;
    }

    memberPlanTitle.textContent = activePlan.name;
    memberPlanCopy.textContent =
      activePlan.id === "free"
        ? `${activePlan.description} Paid plans bypass the shortener and open direct.`
        : activePlan.description;
    memberAccountMeta.innerHTML = currentUser
      ? `
          <span>${escapeHtml(activePlan.priceLabel)}</span>
          <span>${escapeHtml(currentUser.membershipStatus)}</span>
          <span>Joined ${escapeHtml(formatDate(currentUser.createdAt))}</span>
        `
      : `
          <span>${escapeHtml(activePlan.priceLabel)}</span>
          <span>Member-ready access</span>
          <span>${escapeHtml(state.settings.telegramHandle)}</span>
        `;
    memberBenefitsList.innerHTML = activePlan.perks
      .map((perk) => `<div class="picker-item"><span>${escapeHtml(perk)}</span></div>`)
      .join("");
  }

  function renderMemberArea() {
    const currentUser = getCurrentUser();
    const activePlan = currentUser ? getPlanById(currentUser.membershipId) : null;
    signupPlanSelect.innerHTML = state.membershipPlans
      .map(
        (plan) => `
          <option value="${plan.id}" ${plan.featured ? "selected" : ""}>${escapeHtml(plan.name)} - ${escapeHtml(
            plan.priceLabel
          )}</option>
        `
      )
      .join("");

    if (!currentUser) {
      if (!selectedGuestPlanId) {
        selectedGuestPlanId = signupPlanSelect.value;
      }
      signupPlanSelect.value = getPlanById(selectedGuestPlanId)?.id || signupPlanSelect.value;
      memberGuestView.hidden = false;
      memberActiveView.hidden = true;
      memberNavText.textContent = "Membership";
      if (!memberStatus.textContent.trim()) {
        setMemberStatus("Create an account to activate your membership inside KNR MOVIEES.");
      }
      renderMemberSummary();
      return;
    }

    memberGuestView.hidden = true;
    memberActiveView.hidden = false;
    selectedGuestPlanId = activePlan?.id || selectedGuestPlanId;
    memberNavText.textContent = `${currentUser.displayName}`;
    memberGreeting.textContent = `Welcome, ${currentUser.displayName}`;
    memberCurrentPlanCopy.textContent = activePlan
      ? activePlan.id === "free"
        ? `${activePlan.name} is active. Destination links open through LinkShortify.`
        : `${activePlan.name} is active on your account with direct destination access.`
      : "Your account is active.";
    memberMeta.innerHTML = `
      <span>${escapeHtml(activePlan?.priceLabel || "Member")}</span>
      <span>${escapeHtml(currentUser.email)}</span>
      <span>Joined ${escapeHtml(formatDate(currentUser.createdAt))}</span>
    `;
    setMemberStatus(`Logged in as ${currentUser.displayName}.`);
    renderMemberSummary();
  }

  async function openMovieDetailById(movieId) {
    const movie = getMovieById(movieId);
    if (movie) {
      await openMovieDetailByImdbId(movie.imdbID, movie);
    }
  }

  function createDetailGridMarkup(detail, movie) {
    return createFactList(detail, movie)
      .map(
        (item) => `
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.value)}</span>
          </div>
        `
      )
      .join("");
  }

  async function openMovieDetailByImdbId(imdbID, linkedMovie) {
    const content = document.getElementById("detailContent");
    detailModal.classList.add("is-open");
    document.body.classList.add("modal-open");
    content.innerHTML = `<div class="loading-card">Loading movie details...</div>`;

    try {
      const detail = await fetchMovieByImdbId(imdbID);
      const movie = linkedMovie || state.catalog.find((item) => item.imdbID === imdbID) || null;
      const action = movie ? getMoviePrimaryAction(movie) : getFallbackPrimaryAction();
      const movieReference = movie || { id: imdbID, titleHint: detail.Title, yearHint: detail.Year, addedAt: "" };
      const trailerUrl = getMovieTrailerUrl(movieReference, detail);
      const embedUrl = getYoutubeEmbedUrl(trailerUrl);
      const poster = safePoster(detail);
      const metrics = getMovieMetrics(movieReference, detail);

      content.innerHTML = `
        <div class="detail-layout">
          <div class="detail-poster">
            ${
              poster
                ? `<img src="${poster}" alt="${escapeHtml(detail.Title)} poster" />`
                : `<div class="poster-fallback">${escapeHtml(detail.Title)}</div>`
            }
          </div>
          <div class="detail-copy">
            <p class="eyebrow">${escapeHtml(movie?.tag || detail.Genre || "Movie Detail")}</p>
            <h3>${escapeHtml(detail.Title)}</h3>
            <div class="meta-row">
              <span>${escapeHtml(detail.Year || "Year TBA")}</span>
              <span>${escapeHtml(detail.Runtime || "Runtime TBA")}</span>
              <span>${escapeHtml(getPrimaryGenre(movieReference, detail))}</span>
              <span>${escapeHtml(detail.imdbRating || "N/A")} IMDb</span>
            </div>
            <p>${escapeHtml(movie?.note || detail.Plot || "Movie details unavailable.")}</p>
            <div class="detail-stat-strip">
              <div class="detail-stat">
                <strong>${escapeHtml(formatCompactNumber(metrics.views))}</strong>
                <span>Demo views</span>
              </div>
              <div class="detail-stat">
                <strong>${escapeHtml(String(metrics.live))}</strong>
                <span>Live demo</span>
              </div>
              <div class="detail-stat">
                <strong>${escapeHtml(formatCompactNumber(metrics.likes))}</strong>
                <span>Likes</span>
              </div>
            </div>
            <div class="card-actions">
              <a class="primary-button" href="${escapeHtml(action.destinationUrl || state.settings.telegramUrl)}" data-action="open-destination" data-destination-url="${escapeHtml(
                action.destinationUrl || state.settings.telegramUrl
              )}" target="_blank" rel="noreferrer">${escapeHtml(action.label || state.settings.primaryButtonLabel)}</a>
              <a class="ghost-button" href="${escapeHtml(trailerUrl)}" target="_blank" rel="noreferrer">Watch Trailer</a>
              <a class="ghost-button" href="${escapeHtml(state.settings.telegramUrl)}" data-action="open-destination" data-destination-url="${escapeHtml(
                state.settings.telegramUrl
              )}" target="_blank" rel="noreferrer">Visit Channel</a>
            </div>
            ${
              embedUrl
                ? `
                  <div class="detail-panel trailer-panel">
                    <div class="detail-panel-top">
                      <strong>Trailer</strong>
                      <span>YouTube preview</span>
                    </div>
                    <div class="trailer-embed">
                      <iframe
                        src="${escapeHtml(embedUrl)}"
                        title="${escapeHtml(detail.Title)} trailer"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                      ></iframe>
                    </div>
                  </div>
                `
                : `
                  <div class="detail-panel trailer-panel">
                    <div class="detail-panel-top">
                      <strong>Trailer</strong>
                      <span>No direct embed configured</span>
                    </div>
                    <p>Use the trailer button above to open the YouTube trailer search for this movie.</p>
                  </div>
                `
            }
            <div class="detail-grid">${createDetailGridMarkup(detail, movie)}</div>
            <div class="detail-panel legal-panel">
              <div class="detail-panel-top">
                <strong>Ownership & Fair Use</strong>
                <span>Visible site disclaimer</span>
              </div>
              <p>
                Posters, trailers, logos, and movie-related marks belong to their respective owners. This independent
                website presents them for information, discovery, commentary, and promotional reference.
              </p>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Movie detail unavailable</h3>
          <p>${escapeHtml(error.message || "Please check the OMDb configuration.")}</p>
        </div>
      `;
    }
  }

  function closeModal() {
    detailModal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  }

  async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) {
      searchStatus.textContent = "Type a movie title to start searching.";
      searchResults.innerHTML = "";
      return;
    }

    searchStatus.textContent = `Searching OMDb for "${query}"...`;
    searchResults.innerHTML = `<div class="loading-card">Looking up titles...</div>`;

    try {
      const items = await searchOmdb(query);
      searchStatus.textContent = items.length
        ? `${items.length} result${items.length > 1 ? "s" : ""} found for "${query}".`
        : `No titles found for "${query}".`;
      renderSearchResults(items);
    } catch (error) {
      searchStatus.textContent = "Search failed.";
      searchResults.innerHTML = `
        <div class="empty-state">
          <h3>Search unavailable</h3>
          <p>${escapeHtml(error.message || "Check your OMDb key in the admin panel.")}</p>
        </div>
      `;
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    try {
      const user = await window.KNRStore.registerUser({
        displayName: document.getElementById("signupName").value.trim(),
        email: document.getElementById("signupEmail").value.trim(),
        password: document.getElementById("signupPassword").value,
        membershipId: signupPlanSelect.value,
      });
      refreshState();
      renderStats();
      renderMembershipPlans();
      renderMemberArea();
      signupForm.reset();
      userLoginForm.reset();
      setMemberStatus(`Welcome ${user.displayName}, your account is ready.`);
    } catch (error) {
      setMemberStatus(error.message || "Account creation failed.");
    }
  }

  async function handleUserLogin(event) {
    event.preventDefault();
    try {
      const user = await window.KNRStore.verifyUser(
        document.getElementById("loginEmail").value.trim(),
        document.getElementById("loginUserPassword").value
      );
      if (!user) {
        setMemberStatus("Login failed. Check your email and password.");
        return;
      }
      refreshState();
      renderMembershipPlans();
      renderMemberArea();
      userLoginForm.reset();
      setMemberStatus(`Welcome back ${user.displayName}.`);
    } catch (error) {
      setMemberStatus(error.message || "Login failed.");
    }
  }

  async function choosePlan(planId) {
    const plan = getPlanById(planId);
    if (!plan) {
      setMemberStatus("This membership plan is unavailable.");
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      selectedGuestPlanId = plan.id;
      signupPlanSelect.value = plan.id;
      setMemberStatus(`Selected ${plan.name}. Create your account to activate it.`);
      document.getElementById("signupName").focus();
      document.getElementById("membership").scrollIntoView({ behavior: "smooth", block: "start" });
      renderMemberSummary();
      return;
    }

    try {
      await window.KNRStore.updateUserMembership(currentUser.id, plan.id);
      refreshState();
      renderMembershipPlans();
      renderMemberArea();
      setMemberStatus(`Membership switched to ${plan.name}.`);
    } catch (error) {
      setMemberStatus(error.message || "Membership update failed.");
    }
  }

  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) {
      return;
    }

    const action = trigger.getAttribute("data-action");
    if (action === "open-movie") {
      await openMovieDetailById(trigger.getAttribute("data-movie-id"));
    }
    if (action === "open-external") {
      await openMovieDetailByImdbId(trigger.getAttribute("data-imdb-id"));
    }
    if (action === "close-modal") {
      closeModal();
    }
    if (action === "choose-plan") {
      await choosePlan(trigger.getAttribute("data-plan-id"));
    }
    if (action === "open-destination") {
      event.preventDefault();
      await openDestination(trigger.getAttribute("data-destination-url"), trigger.getAttribute("target"));
    }
    if (action === "logout-user") {
      window.KNRStore.clearUserSession();
      refreshState();
      renderMembershipPlans();
      renderMemberArea();
      setMemberStatus("You have logged out.");
    }
  });

  detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailModal.classList.contains("is-open")) {
      closeModal();
    }
  });

  searchForm.addEventListener("submit", handleSearch);
  signupForm.addEventListener("submit", handleSignup);
  userLoginForm.addEventListener("submit", handleUserLogin);
  signupPlanSelect.addEventListener("change", () => {
    selectedGuestPlanId = signupPlanSelect.value;
    renderMemberSummary();
  });

  async function initializeApp() {
    try {
      await window.KNRStore.init("public");
      refreshState();
    } catch (error) {
      searchStatus.textContent = error.message || "Could not connect to the website server.";
      setMemberStatus(error.message || "Could not connect to the website server.");
    }

    renderShellText();
    renderStats();
    renderMembershipPlans();
    renderMemberArea();
    await hydrateCatalogDetails();
    renderStats();
    renderFeaturedRail();
    renderTrendingRail();
    await renderHeroMovie();
    await renderGenreShelves();
    await renderLatestUpdates();
    await renderCollections();
    await renderDirectory();
    startCommunityPulse();
  }

  initializeApp();
})();
