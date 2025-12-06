// ==UserScript==
// @name         Suno to Holding the Pieces
// @namespace    https://holdingthepieces.github.io
// @version      1.7.0
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

    // Scrape lyrics from visible page DOM
    function scrapeLyricsFromPage() {
        console.log('Attempting to scrape lyrics from page...');

        // Try to find lyrics in various possible containers
        const selectors = [
            // Specific Suno lyrics selector (found via inspect element)
            '.font-sans.text-foreground-primary > p',
            'div.font-sans.text-foreground-primary p',
            // Generic fallbacks
            '[class*="lyrics"]',
            '[class*="Lyrics"]',
            '[data-testid*="lyrics"]',
            '[class*="prompt"]',
            '[class*="Prompt"]',
            'pre',
            '[class*="description"]',
            '[class*="Description"]',
            'textarea',
            '[role="textbox"]',
            '[contenteditable="true"]'
        ];

        for (let selector of selectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Checking selector: ${selector}, found ${elements.length} elements`);

            for (let elem of elements) {
                const text = (elem.innerText || elem.textContent || '').trim();
                // Lyrics are usually at least 50 chars
                if (text.length > 50) {
                    console.log('✓ Found lyrics in selector:', selector);
                    console.log('✓ Lyrics preview:', text.substring(0, 100) + '...');
                    console.log('✓ Full lyrics length:', text.length);
                    return text;
                }
            }
        }

        console.log('✗ No lyrics found on page');
        return '';
    }

    // Scrape duration from audio player
    function scrapeDurationFromPage() {
        // Try to find the audio element
        const audio = document.querySelector('audio');
        if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
            console.log('✓ Found duration from audio element:', audio.duration);
            return audio.duration;
        }

        // Try to find duration displayed in UI - look for patterns like "0:03 / 2:45"
        const timeSelectors = ['[class*="duration"]', '[class*="time"]', 'time', 'span', 'div'];
        for (let selector of timeSelectors) {
            const elements = document.querySelectorAll(selector);
            for (let elem of elements) {
                const text = (elem.textContent || elem.innerText || '').trim();
                if (!text) continue; // Skip empty elements

                // Look for pattern like "0:03 / 2:45" (current / total)
                const totalMatch = text.match(/\/\s*(\d+):(\d+)/);
                if (totalMatch) {
                    const minutes = parseInt(totalMatch[1]);
                    const seconds = parseInt(totalMatch[2]);
                    const totalSeconds = minutes * 60 + seconds;
                    console.log('✓ Found total duration from UI:', totalSeconds, 'seconds', '(from:', text + ')');
                    return totalSeconds;
                }
            }
        }

        // Fallback: try to find any time pattern, but prefer longer durations
        for (let selector of timeSelectors) {
            const elements = document.querySelectorAll(selector);
            for (let elem of elements) {
                const text = (elem.textContent || elem.innerText || '').trim();
                if (!text) continue;

                // Match patterns like "2:30" or "02:30" (but only if > 30 seconds to avoid current time)
                const match = text.match(/(\d+):(\d+)/);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const totalSeconds = minutes * 60 + seconds;

                    // Only accept if it's more than 30 seconds (avoid current playback time)
                    if (totalSeconds > 30) {
                        console.log('✓ Found duration from UI:', totalSeconds, 'seconds');
                        return totalSeconds;
                    }
                }
            }
        }

        console.log('✗ Could not find duration');
        return 0;
    }

    // Scrape tags/genre from page
    function scrapeTagsFromPage() {
        console.log('Attempting to scrape tags from page...');

        // First try the most specific selector and take the first element (which is the tags/description)
        const specificSelector = 'div.my-2 > div.gap-2';
        const specificElements = document.querySelectorAll(specificSelector);

        if (specificElements.length > 0) {
            const text = (specificElements[0].innerText || specificElements[0].textContent || '').trim();
            console.log('Found element with specific selector:', text.substring(0, 100));

            // Check if it's not the "Show Summary" button
            if (text && !text.includes('Show Summary') && text.length > 5) {
                console.log('✓ Found tags in selector:', specificSelector);
                console.log('✓ Tags text:', text);
                return text;
            }
        }

        // Fallback to generic selectors
        const tagSelectors = [
            '.my-2 .text-foreground-secondary',
            'div.my-2 div[class*="text-foreground"]',
            '.gap-2.font-sans',
            '[class*="tag"]',
            '[class*="Tag"]',
            '[class*="genre"]',
            '[class*="Genre"]',
            '[class*="style"]',
            '[class*="Style"]'
        ];

        for (let selector of tagSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Checking selector: ${selector}, found ${elements.length} elements`);

            for (let i = 0; i < elements.length; i++) {
                const elem = elements[i];
                const text = (elem.innerText || elem.textContent || '').trim();
                console.log(`  Element ${i}: "${text.substring(0, 50)}..."`);

                // Tags/description, exclude Show Summary button
                if (text && !text.includes('Show Summary') && text.length > 5 && !text.includes('\n\n')) {
                    console.log('✓ Found tags in selector:', selector);
                    console.log('✓ Tags text:', text);
                    return text;
                }
            }
        }

        console.log('✗ No tags found');
        return '';
    }

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
                            const result = extractFromClip(clip);
                            // Fallback to page scraping if data missing
                            if (!result.lyrics) {
                                result.lyrics = scrapeLyricsFromPage();
                            }
                            if (!result.duration || result.duration === 0) {
                                result.duration = scrapeDurationFromPage();
                            }
                            if (!result.tags) {
                                result.tags = scrapeTagsFromPage();
                            }
                            return result;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            // Fallback: try meta tags and scrape everything from page
            const result = extractFromMeta();
            result.lyrics = scrapeLyricsFromPage();
            result.duration = scrapeDurationFromPage();
            result.tags = scrapeTagsFromPage();
            return result;
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

        // Try multiple possible locations for lyrics
        let lyrics = clip.metadata?.gpt_description_prompt ||
                     clip.metadata?.prompt ||
                     clip.lyrics ||
                     clip.lyric ||
                     clip.metadata?.lyrics ||
                     '';

        // Debug: log the clip object to console to see what's available
        console.log('Suno Clip Data:', clip);
        console.log('Extracted Lyrics:', lyrics);

        return {
            title: clip.title || clip.metadata?.prompt || 'Untitled',
            audioUrl: clip.audio_url,
            artworkUrl: clip.image_large_url || clip.image_url,
            duration: clip.metadata?.duration_seconds || 0,
            suggestedGenre: suggestedGenre,
            tags: clip.metadata?.tags || '',
            lyrics: lyrics
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
            console.error('Song data extraction failed');
            alert('Could not extract song data from this page.\n\nPlease:\n1. Make sure you\'re on a Suno song page\n2. Wait for the page to fully load\n3. Check the browser console for errors\n4. Try refreshing the page');
            return;
        }

        if (!songData.audioUrl) {
            console.error('No audio URL found in song data:', songData);
            alert('Could not find audio URL. The song might still be processing or the page hasn\'t fully loaded yet. Try waiting a moment and clicking again.');
            return;
        }

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1a1a2e;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
            z-index: 10000;
            min-width: 400px;
            max-width: 500px;
            border: 1px solid #2a2a3e;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        dialog.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #eee; background: linear-gradient(45deg, #e94560, #ff5f7a); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Add to Holding the Pieces</h2>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #eee; font-size: 14px;">Title:</label>
                <input type="text" id="song-title" value="${songData.title}" style="width: 100%; padding: 12px; border: 2px solid #2a2a3e; border-radius: 6px; box-sizing: border-box; background: #16213e; color: #eee; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #eee; font-size: 14px;">Genre:</label>
                <select id="song-genre" style="width: 100%; padding: 12px; border: 2px solid #2a2a3e; border-radius: 6px; background: #16213e; color: #eee; font-size: 14px;">
                    <option value="Emo Pop Rock" ${songData.suggestedGenre === 'Emo Pop Rock' ? 'selected' : ''}>Emo Pop Rock</option>
                    <option value="Hip Hop" ${songData.suggestedGenre === 'Hip Hop' ? 'selected' : ''}>Hip Hop</option>
                    <option value="Drum and Bass" ${songData.suggestedGenre === 'Drum and Bass' ? 'selected' : ''}>Drum & Bass</option>
                    <option value="EDM" ${songData.suggestedGenre === 'EDM' ? 'selected' : ''}>EDM</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #eee; font-size: 14px;">Album (Optional):</label>
                <select id="song-album" style="width: 100%; padding: 12px; border: 2px solid #2a2a3e; border-radius: 6px; background: #16213e; color: #eee; font-size: 14px;">
                    <option value="">Single (No Album)</option>
                    ${ALBUMS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select>
            </div>
            <div style="margin-bottom: 20px; padding: 15px; background: #16213e; border-radius: 6px; font-size: 13px; color: #aaa; border: 1px solid #2a2a3e;">
                <strong style="color: #eee;">Duration:</strong> ${Math.floor(songData.duration / 60)}:${(songData.duration % 60).toString().padStart(2, '0')}<br>
                <strong style="color: #eee;">Tags:</strong> ${songData.tags || 'None'}<br>
                <strong style="color: #eee;">Has Lyrics:</strong> ${songData.lyrics ? 'Yes' : 'No'}
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="add-song-btn" style="flex: 1; padding: 14px; background: linear-gradient(45deg, #e94560, #ff5f7a); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: transform 0.2s;">
                    Add to Site
                </button>
                <button id="cancel-btn" style="flex: 1; padding: 14px; background: #2a2a3e; color: #eee; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: transform 0.2s;">
                    Cancel
                </button>
            </div>
            <div id="status-message" style="margin-top: 15px; padding: 12px; border-radius: 6px; display: none; font-size: 13px;"></div>
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

        // Add hover effects
        const addBtn = dialog.querySelector('#add-song-btn');
        const cancelBtn = dialog.querySelector('#cancel-btn');

        addBtn.onmouseover = () => addBtn.style.transform = 'scale(1.02)';
        addBtn.onmouseout = () => addBtn.style.transform = 'scale(1)';
        cancelBtn.onmouseover = () => cancelBtn.style.transform = 'scale(1.02)';
        cancelBtn.onmouseout = () => cancelBtn.style.transform = 'scale(1)';

        // Event listeners
        cancelBtn.onclick = () => {
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
        // Wait for page to be ready - give it a bit more time
        setTimeout(() => {
            const checkInterval = setInterval(() => {
                // Look for a good place to add the button
                const targetArea = document.querySelector('[class*="SongPage"]') ||
                                 document.querySelector('main') ||
                                 document.body;

            if (targetArea) {
                clearInterval(checkInterval);

                // Create button
                const button = document.createElement('button');
                button.textContent = '+HTP';
                button.title = 'Add to Holding the Pieces'; // Tooltip on hover
                button.style.cssText = `
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    padding: 10px 16px;
                    background: linear-gradient(45deg, #e94560, #ff5f7a);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 13px;
                    box-shadow: 0 2px 8px rgba(233, 69, 96, 0.3);
                    z-index: 9998;
                    transition: all 0.2s;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                `;

                button.onmouseover = () => {
                    button.style.transform = 'scale(1.05)';
                    button.style.boxShadow = '0 4px 12px rgba(233, 69, 96, 0.5)';
                };

                button.onmouseout = () => {
                    button.style.transform = 'scale(1)';
                    button.style.boxShadow = '0 2px 8px rgba(233, 69, 96, 0.3)';
                };

                button.onclick = () => {
                    // Extract song data when button is clicked (not when page loads)
                    songData = extractSongData();
                    console.log('Extracted song data:', songData);
                    showAddSongDialog();
                };

                document.body.appendChild(button);
            }
            }, 500);

            // Stop trying after 10 seconds
            setTimeout(() => clearInterval(checkInterval), 10000);
        }, 1000); // Wait 1 second before starting to check for button placement
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButton);
    } else {
        addButton();
    }
})();
