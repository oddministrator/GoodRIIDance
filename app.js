document.addEventListener("DOMContentLoaded", () => {
    // --- UI Elements ---
    const handleInput = document.getElementById("handle-input");
    const loginBtn = document.getElementById("login-btn");
    const userDisplay = document.getElementById("current-user-display");
    
    const equipSelect = document.getElementById("equipment-select");
    const backgroundInput = document.getElementById("background-input");
    const newEquipInput = document.getElementById("new-equip-input");
    const equipCalibMassInput = document.getElementById("equip-calib-mass-input");
    const equipCalibIsotopeSelect = document.getElementById("equip-calib-isotope-select");
    const addEquipBtn = document.getElementById("add-equip-btn");

    const sourceSelect = document.getElementById("source-select");
    const distanceInput = document.getElementById("distance-input");
    const sourceMassInput = document.getElementById("source-mass-input");
    const sourceIsotopeSelect = document.getElementById("source-isotope-select");
    const sourceActivityInput = document.getElementById("source-activity-input");
    const sourceActivityUnit = document.getElementById("source-activity-unit");
    const sourceDatetimeInput = document.getElementById("source-datetime-input");
    const addSourceBtn = document.getElementById("add-source-btn");
    
    const unknownSourceInput = document.getElementById("unknown-source-input");
    const addUnknownSourceBtn = document.getElementById("add-unknown-source-btn");

    const attenuatorMaterialSelect = document.getElementById("attenuator-material-select");
    const attenuatorThicknessInput = document.getElementById("attenuator-thickness-input");
    const addAttenuatorBtn = document.getElementById("add-attenuator-btn");
    const attenuatorsCheckboxGroup = document.getElementById("attenuators-checkbox-group");

    const measurementInput = document.getElementById("measurement-input");
    const addMeasurementBtn = document.getElementById("add-measurement-btn");
    const measurementsTableBody = document.querySelector("#measurements-table tbody");
    const transmissionFactorsTableBody = document.querySelector("#transmission-factors-table tbody");
    const theoreticalTransmissionContainer = document.getElementById("theoretical-transmission-container");
    const resetMeasurementsBtn = document.getElementById("reset-measurements-btn");

    const tabInventory = document.getElementById("tab-inventory");
    const tabMeasurements = document.getElementById("tab-measurements");
    const tabResults = document.getElementById("tab-results");
    const tabPalette = document.getElementById("tab-palette");
    
    const panelInventory = document.getElementById("panel-inventory");
    const panelMeasurements = document.getElementById("panel-measurements");
    const panelResults = document.getElementById("panel-results");
    const panelRiidance = document.getElementById("panel-riidance");
    const panelPalette = document.getElementById("panel-palette");

    const tabRiidance = document.getElementById("tab-riidance");
    const riidanceUnknownSelect = document.getElementById("riidance-unknown-select");
    const riidanceTableBody = document.getElementById("riidance-table-body");

    const activeDetectorsUl = document.getElementById("inventory-detectors-ui");
    const activeSourcesUl = document.getElementById("inventory-sources-ui");
    const activeUnknownSourcesUl = document.getElementById("inventory-unknown-sources-ui");
    const activeAttenuatorsUl = document.getElementById("inventory-attenuators-ui");

    let isotopesData = [];
    let attenuatorMaterials = [];
    fetch("isotope_information.json").then(r => r.json()).then(d => { 
        isotopesData = d; 
        
        // Extract attenuator materials from first valid radiation entry
        const validIso = d.find(iso => iso.Radiations && iso.Radiations.some(rad => rad["Attenuation_cm-1"]));
        if (validIso) {
            const validRad = validIso.Radiations.find(rad => rad["Attenuation_cm-1"]);
            attenuatorMaterials = Object.keys(validRad["Attenuation_cm-1"]);
            
            attenuatorMaterialSelect.innerHTML = '<option value="">Select Material</option>';
            attenuatorMaterials.forEach(mat => {
                const opt = document.createElement("option");
                opt.value = mat;
                opt.textContent = mat;
                attenuatorMaterialSelect.appendChild(opt);
            });
        }
        
        // Re-render sources now that the Half-Life data is loaded into memory
        renderSourcesDropdown();
    }).catch(e => console.error("Error loading DB", e));

    // --- State Management ---
    // Load the master database of all handles. If empty, create a blank object.
    let userProfiles = JSON.parse(localStorage.getItem("goodriidanceProfiles")) || {};
    // Load the last person who used the site on this browser
    let currentHandle = localStorage.getItem("goodriidanceLastUser") || null;

    // --- Functions ---

    function saveToStorage() {
        localStorage.setItem("goodriidanceProfiles", JSON.stringify(userProfiles));
        localStorage.setItem("goodriidanceLastUser", currentHandle);
    }

    function renderEquipmentDropdown() {
        equipSelect.innerHTML = ""; // Clear current options
        const tbody = activeDetectorsUl.querySelector("tbody");
        if(tbody) tbody.innerHTML = "";
        
        if (!currentHandle) {
            equipSelect.innerHTML = '<option value="">-- Log in to see equipment --</option>';
            if(tbody) tbody.innerHTML = '<tr><td colspan="3" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Log in to view --</td></tr>';
            equipSelect.disabled = true;
            backgroundInput.disabled = true;
            newEquipInput.disabled = true;
            equipCalibMassInput.disabled = true;
            equipCalibIsotopeSelect.disabled = true;
            addEquipBtn.disabled = true;
            measurementInput.disabled = true;
            checkMeasurementBtn();
            return;
        }

        // Enable inputs
        equipSelect.disabled = false;
        backgroundInput.disabled = false;
        newEquipInput.disabled = false;
        equipCalibMassInput.disabled = false;
        equipCalibIsotopeSelect.disabled = true; // Enabled by A# input
        addEquipBtn.disabled = false;
        measurementInput.disabled = false;
        
        const userData = userProfiles[currentHandle];

        if (userData.equipment.length === 0) {
            equipSelect.innerHTML = '<option value="">-- No equipment saved yet --</option>';
            if(tbody) tbody.innerHTML = '<tr><td colspan="3" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- No detectors added --</td></tr>';
        } else {
            // Populate the dropdown with the user's saved equipment
            userData.equipment.forEach((equipItem, idx) => {
                const name = typeof equipItem === 'string' ? equipItem : equipItem.name;
                const calibRaw = typeof equipItem === 'string' ? '' : (equipItem.calib ? formatIsotopeStr(equipItem.calib) : '');
                
                const calibDrop = calibRaw ? `, Cal: ${calibRaw}` : '';
                const displayDropStr = `${name}${calibDrop}`;
                
                const option = document.createElement("option");
                option.value = idx.toString();
                option.textContent = displayDropStr;
                equipSelect.appendChild(option);

                if (tbody) {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                    
                    const tdName = document.createElement("td");
                    tdName.style.padding = "0.25rem 0";
                    tdName.textContent = name;
                    
                    const tdCal = document.createElement("td");
                    tdCal.style.padding = "0.25rem 0";
                    tdCal.textContent = calibRaw; // Safely writes unicode explicitly
                    
                    const tdDel = document.createElement("td");
                    tdDel.style.padding = "0.25rem 0";
                    tdDel.style.textAlign = "right";
                    
                    const delBtn = document.createElement("button");
                    delBtn.className = "delete-btn";
                    delBtn.textContent = "✖";
                    delBtn.onclick = () => {
                        userData.equipment.splice(idx, 1);
                        if (userData.activeEquipment === idx) userData.activeEquipment = null;
                        else if (userData.activeEquipment > idx) userData.activeEquipment--;
                        saveToStorage();
                        renderEquipmentDropdown();
                    };
                    
                    tdDel.appendChild(delBtn);
                    
                    tr.appendChild(tdName);
                    tr.appendChild(tdCal);
                    tr.appendChild(tdDel);
                    tbody.appendChild(tr);
                }
            });

            // Set the dropdown to their last selected item, if it exists
            if (userData.activeEquipment !== null && userData.activeEquipment !== undefined) {
                // If it's old string based active equipment
                if (typeof userData.activeEquipment === 'string') {
                    const foundIdx = userData.equipment.indexOf(userData.activeEquipment);
                    if (foundIdx > -1) {
                        userData.activeEquipment = foundIdx;
                    } else {
                        userData.activeEquipment = 0;
                    }
                }
                equipSelect.value = userData.activeEquipment.toString();
            }
        }
        checkMeasurementBtn();
    }

    function checkMeasurementBtn() {
        if (!currentHandle) {
            addMeasurementBtn.disabled = true;
            return;
        }
        if (equipSelect.value !== "" && backgroundInput.value !== "" && 
            sourceSelect.value !== "" && distanceInput.value !== "" && 
            measurementInput.value !== "") {
            addMeasurementBtn.disabled = false;
        } else {
            addMeasurementBtn.disabled = true;
        }
    }

    // --- Inputs Validation Hooks ---
    [equipSelect, backgroundInput, sourceSelect, distanceInput, measurementInput].forEach(el => {
        if (el) {
            el.addEventListener("input", checkMeasurementBtn);
            el.addEventListener("change", checkMeasurementBtn);
        }
    });

    if (equipSelect) {
        equipSelect.addEventListener("change", renderMeasurementsTable);
    }

    function format24HrTime(dateString, omitTime = false) {
        const d = new Date(dateString);
        if (omitTime) {
            return d.toLocaleDateString('en-US', { 
                year: 'numeric', month: 'numeric', day: 'numeric'
            });
        }
        return d.toLocaleString('en-US', { 
            year: 'numeric', month: 'numeric', day: 'numeric', 
            hour: 'numeric', minute: '2-digit', hour12: false 
        });
    }

    function toUnicodeSuperscript(numStr) {
        const superscripts = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        return numStr.split('').map(c => superscripts[c] || c).join('');
    }

    function formatIsotopeStr(isoStr) {
        const parts = isoStr.split('-');
        if (parts.length !== 2) return isoStr;
        const num = toUnicodeSuperscript(parts[0]);
        const elem = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
        return `${num}${elem}`;
    }

    // --- Mathematical Logic & Solvers ---
    let currentEfficiencyCoeffs = { a: 0, b: 0, c: 0, d: 0, calEnergy: 0 };
    let currentCalibPoints = [];

    function getEpsilon(E) {
        return computeEpsilon(E, currentEfficiencyCoeffs);
    }

    function computeEpsilon(E, coeffs) {
        if (E < 30) return 0.0;
        const {a, b, c, d} = coeffs;
        if (a === 0 && b === 0 && c === 0 && d === 0) return 1.0;
        const lnE = Math.log(E);
        const lnEps = a + b * lnE + c * Math.pow(lnE, 2) + d * Math.pow(lnE, 3);
        return Math.exp(lnEps);
    }

    function getEpsilonCoeffsForDetector(userData, currentDetName) {
        const coeffs = { a: 0, b: 0, c: 0, d: 0, calEnergy: 0 };
        const eq = userData.equipment.find(e => (typeof e === 'string' ? e : e.name) === currentDetName);
        if (!eq) return coeffs;

        const calib = typeof eq === 'string' ? "137-cs" : (eq.calib || "137-cs"); 
        const parts = calib.split('-');
        let calEnergy = 0;
        
        if (parts.length === 2 && typeof isotopesData !== 'undefined' && isotopesData.length > 0) {
            const aNum = parseInt(parts[0], 10);
            const elStr = parts[1].toUpperCase();
            const matched = isotopesData.find(i => i.A === aNum && i.Element.toUpperCase() === elStr);
            if (matched && matched.Radiations) {
                let maxI = -1;
                matched.Radiations.forEach(r => {
                    if (parseFloat(r.Energy) >= 30 && parseFloat(r.Intensity) > maxI) {
                        maxI = parseFloat(r.Intensity);
                        calEnergy = parseFloat(r.Energy);
                    }
                });
            }
        }
        coeffs.calEnergy = calEnergy;
        if (calEnergy < 30) return coeffs;
        
        const lnE_cal = Math.log(calEnergy);
        const observations = []; 
        const measArray = (userData.measurements || []).filter(m => m.detName === currentDetName);
        
        if (!userData.sources) return coeffs;
        
        userData.sources.forEach(src => {
            const isoText = formatIsotopeStr(src.isotope);
            const baseMeasures = measArray.filter(m => m.isoText === isoText && m.attenStr === "None");
            if (baseMeasures.length === 0) return;
            let sumY = 0;
            baseMeasures.forEach(m => sumY += parseFloat(m.netReading) * Math.pow(parseFloat(m.dist)/100.0, 2));
            const avgY = sumY / baseMeasures.length;
            if (avgY <= 0) return;
            
            const ps = src.isotope.split('-');
            let mIso = null;
            if (ps.length === 2 && typeof isotopesData !== 'undefined') {
                const aN = parseInt(ps[0], 10);
                const eS = ps[1].toUpperCase();
                mIso = isotopesData.find(i => i.A === aN && i.Element.toUpperCase() === eS);
            }
            if (!mIso || !mIso.Radiations) return;
            const radsSrc = mIso.Radiations.filter(r => parseFloat(r.Energy) >= 30 && r["Attenuation_cm-1"]);
            if (radsSrc.length === 0) return;
            
            if (!userData.attenuators) return;
            userData.attenuators.forEach(attStrObj => {
                const attStrFormatted = `${attStrObj.material} ${attStrObj.thickness}cm`;
                const attMeasures = measArray.filter(m => m.isoText === isoText && m.attenStr === attStrFormatted);
                if (attMeasures.length === 0) return;
                let sumX = 0;
                attMeasures.forEach(m => sumX += parseFloat(m.netReading) * Math.pow(parseFloat(m.dist)/100.0, 2));
                const avgX = sumX / attMeasures.length;
                const tExp = avgX / avgY;
                
                const rads = [];
                radsSrc.forEach(r => {
                    if (r["Attenuation_cm-1"][attStrObj.material]) {
                        const en = parseFloat(r.Energy);
                        const intensity = parseFloat(r.Intensity);
                        rads.push({
                            I: intensity / 100.0,
                            E: en,
                            mu: parseFloat(r["Attenuation_cm-1"][attStrObj.material]),
                            x: parseFloat(attStrObj.thickness)
                        });
                    }
                });
                if (rads.length > 0) {
                    observations.push({ rads, tExp });
                }
            });
        });
        
        if (observations.length === 0) return coeffs;
        
        function evalLoss(b, c, d) {
            let loss = 0;
            for (const obs of observations) {
                let sumA = 0; let sumB = 0;
                for (const r of obs.rads) {
                    const lnE = Math.log(r.E);
                    const lnEps = b*(lnE - lnE_cal) + c*(Math.pow(lnE, 2) - Math.pow(lnE_cal, 2)) + d*(Math.pow(lnE, 3) - Math.pow(lnE_cal, 3));
                    const eps = Math.exp(lnEps);
                    sumA += r.I * eps * Math.exp(-r.mu * r.x);
                    sumB += r.I * eps;
                }
                if (sumB === 0) return Infinity; 
                const tTheo = sumA / sumB;
                loss += Math.pow(tTheo - obs.tExp, 2);
            }
            return loss;
        }
        
        let bestB = 0, bestC = 0, bestD = 0;
        let bestLoss = evalLoss(bestB, bestC, bestD);
        let temp = 1.0;
        for (let i = 0; i < 5000; i++) {
            const testB = bestB + (Math.random() - 0.5) * temp;
            const testC = bestC + (Math.random() - 0.5) * temp * 0.1;
            const testD = bestD + (Math.random() - 0.5) * temp * 0.01;
            const l = evalLoss(testB, testC, testD);
            if (l < bestLoss) {
                bestLoss = l; bestB = testB; bestC = testC; bestD = testD;
            }
            temp *= 0.999;
        }
        
        coeffs.b = bestB; coeffs.c = bestC; coeffs.d = bestD;
        coeffs.a = -(bestB * lnE_cal + bestC * Math.pow(lnE_cal, 2) + bestD * Math.pow(lnE_cal, 3));
        return coeffs;
    }

    function calibrateDetectorEnergyResponse(handleName) {
        currentEfficiencyCoeffs = { a: 0, b: 0, c: 0, d: 0, calEnergy: 0 };
        currentCalibPoints = [];
        if (!handleName || !userProfiles[handleName]) return;
        const userData = userProfiles[handleName];
        
        const equipSelectEl = document.getElementById("equipment-select");
        const equipIdx = parseInt(equipSelectEl.value, 10);
        if (isNaN(equipIdx) || !userData.equipment || !userData.equipment[equipIdx]) return;
        
        const eq = userData.equipment[equipIdx];
        const calib = typeof eq === 'string' ? "137-cs" : (eq.calib || "137-cs"); 
        const parts = calib.split('-');
        let calEnergy = 0;
        
        if (parts.length === 2 && typeof isotopesData !== 'undefined' && isotopesData.length > 0) {
            const aNum = parseInt(parts[0], 10);
            const elStr = parts[1].toUpperCase();
            const matched = isotopesData.find(i => i.A === aNum && i.Element.toUpperCase() === elStr);
            if (matched && matched.Radiations) {
                let maxI = -1;
                matched.Radiations.forEach(r => {
                    if (parseFloat(r.Energy) >= 30 && parseFloat(r.Intensity) > maxI) {
                        maxI = parseFloat(r.Intensity);
                        calEnergy = parseFloat(r.Energy);
                    }
                });
            }
        }
        
        currentEfficiencyCoeffs.calEnergy = calEnergy;
        if (calEnergy < 30) return;
        const lnE_cal = Math.log(calEnergy);
        
        const observations = []; 
        const currentDetName = typeof eq === 'string' ? eq : eq.name;
        const measArray = (userData.measurements || []).filter(m => m.detName === currentDetName);
        
        if (!userData.sources) return;
        
        userData.sources.forEach(src => {
            const isoText = formatIsotopeStr(src.isotope);
            const baseMeasures = measArray.filter(m => m.isoText === isoText && m.attenStr === "None");
            if (baseMeasures.length === 0) return;
            let sumY = 0;
            baseMeasures.forEach(m => sumY += parseFloat(m.netReading) * Math.pow(parseFloat(m.dist)/100.0, 2));
            const avgY = sumY / baseMeasures.length;
            if (avgY <= 0) return;
            
            const ps = src.isotope.split('-');
            let mIso = null;
            if (ps.length === 2 && typeof isotopesData !== 'undefined') {
                const aN = parseInt(ps[0], 10);
                const eS = ps[1].toUpperCase();
                mIso = isotopesData.find(i => i.A === aN && i.Element.toUpperCase() === eS);
            }
            if (!mIso || !mIso.Radiations) return;
            const radsSrc = mIso.Radiations.filter(r => parseFloat(r.Energy) >= 30 && r["Attenuation_cm-1"]);
            if (radsSrc.length === 0) return;
            
            if (!userData.attenuators) return;
            userData.attenuators.forEach(attStrObj => {
                const attStrFormatted = `${attStrObj.material} ${attStrObj.thickness}cm`;
                const attMeasures = measArray.filter(m => m.isoText === isoText && m.attenStr === attStrFormatted);
                if (attMeasures.length === 0) return;
                let sumX = 0;
                attMeasures.forEach(m => sumX += parseFloat(m.netReading) * Math.pow(parseFloat(m.dist)/100.0, 2));
                const avgX = sumX / attMeasures.length;
                const tExp = avgX / avgY;
                
                const rads = [];
                radsSrc.forEach(r => {
                    if (r["Attenuation_cm-1"][attStrObj.material]) {
                        const en = parseFloat(r.Energy);
                        const intensity = parseFloat(r.Intensity);
                        rads.push({
                            I: intensity / 100.0,
                            E: en,
                            mu: parseFloat(r["Attenuation_cm-1"][attStrObj.material]),
                            x: parseFloat(attStrObj.thickness)
                        });
                        if (!currentCalibPoints.some(p => p.E === en && p.iso === isoText)) {
                            currentCalibPoints.push({ E: en, I: intensity, iso: isoText });
                        }
                    }
                });
                if (rads.length > 0) {
                    observations.push({ rads, tExp });
                }
            });
        });
        
        if (observations.length === 0) return;
        
        function evalLoss(b, c, d) {
            let loss = 0;
            for (const obs of observations) {
                let sumA = 0;
                let sumB = 0;
                for (const r of obs.rads) {
                    const lnE = Math.log(r.E);
                    const lnEps = b*(lnE - lnE_cal) + c*(Math.pow(lnE, 2) - Math.pow(lnE_cal, 2)) + d*(Math.pow(lnE, 3) - Math.pow(lnE_cal, 3));
                    const eps = Math.exp(lnEps);
                    sumA += r.I * eps * Math.exp(-r.mu * r.x);
                    sumB += r.I * eps;
                }
                if (sumB === 0) return Infinity; 
                const tTheo = sumA / sumB;
                loss += Math.pow(tTheo - obs.tExp, 2);
            }
            return loss;
        }
        
        // Random Search (Simulated Annealing approach)
        let bestB = 0, bestC = 0, bestD = 0;
        let bestLoss = evalLoss(bestB, bestC, bestD);
        let temp = 1.0;
        for (let i = 0; i < 5000; i++) {
            const testB = bestB + (Math.random() - 0.5) * temp;
            const testC = bestC + (Math.random() - 0.5) * temp * 0.1;
            const testD = bestD + (Math.random() - 0.5) * temp * 0.01;
            const l = evalLoss(testB, testC, testD);
            if (l < bestLoss) {
                bestLoss = l;
                bestB = testB;
                bestC = testC;
                bestD = testD;
            }
            temp *= 0.999;
        }
        
        currentEfficiencyCoeffs.b = bestB;
        currentEfficiencyCoeffs.c = bestC;
        currentEfficiencyCoeffs.d = bestD;
        currentEfficiencyCoeffs.a = -(bestB * lnE_cal + bestC * Math.pow(lnE_cal, 2) + bestD * Math.pow(lnE_cal, 3));
    }

    function renderEfficiencyPlot() {
        const container = document.getElementById('efficiency-plot-container');
        if (!container) return;
        
        if (currentEfficiencyCoeffs.calEnergy === 0 || typeof Plotly === 'undefined') {
            container.innerHTML = "";
            return;
        }
        
        // Generate data points
        const xValues = [];
        const yValues = [];
        for (let e = 30; e <= 3000; e += 10) {
            xValues.push(e);
            yValues.push(getEpsilon(e));
        }
        
        const trace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#E04F39', width: 3, shape: 'spline' },
            name: 'Intrinsic Efficiency'
        };
        
        const measX = [];
        const measY = [];
        const measText = [];
        currentCalibPoints.forEach(p => {
            measX.push(p.E);
            measY.push(getEpsilon(p.E));
            measText.push(`${p.iso}<br>E: ${p.E} keV<br>I: ${p.I}%`);
        });
        
        const measuredTrace = {
            x: measX,
            y: measY,
            type: 'scatter',
            mode: 'markers',
            marker: { size: 6, color: '#D6DBD4', opacity: 0.8 },
            name: 'Measured Energies',
            text: measText,
            hoverinfo: 'text'
        };
        
        const anchorTrace = {
            x: [currentEfficiencyCoeffs.calEnergy],
            y: [getEpsilon(currentEfficiencyCoeffs.calEnergy)],
            type: 'scatter',
            mode: 'markers',
            text: [`Anchor: ${currentEfficiencyCoeffs.calEnergy} keV`],
            marker: { size: 10, color: '#FFCD00', line: { color: '#FFFFFF', width: 2 } },
            name: 'Calibration Anchor',
            hoverinfo: 'text'
        };
        
        const layout = {
            title: { text: "Detector Energy Response", font: { color: '#FFFFFF' } },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { 
                type: 'log', 
                title: 'Photon Energy (keV)', 
                color: '#D6DBD4',
                gridcolor: '#54585A'
            },
            yaxis: { 
                title: 'Relative Efficiency', 
                color: '#D6DBD4',
                gridcolor: '#54585A'
            },
            margin: { l: 60, r: 20, t: 40, b: 50 },
            showlegend: false,
            hovermode: 'closest'
        };
        Plotly.newPlot(container, [trace, measuredTrace, anchorTrace], layout, {responsive: true});
    }

    function calculateCurrentActivity(src) {
        let currentActivity = src.activity;
        const parts = src.isotope.split('-');
        if (parts.length === 2 && isotopesData.length > 0) {
            const aNum = parseInt(parts[0], 10);
            const elStr = parts[1].toUpperCase();
            const matchedIso = isotopesData.find(iso => iso.A === aNum && iso.Element.toUpperCase() === elStr);
            if (matchedIso && matchedIso["Half life"]) {
                let hlSecs = matchedIso["Half life"];
                if (typeof hlSecs === "string") {
                    const hStr = hlSecs.toLowerCase();
                    const val = parseFloat(hStr);
                    if (!isNaN(val)) {
                        if (hStr.includes('year') || hStr.includes('y')) hlSecs = val * 31557600;
                        else if (hStr.includes('day') || hStr.includes('d')) hlSecs = val * 86400;
                        else if (hStr.includes('hour') || hStr.includes('h')) hlSecs = val * 3600;
                        else if (hStr.includes('min') || hStr.includes('m')) hlSecs = val * 60;
                        else hlSecs = val;
                    }
                }
                const elapsedSeconds = (new Date() - new Date(src.datetime)) / 1000;
                // Activity = A_0 * (0.5)^(t/(Half life))
                currentActivity = src.activity * Math.pow(0.5, elapsedSeconds / hlSecs);
            }
        }
        return currentActivity;
    }

    function formatActivity(val) {
        if (!val && val !== 0) return "0";
        if (val > 100000 || val < 0.01) {
            let expStr = val.toExponential(3);
            let parts = expStr.split('e');
            let mantissa = parseFloat(parts[0]).toString(); 
            return mantissa + 'E' + parts[1].replace('+', '');
        }
        return parseFloat(val.toFixed(2)).toString();
    }

    function renderSourcesDropdown() {
        sourceSelect.innerHTML = "";
        const tbody = activeSourcesUl.querySelector("tbody");
        if(tbody) tbody.innerHTML = "";
        
        if (!currentHandle) {
            sourceSelect.innerHTML = '<option value="">-- Log in to see sources --</option>';
            if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Log in to view --</td></tr>';
            sourceSelect.disabled = true;
            distanceInput.disabled = true;
            sourceMassInput.disabled = true;
            sourceIsotopeSelect.disabled = true;
            sourceActivityInput.disabled = true;
            sourceActivityUnit.disabled = true;
            sourceDatetimeInput.disabled = true;
            addSourceBtn.disabled = true;
            return;
        }

        sourceSelect.disabled = false;
        distanceInput.disabled = false;
        sourceMassInput.disabled = false;
        sourceIsotopeSelect.disabled = true; // Enabled when A# given
        sourceActivityInput.disabled = false;
        sourceActivityUnit.disabled = false;
        sourceDatetimeInput.disabled = false;
        addSourceBtn.disabled = false;

        const userData = userProfiles[currentHandle];
        if (!userData.sources) userData.sources = [];

        const hasSources = userData.sources && userData.sources.length > 0;
        const hasUnknown = userData.unknownSources && userData.unknownSources.length > 0;
        
        if (!hasSources && !hasUnknown) {
            sourceSelect.innerHTML = '<option value="">-- Add a source in Inventory --</option>';
            if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- No sources added --</td></tr>';
        } else {
            if (hasSources) {
                const grpKnown = document.createElement("optgroup");
                grpKnown.label = "Known Sources";
                userData.sources.forEach((src, idx) => {
                    let halfLife = 0;
                    const parts = src.isotope.split('-');
                    if (parts.length === 2 && isotopesData.length > 0) {
                        const aNum = parseInt(parts[0], 10);
                        const elStr = parts[1].toUpperCase();
                        const matchedIso = isotopesData.find(iso => iso.A === aNum && iso.Element.toUpperCase() === elStr);
                        if (matchedIso && matchedIso["Half life"]) {
                            halfLife = matchedIso["Half life"];
                        }
                    }
                    const isLongLived = halfLife > 31557600;
                    const dateFixed = format24HrTime(src.datetime, isLongLived);
                    const isoText = formatIsotopeStr(src.isotope);
                    const curAct = calculateCurrentActivity(src);
                    
                    const optionStr = `${isoText} | ${formatActivity(src.activity)} Bq (${dateFixed})`;
                    const opt = document.createElement("option");
                    opt.value = idx.toString();
                    opt.textContent = optionStr;
                    grpKnown.appendChild(opt);

                    if (tbody) {
                        const tr = document.createElement("tr");
                        tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                        
                        const tdIso = document.createElement("td");
                        tdIso.style.padding = "0.25rem 0";
                        tdIso.textContent = isoText;
                        const tdA0 = document.createElement("td");
                        tdA0.style.padding = "0.25rem 0";
                        tdA0.textContent = formatActivity(src.activity);
                        const tdDate = document.createElement("td");
                        tdDate.style.padding = "0.25rem 0";
                        tdDate.textContent = dateFixed;
                        const tdAct = document.createElement("td");
                        tdAct.style.padding = "0.25rem 0";
                        tdAct.textContent = formatActivity(curAct);
                        
                        const tdDel = document.createElement("td");
                        tdDel.style.padding = "0.25rem 0";
                        tdDel.style.textAlign = "right";
                        const delBtn = document.createElement("button");
                        delBtn.className = "delete-btn";
                        delBtn.textContent = "✖";
                        delBtn.onclick = () => {
                            userData.sources.splice(idx, 1);
                            if (userData.activeSource === idx) userData.activeSource = null;
                            else if (typeof userData.activeSource === 'number' && userData.activeSource > idx) userData.activeSource--;
                            saveToStorage();
                            renderSourcesDropdown();
                        };
                        tdDel.appendChild(delBtn);
                        tr.appendChild(tdIso); tr.appendChild(tdA0); tr.appendChild(tdDate); tr.appendChild(tdAct); tr.appendChild(tdDel);
                        tbody.appendChild(tr);
                    }
                });
                sourceSelect.appendChild(grpKnown);
            } else {
                if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- No sources added --</td></tr>';
            }
            
            if (hasUnknown) {
                const grpUnknown = document.createElement("optgroup");
                grpUnknown.label = "Unknown Sources";
                userData.unknownSources.forEach((uname, uIdx) => {
                    const opt = document.createElement("option");
                    opt.value = "u_" + uIdx;
                    opt.textContent = uname;
                    grpUnknown.appendChild(opt);
                });
                sourceSelect.appendChild(grpUnknown);
            }
            
            if (userData.activeSource !== null && userData.activeSource !== undefined) {
                sourceSelect.value = userData.activeSource.toString();
            }
        }
        
        sourceSelect.disabled = (!hasSources && !hasUnknown);
        renderTransmissionFactorsTable();
    }

    function renderTransmissionFactorsTable() {
        if (!transmissionFactorsTableBody) return;
        transmissionFactorsTableBody.innerHTML = "";
        
        if (!currentHandle) {
            transmissionFactorsTableBody.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Awaiting inventory data --</td></tr>';
            return;
        }

        const userData = userProfiles[currentHandle];
        const hasSources = userData && userData.sources && userData.sources.length > 0;
        const hasUnknown = userData && userData.unknownSources && userData.unknownSources.length > 0;
        
        if (!hasSources && !hasUnknown) {
            transmissionFactorsTableBody.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Awaiting inventory data --</td></tr>';
            return;
        }
        
        const equipIdx = parseInt(equipSelect.value, 10);
        let measArray = [];
        if (!isNaN(equipIdx) && userData.equipment && userData.equipment[equipIdx]) {
            const currDetItem = userData.equipment[equipIdx];
            const currentDetName = typeof currDetItem === 'string' ? currDetItem : currDetItem.name;
            measArray = (userData.measurements || []).filter(m => m.detName === currentDetName);
        }
        
        let allItemsToRender = [];
        if (hasSources) {
            userData.sources.forEach(src => {
                const curAct = calculateCurrentActivity(src);
                let expStr = curAct.toExponential(2);
                let parts = expStr.split("e");
                let actStr = parseFloat(parts[0]).toString() + "E" + parts[1].replace('+', '');
                allItemsToRender.push({ isoStrFormatted: formatIsotopeStr(src.isotope), actStr: actStr });
            });
        }
        if (hasUnknown) {
            userData.unknownSources.forEach(uname => {
                allItemsToRender.push({ isoStrFormatted: uname, actStr: "" });
            });
        }
        
        allItemsToRender.forEach(item => {
            const isoStrFormatted = item.isoStrFormatted;
            const actStr = item.actStr;
            const hasBaseline = measArray.some(m => m.isoText === isoStrFormatted && m.attenStr === "None");
            
            let displayAttenuators = [];
            if (userData.attenuators && userData.attenuators.length > 0) {
                displayAttenuators = userData.attenuators.map(att => `${att.material} ${att.thickness}cm`);
            } else {
                displayAttenuators = ["None"];
            }
            
            const rowCount = displayAttenuators.length;
            
            displayAttenuators.forEach((attStr, aIdx) => {
                const tr = document.createElement("tr");
                if (aIdx === displayAttenuators.length - 1) {
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                }
                
                if (aIdx === 0) {
                    const tdSrc = document.createElement("td");
                    tdSrc.style.padding = "0.25rem 0.5rem";
                    tdSrc.textContent = isoStrFormatted;
                    tdSrc.rowSpan = rowCount;
                    tdSrc.style.verticalAlign = "top";
                    tr.appendChild(tdSrc);
                    
                    const tdAct = document.createElement("td");
                    tdAct.style.padding = "0.25rem 0.5rem";
                    tdAct.textContent = actStr;
                    tdAct.rowSpan = rowCount;
                    tdAct.style.verticalAlign = "top";
                    tr.appendChild(tdAct);
                }
                
                const tdAtt = document.createElement("td");
                tdAtt.style.padding = "0.25rem 0.5rem";
                tdAtt.textContent = attStr;
                tr.appendChild(tdAtt);
                
                const tdT = document.createElement("td");
                tdT.style.padding = "0.25rem 0.5rem";
                if (!hasBaseline) {
                    tdT.innerHTML = '<span title="An unattenuated reading of this source is needed in the Measurements tab." style="cursor: help; color: var(--new-horizon); font-style: italic;">No Base Reading</span>';
                } else if (attStr !== "None") {
                    const attenMeasures = measArray.filter(m => m.isoText === isoStrFormatted && m.attenStr === attStr);
                    if (attenMeasures.length === 0) {
                        tdT.innerHTML = '<span title="Please enter an attenuated reading for this source and attenuator in the Measurements tab." style="cursor: help; color: var(--new-horizon); font-style: italic;">No Attenuated Reading</span>';
                    } else {
                        const baseMeasures = measArray.filter(m => m.isoText === isoStrFormatted && m.attenStr === "None");
                        
                        let sumX = 0;
                        attenMeasures.forEach(m => {
                            sumX += parseFloat(m.netReading) * Math.pow(parseFloat(m.dist) / 100.0, 2);
                        });
                        let X = sumX / attenMeasures.length;
                        
                        let sumY = 0;
                        baseMeasures.forEach(m => {
                            sumY += parseFloat(m.netReading) * Math.pow(parseFloat(m.dist) / 100.0, 2);
                        });
                        let Y = sumY / baseMeasures.length;
                        
                        const tVal = X / Y;
                        tdT.textContent = tVal.toFixed(4);
                    }
                } else {
                    tdT.textContent = "1.0000";
                }
                tr.appendChild(tdT);
                
                transmissionFactorsTableBody.appendChild(tr);
            });
        });
        
        calibrateDetectorEnergyResponse(currentHandle);
        renderTheoreticalTransmissionTable();
        renderEfficiencyPlot();
    }
    
    function renderTheoreticalTransmissionTable() {
        const container = theoreticalTransmissionContainer;
        if (!container) return;
        container.innerHTML = "";
        
        const noDataMsg = '<div style="color: var(--text-muted); text-align: center; padding-top: 0.5rem; font-size: 0.9rem;">-- Awaiting inventory data --</div>';
        
        if (!currentHandle) {
            container.innerHTML = noDataMsg;
            return;
        }

        const userData = userProfiles[currentHandle];
        if (!userData || !userData.sources || userData.sources.length === 0) {
            container.innerHTML = noDataMsg;
            return;
        }
        
        let uniqueIsotopes = [];
        userData.sources.forEach(src => {
            const rawIso = src.isotope;
            if (!uniqueIsotopes.some(u => u.raw === rawIso)) {
                uniqueIsotopes.push({ raw: rawIso, formatted: formatIsotopeStr(rawIso) });
            }
        });
        
        if (uniqueIsotopes.length === 0) {
            container.innerHTML = noDataMsg;
            return;
        }
        
        let displayAttenuatorsData = [];
        if (userData.attenuators && userData.attenuators.length > 0) {
            displayAttenuatorsData = userData.attenuators.map(att => ({
                str: `${att.material} ${att.thickness}cm`,
                material: att.material,
                thickness: parseFloat(att.thickness)
            }));
        } else {
            // Even if no specific attenuators, represent the "None" baseline.
            displayAttenuatorsData = [{ str: "None", material: "None", thickness: 0 }];
        }
        
        const MAX_COLS = 6;
        for (let i = 0; i < uniqueIsotopes.length; i += MAX_COLS) {
            const chunk = uniqueIsotopes.slice(i, i + MAX_COLS);
            
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.fontSize = "0.9rem";
            table.style.textAlign = "left";
            table.style.color = "var(--text-main)";
            table.style.backgroundColor = "var(--navy-blue)";
            
            // Thead
            const thead = document.createElement("thead");
            const trHead = document.createElement("tr");
            trHead.style.color = "var(--text-muted)";
            trHead.style.borderBottom = "1px solid var(--border)";
            
            const thAtt = document.createElement("th");
            thAtt.style.padding = "0.25rem 0.5rem";
            thAtt.textContent = "Attenuator";
            trHead.appendChild(thAtt);
            
            chunk.forEach(isoObj => {
                const thIso = document.createElement("th");
                thIso.style.padding = "0.25rem 0.5rem";
                thIso.textContent = isoObj.formatted;
                trHead.appendChild(thIso);
            });
            thead.appendChild(trHead);
            table.appendChild(thead);
            
            // Tbody
            const tbody = document.createElement("tbody");
            
            displayAttenuatorsData.forEach((attObj, aIdx) => {
                const tr = document.createElement("tr");
                if (aIdx === displayAttenuatorsData.length - 1) {
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                }
                
                const tdAtt = document.createElement("td");
                tdAtt.style.padding = "0.25rem 0.5rem";
                tdAtt.textContent = attObj.str;
                tr.appendChild(tdAtt);
                
                chunk.forEach(isoObj => {
                    const tdT = document.createElement("td");
                    tdT.style.padding = "0.25rem 0.5rem";
                    
                    let tVal = null;
                    if (attObj.thickness === 0) {
                        tVal = 1.0;
                    } else {
                        const parts = isoObj.raw.split('-');
                        let matchedIso = null;
                        if (parts.length === 2 && isotopesData && isotopesData.length > 0) {
                            const aNum = parseInt(parts[0], 10);
                            const elStr = parts[1].toUpperCase();
                            matchedIso = isotopesData.find(i => i.A === aNum && i.Element.toUpperCase() === elStr);
                        }
                        
                        if (matchedIso && matchedIso.Radiations && matchedIso.Radiations.length > 0) {
                            const rads = matchedIso.Radiations;
                            
                            if (rads.length === 1) {
                                // Single energy
                                const r = rads[0];
                                const muMap = r["Attenuation_cm-1"];
                                if (muMap && muMap[attObj.material] !== undefined) {
                                    const mu = parseFloat(muMap[attObj.material]);
                                    tVal = Math.exp(-mu * attObj.thickness);
                                }
                            } else {
                                // Multi energy
                                let sumA = 0;
                                let sumB = 0;
                                let validMath = true;
                                
                                rads.forEach(r => {
                                    const intensity = parseFloat(r.Intensity) / 100.0;
                                    const muMap = r["Attenuation_cm-1"];
                                    if (isNaN(intensity) || !muMap || muMap[attObj.material] === undefined) {
                                        validMath = false;
                                    } else {
                                        const energy = parseFloat(r.Energy);
                                        const eps = getEpsilon(energy);
                                        const mu = parseFloat(muMap[attObj.material]);
                                        sumA += intensity * eps * Math.exp(-mu * attObj.thickness);
                                        sumB += intensity * eps;
                                    }
                                });
                                
                                if (validMath && sumB > 0) {
                                    tVal = sumA / sumB;
                                }
                            }
                        }
                    }
                    
                    tdT.textContent = tVal !== null ? tVal.toFixed(4) : "--";
                    tr.appendChild(tdT);
                });
                
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            container.appendChild(table);
        }
    }

    function renderAttenuatorsDropdown() {
        const checkboxTbody = attenuatorsCheckboxGroup.querySelector("tbody");
        if(checkboxTbody) checkboxTbody.innerHTML = "";
        
        const tbody = activeAttenuatorsUl.querySelector("tbody");
        if(tbody) tbody.innerHTML = "";
        
        if (!currentHandle) {
            if(checkboxTbody) checkboxTbody.innerHTML = '<tr><td colspan="3" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Log in to see attenuators --</td></tr>';
            if(tbody) tbody.innerHTML = '<tr><td colspan="3" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Log in to view --</td></tr>';
            attenuatorMaterialSelect.disabled = true;
            attenuatorThicknessInput.disabled = true;
            addAttenuatorBtn.disabled = true;
            return;
        }

        attenuatorMaterialSelect.disabled = false;
        attenuatorThicknessInput.disabled = false;
        addAttenuatorBtn.disabled = false;

        const userData = userProfiles[currentHandle];
        if (!userData.attenuators) userData.attenuators = [];
        if (!userData.activeAttenuators) userData.activeAttenuators = [];

        if (userData.attenuators.length === 0) {
            if(checkboxTbody) checkboxTbody.innerHTML = '<tr><td colspan="3" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- No attenuators saved yet --</td></tr>';
            if(tbody) tbody.innerHTML = '<tr><td colspan="3" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- No attenuators added --</td></tr>';
        } else {
            userData.attenuators.forEach((att, idx) => {
                const optionStr = `${att.material} (${att.thickness} cm)`;
                
                if (checkboxTbody) {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                    
                    const tdCb = document.createElement("td");
                    tdCb.style.padding = "0.25rem 0.5rem";
                    tdCb.style.width = "30px";
                    
                    const cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.value = idx.toString();
                    cb.checked = userData.activeAttenuators.includes(idx);
                    
                    cb.addEventListener("change", () => {
                        if (cb.checked) {
                            if (!userData.activeAttenuators.includes(idx)) userData.activeAttenuators.push(idx);
                        } else {
                            userData.activeAttenuators = userData.activeAttenuators.filter(i => i !== idx);
                        }
                        saveToStorage();
                    });
                    
                    tdCb.appendChild(cb);
                    
                    const tdMat = document.createElement("td");
                    tdMat.style.padding = "0.25rem 0";
                    tdMat.textContent = att.material;
                    
                    const tdThick = document.createElement("td");
                    tdThick.style.padding = "0.25rem 0";
                    tdThick.textContent = att.thickness; 
                    
                    tr.appendChild(tdCb);
                    tr.appendChild(tdMat);
                    tr.appendChild(tdThick);
                    checkboxTbody.appendChild(tr);
                }

                // Inventory Table Draw (Right side panel)
                if (tbody) {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                    
                    const tdMat = document.createElement("td");
                    tdMat.style.padding = "0.25rem 0";
                    tdMat.textContent = att.material;
                    
                    const tdThick = document.createElement("td");
                    tdThick.style.padding = "0.25rem 0";
                    tdThick.textContent = att.thickness; 
                    
                    const tdDel = document.createElement("td");
                    tdDel.style.padding = "0.25rem 0";
                    tdDel.style.textAlign = "right";
                    
                    const delBtn = document.createElement("button");
                    delBtn.className = "delete-btn";
                    delBtn.textContent = "✖";
                    delBtn.onclick = () => {
                        userData.attenuators.splice(idx, 1);
                        userData.activeAttenuators = userData.activeAttenuators.filter(i => i !== idx).map(i => i > idx ? i - 1 : i);
                        saveToStorage();
                        renderAttenuatorsDropdown();
                    };
                    
                    tdDel.appendChild(delBtn);
                    
                    tr.appendChild(tdMat);
                    tr.appendChild(tdThick);
                    tr.appendChild(tdDel);
                    tbody.appendChild(tr);
                }
            });
        }
    }

    function renderMeasurementsTable() {
        measurementsTableBody.innerHTML = "";
        const calIsotopeWarning = document.getElementById("cal-isotope-warning");
        if (calIsotopeWarning) calIsotopeWarning.style.display = "none";
        
        if (!currentHandle) {
            resetMeasurementsBtn.disabled = true;
            measurementsTableBody.innerHTML = '<tr><td colspan="7" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Awaiting measurement data --</td></tr>';
            return;
        }

        const userData = userProfiles[currentHandle];
        if (!userData || !userData.equipment) return;
        
        const equipIdx = parseInt(equipSelect.value, 10);
        if (isNaN(equipIdx)) {
            resetMeasurementsBtn.disabled = true;
            measurementsTableBody.innerHTML = '<tr><td colspan="7" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Select a detector --</td></tr>';
            return;
        }
        
        const currDetItem = userData.equipment[equipIdx];
        if (!currDetItem) return;
        const currentDetName = typeof currDetItem === 'string' ? currDetItem : currDetItem.name;

        let allMeas = userData.measurements || [];
        const measArray = allMeas.filter(m => m.detName === currentDetName);

        if (measArray.length === 0) {
            measurementsTableBody.innerHTML = '<tr><td colspan="7" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Awaiting measurement data --</td></tr>';
            resetMeasurementsBtn.disabled = true;
        } else {
            resetMeasurementsBtn.disabled = false;
            measArray.forEach(m => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                
                const tdDet = document.createElement("td");
                tdDet.style.padding = "0.25rem 0.5rem";
                tdDet.textContent = m.detName;
                
                const tdSrc = document.createElement("td");
                tdSrc.style.padding = "0.25rem 0.5rem";
                tdSrc.textContent = m.isoText;
                
                const tdAct = document.createElement("td");
                tdAct.style.padding = "0.25rem 0.5rem";
                tdAct.textContent = m.actStr;
                
                const tdAtt = document.createElement("td");
                tdAtt.style.padding = "0.25rem 0.5rem";
                tdAtt.style.wordWrap = "break-word";
                tdAtt.style.whiteSpace = "normal";
                tdAtt.style.maxWidth = "200px";
                tdAtt.textContent = m.attenStr;
                
                const tdDist = document.createElement("td");
                tdDist.style.padding = "0.25rem 0.5rem";
                tdDist.textContent = m.dist.toString();
                
                const tdRead = document.createElement("td");
                tdRead.style.padding = "0.25rem 0.5rem";
                tdRead.textContent = m.netReading;
                
                const tdDel = document.createElement("td");
                tdDel.style.padding = "0.25rem 0";
                tdDel.style.textAlign = "right";
                
                const delBtn = document.createElement("button");
                delBtn.className = "delete-btn";
                delBtn.textContent = "✖";
                delBtn.onclick = () => {
                    const realIndex = userData.measurements.indexOf(m);
                    if (realIndex > -1) {
                        userData.measurements.splice(realIndex, 1);
                        saveToStorage();
                        renderMeasurementsTable(); 
                    }
                };
                tdDel.appendChild(delBtn);
                
                tr.appendChild(tdDet);
                tr.appendChild(tdSrc);
                tr.appendChild(tdAct);
                tr.appendChild(tdAtt);
                tr.appendChild(tdDist);
                tr.appendChild(tdRead);
                tr.appendChild(tdDel);
                measurementsTableBody.appendChild(tr);
            });
        }
        
        // Calibration Check Display Hook
        if (typeof currDetItem !== 'string' && currDetItem.calib && calIsotopeWarning) {
            const calibFormatted = formatIsotopeStr(currDetItem.calib);
            const hasCalibMeas = measArray.some(m => m.isoText === calibFormatted);
            if (!hasCalibMeas) {
                calIsotopeWarning.textContent = `Please include a measurement of ${calibFormatted} if possible.`;
                calIsotopeWarning.style.display = "block";
            }
        }
        renderTransmissionFactorsTable();
    }

    function switchUser(handleName) {
        if (!handleName) return;

        // If this is a brand new handle, create their profile structure
        if (!userProfiles[handleName]) {
            userProfiles[handleName] = {
                equipment: [],
                activeEquipment: null,
                sources: [],
                activeSource: null,
                attenuators: [],
                activeAttenuator: null,
                unknownSources: []
            };
        } else {
            if (!userProfiles[handleName].sources) {
                userProfiles[handleName].sources = [];
                userProfiles[handleName].activeSource = null;
            }
            if (!userProfiles[handleName].measurements) {
                userProfiles[handleName].measurements = [];
            }
            if (!userProfiles[handleName].activeAttenuators) {
                userProfiles[handleName].activeAttenuators = [];
            }
            if (!userProfiles[handleName].unknownSources) {
                userProfiles[handleName].unknownSources = [];
            }
        }

        currentHandle = handleName;
        userDisplay.textContent = currentHandle;
        saveToStorage();
        renderEquipmentDropdown();
        renderSourcesDropdown();
        renderUnknownSourcesUI();
        renderAttenuatorsDropdown();
        renderMeasurementsTable();
        handleInput.value = ""; // Clear the login box
    }

    function renderUnknownSourcesUI() {
        const tbody = activeUnknownSourcesUl ? activeUnknownSourcesUl.querySelector("tbody") : null;
        if(tbody) tbody.innerHTML = "";
        
        if (!currentHandle) {
            if(tbody) tbody.innerHTML = '<tr><td colspan="2" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Log in to view --</td></tr>';
            unknownSourceInput.disabled = true;
            addUnknownSourceBtn.disabled = true;
            return;
        }

        unknownSourceInput.disabled = false;
        addUnknownSourceBtn.disabled = false;

        const userData = userProfiles[currentHandle];
        if (!userData.unknownSources) userData.unknownSources = [];

        if (userData.unknownSources.length === 0) {
            if(tbody) tbody.innerHTML = '<tr><td colspan="2" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- No unknown sources added --</td></tr>';
        } else {
            userData.unknownSources.forEach((name, idx) => {
                if (tbody) {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                    
                    const tdName = document.createElement("td");
                    tdName.style.padding = "0.25rem 0";
                    tdName.textContent = name;
                    
                    const tdDel = document.createElement("td");
                    tdDel.style.padding = "0.25rem 0";
                    tdDel.style.textAlign = "right";
                    
                    const delBtn = document.createElement("button");
                    delBtn.className = "delete-btn";
                    delBtn.textContent = "✖";
                    delBtn.onclick = () => {
                        userData.unknownSources.splice(idx, 1);
                        saveToStorage();
                        renderUnknownSourcesUI();
                    };
                    
                    tdDel.appendChild(delBtn);
                    tr.appendChild(tdName);
                    tr.appendChild(tdDel);
                    tbody.appendChild(tr);
                }
            });
        }
    }

    // --- Event Listeners ---

    // Handle Login/Create Profile
    loginBtn.addEventListener("click", () => {
        const name = handleInput.value.trim();
        switchUser(name);
    });

    handleInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") switchUser(handleInput.value.trim());
    });

    function switchTab(activeTab, activePanel, displayStyle) {
        [tabInventory, tabMeasurements, tabResults, tabRiidance, tabPalette].forEach(t => t.classList.remove("active"));
        [panelInventory, panelMeasurements, panelResults, panelRiidance, panelPalette].forEach(p => p.style.display = "none");
        
        activeTab.classList.add("active");
        activePanel.style.display = displayStyle;
    }

    tabInventory.addEventListener("click", () => switchTab(tabInventory, panelInventory, "grid"));
    tabMeasurements.addEventListener("click", () => switchTab(tabMeasurements, panelMeasurements, "grid"));
    tabResults.addEventListener("click", () => switchTab(tabResults, panelResults, "block"));
    tabRiidance.addEventListener("click", () => {
        switchTab(tabRiidance, panelRiidance, "block");
        renderRiidanceTab();
    });
    tabPalette.addEventListener("click", () => switchTab(tabPalette, panelPalette, "block"));

    equipCalibMassInput.addEventListener("input", () => {
        const aNum = parseInt(equipCalibMassInput.value, 10);
        equipCalibIsotopeSelect.innerHTML = "";
        if (isNaN(aNum)) {
            equipCalibIsotopeSelect.disabled = true;
            equipCalibIsotopeSelect.innerHTML = '<option value="">Enter A-number first</option>';
            return;
        }
        const matches = isotopesData.filter(iso => iso.A === aNum);
        if (matches.length === 0) {
            equipCalibIsotopeSelect.disabled = true;
            equipCalibIsotopeSelect.innerHTML = '<option value="">No isotopes found</option>';
            return;
        }
        equipCalibIsotopeSelect.disabled = false;
        matches.forEach(iso => {
            const opt = document.createElement("option");
            const valName = `${iso.A}-${iso.Element}`;
            opt.value = valName;
            opt.textContent = valName;
            equipCalibIsotopeSelect.appendChild(opt);
        });
    });

    // Handle Adding New Equipment
    addEquipBtn.addEventListener("click", () => {
        const equipName = newEquipInput.value.trim();
        const calib = equipCalibIsotopeSelect.value;
        
        if (!currentHandle) return;
        
        if (!equipName || !calib) {
            alert("Please enter a detector name and select a calibration isotope.");
            return;
        }
        
        // Prevent duplicates (checking objects)
        const isDuplicate = userProfiles[currentHandle].equipment.some(eq => {
            const name = typeof eq === 'string' ? eq : eq.name;
            return name === equipName;
        });

        if (!isDuplicate) {
            const newEquipObj = { name: equipName, calib: calib };
            userProfiles[currentHandle].equipment.push(newEquipObj);
            userProfiles[currentHandle].activeEquipment = userProfiles[currentHandle].equipment.length - 1; // Auto-select new item
            saveToStorage();
            renderEquipmentDropdown();
        }
        
        newEquipInput.value = "";
        equipCalibMassInput.value = "";
        equipCalibMassInput.dispatchEvent(new Event("input"));
    });

    newEquipInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addEquipBtn.click();
    });

    // Handle Selecting Equipment from the dropdown
    equipSelect.addEventListener("change", () => {
        if (currentHandle) {
            userProfiles[currentHandle].activeEquipment = parseInt(equipSelect.value, 10);
            saveToStorage();
        }
    });

    sourceMassInput.addEventListener("input", () => {
        const aNum = parseInt(sourceMassInput.value, 10);
        sourceIsotopeSelect.innerHTML = "";
        if (isNaN(aNum)) {
            sourceIsotopeSelect.disabled = true;
            sourceIsotopeSelect.innerHTML = '<option value="">Enter A-number first</option>';
            return;
        }
        const matches = isotopesData.filter(iso => iso.A === aNum);
        if (matches.length === 0) {
            sourceIsotopeSelect.disabled = true;
            sourceIsotopeSelect.innerHTML = '<option value="">No isotopes found</option>';
            return;
        }
        sourceIsotopeSelect.disabled = false;
        matches.forEach(iso => {
            const opt = document.createElement("option");
            const valName = `${iso.A}-${iso.Element}`;
            opt.value = valName;
            opt.textContent = valName;
            sourceIsotopeSelect.appendChild(opt);
        });
    });

    addSourceBtn.addEventListener("click", () => {
        if (!currentHandle) return;
        const isotope = sourceIsotopeSelect.value;
        const activityRaw = parseFloat(sourceActivityInput.value);
        const unitMultiplier = parseFloat(sourceActivityUnit.value);
        const dt = sourceDatetimeInput.value;
        
        if (!isotope || isNaN(activityRaw) || !dt) {
            alert("Please fill out Isotope, Activity, and Date/Time.");
            return;
        }
        
        if (!userProfiles[currentHandle].sources) userProfiles[currentHandle].sources = [];
        const newSource = { isotope, activity: activityRaw * unitMultiplier, datetime: dt };
        userProfiles[currentHandle].sources.push(newSource);
        userProfiles[currentHandle].activeSource = userProfiles[currentHandle].sources.length - 1;
        
        saveToStorage();
        renderSourcesDropdown();
        
        sourceMassInput.value = "";
        sourceActivityInput.value = "";
        sourceDatetimeInput.value = "";
        sourceMassInput.dispatchEvent(new Event("input"));
    });

    sourceSelect.addEventListener("change", () => {
        if (currentHandle) {
            const v = sourceSelect.value;
            userProfiles[currentHandle].activeSource = v.startsWith("u_") ? v : parseInt(v, 10);
            saveToStorage();
        }
    });

    addUnknownSourceBtn.addEventListener("click", () => {
        if (!currentHandle) return;
        const name = unknownSourceInput.value.trim();
        if (!name) return;
        
        if (!userProfiles[currentHandle].unknownSources) userProfiles[currentHandle].unknownSources = [];
        userProfiles[currentHandle].unknownSources.push(name);
        
        saveToStorage();
        renderUnknownSourcesUI();
        
        unknownSourceInput.value = "";
    });

    unknownSourceInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addUnknownSourceBtn.click();
    });

    addAttenuatorBtn.addEventListener("click", () => {
        if (!currentHandle) return;
        const mat = attenuatorMaterialSelect.value;
        const thick = parseFloat(attenuatorThicknessInput.value);
        
        if (!mat || isNaN(thick)) {
            alert("Please select a material and enter thickness.");
            return;
        }
        
        if (!userProfiles[currentHandle].attenuators) userProfiles[currentHandle].attenuators = [];
        if (!userProfiles[currentHandle].activeAttenuators) userProfiles[currentHandle].activeAttenuators = [];
        
        const newAttenuator = { material: mat, thickness: thick };
        userProfiles[currentHandle].attenuators.push(newAttenuator);
        
        // Auto-check new item
        userProfiles[currentHandle].activeAttenuators.push(userProfiles[currentHandle].attenuators.length - 1);
        
        saveToStorage();
        renderAttenuatorsDropdown();
        
        attenuatorMaterialSelect.value = "";
        attenuatorThicknessInput.value = "";
    });

    addMeasurementBtn.addEventListener("click", () => {
        if (addMeasurementBtn.disabled || !currentHandle) return;
        
        const userData = userProfiles[currentHandle];
        
        // Detector
        const equipIdx = parseInt(equipSelect.value, 10);
        const equipItem = userData.equipment[equipIdx];
        const detName = typeof equipItem === 'string' ? equipItem : equipItem.name;
        
        // Source
        let isoText = "";
        let actStr = "";
        const selVal = sourceSelect.value;
        
        if (selVal.startsWith("u_")) {
            const uIdx = parseInt(selVal.replace("u_", ""), 10);
            isoText = userData.unknownSources[uIdx];
        } else {
            const sourceIdx = parseInt(selVal, 10);
            const src = userData.sources[sourceIdx];
            isoText = formatIsotopeStr(src.isotope);
            const curAct = calculateCurrentActivity(src);
            
            let expStr = curAct.toExponential(2); // 3 total sig-figs
            let parts = expStr.split("e");
            actStr = parseFloat(parts[0]).toString() + "E" + parts[1].replace('+', '');
        }
        
        // Attenuator
        let attenStr = "None";
        if (userData.activeAttenuators && userData.activeAttenuators.length > 0) {
            // Sort ascending index
            const activeIdxs = [...userData.activeAttenuators].sort((a,b)=>a-b);
            const attStrings = activeIdxs.map(idx => {
                const att = userData.attenuators[idx];
                return `${att.material} ${att.thickness}cm`;
            });
            attenStr = attStrings.join("; ");
        }
        
        // Distance
        const dist = parseFloat(distanceInput.value);
        
        // Reading Math
        const meas = parseFloat(measurementInput.value);
        const bg = parseFloat(backgroundInput.value);
        const netReading = meas - bg;
        const readingStr = isNaN(netReading) ? "" : parseFloat(netReading.toFixed(3)).toString();
        
        if (!userData.measurements) userData.measurements = [];
        userData.measurements.push({
            detName, isoText, actStr, attenStr, dist, netReading: readingStr
        });
        
        saveToStorage();
        renderMeasurementsTable();
        
        measurementInput.value = "";
        checkMeasurementBtn();
    });

    resetMeasurementsBtn.addEventListener("click", () => {
        if (!currentHandle) return;
        const userData = userProfiles[currentHandle];
        if (!userData || !userData.measurements) return;
        
        const equipIdx = parseInt(equipSelect.value, 10);
        if (isNaN(equipIdx)) return;
        
        const currDetItem = userData.equipment[equipIdx];
        if (!currDetItem) return;
        
        const currentDetName = typeof currDetItem === 'string' ? currDetItem : currDetItem.name;
        
        // Filter out measurements ONLY matching this actively partitioned detector natively
        userData.measurements = userData.measurements.filter(m => m.detName !== currentDetName);
        
        saveToStorage();
        renderMeasurementsTable();
    });

    // --- RIIDance Engine ---
    function renderRiidanceTab() {
        if (!riidanceUnknownSelect) return;
        riidanceUnknownSelect.innerHTML = "";
        const uOpt = document.createElement("option");
        uOpt.value = "";
        uOpt.textContent = "-- Select --";
        riidanceUnknownSelect.appendChild(uOpt);
        
        if (currentHandle && userProfiles[currentHandle]) {
            const userData = userProfiles[currentHandle];
            if (userData.unknownSources) {
                userData.unknownSources.forEach((uname, idx) => {
                    const opt = document.createElement("option");
                    opt.value = idx.toString();
                    opt.textContent = uname;
                    riidanceUnknownSelect.appendChild(opt);
                });
            }
        }
        
        riidanceTableBody.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Select an Unknown Source --</td></tr>';
    }

    if (riidanceUnknownSelect) {
        riidanceUnknownSelect.addEventListener("change", () => {
            const val = riidanceUnknownSelect.value;
            if (val !== "") {
                runIdentificationEngine(parseInt(val, 10));
            } else {
                riidanceTableBody.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Select an Unknown Source --</td></tr>';
            }
        });
    }

    function runIdentificationEngine(unknownIdx) {
        if (!currentHandle || !userProfiles[currentHandle]) return;
        const userData = userProfiles[currentHandle];
        const unknownName = userData.unknownSources[unknownIdx];
        
        const allUnkMeas = (userData.measurements || []).filter(m => m.isoText === unknownName);
        
        const unkMeasuresByDet = {};
        allUnkMeas.forEach(m => {
            if (!unkMeasuresByDet[m.detName]) unkMeasuresByDet[m.detName] = [];
            unkMeasuresByDet[m.detName].push(m);
        });
        
        const activeDetectorsData = [];
        
        for (const detName in unkMeasuresByDet) {
            const measArr = unkMeasuresByDet[detName];
            const baseMeasures = measArr.filter(m => m.attenStr === "None");
            if (baseMeasures.length === 0) continue;
            
            let sumY = 0;
            baseMeasures.forEach(m => sumY += parseFloat(m.netReading) * Math.pow(parseFloat(m.dist)/100.0, 2));
            const avgY = sumY / baseMeasures.length;
            if (avgY <= 0) continue;
            
            const activeAtts = [];
            if (userData.attenuators) {
                userData.attenuators.forEach(att => {
                    const attFormatted = `${att.material} ${att.thickness}cm`;
                    const attMeasures = measArr.filter(m => m.attenStr === attFormatted);
                    if (attMeasures.length > 0) {
                        let sumX = 0;
                        attMeasures.forEach(m => sumX += parseFloat(m.netReading) * Math.pow(parseFloat(m.dist)/100.0, 2));
                        const avgX = sumX / attMeasures.length;
                        const tExp = avgX / avgY;
                        activeAtts.push({
                            material: att.material,
                            thickness: parseFloat(att.thickness),
                            tExp: tExp
                        });
                    }
                });
            }
            if (activeAtts.length === 0) continue;
            
            const coeffs = getEpsilonCoeffsForDetector(userData, detName);
            
            activeDetectorsData.push({
                detName: detName,
                coeffs: coeffs,
                activeAtts: activeAtts
            });
        }
        
        if (activeDetectorsData.length === 0) {
            riidanceTableBody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Need baseline + attenuator measurements for at least one detector --</td></tr>';
            return;
        }

        const scores = [];
        
        isotopesData.forEach(iso => {
            const radsTemplate = iso.Radiations ? iso.Radiations.filter(r => parseFloat(r.Energy) >= 30 && r["Attenuation_cm-1"]) : [];
            if (radsTemplate.length === 0) return;
            
            let domEnergy = 0;
            let maxI = -1;
            radsTemplate.forEach(r => {
                const intensity = parseFloat(r.Intensity);
                if (intensity > maxI) {
                    maxI = intensity;
                    domEnergy = parseFloat(r.Energy);
                }
            });
            
            let jmse = 0;
            let validComplete = true;
            let contributingDetectors = [];
            
            activeDetectorsData.forEach(detData => {
                let detSSE = 0;
                let detValid = true;
                
                detData.activeAtts.forEach(att => {
                    const radsAtt = radsTemplate.filter(r => r["Attenuation_cm-1"][att.material]);
                    if (radsAtt.length === 0) {
                        detValid = false;
                        return;
                    }
                    
                    let sumA = 0;
                    let sumB = 0;
                    radsAtt.forEach(r => {
                        const intensity = parseFloat(r.Intensity) / 100.0;
                        const energy = parseFloat(r.Energy);
                        const mu = parseFloat(r["Attenuation_cm-1"][att.material]);
                        const eps = computeEpsilon(energy, detData.coeffs);
                        sumA += intensity * eps * Math.exp(-mu * att.thickness);
                        sumB += intensity * eps;
                    });
                    
                    if (sumB === 0) {
                        detValid = false;
                        return;
                    }
                    
                    const tTheo = sumA / sumB;
                    detSSE += Math.pow(att.tExp - tTheo, 2);
                });
                
                if (!detValid) {
                    validComplete = false;
                } else {
                    const mse = detSSE / detData.activeAtts.length;
                    jmse += mse;
                    contributingDetectors.push(detData.detName);
                }
            });
            
            if (validComplete && contributingDetectors.length > 0) {
                scores.push({
                    name: `${iso.A}-${iso.Element}`,
                    jmse: jmse,
                    domEnergy: domEnergy,
                    detectorsStr: contributingDetectors.join(", ")
                });
            }
        });
        
        scores.sort((a,b) => a.jmse - b.jmse);
        const top20 = scores.slice(0, 20);
        
        riidanceTableBody.innerHTML = "";
        
        if (top20.length === 0) {
            riidanceTableBody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- No valid isotopes found --</td></tr>';
            return;
        }

        top20.forEach((item, idx) => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
            
            const tdRank = document.createElement("td");
            tdRank.style.padding = "0.4rem 0.5rem";
            tdRank.textContent = (idx + 1).toString();
            if (idx === 0) {
                tdRank.style.color = "var(--tech-gold)";
                tdRank.style.fontWeight = "bold";
            }
            
            const tdName = document.createElement("td");
            tdName.style.padding = "0.4rem 0.5rem";
            tdName.textContent = formatIsotopeStr(item.name);
            if (idx === 0) {
                tdName.style.color = "var(--tech-gold)";
                tdName.style.fontWeight = "bold";
            }
            
            const tdScore = document.createElement("td");
            tdScore.style.padding = "0.4rem 0.5rem";
            tdScore.textContent = item.jmse < 0.0001 ? item.jmse.toExponential(3) : item.jmse.toFixed(5);
            
            const tdDom = document.createElement("td");
            tdDom.style.padding = "0.4rem 0.5rem";
            tdDom.textContent = item.domEnergy.toFixed(1) + " keV";
            
            const tdDet = document.createElement("td");
            tdDet.style.padding = "0.4rem 0.5rem";
            tdDet.style.fontSize = "0.8rem";
            tdDet.style.color = "var(--text-muted)";
            tdDet.textContent = item.detectorsStr;
            
            tr.appendChild(tdRank);
            tr.appendChild(tdName);
            tr.appendChild(tdScore);
            tr.appendChild(tdDom);
            tr.appendChild(tdDet);
            
            riidanceTableBody.appendChild(tr);
        });
    }

    // --- Initialization ---
    // If someone was logged in last time, log them back in automatically
    if (currentHandle) {
        userDisplay.textContent = currentHandle;
        renderEquipmentDropdown();
        renderSourcesDropdown();
        renderUnknownSourcesUI();
        renderAttenuatorsDropdown();
        renderMeasurementsTable();
        renderRiidanceTab();
    } else {
        renderEquipmentDropdown(); // Renders the disabled/guest state
        renderSourcesDropdown();
        renderUnknownSourcesUI();
        renderAttenuatorsDropdown();
        renderMeasurementsTable();
        renderRiidanceTab();
    }


});