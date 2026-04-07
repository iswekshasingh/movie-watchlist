/* ============================================================
   Movie Watchlist — Milestone 3
   Features: Search · Watchlist · Sort · Filter
   HOFs used: .map()  .filter()  .sort()  .find()  .some()
   ============================================================ */

const API_KEY = "9d8c7133";

// ── State ────────────────────────────────────────────────────
// `searchResults` holds the raw array returned by the OMDb API.
// All sort/filter operations work ON THIS ARRAY (never mutate it).
let searchResults = [];

// ── localStorage helpers ──────────────────────────────────────
// Always parse/stringify when reading from / writing to localStorage.

/**
 * Reads the watchlist from localStorage.
 * Returns an empty array if nothing is saved yet.
 */
function getWatchlist() {
    return JSON.parse(localStorage.getItem("watchlist")) || [];
}

/**
 * Saves the entire watchlist array back to localStorage.
 * @param {Array} list
 */
function saveWatchlist(list) {
    localStorage.setItem("watchlist", JSON.stringify(list));
}

// ── Watchlist: Add / Remove ───────────────────────────────────
// WHY .some()?  We need to check whether a movie already exists
// in the watchlist without writing a loop ourselves.

/**
 * Toggles a movie in/out of the watchlist.
 * Uses Array.some() to detect duplicates.
 * @param {Object} movie  — the full OMDb movie object
 */
function toggleWatchlist(movie) {
    let list = getWatchlist();

    // .some() returns true if at least one element matches the predicate
    const alreadySaved = list.some(m => m.imdbID === movie.imdbID);

    if (alreadySaved) {
        // .filter() keeps everything EXCEPT the removed movie
        list = list.filter(m => m.imdbID !== movie.imdbID);
    } else {
        list.push(movie);
    }

    saveWatchlist(list);
    updateBadge();

    // Re-render whichever tab is active so buttons update instantly
    const activeTab = document.querySelector(".tab.active").id;
    if (activeTab === "tabSearch") {
        renderMovies(searchResults, "moviesContainer");
    } else {
        renderWatchlist();
    }
}

// ── Sort ──────────────────────────────────────────────────────
// WHY .sort()?  Pure declarative comparison — no manual loops needed.

/**
 * Sorts a movie array by year using Array.sort().
 * IMPORTANT: we spread [...movies] to avoid mutating the original array.
 * @param {Array}  movies
 * @param {string} order  — "asc" | "desc" | "none"
 * @returns {Array} sorted copy
 */
function sortMovies(movies, order) {
    if (order === "none") return [...movies];

    return [...movies].sort((a, b) => {
        // Years can be "2019", "2019–2022" etc. parseInt handles both.
        const yearA = parseInt(a.Year) || 0;
        const yearB = parseInt(b.Year) || 0;

        return order === "asc" ? yearA - yearB : yearB - yearA;
    });
}

// ── Filter ────────────────────────────────────────────────────
// WHY .filter()?  It returns a NEW array containing only the
// elements that pass the test — no side-effects, no loops.

/**
 * Filters movies by their "Type" field (movie / series).
 * @param {Array}  movies
 * @param {string} type   — "all" | "movie" | "series"
 * @returns {Array} filtered copy
 */
function filterMovies(movies, type) {
    if (type === "all") return movies; // nothing to filter
    return movies.filter(m => m.Type === type);
}

// ── applyControls ─────────────────────────────────────────────
// Called whenever the user changes the sort or filter dropdown.
// Pipeline: searchResults → filter → sort → render

function applyControls() {
    const type  = document.getElementById("filterType").value;
    const order = document.getElementById("sortOrder").value;

    // Step 1 – filter (uses Array.filter internally)
    const filtered = filterMovies(searchResults, type);

    // Step 2 – sort the filtered result (uses Array.sort internally)
    const sorted = sortMovies(filtered, order);

    // Step 3 – render the final processed array
    renderMovies(sorted, "moviesContainer");
}

// ── Search ────────────────────────────────────────────────────

async function searchMovies() {
    const query     = document.getElementById("searchInput").value.trim();
    const container = document.getElementById("moviesContainer");

    if (!query) return;

    container.innerHTML = `<p class="status-msg">Searching…</p>`;

    try {
        const response = await fetch(
            `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`
        );
        const data = await response.json();

        if (data.Response === "False") {
            container.innerHTML = `<p class="status-msg">No results for "<strong>${query}</strong>".</p>`;
            searchResults = [];
            return;
        }

        // Store raw results so sort/filter can always start fresh
        searchResults = data.Search;

        // Switch to search tab (in case user was on watchlist)
        switchTab("search");

        // Apply current dropdown selections immediately
        applyControls();

    } catch (error) {
        container.innerHTML = `<p class="status-msg error">⚠️ Could not fetch results. Check your connection.</p>`;
    }
}

// ── Render helpers ────────────────────────────────────────────
// WHY .map()?  It transforms each movie object into an HTML string,
// returning a new array we then .join("") into one big string.

/**
 * Renders an array of movies into a given container element.
 * Uses Array.map() to convert each movie → HTML card string.
 * @param {Array}  movies
 * @param {string} containerId
 */
function renderMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    const list      = getWatchlist();

    if (!movies || movies.length === 0) {
        container.innerHTML = `<p class="status-msg">No movies to show.</p>`;
        return;
    }

    // .map() turns each movie object into an HTML string
    // .join("") stitches them together — no loop required
    container.innerHTML = movies.map(movie => {
        // .find() checks if this specific movie is already in watchlist
        const inWatchlist = list.some(m => m.imdbID === movie.imdbID);

        const poster = movie.Poster !== "N/A"
            ? movie.Poster
            : "https://via.placeholder.com/150x220?text=No+Poster";

        return `
            <div class="movie-card" id="card-${movie.imdbID}">
                <img src="${poster}" alt="${movie.Title} poster" loading="lazy">
                <div class="card-info">
                    <h3>${movie.Title}</h3>
                    <span class="badge-type ${movie.Type}">${movie.Type}</span>
                    <p class="year">📅 ${movie.Year}</p>
                    <button
                        class="btn-watchlist ${inWatchlist ? 'added' : ''}"
                        onclick='toggleWatchlist(${JSON.stringify(movie)})'
                    >
                        ${inWatchlist ? '✅ Remove' : '➕ Add to Watchlist'}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

/**
 * Renders the saved watchlist tab.
 */
function renderWatchlist() {
    const list = getWatchlist();
    renderMovies(list, "watchlistContainer");
}

// ── Tab switching ─────────────────────────────────────────────

/**
 * Switches between the "search" tab and "watchlist" tab.
 * @param {string} tab — "search" | "watchlist"
 */
function switchTab(tab) {
    const searchGrid    = document.getElementById("moviesContainer");
    const watchlistGrid = document.getElementById("watchlistContainer");
    const controls      = document.getElementById("controls");
    const tabSearch     = document.getElementById("tabSearch");
    const tabWatchlist  = document.getElementById("tabWatchlist");

    if (tab === "search") {
        searchGrid.classList.remove("hidden");
        watchlistGrid.classList.add("hidden");
        controls.classList.remove("hidden");
        tabSearch.classList.add("active");
        tabWatchlist.classList.remove("active");
    } else {
        searchGrid.classList.add("hidden");
        watchlistGrid.classList.remove("hidden");
        controls.classList.add("hidden");          // sort/filter don't apply to watchlist
        tabSearch.classList.remove("active");
        tabWatchlist.classList.add("active");
        renderWatchlist();
    }
}

// ── Badge counter ─────────────────────────────────────────────

function updateBadge() {
    document.getElementById("watchlistCount").textContent = getWatchlist().length;
}

// ── Init ──────────────────────────────────────────────────────
// Run once on page load to show correct badge count

updateBadge();