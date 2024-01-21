# Stash Stuffs

**Stuffs I made for Stash app**

### Installation

Go to [Settings => Plugins => Available Plugins](http://localhost:9999/settings?tab=plugins) and click `Add Source`, And fill the popup with these values:

1. Name: `Tetrax Repo`
2. Source URL: `https://tetrax-10.github.io/stash-stuffs/release/index.yml`
3. Local Path: `tetrax-repo`

<img src="./assets/installation/add-repo.png" style="width: 400px; height: auto;">

## Plugins

### 1. Auto Update Plugins and Scrapers

Automatically updates Plugins and Scrappers on website (localhost:9999) startup.

_**Note:** Updating plugins and scrapers will also replaces its config files with the newer version which means your settings for that plugin or scraper will be gone if you have configured any of it (eg: API keys). **Its not my fault its how Stash plugin manager updates its plugins and scrapers**. If you don't want to loose your settings then you can use my [Auto Select Updatable Plugins](https://github.com/Tetrax-10/stash-stuffs?tab=readme-ov-file#2-auto-select-updatable-plugins-and-scrapers)._

### 2. Auto Select Updatable Plugins and Scrapers

Auto selects updatable Plugins and Scrapers on Check for Updates

![demo](./assets/AutoSelectUpdatablePlugins/demo.gif)

### 3. Replace Thumbnails With High-Res Images

Replaces thumbnails with original high res images across entire webpage.

You can see the difference in sharpness, details and colors.

<table>
  <tr align="center">
    <td>Default Thumbnail</td>
     <td>Replaced Image by the plugin</td>
  </tr>
  <tr>
    <td><img src="./assets/replace-thumbnails-with-images/thumbnail.jpeg" style="width: 427px; height: auto;"></td>
    <td><img src="./assets/replace-thumbnails-with-images/original.jpg" style="width: 427px; height: auto;"></td>
  </tr>
  <tr>
    <td><img src="./assets/replace-thumbnails-with-images/closeup/thumbnail.jpeg" style="width: 427px; height: auto;"></td>
    <td><img src="./assets/replace-thumbnails-with-images/closeup/original.jpg" style="width: 427px; height: auto;"></td>
  </tr>
</table>

### 4. Play videos instead of previews

Play videos instead of previews when hovered over scene cards. This works on mobile too.

![demo](./assets/play-videos-instead-of-previews/demo.gif)

</br>

## Themes

### 1. Plex Better Styles

A modified version of [Stash-Plex theme](https://docs.stashapp.cc/user-interface-ui/themes/plex/) which was originally developed by [Fidelio](https://github.com/f1delio).

**Modifications**:

1. Better **image**, **gallery** cards (flexible according to different aspect ratio)
2. Fixed UI bugs (toolbar, settings, etc...)
3. Uniform Colors (tags, links, settings cards, etc...)

### Galleries

![galleries](./assets/plex-better-styles/galleries.png)

### Performers

![performers](./assets/plex-better-styles/performers.png)

### Images

![images](./assets/plex-better-styles/images.png)

### Scenes

![scenes](./assets/plex-better-styles/scenes.png)

### Settings

![settings](./assets/plex-better-styles/settings.png)

### Help

![help](./assets/plex-better-styles/help.png)

### Tags

![tags](./assets/plex-better-styles/tags.png)
