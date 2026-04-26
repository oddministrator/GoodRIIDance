import re

def refactor():
    with open('/home/notlogic/projects/MP6757/app.js.bak', 'r') as f:
        content = f.read()
    
    # We will strip out document.addEventListener("DOMContentLoaded", () => { and the trailing });
    content = re.sub(r'^document\.addEventListener\("DOMContentLoaded", \(\) => \{\s*', '', content)
    content = re.sub(r'\}\);\s*$', '', content)
    
    # BLOCK 1: DOM Elements
    # Extract all const/let declarations that get elements.
    dom_regex = r'(?:^|\n)\s*(?:const|let)\s+[a-zA-Z0-9_]+\s*=\s*document\.(?:getElementById|querySelector(?:All)?)\([^)]+\);'
    dom_matches = re.findall(dom_regex, content)
    dom_block = "\n    // --- Block 1: DOM Elements ---\n" + "".join(m + "\n" for m in dom_matches)
    
    # Remove DOM elements from content
    for m in set(dom_matches):
        content = content.replace(m.lstrip("\n"), "")
        
    # Remove some remaining newlines at the head
    content = content.lstrip()

    # BLOCK 2: State Variables
    state_vars = [
        "let userProfiles = {};",
        "let currentHandle = null;",
        "let isotopesData = [];",
        "let currentEfficiencyCoeffs = null;"
    ]
    state_block = "\n    // --- Block 2: State Variables ---\n    " + "\n    ".join(state_vars) + "\n"
    
    for v in state_vars:
        content = content.replace(v, "")

    # Clean up empty lines created
    content = re.sub(r'\n\s*\n', '\n', content)

    # BLOCK 3: Utility/Helper Functions
    # Create the new helpers
    helpers_new = """
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

    # We need to extract the existing helpers: formatIsotopeStr, formatActivity, format24HrTime
    # And remove them from the content
    def extract_func(func_name, code):
        pattern = r'(\s*function ' + func_name + r'\s*\([^)]*\)\s*\{(.|\n)*?\n    \})'
        match = re.search(pattern, code)
        if match:
            return match.group(1), code.replace(match.group(1), "")
        return "", code

    f_formatIso, content = extract_func('formatIsotopeStr', content)
    f_formatAct, content = extract_func('formatActivity', content)
    f_formatTime, content = extract_func('format24HrTime', content)
    
    # Ensure they are in the helpers block
    helpers_block = helpers_new + f_formatIso + f_formatAct + f_formatTime + "\n"

    # Refactor content to use getIsotopeData
    content = re.sub(r"const\s+parts\s*=\s*(?:[a-zA-Z0-9_\.]+|\[[^\]]+\])\.split\('-');\s*.*?find\(i\s*=>\s*i\.A\s*===\s*aNum\s*&&\s*i\.Element\.toUpperCase\(\)\s*===\s*elStr\);",
                     r"const matchedIso = getIsotopeData(\1);", content, flags=re.DOTALL)
    # The above regex might be fragile, let's just do Python string replacement for the common lines.
    
    return True

refactor()
