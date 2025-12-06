# Suno to Holding the Pieces - Setup Guide

This userscript allows you to add songs from Suno.com directly to your GitHub Pages music site with one click!

## Setup Instructions

### Step 1: Create a GitHub Personal Access Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Suno to Holding the Pieces`
4. Set expiration: Choose **"No expiration"** or your preferred timeframe
5. Select these scopes:
   - ✅ **repo** (Full control of private repositories)
   - ✅ **workflow** (Update GitHub Action workflows)
6. Click **"Generate token"** at the bottom
7. **IMPORTANT:** Copy the token immediately (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Install the Userscript

#### On macOS (Safari):
1. Make sure you have **Userscripts** extension installed from App Store
2. Open the file: `userscripts/suno-to-github.user.js`
3. Find this line (near the top):
   ```javascript
   const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
   ```
4. Replace `YOUR_GITHUB_TOKEN_HERE` with your actual token:
   ```javascript
   const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
   ```
5. Save the file
6. In Safari, click the Userscripts extension icon
7. Click **"+"** to add a new script
8. Paste the entire contents of `suno-to-github.user.js`
9. Save it

#### On iPhone/iPad (Safari):
1. Open the Userscripts app
2. Tap **"+"** to create a new script
3. Copy the contents of `suno-to-github.user.js` from your Mac
4. Paste it into the Userscripts app
5. Edit the `GITHUB_TOKEN` line with your token
6. Save the script
7. Make sure it's enabled in Safari Settings → Userscripts

### Step 3: Use It!

1. Go to any Suno song page (e.g., https://suno.com/s/8w8btUD99wcr9xtO)
2. You'll see a button at the bottom right: **"+ Add to Holding the Pieces"**
3. Click it!
4. A dialog appears with:
   - Song title (editable)
   - Genre (auto-detected, but you can change it)
   - Album (optional - select if part of an album)
5. Click **"Add to Site"**
6. Done! The workflow will:
   - Download the audio file
   - Download the artwork
   - Add it to your music.json
   - Commit and push to GitHub
   - Your site updates automatically!

### Step 4: Monitor Progress

After clicking "Add to Site":
1. Go to your GitHub repo: https://github.com/holdingthepieces/holdingthepieces.github.io
2. Click the **"Actions"** tab
3. You'll see "Add Song from Suno" running
4. Wait 1-2 minutes for it to complete
5. Your site updates automatically!

## Troubleshooting

### "Please configure your GitHub token"
- You forgot to replace `YOUR_GITHUB_TOKEN_HERE` with your actual token

### "Failed to trigger workflow"
- Check that your token has the correct scopes (repo, workflow)
- Make sure the token hasn't expired

### "Could not extract song data"
- The song might still be processing on Suno
- Try refreshing the page and waiting a moment

### Button doesn't appear
- Refresh the Suno page
- Check that the userscript is enabled in Userscripts extension
- Make sure you're on a song page (suno.com/s/... or suno.com/song/...)

## Adding More Albums

When you create a new album, update the userscript:

1. Find this section in the script:
   ```javascript
   const ALBUMS = [
       { id: 'poetic-pain', name: 'Poetic Pain' },
       // Add more albums here
   ];
   ```

2. Add your new album:
   ```javascript
   const ALBUMS = [
       { id: 'poetic-pain', name: 'Poetic Pain' },
       { id: 'my-new-album', name: 'My New Album' },
   ];
   ```

3. Save and refresh the userscript

## Security Note

⚠️ **Keep your GitHub token private!** Don't share your userscript file with others if it contains your token.

If your token is ever compromised:
1. Go to https://github.com/settings/tokens
2. Delete the old token
3. Create a new one
4. Update the userscript with the new token
