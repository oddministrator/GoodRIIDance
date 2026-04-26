import re

with open('app.js.bak', 'r') as f:
    text = f.read()

# 1. ADD HELPERS
helpers = """
    // --- Block 3: Utility/Helper Functions ---
    function createCell(text, align = "left", isHTML = false) {
        const td = document.createElement("td");
        td.style.padding = "0.25rem 0.5rem";
        td.style.textAlign = align;
        if (isHTML) {
            td.innerHTML = text;
        } else {
            td.textContent = text;
        }
        return td;
    }

    function getIsotopeData(isoString) {
        if (!isotopesData || isotopesData.length === 0) return null;
        const parts = isoString.split('-');
        if (parts.length !== 2) return null;
        const aNum = parseInt(parts[0], 10);
        const elStr = parts[1].toUpperCase();
        return isotopesData.find(i => i.A === aNum && i.Element.toUpperCase() === elStr) || null;
    }
"""
text = text.replace('    // --- Functions ---', helpers)

# 2. REPLACE TD CELLS (Simple and safe approach)
td_regex = re.compile(
    r'const\s+([a-zA-Z0-9_]+)\s*=\s*document\.createElement\("td"\);\s*\n'
    r'\s*\1\.style\.padding\s*=\s*"0\.25rem\s+[0\.5rem0]+";\s*\n'
    r'(?:\s*\1\.style\.textAlign\s*=\s*"right";\s*\n)?'
    r'(?:\s*\1\.style\.width\s*=\s*"[^"]+";\s*\n)?'
    r'\s*\1\.(textContent|innerHTML)\s*=\s*([^;]+);',
    re.MULTILINE
)

def td_repl(match):
    var_name = match.group(1)
    is_right = 'textAlign = "right"' in match.group(0)
    align = '"right"' if is_right else '"left"'
    
    is_html = 'true' if match.group(2) == 'innerHTML' else 'false'
    val = match.group(3)
    
    if align == '"left"' and is_html == 'false':
        return f"const {var_name} = createCell({val});"
    elif is_html == 'false':
        return f"const {var_name} = createCell({val}, {align});"
    else:
        return f"const {var_name} = createCell({val}, {align}, {is_html});"

text = td_regex.sub(td_repl, text)

# 3. REPLACE ISOTOPE LOOKUP (Specific static string patches)
iso1 = """        const parts = calib.split('-');
        let calEnergy = 0;
        
        if (parts.length === 2 && typeof isotopesData !== 'undefined' && isotopesData.length > 0) {
            const aNum = parseInt(parts[0], 10);
            const elStr = parts[1].toUpperCase();
            const matched = isotopesData.find(i => i.A === aNum && i.Element.toUpperCase() === elStr);
            if (matched && matched.Radiations) {"""
rep1 = """        const matched = getIsotopeData(calib);
        let calEnergy = 0;
        if (matched && matched.Radiations) {"""

iso2 = """            const ps = src.isotope.split('-');
            let mIso = null;
            if (ps.length === 2 && typeof isotopesData !== 'undefined') {
                const aN = parseInt(ps[0], 10);
                const eS = ps[1].toUpperCase();
                mIso = isotopesData.find(i => i.A === aN && i.Element.toUpperCase() === eS);
            }
            if (!mIso || !mIso.Radiations) return;"""
rep2 = """            const mIso = getIsotopeData(src.isotope);
            if (!mIso || !mIso.Radiations) return;"""

iso3 = """        const parts = src.isotope.split('-');
        if (parts.length === 2 && isotopesData.length > 0) {
            const aNum = parseInt(parts[0], 10);
            const elStr = parts[1].toUpperCase();
            const matchedIso = isotopesData.find(iso => iso.A === aNum && iso.Element.toUpperCase() === elStr);
            if (matchedIso && matchedIso["Half life"]) {"""
rep3 = """        const matchedIso = getIsotopeData(src.isotope);
        if (matchedIso && matchedIso["Half life"]) {"""

iso4 = """                        const parts = src.isotope.split('-');
                        if (parts.length === 2 && isotopesData.length > 0) {
                            const aNum = parseInt(parts[0], 10);
                            const elStr = parts[1].toUpperCase();
                            const matchedIso = isotopesData.find(iso => iso.A === aNum && iso.Element.toUpperCase() === elStr);
                            if (matchedIso && matchedIso["Half life"]) {"""
rep4 = """                        const matchedIso = getIsotopeData(src.isotope);
                        if (matchedIso && matchedIso["Half life"]) {"""

iso5 = """        const parts = isoStr.split('-');
        if (parts.length !== 2) return isoStr;
        const num = toUnicodeSuperscript(parts[0]);
        const elem = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();"""
rep5 = """        const parts = isoStr.split('-');
        if (parts.length !== 2) return isoStr;
        const num = toUnicodeSuperscript(parts[0]);
        const elem = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();"""

# identification engine
iso6 = """                    const parts = isoObj.raw.split('-');
                    let matchedIso = null;
                    if (parts.length === 2) {
                        const aNum = parseInt(parts[0], 10);
                        const elStr = parts[1].toUpperCase();
                        matchedIso = (isotopesData || []).find(i => i.A === aNum && i.Element.toUpperCase() === elStr);
                    }"""
rep6 = """                    const matchedIso = getIsotopeData(isoObj.raw);"""

iso7 = """                    const parts = src.isotope.split('-');
                    let matchedIso = null;
                    if (parts.length === 2) {
                        const aNum = parseInt(parts[0], 10);
                        const elStr = parts[1].toUpperCase();
                        matchedIso = (isotopesData || []).find(i => i.A === aNum && i.Element.toUpperCase() === elStr);
                    }"""
rep7 = """                    const matchedIso = getIsotopeData(src.isotope);"""

text = text.replace(iso1, rep1)
text = text.replace(iso2, rep2)
text = text.replace(iso3, rep3)
text = text.replace(iso4, rep4)
text = text.replace(iso6, rep6)
text = text.replace(iso7, rep7)

with open('app.js', 'w') as f:
    f.write(text)

