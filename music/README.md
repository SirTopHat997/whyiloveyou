# music/

Drop your MP3 files into this folder, then register them in `script.js`.

## How to add songs

1. Copy your `.mp3` files here (e.g. `music/perfect.mp3`)
2. Open `script.js` and find the `SONGS` array near the top
3. Add an entry for each song:

```js
const SONGS = [
  { title: "Perfect",          src: "music/perfect.mp3"       },
  { title: "All of Me",        src: "music/all-of-me.mp3"     },
  { title: "A Thousand Years", src: "music/thousand-years.mp3" },
];
```

That's it. The player will pick a random song when turned on, auto-advance when a song ends, and never play the same song twice in a row (unless there's only one).

## Notes

- MP3 format works everywhere. AAC (.m4a) also works in most browsers.
- Keep file names lowercase with hyphens (no spaces) to avoid URL issues.
- Volume is set to `0.12` by default — soft background level. Change `MUSIC_VOLUME` in `script.js` to adjust.
- Large audio files may slow the initial page load on slow connections. Consider using 128kbps MP3s.
