/* =========================================================
   YNUBO — MAIN SCRIPT
   ========================================================= */


/* =========================================================
   CURSOR
   ========================================================= */

const cursor = document.querySelector(".cursor");
const follower = document.querySelector(".cursor-follower");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

let followerX = mouseX;
let followerY = mouseY;


document.addEventListener("mousemove", (event) => {

    mouseX = event.clientX;
    mouseY = event.clientY;

    if (cursor) {
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
    }

});


function animateFollower() {

    followerX +=
        (mouseX - followerX) * 0.12;

    followerY +=
        (mouseY - followerY) * 0.12;

    if (follower) {
        follower.style.left = `${followerX}px`;
        follower.style.top = `${followerY}px`;
    }

    requestAnimationFrame(animateFollower);
}

animateFollower();


/* Cursor hover */

const interactiveElements =
    document.querySelectorAll(
        "a, button, input, .playlist-item"
    );


interactiveElements.forEach((element) => {

    element.addEventListener("mouseenter", () => {

        cursor?.classList.add("active");
        follower?.classList.add("active");

    });

    element.addEventListener("mouseleave", () => {

        cursor?.classList.remove("active");
        follower?.classList.remove("active");

    });

});


/* =========================================================
   MUSIC CONFIG
   ========================================================= */

const MUSIC_CONFIG = {

    /*
     * GitHub username
     */
    owner: "ynubo",

    /*
     * Название репозитория.
     *
     * Если сайт находится, например,
     * в репозитории:
     *
     * github.com/ynubo/site
     *
     * здесь должно быть:
     *
     * repo: "site"
     */
    repo: "ynubo",

    /*
     * Папка с музыкой
     */
    path: "music",

    /*
     * Ветка
     */
    branch: "main"

};


/* =========================================================
   SUPPORTED AUDIO
   ========================================================= */

const SUPPORTED_AUDIO = [
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".flac"
];


/* =========================================================
   PLAYER
   ========================================================= */

const audio =
    document.querySelector("#audio");

const playButton =
    document.querySelector("#play");

const prevButton =
    document.querySelector("#prev");

const nextButton =
    document.querySelector("#next");

const progress =
    document.querySelector("#progress");

const currentTimeElement =
    document.querySelector("#current-time");

const durationElement =
    document.querySelector("#duration");

const playerTitle =
    document.querySelector("#player-title");

const playerArtist =
    document.querySelector("#player-artist");

const playlistElement =
    document.querySelector("#playlist");

const trackNumber =
    document.querySelector("#track-number");


/* =========================================================
   STATE
   ========================================================= */

let playlist = [];

let currentTrack = 0;


/* =========================================================
   GET MUSIC FROM GITHUB
   ========================================================= */

async function loadPlaylist() {

    if (!playlistElement) {
        return;
    }

    playlistElement.innerHTML = `
        <div class="playlist-empty">
            загрузка...
        </div>
    `;


    try {

        const url =
            `https://api.github.com/repos/` +
            `${encodeURIComponent(MUSIC_CONFIG.owner)}/` +
            `${encodeURIComponent(MUSIC_CONFIG.repo)}/contents/` +
            `${MUSIC_CONFIG.path}` +
            `?ref=${encodeURIComponent(MUSIC_CONFIG.branch)}`;


        const response =
            await fetch(url, {
                headers: {
                    "Accept":
                        "application/vnd.github+json"
                }
            });


        if (!response.ok) {

            throw new Error(
                `GitHub API: ${response.status}`
            );

        }


        const files =
            await response.json();


        if (!Array.isArray(files)) {

            throw new Error(
                "GitHub вернул неожиданный ответ."
            );

        }


        playlist = files

            .filter((file) => {

                if (file.type !== "file") {
                    return false;
                }

                const filename =
                    file.name.toLowerCase();

                return SUPPORTED_AUDIO.some(
                    (extension) =>
                        filename.endsWith(extension)
                );

            })


            .map((file) => ({

                name:
                    removeExtension(file.name),

                fileName:
                    file.name,

                url:
                    file.download_url

            }))


            .sort((a, b) =>
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

            playlistElement.innerHTML = `
                <div class="playlist-empty">
                    в папке /music пока ничего нет
                </div>
            `;

            updateTrackCounter();

            return;
        }


        renderPlaylist();

        loadTrack(0, false);


        console.log(
            `ynubo music: загружено ${playlist.length} треков`
        );


    } catch (error) {

        console.error(
            "Ошибка загрузки музыки:",
            error
        );


        playlistElement.innerHTML = `
            <div class="playlist-empty">
                не удалось загрузить музыку
            </div>
        `;

    }

}


/* =========================================================
   REMOVE EXTENSION
   ========================================================= */

function removeExtension(filename) {

    return filename.replace(
        /\.[^/.]+$/,
        ""
    );

}


/* =========================================================
   LOAD TRACK
   ========================================================= */

function loadTrack(
    index,
    autoplay = false
) {

    if (!playlist.length) {
        return;
    }


    if (index < 0) {

        index =
            playlist.length - 1;

    }


    if (index >= playlist.length) {

        index = 0;

    }


    currentTrack = index;


    const track =
        playlist[currentTrack];


    audio.src = track.url;

    audio.load();


    if (playerTitle) {

        playerTitle.textContent =
            track.name;

    }


    if (playerArtist) {

        playerArtist.textContent =
            "ynubo";

    }


    updateTrackCounter();

    updateProgress();

    renderPlaylist();


    /*
     * ВАЖНО:
     *
     * autoplay по умолчанию false.
     *
     * Поэтому при загрузке страницы
     * музыка сама НЕ начинает играть.
     */

    if (autoplay) {

        const promise =
            audio.play();

        if (promise) {

            promise
                .then(() => {
                    updatePlayButton(true);
                })
                .catch(() => {
                    updatePlayButton(false);
                });

        }

    } else {

        updatePlayButton(false);

    }

}


/* =========================================================
   PLAY / PAUSE
   ========================================================= */

function togglePlay() {

    if (!audio || !audio.src) {
        return;
    }


    if (audio.paused) {

        const promise =
            audio.play();


        if (promise) {

            promise
                .then(() => {

                    updatePlayButton(true);

                })
                .catch((error) => {

                    console.error(
                        "Воспроизведение заблокировано:",
                        error
                    );

                    updatePlayButton(false);

                });

        }

    } else {

        audio.pause();

        updatePlayButton(false);

    }

}


/* =========================================================
   NEXT
   ========================================================= */

function nextTrack() {

    if (!playlist.length) {
        return;
    }


    let next =
        currentTrack + 1;


    if (next >= playlist.length) {

        next = 0;

    }


    loadTrack(
        next,
        true
    );

}


/* =========================================================
   PREVIOUS
   ========================================================= */

function previousTrack() {

    if (!playlist.length) {
        return;
    }


    let previous =
        currentTrack - 1;


    if (previous < 0) {

        previous =
            playlist.length - 1;

    }


    loadTrack(
        previous,
        true
    );

}


/* =========================================================
   PLAY BUTTON
   ========================================================= */

function updatePlayButton(
    isPlaying
) {

    if (!playButton) {
        return;
    }


    playButton.textContent =
        isPlaying
            ? "Ⅱ"
            : "▶";


    playButton.setAttribute(
        "aria-label",
        isPlaying
            ? "Пауза"
            : "Воспроизвести"
    );

}


/* =========================================================
   TRACK COUNTER
   ========================================================= */

function updateTrackCounter() {

    if (!trackNumber) {
        return;
    }


    if (!playlist.length) {

        trackNumber.textContent =
            "00 / 00";

        return;

    }


    const current =
        String(currentTrack + 1)
            .padStart(2, "0");


    const total =
        String(playlist.length)
            .padStart(2, "0");


    trackNumber.textContent =
        `${current} / ${total}`;

}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {

        return "0:00";

    }


    const minutes =
        Math.floor(seconds / 60);


    const secondsPart =
        Math.floor(seconds % 60);


    return (
        `${minutes}:` +
        `${String(secondsPart).padStart(2, "0")}`
    );

}


/* =========================================================
   UPDATE PROGRESS
   ========================================================= */

function updateProgress() {

    if (progress) {
        progress.value = 0;
    }


    if (currentTimeElement) {

        currentTimeElement.textContent =
            "0:00";

    }


    if (durationElement) {

        durationElement.textContent =
            formatTime(audio?.duration);

    }

}


/* =========================================================
   AUDIO METADATA
   ========================================================= */

audio?.addEventListener(
    "loadedmetadata",
    () => {

        if (durationElement) {

            durationElement.textContent =
                formatTime(audio.duration);

        }

    }
);


/* =========================================================
   TIME UPDATE
   ========================================================= */

audio?.addEventListener(
    "timeupdate",
    () => {

        if (!audio.duration) {
            return;
        }


        const percent =
            (
                audio.currentTime /
                audio.duration
            ) * 100;


        if (progress) {

            progress.value =
                percent;

        }


        if (currentTimeElement) {

            currentTimeElement.textContent =
                formatTime(
                    audio.currentTime
                );

        }


        if (durationElement) {

            durationElement.textContent =
                formatTime(
                    audio.duration
                );

        }

    }
);


/* =========================================================
   SEEK
   ========================================================= */

progress?.addEventListener(
    "input",
    () => {

        if (!audio.duration) {
            return;
        }


        audio.currentTime =
            (
                Number(progress.value) /
                100
            ) * audio.duration;

    }
);


/* =========================================================
   TRACK ENDED
   ========================================================= */

audio?.addEventListener(
    "ended",
    () => {

        nextTrack();

    }
);


/* =========================================================
   PLAY STATE
   ========================================================= */

audio?.addEventListener(
    "play",
    () => {

        updatePlayButton(true);

    }
);


audio?.addEventListener(
    "pause",
    () => {

        updatePlayButton(false);

    }
);


/* =========================================================
   PLAYLIST RENDER
   ========================================================= */

function renderPlaylist() {

    if (!playlistElement) {
        return;
    }


    playlistElement.innerHTML = "";


    playlist.forEach(
        (track, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "playlist-item";


            if (index === currentTrack) {

                button.classList.add(
                    "active"
                );

            }


            const indexElement =
                document.createElement(
                    "span"
                );


            indexElement.className =
                "playlist-index";


            indexElement.textContent =
                String(index + 1)
                    .padStart(2, "0");


            const nameElement =
                document.createElement(
                    "span"
                );


            nameElement.className =
                "playlist-name";


            /*
             * textContent используется специально:
             *
             * кириллические и специальные
             * символы в имени файла
             * будут отображаться безопасно.
             */

            nameElement.textContent =
                track.name;


            button.appendChild(
                indexElement
            );


            button.appendChild(
                nameElement
            );


            button.addEventListener(
                "click",
                () => {

                    loadTrack(
                        index,
                        true
                    );

                }
            );


            playlistElement.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   BUTTONS
   ========================================================= */

playButton?.addEventListener(
    "click",
    togglePlay
);


prevButton?.addEventListener(
    "click",
    previousTrack
);


nextButton?.addEventListener(
    "click",
    nextTrack
);


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        const target =
            event.target;


        const isTyping =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT";


        if (isTyping) {
            return;
        }


        /*
         * Space
         * play / pause
         */

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            togglePlay();

        }


        /*
         * ArrowRight
         * next
         */

        if (
            event.code === "ArrowRight"
        ) {

            nextTrack();

        }


        /*
         * ArrowLeft
         * previous
         */

        if (
            event.code === "ArrowLeft"
        ) {

            previousTrack();

        }

    }
);


/* =========================================================
   SMOOTH LINK HOVER CURSOR
   ========================================================= */

document
    .querySelectorAll("a, button")
    .forEach((element) => {

        element.addEventListener(
            "mouseenter",
            () => {

                cursor?.classList.add(
                    "active"
                );

                follower?.classList.add(
                    "active"
                );

            }
        );


        element.addEventListener(
            "mouseleave",
            () => {

                cursor?.classList.remove(
                    "active"
                );

                follower?.classList.remove(
                    "active"
                );

            }
        );

    });


/* =========================================================
   START
   ========================================================= */

loadPlaylist();
