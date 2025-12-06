# Music Player v1.0.0

A modern, responsive web-based music player for showcasing your original music on GitHub Pages.

## Features

- Play music directly in the browser with HTML5 audio
- Filter tracks by Genre or Album
- Modern dark-themed UI
- Responsive design (works on desktop, tablet, and mobile)
- Album artwork display
- Track progress bar and playback controls
- Volume control
- Keyboard shortcuts (Space to play/pause, Arrow keys for prev/next)

## How to Add Your Music

### Step 1: Add Audio Files

1. Place your music files in the appropriate genre folder:
   - `music/emo-pop-rock/` - For Emo Pop Rock tracks
   - `music/hip-hop/` - For Hip Hop tracks
   - `music/drum-and-bass/` - For Drum & Bass tracks
   - `music/edm/` - For EDM tracks

2. Supported formats: MP3, WAV, OGG (MP3 recommended for best compatibility)

### Step 2: Add Album Artwork

1. Add album covers to `artwork/albums/`
2. Add individual track artwork to `artwork/singles/`
3. Recommended size: 500x500px or larger (square format)
4. Supported formats: JPG, PNG, WebP

### Step 3: Update music.json

Edit the `data/music.json` file:

#### Update Artist Name
```json
"artist": "Your Artist Name"
```

#### Add Albums
```json
"albums": [
  {
    "id": "my-album-1",
    "title": "My First Album",
    "genre": "Emo Pop Rock",
    "year": "2024",
    "artwork": "artwork/albums/my-album-cover.jpg"
  }
]
```

#### Add Tracks
```json
"tracks": [
  {
    "id": 1,
    "title": "My Song Title",
    "album": "my-album-1",
    "genre": "Emo Pop Rock",
    "file": "music/emo-pop-rock/my-song.mp3",
    "artwork": "artwork/singles/my-song-cover.jpg",
    "duration": "3:45"
  }
]
```

**Note**: If a track is not part of an album, set `"album": null`

### Available Genres
- Emo Pop Rock
- Hip Hop
- Drum and Bass
- EDM

You can add more genres by editing the HTML in `index.html` (line 30-34).

## Deploying to GitHub Pages

1. Commit all your changes:
   ```bash
   git add .
   git commit -m "Add my music"
   git push
   ```

2. Enable GitHub Pages:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Under "Source", select "main" branch
   - Click "Save"

3. Your site will be available at: `https://holdingthepieces.github.io/`

## File Structure

```
.
├── index.html              # Main HTML file
├── styles.css              # Styles
├── player.js               # Player functionality
├── data/
│   └── music.json         # Music database (edit this!)
├── music/
│   ├── emo-pop-rock/      # Genre folders
│   ├── hip-hop/
│   ├── drum-and-bass/
│   └── edm/
└── artwork/
    ├── albums/            # Album covers
    └── singles/           # Single covers
```

## Tips

- Keep music files under 10MB for faster loading
- Use consistent artwork dimensions (square format)
- Test locally by opening `index.html` in your browser
- Use descriptive filenames (e.g., `song-title.mp3` instead of `track1.mp3`)

## Keyboard Shortcuts

- **Space**: Play/Pause
- **Arrow Left**: Previous track
- **Arrow Right**: Next track

## Browser Support

Works on all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

## License

Free to use for personal projects. Music created with Suno.com Pro.
