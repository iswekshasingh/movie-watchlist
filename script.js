const API_KEY = "9d8c7133";

async function searchMovies() {
    const query = document.getElementById("searchInput").value;

    const container = document.getElementById("moviesContainer");

    container.innerHTML = "Loading...";

    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`);
        const data = await response.json();

        displayMovies(data.Search);
    } catch(error) {
        container.innerHTML = "Error fetching data";
    }
}

function displayMovies(movies) {
    const container = document.getElementById("moviesContainer");

    if (!movies) {
        container.innerHTML = "No movies found";
        return;
    }

    container.innerHTML = "";

    movies.forEach(movie => {
        const div = document.createElement("div");
        div.classList.add("movie");

        div.innerHTML = `
            <h3>${movie.Title}</h3>
            <p>${movie.Year}</p>
            <img src="${movie.Poster}" width="150">
        `;

        container.appendChild(div);
    });
}