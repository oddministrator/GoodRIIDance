document.addEventListener("DOMContentLoaded", () => {
    // --- UI Elements ---
    const handleInput = document.getElementById("handle-input");
    const loginBtn = document.getElementById("login-btn");
    const userDisplay = document.getElementById("current-user-display");
    
    const equipSelect = document.getElementById("equipment-select");
    const newEquipInput = document.getElementById("new-equip-input");
    const equipCalibMassInput = document.getElementById("equip-calib-mass-input");
    const equipCalibIsotopeSelect = document.getElementById("equip-calib-isotope-select");
    const addEquipBtn = document.getElementById("add-equip-btn");

    const sourceSelect = document.getElementById("source-select");
    const sourceMassInput = document.getElementById("source-mass-input");
    const sourceIsotopeSelect = document.getElementById("source-isotope-select");
    const sourceActivityInput = document.getElementById("source-activity-input");
    const sourceActivityUnit = document.getElementById("source-activity-unit");
    const sourceDatetimeInput = document.getElementById("source-datetime-input");
    const addSourceBtn = document.getElementById("add-source-btn");

    const attenuatorSelect = document.getElementById("attenuator-select");
    const attenuatorMaterialSelect = document.getElementById("attenuator-material-select");
    const attenuatorThicknessInput = document.getElementById("attenuator-thickness-input");
    const addAttenuatorBtn = document.getElementById("add-attenuator-btn");

    const tabInventory = document.getElementById("tab-inventory");
    const tabResults = document.getElementById("tab-results");
    const tabPalette = document.getElementById("tab-palette");
    
    const panelInventory = document.getElementById("panel-inventory");
    const panelResults = document.getElementById("panel-results");
    const panelPalette = document.getElementById("panel-palette");

    const activeDetectorsUl = document.getElementById("inventory-detectors-ui");
    const activeSourcesUl = document.getElementById("inventory-sources-ui");
    const activeAttenuatorsUl = document.getElementById("inventory-attenuators-ui");

    let isotopesData = [];
    let attenuatorMaterials = [];
    fetch("isotopes_with_attenuation.json").then(r => r.json()).then(d => { 
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
        activeDetectorsUl.innerHTML = "";
        
        if (!currentHandle) {
            equipSelect.innerHTML = '<option value="">-- Log in to see equipment --</option>';
            activeDetectorsUl.innerHTML = '<li style="color: var(--text-muted); font-size: 0.9rem;">-- Log in to view --</li>';
            equipSelect.disabled = true;
            newEquipInput.disabled = true;
            equipCalibMassInput.disabled = true;
            equipCalibIsotopeSelect.disabled = true;
            addEquipBtn.disabled = true;
            return;
        }

        // Enable inputs
        equipSelect.disabled = false;
        newEquipInput.disabled = false;
        equipCalibMassInput.disabled = false;
        equipCalibIsotopeSelect.disabled = true; // Enabled by A# input
        addEquipBtn.disabled = false;

        const userData = userProfiles[currentHandle];

        if (userData.equipment.length === 0) {
            equipSelect.innerHTML = '<option value="">-- No equipment saved yet --</option>';
            activeDetectorsUl.innerHTML = '<li style="color: var(--text-muted); font-size: 0.9rem;">-- No detectors added --</li>';
        } else {
            // Populate the dropdown with the user's saved equipment
            userData.equipment.forEach((equipItem, idx) => {
                const name = typeof equipItem === 'string' ? equipItem : equipItem.name;
                const calib = equipItem.calib ? ` [Calib: ${equipItem.calib}]` : '';
                const displayStr = `${name}${calib}`;
                
                const option = document.createElement("option");
                option.value = idx.toString();
                option.textContent = displayStr;
                equipSelect.appendChild(option);

                const li = document.createElement("li");
                li.className = "inventory-list-item";
                
                const span = document.createElement("span");
                span.textContent = displayStr;
                
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
                
                li.appendChild(span);
                li.appendChild(delBtn);
                activeDetectorsUl.appendChild(li);
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
    }

    function format24HrTime(dateString) {
        return new Date(dateString).toLocaleString('en-GB', { 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', hour12: false 
        });
    }

    function formatIsotopeStr(isoStr) {
        const parts = isoStr.split('-');
        if (parts.length !== 2) return `[${isoStr}]`;
        const num = parts[0];
        const elem = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
        return `<sup>${num}</sup>${elem}`;
    }

    function calculateCurrentActivity(src) {
        let currentActivity = src.activity;
        const parts = src.isotope.split('-');
        if (parts.length === 2 && isotopesData.length > 0) {
            const aNum = parseInt(parts[0], 10);
            const elStr = parts[1].toUpperCase();
            const matchedIso = isotopesData.find(iso => iso.A === aNum && iso.Element.toUpperCase() === elStr);
            if (matchedIso && matchedIso["HalfLife_s"]) {
                const elapsedSeconds = (new Date() - new Date(src.datetime)) / 1000;
                const lambda = Math.LN2 / matchedIso["HalfLife_s"];
                currentActivity = src.activity * Math.exp(-lambda * elapsedSeconds);
            }
        }
        return currentActivity;
    }

    function formatActivity(val) {
        if (val > 100000 || val < 0.01) return val.toExponential(3);
        return val.toFixed(2);
    }

    function renderSourcesDropdown() {
        sourceSelect.innerHTML = "";
        const tbody = activeSourcesUl.querySelector("tbody");
        if(tbody) tbody.innerHTML = "";
        
        if (!currentHandle) {
            sourceSelect.innerHTML = '<option value="">-- Log in to see sources --</option>';
            if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- Log in to view --</td></tr>';
            sourceSelect.disabled = true;
            sourceMassInput.disabled = true;
            sourceIsotopeSelect.disabled = true;
            sourceActivityInput.disabled = true;
            sourceActivityUnit.disabled = true;
            sourceDatetimeInput.disabled = true;
            addSourceBtn.disabled = true;
            return;
        }

        sourceSelect.disabled = false;
        sourceMassInput.disabled = false;
        sourceIsotopeSelect.disabled = true; // Enabled when A# given
        sourceActivityInput.disabled = false;
        sourceActivityUnit.disabled = false;
        sourceDatetimeInput.disabled = false;
        addSourceBtn.disabled = false;

        const userData = userProfiles[currentHandle];
        if (!userData.sources) userData.sources = [];

        if (userData.sources.length === 0) {
            sourceSelect.innerHTML = '<option value="">-- No sources saved yet --</option>';
            if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); text-align: center; padding-top: 0.5rem;">-- No sources added --</td></tr>';
        } else {
            userData.sources.forEach((src, idx) => {
                const dateFixed = format24HrTime(src.datetime);
                const isoHtml = formatIsotopeStr(src.isotope);
                const isoText = src.isotope; 
                
                const curAct = calculateCurrentActivity(src);
                
                const optionStr = `[${isoText}] ${formatActivity(src.activity)} Bq (${dateFixed})`;
                const opt = document.createElement("option");
                opt.value = idx.toString();
                opt.textContent = optionStr;
                sourceSelect.appendChild(opt);

                if (tbody) {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                    
                    const tdIso = document.createElement("td");
                    tdIso.style.padding = "0.25rem 0";
                    tdIso.innerHTML = isoHtml;
                    
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
                        else if (userData.activeSource > idx) userData.activeSource--;
                        saveToStorage();
                        renderSourcesDropdown();
                    };
                    
                    tdDel.appendChild(delBtn);
                    
                    tr.appendChild(tdIso);
                    tr.appendChild(tdA0);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdAct);
                    tr.appendChild(tdDel);
                    tbody.appendChild(tr);
                }
            });
            if (userData.activeSource !== null && userData.activeSource !== undefined) {
                sourceSelect.value = userData.activeSource.toString();
            }
        }
    }

    function renderAttenuatorsDropdown() {
        attenuatorSelect.innerHTML = "";
        activeAttenuatorsUl.innerHTML = "";
        
        if (!currentHandle) {
            attenuatorSelect.innerHTML = '<option value="">-- Log in to see attenuators --</option>';
            activeAttenuatorsUl.innerHTML = '<li style="color: var(--text-muted); font-size: 0.9rem;">-- Log in to view --</li>';
            attenuatorSelect.disabled = true;
            attenuatorMaterialSelect.disabled = true;
            attenuatorThicknessInput.disabled = true;
            addAttenuatorBtn.disabled = true;
            return;
        }

        attenuatorSelect.disabled = false;
        attenuatorMaterialSelect.disabled = false;
        attenuatorThicknessInput.disabled = false;
        addAttenuatorBtn.disabled = false;

        const userData = userProfiles[currentHandle];
        if (!userData.attenuators) userData.attenuators = [];

        if (userData.attenuators.length === 0) {
            attenuatorSelect.innerHTML = '<option value="">-- No attenuators saved yet --</option>';
            activeAttenuatorsUl.innerHTML = '<li style="color: var(--text-muted); font-size: 0.9rem;">-- No attenuators added --</li>';
        } else {
            userData.attenuators.forEach((att, idx) => {
                const optionStr = `${att.material} (${att.thickness} cm)`;
                const opt = document.createElement("option");
                opt.value = idx.toString();
                opt.textContent = optionStr;
                attenuatorSelect.appendChild(opt);

                const li = document.createElement("li");
                li.className = "inventory-list-item";
                
                const span = document.createElement("span");
                span.textContent = optionStr;
                
                const delBtn = document.createElement("button");
                delBtn.className = "delete-btn";
                delBtn.textContent = "✖";
                delBtn.onclick = () => {
                    userData.attenuators.splice(idx, 1);
                    if (userData.activeAttenuator === idx) userData.activeAttenuator = null;
                    else if (userData.activeAttenuator > idx) userData.activeAttenuator--;
                    saveToStorage();
                    renderAttenuatorsDropdown();
                };
                
                li.appendChild(span);
                li.appendChild(delBtn);
                activeAttenuatorsUl.appendChild(li);
            });
            if (userData.activeAttenuator !== null && userData.activeAttenuator !== undefined) {
                attenuatorSelect.value = userData.activeAttenuator.toString();
            }
        }
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
                activeAttenuator: null
            };
        } else {
            if (!userProfiles[handleName].sources) {
                userProfiles[handleName].sources = [];
                userProfiles[handleName].activeSource = null;
            }
            if (!userProfiles[handleName].attenuators) {
                userProfiles[handleName].attenuators = [];
                userProfiles[handleName].activeAttenuator = null;
            }
        }

        currentHandle = handleName;
        userDisplay.textContent = currentHandle;
        saveToStorage();
        renderEquipmentDropdown();
        renderSourcesDropdown();
        renderAttenuatorsDropdown();
        handleInput.value = ""; // Clear the login box
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

    tabInventory.addEventListener("click", () => {
        tabInventory.classList.add("active");
        tabResults.classList.remove("active");
        tabPalette.classList.remove("active");
        
        panelInventory.style.display = "grid"; // It's a grid container
        panelResults.style.display = "none";
        panelPalette.style.display = "none";
    });

    tabResults.addEventListener("click", () => {
        tabResults.classList.add("active");
        tabInventory.classList.remove("active");
        tabPalette.classList.remove("active");
        
        panelResults.style.display = "block";
        panelInventory.style.display = "none";
        panelPalette.style.display = "none";
    });

    tabPalette.addEventListener("click", () => {
        tabPalette.classList.add("active");
        tabInventory.classList.remove("active");
        tabResults.classList.remove("active");
        
        panelPalette.style.display = "block";
        panelInventory.style.display = "none";
        panelResults.style.display = "none";
    });

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
            userProfiles[currentHandle].activeSource = parseInt(sourceSelect.value, 10);
            saveToStorage();
        }
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
        const newAttenuator = { material: mat, thickness: thick };
        userProfiles[currentHandle].attenuators.push(newAttenuator);
        userProfiles[currentHandle].activeAttenuator = userProfiles[currentHandle].attenuators.length - 1;
        
        saveToStorage();
        renderAttenuatorsDropdown();
        
        attenuatorMaterialSelect.value = "";
        attenuatorThicknessInput.value = "";
    });

    attenuatorSelect.addEventListener("change", () => {
        if (currentHandle) {
            userProfiles[currentHandle].activeAttenuator = parseInt(attenuatorSelect.value, 10);
            saveToStorage();
        }
    });

    // --- Initialization ---
    // If someone was logged in last time, log them back in automatically
    if (currentHandle) {
        userDisplay.textContent = currentHandle;
        renderEquipmentDropdown();
        renderSourcesDropdown();
        renderAttenuatorsDropdown();
    } else {
        renderEquipmentDropdown(); // Renders the disabled/guest state
        renderSourcesDropdown();
        renderAttenuatorsDropdown();
    }
});