# GoodRIIDance (Progressive Web App)

## Overview
GoodRIIDance is a "Radiation Absorption Spectroscopy Calculator", designed as both an educational physics tool and a functional laboratory utility. It allows users to calibrate generic radiation rate meters using known sources, and subsequently identify unknown gamma-emitting isotopes by applying the Beer-Lambert law of attenuation along with detector-specific Energy Response curves.

By operating entirely client-side, the app ensures that sensitive measurement data (stored safely in `localStorage`) remains private and that the utility functions flawlessly in completely offline environments—such as deep within a concrete facility or a basement laboratory where cellular service is unavailable.

## User Experience Workflow
1. **Inventory Management**: 
   - **Detectors**: Register equipment and assign specific calibration isotopes.
   - **Known Sources**: Log known gamma sources, tracking their original activity and calculating present-day real-time activity using built-in half-life mathematical decay.
   - **Attenuators**: Select standard materials (Lead, Aluminum, Copper, Water) with specific thicknesses.
   - **Unknown Sources**: Create tags for mystery objects to be analyzed.
2. **Measurement Setup**: Record unattenuated background and source activity readings for specific Detector-and-Source pairings, followed by varying iterations of shielded readings behind specific attenuator thicknesses. 
3. **Transmission & Response**: The application utilizes a stochastic optimization algorithm (simulated annealing) to compute a dynamic efficiency response curve unique to *each individual detector* based on the entered data. Theoretical transmission tables are dynamically generated and compared against measured empirical transmission factors. 
4. **Identification Engine (RIIDance)**: Evaluates user-provided measurements of an `Unknown Source` across multiple detectors applying the known theoretical transmission limits of every isotope in the database. Results are sorted mathematically using a Joint Mean Squared Error (JMSE) statistical analysis, yielding the highest-confidence isotope prediction.

## File Structure & Architecture
To minimize load times and remove unnecessary complexity, GoodRIIDance is built as a lightweight, flat-architecture Single Page Application (SPA). All primary application features are cleanly housed directly in the root directory:

```text
/
├── index.html                      (The dashboard structure, tabs, and layout)
├── styles.css                      (Navy-blue branding, responsive media grids, tooltip overlays)
├── app.js                          (Monolithic controller: UI, Physics logic)
├── isotope_information.json        (Consolidated physics db: t_1/2, photons, Attenuation)
├── manifest.json                   (PWA installation configuration and theme bindings)
└── sw.js                           (Service Worker handling offline asset caching)
```

### File Breakdown
* **`index.html`**
  The solitary document structure for the dashboard. It features functional tabs matching the User Workflow, completely responsive twin-panel grids that collapse smoothly under 1000px for mobile interfaces, and an interactive `(?)` tooltip educational overlay tracking system.
  
* **`styles.css`**
  Contains all styling variables dictating the modern, dark-mode sleek visual aesthetics. It handles cross-browser form modifications and cleanly stacks structural CSS grids specifically designed for responsive one-handed use environments.

* **`app.js`**
  The "brain" of the operation. It autonomously handles:
  - Reading/Writing to browser `localStorage` ensuring multi-session persistence.
  - Mathematical computation of isotopic decay strings.
  - The computationally intensive simulated annealing optimization mapping logic (`evalLoss`).
  - Rendering DOM manipulations synchronously based on nested user interactions.
  - Building and binding interactive arrays via `Plotly`.

* **`isotope_information.json`**
  A dense, compiled reference matrix merging elemental properties with evaluated X-Ray energy intensities (above 30 keV) and their precise linear attenuation mass coefficients mapped for Lead, Water, Copper, and Aluminum filtering models.

* **`manifest.json` & `sw.js`**
  The backbone of the Progressive Web App environment. `manifest.json` overrides standard browser view port framing to run the calculator in `standalone` mode (simulating a native application). `sw.js` forcefully intercepts and caches all local assets + external Plotly dependencies, enabling absolute functionality offline without any internet connection.

## Getting Started
Because the application fetches local files (like the large JSON matrix) via XHR, it cannot simply be run via `file://` protocol directly from disk due to CORS security restrictions. 
