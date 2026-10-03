# Optional assets for the final cafe

The working draft needs no additional assets. Its original SVGs can stay until the frontend partner has final artwork.

If you want photographic drinks or ambient backgrounds, provide:

| Asset | Exact request | Suggested filename |
| --- | --- | --- |
| Drink and snack cutouts | One Cafe Latte, Matcha, Hot Chocolate and Butter Cookie; transparent PNG or WebP; at least 1024 × 1024; consistent angle and lighting; whole item visible | cafe-latte.png, matcha.png, hot-chocolate.png, butter-cookie.png |
| Five room scenes | Window Seat, Quiet Corner, Library Table, Garden Patio and Midnight Cafe; 1600 × 1000 or larger; consistent illustration or photography style; no text embedded in the image | window-seat.webp, quiet-corner.webp, library-table.webp, garden-patio.webp, midnight-cafe.webp |
| Optional ambient videos | One per space; 10–20 second seamless loop; 1920 × 1080 MP4; muted; steady camera; quiet movement; accompanying still image for reduced motion and mobile | same space filenames with .mp4 extension |
| Optional storefront | An original Cafe Tempo entrance illustration; at least 1600 px wide; no reference-site characters or branding | cafe-front.webp |

Use your own work or assets you have permission to use. No video or audio is required to test the project.

Place final files in public/assets/. Update src/assets.ts for the entrance, and swap the presentation in SpaceIllustration.tsx or MenuArtwork.tsx for room/item files. Keep room and item names matched to server data. Add a fallback for unknown menu items.

Music controls are implemented and await your file. Place your MP3 at `public/assets/cozy-cafe.mp3` and set `music` to `/assets/cozy-cafe.mp3` in `src/assets.ts`. OGG or WAV also works; match the filename and extension. See [STUDY_FLOW.md](STUDY_FLOW.md).
