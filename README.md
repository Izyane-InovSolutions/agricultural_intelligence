# AgID – Agricultural Intelligence Dashboard (prototype)

Frontend-only demo for the Ministry of Agriculture, Zambia, built with React, Vite, Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com/).
All figures are synthetic. There is no backend: role selection, sync runs, data-sharing agreement changes and brief approvals are saved in the browser's `localStorage` (key `agid-demo:v1`). Use the reset button in the header to clear them.

It installs as an app and keeps working offline after the first visit (service worker via `vite-plugin-pwa`). Each page and the trend charts download only when opened.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build into dist/
```

## Layout

- `src/data/demo.ts` – provinces, agency sources, indicator dictionary, roles
- `src/data/trends.ts`, `src/data/held.ts` – synthetic monthly history and held-record samples
- `src/data/zambia-map.ts` – province outlines (generated, see Credits)
- `src/components/` – KPI detail panel, province map, alerts, guided tour
- `src/lib/store.tsx` – app state persisted to localStorage
- `src/views/` – Overview, Data sources, Indicator dictionary, Briefings, Benefits
- `src/components/ui/` – shadcn/ui components
- `src/index.css` – theme tokens (green primary, white secondary, orange accent)

## Demo script

The **Tour** button in the header walks through this; it also starts automatically on a first visit.

1. As **Permanent Secretary**, review the overview. Open a figure for its trend and breakdown; select a province; acknowledge or assign an alert.
2. Switch to **Planning and M&E, HQ** → Data sources → *Run sync now*; open "records held"; change an agreement status.
3. Briefings → edit the key messages → *Mark as checked*.
4. Switch to **Permanent Secretary** → *Approve brief* or *Send back* with a comment. Export with *Print or save PDF* or *Word*.
5. Switch to **Provincial Agriculture Coordinator** to see the scoped, read-only view.

## Credits

Province boundaries: [geoBoundaries](https://www.geoboundaries.org) ZMB ADM1, source Zambia Data Hub, licensed CC BY 4.0. Simplified and projected into `src/data/zambia-map.ts`.
