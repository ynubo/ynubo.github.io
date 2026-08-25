/* =========================
   MUSIC — AUTO PLAYLIST
   ========================= */

const MUSIC_CONFIG = {
    // Укажи здесь свой GitHub-репозиторий
    owner: "ynubo",
    repo: "ynubo",

    // Папка с музыкой
    path: "music",

    // Ветка
    branch: "main"
};

const SUPPORTED_AUDIO = [
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".flac"
];

let playlist = [];
let currentTrack = 0;

const audio = document.querySelector("#audio");

const playerTitle = document.querySelector("#player-title");
const playerArtist = document.querySelector("#player-artist");

const playButton = document.querySelector("#play");
const prevButton = document.querySelector("#prev");
const nextButton = document.querySelector("#next");

const progress = document.querySelector("#progress");
const currentTimeElement = document.querySelector("#current-time");
const durationElement = document.querySelector("#duration");


/* =========================
   GET MUSIC FROM GITHUB
   ========================= */

async function loadPlaylist() {
    try {
        const url =
            `https://api.github.com/repos/` +
            `${MUSIC_CONFIG.owner}/` +
            `${MUSIC_CONFIG.repo}/contents/` +
            `${MUSIC_CONFIG.path}?ref=${MUSIC_CONFIG.branch}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `GitHub API error: ${response.status}`
            );
        }

        const files = await response.json();

        playlist = files
            .filter(file => {
                if (file.type !== "file") return false;

                const name = file.name.toLowerCase();

                return SUPPORTED_AUDIO.some(extension =>
                    name.endsWith(extension)
                );
            })
            .map(file => ({
                name: removeExtension(file.name),
                fileName: file.name,
                url: file.download_url
            }));

        // Сортировка по названию
        playlist.sort((a, b) =>
            a.name.localeCompare(
                b.name,
                "ru",
                {
                    numeric: true,
                    sensitivity: "base"
                }
            )
        );

        if (playlist.length === 0) {
            console.warn("В папке /music нет аудиофайлов.");
            return;
        }

        console.log(
            `Загружено треков: ${playlist.length}`
        );

        loadTrack(0);

    } catch (error) {
        console.error(
            "Не удалось загрузить плейлист:",
            error
        );
    }
}


/* =========================
   REMOVE FILE EXTENSION
   ========================= */

function removeExtension(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}


/* =========================
   LOAD TRACK
   ========================= */

function loadTrack(index) {
    if (!playlist.length) return;

    if (index < 0) {
        index = playlist.length - 1;
    }

    if (index >= playlist.length) {
        index = 0;
    }

    currentTrack = index;

    const track = playlist[currentTrack];

    audio.src = track.url;

    if (playerTitle) {
        playerTitle.textContent = track.name;
    }

    if (playerArtist) {
        playerArtist.textContent = "ynubo";
    }

    audio.load();

    updatePlayer();

    console.log(
        `Текущий трек: ${track.name}`
    );
}


/* =========================
   PLAY / PAUSE
   ========================= */

function togglePlay() {
    if (!audio.src) return;

    if (audio.paused) {
        audio.play()
            .then(() => {
                updatePlayButton(true);
            })
            .catch(error => {
                console.error(
                    "Не удалось воспроизвести трек:",
                    error
                );
            });
    } else {
        audio.pause();
        updatePlayButton(false);
    }
}


/* =========================
   NEXT TRACK
   ========================= */

function nextTrack() {
    if (!playlist.length) return;

    currentTrack++;

    if (currentTrack >= playlist.length) {
        currentTrack = 0;
    }

    loadTrack(currentTrack);

    audio.play()
        .then(() => {
            updatePlayButton(true);
        })
        .catch(() => {});
}


/* =========================
   PREVIOUS TRACK
   ========================= */

function previousTrack() {
    if (!playlist.length) return;

    currentTrack--;

    if (currentTrack < 0) {
        currentTrack = playlist.length - 1;
    }

    loadTrack(currentTrack);

    audio.play()
        .then(() => {
            updatePlayButton(true);
        })
        .catch(() => {});
}


/* =========================
   PLAY BUTTON STATE
   ========================= */

function updatePlayButton(isPlaying) {
    if (!playButton) return;

    /*
     * Здесь оставляем твою существующую
     * иконку/стилистику.
     *
     * Если у тебя используются символы:
     * ▶ — play
     * ❚❚ — pause
     */

    playButton.textContent =
        isPlaying ? "❚❚" : "▶";
}


/* =========================
   PLAYER INFO
   ========================= */

function updatePlayer() {
    if (!playlist.length) return;

    const track = playlist[currentTrack];

    if (playerTitle) {
        playerTitle.textContent = track.name;
    }

    if (playerArtist) {
        playerArtist.textContent = "ynubo";
    }

    if (progress) {
        progress.value = 0;
    }

    if (currentTimeElement) {
        currentTimeElement.textContent =
            formatTime(0);
    }

    if (durationElement) {
        durationElement.textContent =
            formatTime(audio.duration);
    }

    updatePlayButton(false);
}


/* =========================
   TIME
   ========================= */

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds =
        Math.floor(seconds % 60);

    return `${minutes}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


/* =========================
   PROGRESS
   ========================= */

audio.addEventListener("loadedmetadata", () => {
    if (durationElement) {
        durationElement.textContent =
            formatTime(audio.duration);
    }
});


audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    if (progress) {
        progress.value =
            (audio.currentTime / audio.duration) * 100;
    }

    if (currentTimeElement) {
        currentTimeElement.textContent =
            formatTime(audio.currentTime);
    }

    if (durationElement) {
        durationElement.textContent =
            formatTime(audio.duration);
    }
});


/* =========================
   SEEK
   ========================= */

if (progress) {
    progress.addEventListener("input", () => {
        if (!audio.duration) return;

        audio.currentTime =
            (progress.value / 100) *
            audio.duration;
    });
}


/* =========================
   TRACK ENDED
   ========================= */

audio.addEventListener("ended", () => {
    nextTrack();
});


/* =========================
   BUTTONS
   ========================= */

if (playButton) {
    playButton.addEventListener(
        "click",
        togglePlay
    );
}

if (prevButton) {
    prevButton.addEventListener(
        "click",
        previousTrack
    );
}

if (nextButton) {
    nextButton.addEventListener(
        "click",
        nextTrack
    );
});


/* =========================
   KEYBOARD
   ========================= */

document.addEventListener("keydown", event => {
    // Не мешаем вводу текста
    if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
    ) {
        return;
    }

    if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
    }

    if (event.code === "ArrowRight") {
        nextTrack();
    }

    if (event.code === "ArrowLeft") {
        previousTrack();
    }
});


/* =========================
   START
   ========================= */

loadPlaylist();
