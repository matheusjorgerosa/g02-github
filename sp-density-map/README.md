# São Paulo Density Map

A 3D visualization of population flow in São Paulo using Deck.gl and React.

## Features
- **3D Hexagon Binning:** Aggregates data points into hexagonal bins.
- **Height & Color:** Represents the volume of people (`uniques` count) in each area.
- **Interactive:** Pan, zoom, and tilt (Ctrl + Drag) to explore the 3D data.
- **Tooltip:** Hover over a bar to see the exact count.

## Data
The visualization uses `public/data.csv`, which should contain:
- `latitude`
- `longitude`
- `uniques` (count of people)

## How to Run

1.  Install dependencies (if not already done):
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

3.  Open your browser at the URL provided (usually `http://localhost:5173`).
