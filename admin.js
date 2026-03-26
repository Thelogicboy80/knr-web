(function () {
  let state = window.KNRStore.loadState();
  let selectedCandidate = null;

  const authGate = document.getElementById("authGate");
  const setupCard = document.getElementById("setupCard");
  const loginCard = document.getElementById("loginCard");
  const adminShell = document.getElementById("adminShell");
  const authMessage = document.getElementById("authMessage");
  const lookupMessage = document.getElementById("lookupMessage");
  const lookupResults = document.getElementById("lookupResults");
  const movieForm = document.getElementById("movieForm");
  const collectionForm = document.getElementById("collectionForm");
  const collectionMoviePicker = document.getElementById("collectionMoviePicker");
  const heroMovieSelect = document.getElementById("heroMovieId");
  const collectionList = document.getElementById("collectionList");
  const catalogList = document.getElementById("catalogList");
  const planList = document.getElementById("planList");
  const memberList = document.getElementById("memberList");
  const dashboardStats = document.getElementById("dashboardStats");
  const settingsForm = document.getElementById("settingsForm");
  const adminStatus = document.getElementById("adminStatus");

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isAuthenticated() {
    const session = window.KNRStore.getSession();
    return Boolean(session && session.username && session.username === state.admin.username);
  }

  function setStatus(message) {
    authMessage.textContent = message;
    if (adminStatus) {
      adminStatus.textContent = message;
    }
  }

  function getPlanById(planId) {
    return (
      state.membershipPlans.find((plan) => plan.id === String(planId || "").trim()) ||
      state.membershipPlans[0] ||
      null
    );
  }

  function getDefaultMovieCtaLabel() {
    return window.KNRDefaults.normalizeTelegramBotUsername(state.settings.telegramBotUsername)
      ? "Get in Telegram Bot"
      : "Open on Telegram";
  }

  function toggleAuthView() {
    state = window.KNRStore.loadState();
    const configured = state.admin.configured;
    const authenticated = isAuthenticated();

    setupCard.hidden = configured;
    loginCard.hidden = !configured || authenticated;
    authGate.hidden = authenticated;
    adminShell.hidden = !authenticated;

    if (!configured) {
      setStatus("Create your admin login first. It will be stored in MongoDB.");
    } else if (!authenticated) {
      setStatus("Sign in to manage KNR MOVIEES.");
    } else {
      setStatus("You are signed in. Start editing your site.");
      renderAdmin();
    }
  }

  async function fetchOmdb(url) {
    const response = await fetch(url);
    const data = await response.json();
    if (data.Response === "False") {
      throw new Error(data.Error || "OMDb request failed.");
    }
    return data;
  }

  async function lookupMovies(event) {
    event.preventDefault();
    const apiKey = String(state.settings.apiKey || "").trim();
    const mode = document.getElementById("lookupMode").value;
    const query = document.getElementById("lookupQuery").value.trim();

    if (!query) {
      lookupMessage.textContent = "Enter a title or IMDb ID to search.";
      return;
    }

    if (!apiKey) {
      lookupMessage.textContent = "Add the OMDb API key in Site Settings first.";
      return;
    }

    lookupMessage.textContent = "Searching OMDb...";
    lookupResults.innerHTML = `<div class="loading-card">Loading results...</div>`;

    try {
      if (mode === "id") {
        const detail = await fetchOmdb(
          `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&plot=short&i=${encodeURIComponent(query)}`
        );
        renderLookupResults([detail]);
      } else {
        const result = await fetch(
          `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&type=movie&s=${encodeURIComponent(query)}`
        );
        const data = await result.json();
        const searchItems = data.Response === "False" ? [] : data.Search || [];
        renderLookupResults(searchItems);
      }
    } catch (error) {
      lookupMessage.textContent = error.message || "Lookup failed.";
      lookupResults.innerHTML = "";
    }
  }

  function renderLookupResults(items) {
    lookupMessage.textContent = items.length
      ? "Pick a movie to add it to your catalog."
      : "No OMDb matches found.";

    lookupResults.innerHTML = items
      .map((item) => {
        const title = item.Title || item.titleHint || item.imdbID;
        const poster =
          item.Poster && item.Poster !== "N/A"
            ? `<img src="${item.Poster}" alt="${escapeHtml(title)} poster" loading="lazy" />`
            : `<div class="poster-fallback">${escapeHtml(title)}</div>`;

        return `
          <article class="lookup-card">
            <div class="lookup-poster">${poster}</div>
            <div class="lookup-copy">
              <h4>${escapeHtml(title)}</h4>
              <p>${escapeHtml(item.Year || "Year TBA")} - ${escapeHtml(item.imdbID || "IMDb pending")}</p>
              <button class="primary-button small" data-action="select-candidate" data-imdb-id="${escapeHtml(
                item.imdbID
              )}" data-title="${escapeHtml(title)}" data-year="${escapeHtml(item.Year || "")}">
                Use This Movie
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function fillMovieForm(movie, source) {
    selectedCandidate = source || {
      imdbID: movie.imdbID,
      Title: movie.titleHint,
      Year: movie.yearHint,
    };

    document.getElementById("movieId").value = movie.id || "";
    document.getElementById("movieImdbId").value = selectedCandidate.imdbID || movie.imdbID || "";
    document.getElementById("movieTitleHint").value = selectedCandidate.Title || movie.titleHint || "";
    document.getElementById("movieYearHint").value = selectedCandidate.Year || movie.yearHint || "";
    document.getElementById("movieTag").value = movie.tag || "";
    document.getElementById("movieNote").value = movie.note || "";
    document.getElementById("movieCtaLabel").value = movie.ctaLabel || getDefaultMovieCtaLabel();
    document.getElementById("movieCtaUrl").value = movie.ctaUrl || state.settings.telegramUrl;
    document.getElementById("movieTrailerUrl").value = movie.trailerUrl || "";
    document.getElementById("movieDownloadLabel").value = movie.downloadLabel || "Download";
    document.getElementById("movieDownloadUrl").value = movie.downloadUrl || "";
    document.getElementById("movieFeatured").checked = Boolean(movie.featured);
    document.getElementById("selectedMovieLabel").textContent = selectedCandidate.Title
      ? `Selected: ${selectedCandidate.Title}`
      : "No movie selected yet.";
  }

  function clearMovieForm() {
    selectedCandidate = null;
    movieForm.reset();
    document.getElementById("movieId").value = "";
    document.getElementById("movieCtaLabel").value = getDefaultMovieCtaLabel();
    document.getElementById("movieCtaUrl").value = state.settings.telegramUrl;
    document.getElementById("movieTrailerUrl").value = "";
    document.getElementById("movieDownloadLabel").value = "Download";
    document.getElementById("movieDownloadUrl").value = "";
    document.getElementById("selectedMovieLabel").textContent = "No movie selected yet.";
  }

  function populateSettings() {
    [
      "siteName",
      "tagline",
      "heroEyebrow",
      "heroTitle",
      "heroCopy",
      "announcement",
      "telegramHandle",
      "telegramUrl",
      "telegramBotUsername",
      "primaryButtonLabel",
      "secondaryButtonLabel",
      "apiKey",
      "shortenerBaseUrl",
      "distributionNotice",
      "footerNote",
    ].forEach((field) => {
      const input = document.getElementById(field);
      if (input) {
        input.value = state.settings[field] || "";
      }
    });
    document.getElementById("freePlanShortenerEnabled").checked = state.settings.freePlanShortenerEnabled !== false;

    heroMovieSelect.innerHTML = state.catalog
      .map(
        (movie) => `
          <option value="${movie.id}" ${movie.id === state.settings.heroMovieId ? "selected" : ""}>
            ${escapeHtml(movie.titleHint || movie.imdbID)}
          </option>
        `
      )
      .join("");
  }

  function renderDashboardStats() {
    const featuredCount = state.catalog.filter((movie) => movie.featured).length;
    const paidMemberCount = state.users.filter((user) => user.membershipId !== "free").length;
    dashboardStats.innerHTML = [
      { value: state.catalog.length, label: "Catalog Movies" },
      { value: state.collections.length, label: "Active Collections" },
      { value: featuredCount, label: "Featured Titles" },
      { value: state.users.length, label: "Registered Users" },
      { value: paidMemberCount, label: "Paid Members" },
    ]
      .map(
        (item) => `
          <div class="stat-card">
            <strong>${item.value}</strong>
            <span>${escapeHtml(item.label)}</span>
          </div>
        `
      )
      .join("");
  }

  function renderCatalog() {
    catalogList.innerHTML = state.catalog
      .map((movie) => {
        const deliveryStatus = movie.downloadUrl
          ? window.KNRDefaults.normalizeTelegramBotUsername(state.settings.telegramBotUsername)
            ? "Bot delivery ready"
            : "Download URL saved"
          : "Catalog only";

        return `
          <article class="admin-list-card">
            <div>
              <p class="eyebrow">${escapeHtml(movie.tag || "Catalog Entry")}</p>
              <h4>${escapeHtml(movie.titleHint || movie.imdbID)}</h4>
              <p>${escapeHtml(movie.note || "No note added yet.")}</p>
              <div class="meta-row">
                <span>${escapeHtml(movie.yearHint || "Year TBA")}</span>
                <span>${escapeHtml(movie.imdbID)}</span>
                <span>${movie.trailerUrl ? "Trailer linked" : "Trailer search only"}</span>
                <span>${escapeHtml(deliveryStatus)}</span>
                <span>${movie.featured ? "Featured" : "Standard"}</span>
              </div>
            </div>
            <div class="card-actions">
              <button class="ghost-button" data-action="edit-movie" data-movie-id="${movie.id}">Edit</button>
              <button class="danger-button" data-action="delete-movie" data-movie-id="${movie.id}">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");

    if (!state.catalog.length) {
      catalogList.innerHTML = `
        <div class="empty-state">
          <h3>No catalog movies yet</h3>
          <p>Use the OMDb lookup above to add your first title.</p>
        </div>
      `;
    }
  }

  function renderPlans() {
    planList.innerHTML = state.membershipPlans
      .map((plan) => {
        const memberCount = state.users.filter((user) => user.membershipId === plan.id).length;
        return `
          <article class="admin-list-card">
            <div>
              <p class="eyebrow">${plan.featured ? "Recommended Plan" : "Membership Plan"}</p>
              <h4>${escapeHtml(plan.name)}</h4>
              <p>${escapeHtml(plan.description)}</p>
              <div class="meta-row">
                <span>${escapeHtml(plan.priceLabel)}</span>
                <span>${memberCount} member${memberCount === 1 ? "" : "s"}</span>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderMembers() {
    if (!state.users.length) {
      memberList.innerHTML = `
        <div class="empty-state">
          <h3>No users yet</h3>
          <p>New registrations from the public site will appear here.</p>
        </div>
      `;
      return;
    }

    memberList.innerHTML = state.users
      .map((user) => {
        const plan = getPlanById(user.membershipId);
        return `
          <article class="admin-list-card">
            <div>
              <p class="eyebrow">${escapeHtml(plan?.name || "Member")}</p>
              <h4>${escapeHtml(user.displayName || user.email)}</h4>
              <p>${escapeHtml(user.email)}</p>
              <div class="meta-row">
                <span>${escapeHtml(user.membershipStatus)}</span>
                <span>Joined ${escapeHtml(user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "Today")}</span>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderCollectionPicker() {
    collectionMoviePicker.innerHTML = state.catalog
      .map(
        (movie) => `
          <label class="picker-item">
            <input type="checkbox" value="${movie.id}" />
            <span>${escapeHtml(movie.titleHint || movie.imdbID)}</span>
          </label>
        `
      )
      .join("");
  }

  function renderCollections() {
    collectionList.innerHTML = state.collections
      .map(
        (collection) => `
          <article class="admin-list-card">
            <div>
              <p class="eyebrow">Collection</p>
              <h4>${escapeHtml(collection.title)}</h4>
              <p>${escapeHtml(collection.description || "No description added yet.")}</p>
              <div class="meta-row">
                <span>${collection.movieIds.length} movie${collection.movieIds.length === 1 ? "" : "s"}</span>
              </div>
            </div>
            <div class="card-actions">
              <button class="ghost-button" data-action="edit-collection" data-collection-id="${collection.id}">Edit</button>
              <button class="danger-button" data-action="delete-collection" data-collection-id="${collection.id}">Delete</button>
            </div>
          </article>
        `
      )
      .join("");

    if (!state.collections.length) {
      collectionList.innerHTML = `
        <div class="empty-state">
          <h3>No collections yet</h3>
          <p>Create a row to organize movies on the public site.</p>
        </div>
      `;
    }
  }

  function fillCollectionForm(collection) {
    document.getElementById("collectionId").value = collection.id || "";
    document.getElementById("collectionTitle").value = collection.title || "";
    document.getElementById("collectionDescription").value = collection.description || "";
    const selectedIds = new Set(collection.movieIds || []);
    collectionMoviePicker.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = selectedIds.has(input.value);
    });
  }

  function clearCollectionForm() {
    collectionForm.reset();
    document.getElementById("collectionId").value = "";
    collectionMoviePicker.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = false;
    });
  }

  function renderAdmin() {
    state = window.KNRStore.loadState();
    document.getElementById("adminBrandText").textContent = `${state.settings.siteName} Admin`;
    document.getElementById("adminTagline").textContent = state.settings.tagline;
    renderDashboardStats();
    populateSettings();
    renderCatalog();
    renderCollectionPicker();
    renderCollections();
    renderPlans();
    renderMembers();
    clearMovieForm();
    clearCollectionForm();
  }

  async function handleSetup(event) {
    event.preventDefault();
    const username = document.getElementById("setupUsername").value.trim();
    const password = document.getElementById("setupPassword").value;
    const confirmPassword = document.getElementById("setupConfirmPassword").value;

    if (!username || password.length < 6) {
      setStatus("Use a username and a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    try {
      await window.KNRStore.configureAdmin(username, password);
      state = window.KNRStore.loadState();
      toggleAuthView();
    } catch (error) {
      setStatus(error.message || "Admin setup failed.");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const isValid = await window.KNRStore.verifyAdmin(username, password);
      setStatus(isValid ? "Signed in." : "Login failed. Check your username and password.");
      toggleAuthView();
    } catch (error) {
      setStatus(error.message || "Login failed.");
    }
  }

  async function handleSettingsSave(event) {
    event.preventDefault();
    try {
      state = await window.KNRStore.updateState((draft) => {
        [
          "siteName",
          "tagline",
          "heroEyebrow",
          "heroTitle",
          "heroCopy",
          "announcement",
          "telegramHandle",
          "telegramUrl",
          "telegramBotUsername",
          "primaryButtonLabel",
          "secondaryButtonLabel",
          "apiKey",
          "shortenerBaseUrl",
          "distributionNotice",
          "footerNote",
        ].forEach((field) => {
          draft.settings[field] = document.getElementById(field).value.trim();
        });
        draft.settings.freePlanShortenerEnabled = document.getElementById("freePlanShortenerEnabled").checked;
        draft.settings.heroMovieId = heroMovieSelect.value;
        return draft;
      });

      renderAdmin();
      setStatus("Site settings saved.");
    } catch (error) {
      setStatus(error.message || "Site settings could not be saved.");
    }
  }

  async function handleMovieSave(event) {
    event.preventDefault();
    const imdbID = document.getElementById("movieImdbId").value.trim();
    if (!imdbID) {
      lookupMessage.textContent = "Select a movie from OMDb first.";
      return;
    }

    const movieId = document.getElementById("movieId").value.trim();
    const payload = {
      id: movieId || window.KNRDefaults.createId("movie"),
      imdbID,
      titleHint: document.getElementById("movieTitleHint").value.trim(),
      yearHint: document.getElementById("movieYearHint").value.trim(),
      tag: document.getElementById("movieTag").value.trim(),
      note: document.getElementById("movieNote").value.trim(),
      ctaLabel: document.getElementById("movieCtaLabel").value.trim(),
      ctaUrl: document.getElementById("movieCtaUrl").value.trim(),
      trailerUrl: document.getElementById("movieTrailerUrl").value.trim(),
      downloadLabel: document.getElementById("movieDownloadLabel").value.trim(),
      downloadUrl: document.getElementById("movieDownloadUrl").value.trim(),
      featured: document.getElementById("movieFeatured").checked,
    };

    try {
      state = await window.KNRStore.updateState((draft) => {
        const existingIndex = draft.catalog.findIndex((movie) => movie.id === payload.id);
        if (existingIndex >= 0) {
          draft.catalog[existingIndex] = {
            ...draft.catalog[existingIndex],
            ...payload,
          };
        } else {
          draft.catalog.unshift(payload);
        }

        if (!draft.settings.heroMovieId) {
          draft.settings.heroMovieId = payload.id;
        }

        return draft;
      });

      renderAdmin();
      lookupMessage.textContent = "Movie saved to catalog.";
    } catch (error) {
      setStatus(error.message || "Movie could not be saved.");
    }
  }

  async function handleCollectionSave(event) {
    event.preventDefault();
    const collectionId = document.getElementById("collectionId").value.trim();
    const selectedMovieIds = Array.from(
      collectionMoviePicker.querySelectorAll("input[type='checkbox']:checked")
    ).map((input) => input.value);

    if (!selectedMovieIds.length) {
      setStatus("Select at least one movie for the collection.");
      return;
    }

    const payload = {
      id: collectionId || window.KNRDefaults.createId("collection"),
      title: document.getElementById("collectionTitle").value.trim(),
      description: document.getElementById("collectionDescription").value.trim(),
      movieIds: selectedMovieIds,
    };

    if (!payload.title) {
      setStatus("Collection title is required.");
      return;
    }

    try {
      state = await window.KNRStore.updateState((draft) => {
        const existingIndex = draft.collections.findIndex((collection) => collection.id === payload.id);
        if (existingIndex >= 0) {
          draft.collections[existingIndex] = payload;
        } else {
          draft.collections.push(payload);
        }
        return draft;
      });

      renderAdmin();
      setStatus("Collection saved.");
    } catch (error) {
      setStatus(error.message || "Collection could not be saved.");
    }
  }

  async function downloadBackup() {
    const backup = await window.KNRStore.exportState();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "knr-movies-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imported = JSON.parse(String(reader.result || "{}"));
        state = await window.KNRStore.saveState(imported);
        toggleAuthView();
        setStatus("Backup imported.");
      } catch (error) {
        setStatus("Backup import failed. Use a valid KNR MOVIEES JSON backup.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  document.addEventListener("click", async (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.getAttribute("data-action");

    if (action === "select-candidate") {
      selectedCandidate = {
        imdbID: actionTarget.getAttribute("data-imdb-id"),
        Title: actionTarget.getAttribute("data-title"),
        Year: actionTarget.getAttribute("data-year"),
      };

      fillMovieForm(
        {
          id: "",
          imdbID: selectedCandidate.imdbID,
          titleHint: selectedCandidate.Title,
          yearHint: selectedCandidate.Year,
          tag: "",
          note: "",
          ctaLabel: getDefaultMovieCtaLabel(),
          ctaUrl: state.settings.telegramUrl,
          trailerUrl: "",
          downloadLabel: "Download",
          downloadUrl: "",
          featured: false,
        },
        selectedCandidate
      );
    }

    if (action === "edit-movie") {
      const movie = state.catalog.find((item) => item.id === actionTarget.getAttribute("data-movie-id"));
      if (movie) {
        fillMovieForm(movie);
      }
    }

    if (action === "delete-movie") {
      const movieId = actionTarget.getAttribute("data-movie-id");
      try {
        state = await window.KNRStore.updateState((draft) => {
          draft.catalog = draft.catalog.filter((movie) => movie.id !== movieId);
          draft.collections = draft.collections.map((collection) => ({
            ...collection,
            movieIds: collection.movieIds.filter((id) => id !== movieId),
          }));
          if (draft.settings.heroMovieId === movieId) {
            draft.settings.heroMovieId = draft.catalog[0] ? draft.catalog[0].id : "";
          }
          return draft;
        });
        renderAdmin();
        setStatus("Movie removed.");
      } catch (error) {
        setStatus(error.message || "Movie could not be removed.");
      }
    }

    if (action === "edit-collection") {
      const collection = state.collections.find(
        (item) => item.id === actionTarget.getAttribute("data-collection-id")
      );
      if (collection) {
        fillCollectionForm(collection);
      }
    }

    if (action === "delete-collection") {
      const collectionId = actionTarget.getAttribute("data-collection-id");
      try {
        state = await window.KNRStore.updateState((draft) => {
          draft.collections = draft.collections.filter((collection) => collection.id !== collectionId);
          return draft;
        });
        renderAdmin();
        setStatus("Collection removed.");
      } catch (error) {
        setStatus(error.message || "Collection could not be removed.");
      }
    }

    if (action === "clear-movie-form") {
      clearMovieForm();
    }

    if (action === "clear-collection-form") {
      clearCollectionForm();
    }

    if (action === "logout") {
      window.KNRStore.clearSession();
      toggleAuthView();
    }

    if (action === "download-backup") {
      try {
        await downloadBackup();
      } catch (error) {
        setStatus(error.message || "Backup download failed.");
      }
    }

    if (action === "reset-starter") {
      try {
        await window.KNRStore.resetState();
        state = window.KNRStore.loadState();
        toggleAuthView();
        setStatus("Starter content restored. Create the admin account again if needed.");
      } catch (error) {
        setStatus(error.message || "Starter reset failed.");
      }
    }
  });

  document.getElementById("setupForm").addEventListener("submit", handleSetup);
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("lookupForm").addEventListener("submit", lookupMovies);
  movieForm.addEventListener("submit", handleMovieSave);
  collectionForm.addEventListener("submit", handleCollectionSave);
  settingsForm.addEventListener("submit", handleSettingsSave);
  document.getElementById("backupInput").addEventListener("change", importBackup);

  async function initializeAdmin() {
    let bootError = "";

    try {
      await window.KNRStore.init("admin");
      state = window.KNRStore.loadState();
    } catch (error) {
      state = window.KNRStore.loadState();
      bootError = error.message || "Could not connect to the website server.";
    }

    toggleAuthView();
    if (bootError) {
      setStatus(bootError);
    }
  }

  initializeAdmin();
})();
