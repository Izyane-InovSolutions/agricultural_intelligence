# AgID – Agricultural Intelligence Dashboard (prototype)

Frontend-only demo for the Ministry of Agriculture, Zambia, built with React, Vite, Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com/).
All figures are synthetic. There is no backend: role selection, sync runs, data-sharing agreement changes and brief approvals are saved in the browser's `localStorage` (key `agid-demo:v1`). Use the reset button in the header to clear them.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build into dist/
```

## Layout

- `src/data/demo.ts` – provinces, agency sources, indicator dictionary, roles
- `src/lib/store.tsx` – app state persisted to localStorage
- `src/views/` – Overview, Data sources, Indicator dictionary, Briefings, Benefits
- `src/components/ui/` – shadcn/ui components
- `src/index.css` – theme tokens (green primary, white secondary, orange accent)

## Demo script

1. As **Permanent Secretary**, review the overview, map and alerts.
2. Switch to **Planning and M&E, HQ** → Data sources → *Run sync now*; change an agreement status.
3. Briefings → *Mark as checked*, then switch back to **Permanent Secretary** → *Approve brief*.
4. Switch to **Provincial Agriculture Coordinator** to see the scoped, read-only view.
