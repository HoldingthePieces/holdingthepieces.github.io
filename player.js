// Music Player v1.0.0

let musicData = null;
let currentTrackIndex = 0;
let filteredTracks = [];
let isPlaying = false;

// DOM Elements
const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const tracksContainer = document.getElementById('tracks-container');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const playOverlay = document.getElementById('play-overlay');

// Current track display
const currentArtwork = document.getElementById('current-artwork');
const currentTitle = document.getElementById('current-title');
const currentAlbum = document.getElementById('current-album');
const currentGenre = document.getElementById('current-genre');
const artistName = document.getElementById('artist-name');

// Filters
const filterBtns = document.querySelectorAll('.filter-btn');
const genreFilters = document.getElementById('genre-filters');
const albumFilters = document.getElementById('album-filters');

// Load music data
async function loadMusicData() {
    try {
        const response = await fetch('data/music.json');
        musicData = await response.json();

        // Title is set in HTML, don't override
        // artistName.textContent = musicData.artist;

        // Initialize with all tracks
        filteredTracks = [...musicData.tracks];

        // Render tracks
        renderTracks();

        // Setup album filters
        setupAlbumFilters();

        // Load first track (but don't play)
        if (filteredTracks.length > 0) {
            loadTrack(0);
        }
    } catch (error) {
        console.error('Error loading music data:', error);
        tracksContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Error loading music. Please check your music.json file.</p>';
    }
}

// Setup album filters dynamically
function setupAlbumFilters() {
    if (!musicData.albums || musicData.albums.length === 0) return;

    albumFilters.innerHTML = '<button class="genre-btn active" data-album="all">All Albums</button>';

    musicData.albums.forEach(album => {
        const btn = document.createElement('button');
        btn.className = 'genre-btn';
        btn.dataset.album = album.id;
        btn.textContent = album.title;
        btn.addEventListener('click', () => filterByAlbum(album.id));
        albumFilters.appendChild(btn);
    });
}

// Render tracks
function renderTracks() {
    tracksContainer.innerHTML = '';

    if (filteredTracks.length === 0) {
        tracksContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No tracks found.</p>';
        return;
    }

    filteredTracks.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        if (index === currentTrackIndex) {
            trackItem.classList.add('active');
        }

        const album = track.album ? musicData.albums.find(a => a.id === track.album) : null;
        const albumTitle = album ? album.title : 'Single';

        trackItem.innerHTML = `
            <img src="${track.artwork}" alt="${track.title}" onerror="this.src='https://via.placeholder.com/60x60/1a1a2e/eee?text=♪'">
            <div class="track-details">
                <h4>${track.title}</h4>
                <div class="track-meta">${track.genre} • ${albumTitle}</div>
            </div>
            <div class="track-duration">${track.duration || '0:00'}</div>
        `;

        trackItem.addEventListener('click', () => {
            currentTrackIndex = index;
            loadTrack(index);
            play();
        });

        tracksContainer.appendChild(trackItem);
    });
}

// Load track
function loadTrack(index) {
    if (index < 0 || index >= filteredTracks.length) return;

    const track = filteredTracks[index];
    currentTrackIndex = index;

    // Update audio source
    audioPlayer.src = track.file;

    // Update UI
    currentArtwork.src = track.artwork;
    currentArtwork.onerror = function() {
        this.src = 'https://via.placeholder.com/300x300/1a1a2e/eee?text=♪';
    };

    currentTitle.textContent = track.title;

    const album = track.album ? musicData.albums.find(a => a.id === track.album) : null;
    currentAlbum.textContent = album ? album.title : 'Single';
    currentGenre.textContent = track.genre;

    // Update active track in list
    document.querySelectorAll('.track-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// Play
function play() {
    audioPlayer.play();
    isPlaying = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
}

// Pause
function pause() {
    audioPlayer.pause();
    isPlaying = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
}

// Toggle play/pause
function togglePlay() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}

// Previous track
function previousTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + filteredTracks.length) % filteredTracks.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) play();
}

// Next track
function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % filteredTracks.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) play();
}

// Update progress bar
function updateProgress() {
    const { duration, currentTime } = audioPlayer;

    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progressFill.style.width = `${progressPercent}%`;

        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
    }
}

// Format time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Seek
function seek(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
}

// Filter functions
function showAllTracks() {
    filteredTracks = [...musicData.tracks];
    currentTrackIndex = 0;
    renderTracks();
    if (filteredTracks.length > 0) {
        loadTrack(0);
    }
}

function filterByGenre(genre) {
    if (genre === 'all') {
        filteredTracks = [...musicData.tracks];
    } else {
        filteredTracks = musicData.tracks.filter(track => track.genre === genre);
    }
    currentTrackIndex = 0;
    renderTracks();
    if (filteredTracks.length > 0) {
        loadTrack(0);
    }

    // Update active button
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.genre === genre);
    });
}

function filterByAlbum(albumId) {
    if (albumId === 'all') {
        filteredTracks = [...musicData.tracks];
    } else {
        filteredTracks = musicData.tracks.filter(track => track.album === albumId);
    }
    currentTrackIndex = 0;
    renderTracks();
    if (filteredTracks.length > 0) {
        loadTrack(0);
    }

    // Update active button
    document.querySelectorAll('#album-filters .genre-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.album === albumId);
    });
}

// Event Listeners
playPauseBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', previousTrack);
nextBtn.addEventListener('click', nextTrack);
audioPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('ended', nextTrack);
progressBar.addEventListener('click', seek);
playOverlay.addEventListener('click', togglePlay);

volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value / 100;
});

// Set initial volume
audioPlayer.volume = 0.7;

// Filter controls
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active filter button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        // Show/hide sub-filters
        genreFilters.classList.toggle('hidden', filter !== 'genre');
        albumFilters.classList.toggle('hidden', filter !== 'album');

        if (filter === 'all') {
            showAllTracks();
        }
    });
});

// Genre filter buttons
document.querySelectorAll('.genre-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const genre = btn.dataset.genre;
        filterByGenre(genre);
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
    } else if (e.code === 'ArrowLeft') {
        previousTrack();
    } else if (e.code === 'ArrowRight') {
        nextTrack();
    }
});

// Initialize
loadMusicData();
