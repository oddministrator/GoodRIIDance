# Gamma Isotope Identifier (PWA)

## Overview
This Progressive Web App (PWA) is designed as both an educational physics tool and a functional laboratory utility. It allows users to calibrate a generic radiation rate meter using known sources, and subsequently identify unknown single gamma-emitting isotopes by applying the Beer-Lambert law of attenuation ($I = I_0 e^{-\mu x}$). 

By operating entirely client-side, the app ensures that sensitive measurement data remains private and that the utility functions flawlessly in completely offline environments—such as deep within a concrete facility or a basement laboratory where cellular service is unavailable.

## Architecture & Project Structure
This application is built as a lightweight Single Page Application (SPA) using standard web technologies (HTML, CSS, JavaScript). It avoids heavy frameworks in favor of native ES6 modules for modularity and performance.

## User Experience ##
1. This application has an inventory tab where the user can keep an equipment inventory, with user-defined names for each item, which includes:
1.a. A list of their radiation detection equipment they have. This includes the make and model of the meter, its serial number, and the same for their detectors (if separate). 
1.b. A list of their known radiation sources. This includes the isotope, the date at which its activity was last confirmed, and its activity at that date. 
1.c. A list of their known attenuators. Materials will be selected from a dropdown list, and the user will input the thickness of each attenuator they possess. 
2. The application has confirmation tab where the app prompts the user to select an item from 1.a. then asks them to select an item from 1.b. and place it at a certain distance from the detector. The user is then able to input the reading they get from the detector. The app then prompts the user to add attenuators from 1.c. one by one and input the reading they get from the detector after each addition. 
3. The application has an identification tab where the app prompts the user to select an item from 1.a. then asks them to place their detector at a distance from an unknown source such that the meter reads a value within the range their meter is known to measure from part 2. The user is then prompted to add attenuators from 1.c. one by one and input the reading they get from the detector after each addition. The application then provides a list of possible isotopes that could be the unknown source, ranked by confidence. 

## File Structure ##
gamma-detector-app/
├── index.html          (The skeleton)
├── css/
│   └── styles.css      (The skin)
├── js/
│   ├── app.js          (The main controller)
│   ├── physics.js      (The math and logic)
│   └── ui.js           (The interface handler)
├── data/
│   └── isotopes.json   (Your attenuation database)
├── assets/
│   └── icon-512.png    (The app icon)
├── manifest.json       (PWA configuration file)
└── sw.js               (Service Worker for offline mode)

### Root Directory
* **`index.html`**
  This is the single entry point for the application.

* **`manifest.json`**
  The web app manifest transforms the website into an installable application. It tells the mobile device or desktop browser the app's formal name, preferred display mode (e.g., `standalone` to hide the URL bar), background colors, and the path to the app's icons.

* **`sw.js`**
  This script runs in the background, separate from the main web page. On the initial load, it intercepts network requests and caches all necessary assets (HTML, CSS, JS, and JSON data). On subsequent visits, it serves the app directly from the local device cache, enabling absolute offline functionality.

### `/css/` Directory
* **`styles.css`**
  Contains all styling rules for the application. Utilizing CSS Flexbox and Grid, this file ensures the UI is responsive. The design is mobile-first, optimizing tap targets and input fields for users holding a phone in one hand while manipulating lead attenuators and rate meters with the other.

### `/js/` Directory
The application logic is broken down into ES6 modules to separate concerns and maintain clean code.

* **`app.js`**
  The core orchestrator. This script is loaded by `index.html` and is responsible for bootstrapping the application. It initializes the Service Worker, fetches the `isotopes.json` database on startup, and wires together the UI event listeners with the core physics logic.

* **`physics.js`**
  The computational engine. This module has no knowledge of the user interface. It exports pure functions designed to process the raw measurement data. Responsibilities include:
  * Applying the Beer-Lambert calculations to determine experimental linear attenuation coefficients ($\mu$).
  * Processing statistical variance and background subtraction.
  * Running the sorting algorithm that compares user-derived attenuation curves against the known values to output a confidence-ranked list of suspected isotopes.

* **`ui.js`**
  The DOM (Document Object Model) manipulation module. It intercepts user inputs from the HTML form fields, passes those values to `app.js` or `physics.js` for processing, and dynamically updates the screen with calculated results, error messages, or the final confidence rankings.

### `/data/` Directory
* **`isotopes.json`**
  A structured, read-only data store containing the reference values for the physics calculations. It stores objects representing known isotopes, their specific gamma energies (in keV or MeV), and a nested dictionary of their theoretical linear attenuation coefficients ($\mu$) across various materials (e.g., Lead, Aluminum, Copper, Water).

### `/assets/` Directory
* **`icon-512.png`**
  A high-resolution icon used by the device operating system when the user adds the application to their home screen or desktop. The `manifest.json` references this file to brand the installed PWA.

## Getting Started for Development
Because the application fetches local files (like `isotopes.json` and ES6 module imports), it cannot simply be opened via `file://` protocol in a browser due to CORS security restrictions. 

To run this locally in your development environment:
1. Navigate to the project root directory in your terminal.
2. Spin up a lightweight local server (e.g., `python3 -m http.server 8000`).
3. Open `http://localhost:8000` in your web browser.
