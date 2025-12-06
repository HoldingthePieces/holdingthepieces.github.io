// ==UserScript==
// @name         Suno to Holding the Pieces
// @namespace    https://holdingthepieces.github.io
// @version      1.0.1
// @description  Add Suno songs directly to your GitHub Pages music site
// @author       Holding the Pieces
// @match        https://suno.com/s/*
// @match        https://suno.com/song/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    // Get your GitHub token here: https://github.com/settings/tokens
    // Required scopes: repo, workflow
    const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN_HERE'; // ⚠️ REPLACE THIS
    const GITHUB_REPO = 'HoldingthePieces/holdingthepieces.github.io';
    // =========================

    // Genre mapping from Suno tags to your site's genres
    const GENRE_MAP = {
        'emo': 'Emo Pop Rock',
        'pop rock': 'Emo Pop Rock',
        'hip hop': 'Hip Hop',
        'hip-hop': 'Hip Hop',
        'rap': 'Hip Hop',
        'drum and bass': 'Drum and Bass',
        'dnb': 'Drum and Bass',
        'edm': 'EDM',
        'electronic': 'EDM',
        'dance': 'EDM'
    };

    // Available albums
    const ALBUMS = [
        { id: 'poetic-pain', name: 'Poetic Pain' },
        // Add more albums here as you create them
    ];

    let songData = null;

    // Extract song data from the page
    function extractSongData() {
        try {
            // Try to find the JSON data in script tags
            const scripts = document.querySelectorAll('script[type="application/json"]');
            for (let script of scripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    // Look for song data in the JSON
                    if (data && data.props && data.props.pageProps) {
                        const clip = data.props.pageProps.clip;
                        if (clip) {
                            return extractFromClip(clip);
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            // Fallback: try meta tags
            return extractFromMeta();
        } catch (error) {
            console.error('Error extracting song data:', error);
            return null;
        }
    }

    function extractFromClip(clip) {
        // Suggest genre based on tags
        let suggestedGenre = 'Emo Pop Rock'; // default
        if (clip.metadata && clip.metadata.tags) {
            const tags = clip.metadata.tags.toLowerCase();
            for (let [key, value] of Object.entries(GENRE_MAP)) {
                if (tags.includes(key)) {
                    suggestedGenre = value;
                    break;
                }
            }
        }

        return {
            title: clip.title || clip.metadata?.prompt || 'Untitled',
            audioUrl: clip.audio_url,
            artworkUrl: clip.image_large_url || clip.image_url,
            duration: clip.metadata?.duration_seconds || 0,
            suggestedGenre: suggestedGenre,
            tags: clip.metadata?.tags || '',
            lyrics: clip.metadata?.prompt || clip.lyric || ''
        };
    }

    function extractFromMeta() {
        const title = document.querySelector('meta[property="og:title"]')?.content || 'Untitled';
        const audioUrl = document.querySelector('meta[property="og:audio"]')?.content;
        const artworkUrl = document.querySelector('meta[property="og:image"]')?.content;

        return {
            title: title,
            audioUrl: audioUrl,
            artworkUrl: artworkUrl,
            duration: 0, // Can't get from meta tags
            suggestedGenre: 'Emo Pop Rock',
            tags: '',
            lyrics: ''
        };
    }

    // Create and show the dialog
    function showAddSongDialog() {
        if (!songData) {
            alert('Could not extract song data from this page. Make sure you\'re on a Suno song page.');
            return;
        }

        if (!songData.audioUrl) {
            alert('Could not find audio URL. The song might still be processing.');
            return;
        }

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            min-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        dialog.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #1a1a2e;">Add to Holding the Pieces</h2>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Title:</label>
                <input type="text" id="song-title" value="${songData.title}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Genre:</label>
                <select id="song-genre" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="Emo Pop Rock" ${songData.suggestedGenre === 'Emo Pop Rock' ? 'selected' : ''}>Emo Pop Rock</option>
                    <option value="Hip Hop" ${songData.suggestedGenre === 'Hip Hop' ? 'selected' : ''}>Hip Hop</option>
                    <option value="Drum and Bass" ${songData.suggestedGenre === 'Drum and Bass' ? 'selected' : ''}>Drum & Bass</option>
                    <option value="EDM" ${songData.suggestedGenre === 'EDM' ? 'selected' : ''}>EDM</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Album (Optional):</label>
                <select id="song-album" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">Single (No Album)</option>
                    ${ALBUMS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select>
            </div>
            <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
                <strong>Duration:</strong> ${Math.floor(songData.duration / 60)}:${(songData.duration % 60).toString().padStart(2, '0')}<br>
                <strong>Tags:</strong> ${songData.tags || 'None'}
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="add-song-btn" style="flex: 1; padding: 12px; background: #e94560; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    Add to Site
                </button>
                <button id="cancel-btn" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    Cancel
                </button>
            </div>
            <div id="status-message" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none;"></div>
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        // Event listeners
        dialog.querySelector('#cancel-btn').onclick = () => {
            overlay.remove();
            dialog.remove();
        };

        dialog.querySelector('#add-song-btn').onclick = async () => {
            const title = dialog.querySelector('#song-title').value;
            const genre = dialog.querySelector('#song-genre').value;
            const album = dialog.querySelector('#song-album').value;
            const statusEl = dialog.querySelector('#status-message');

            if (!title.trim()) {
                alert('Please enter a song title');
                return;
            }

            // Show loading
            statusEl.style.display = 'block';
            statusEl.style.background = '#fff3cd';
            statusEl.style.color = '#856404';
            statusEl.textContent = 'Adding song to your site...';

            try {
                await triggerGitHubWorkflow(title, genre, album);
                statusEl.style.background = '#d4edda';
                statusEl.style.color = '#155724';
                statusEl.textContent = '✅ Song added! Check your GitHub Actions for progress.';

                setTimeout(() => {
                    overlay.remove();
                    dialog.remove();
                }, 3000);
            } catch (error) {
                statusEl.style.background = '#f8d7da';
                statusEl.style.color = '#721c24';
                statusEl.textContent = '❌ Error: ' + error.message;
            }
        };

        overlay.onclick = () => {
            overlay.remove();
            dialog.remove();
        };
    }

    // Trigger the GitHub Actions workflow
    async function triggerGitHubWorkflow(title, genre, album) {
        if (GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
            throw new Error('Please configure your GitHub token in the userscript');
        }

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/add-song.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: {
                    title: title,
                    audio_url: songData.audioUrl,
                    artwork_url: songData.artworkUrl,
                    duration: songData.duration.toString(),
                    genre: genre,
                    album: album,
                    lyrics: songData.lyrics || ''
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to trigger workflow');
        }
    }

    // Add the button to the page
    function addButton() {
        // Wait for page to be ready
        const checkInterval = setInterval(() => {
            // Look for a good place to add the button
            const targetArea = document.querySelector('[class*="SongPage"]') ||
                             document.querySelector('main') ||
                             document.body;

            if (targetArea) {
                clearInterval(checkInterval);

                // Extract song data
                songData = extractSongData();

                // Create button
                const button = document.createElement('button');
                button.textContent = '+ Add to Holding the Pieces';
                button.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 15px 25px;
                    background: linear-gradient(45deg, #e94560, #ff5f7a);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
                    z-index: 9998;
                    transition: transform 0.2s, box-shadow 0.2s;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                `;

                button.onmouseover = () => {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 6px 20px rgba(233, 69, 96, 0.6)';
                };

                button.onmouseout = () => {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = '0 4px 15px rgba(233, 69, 96, 0.4)';
                };

                button.onclick = showAddSongDialog;

                document.body.appendChild(button);
            }
        }, 500);

        // Stop trying after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButton);
    } else {
        addButton();
    }
})();
