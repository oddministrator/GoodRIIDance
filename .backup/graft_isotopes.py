import json
import copy
import math

grafts = [
    {"target": "137-CS", "donor": "133-BA", "energy": 32.194, "intensity": 7.5},
    {"target": "131-I", "donor": "133-XE", "energy": 30.973, "intensity": 4.5},
    {"target": "141-CE", "donor": "137-PR", "energy": 34.72, "intensity": 8.5},
    {"target": "99-MO", "donor": "99-TC", "energy": 140.511, "intensity": 89.0},
    {"target": "140-BA", "donor": "140-LA", "energy": 487.021, "intensity": 45.5},
    {"target": "140-BA", "donor": "140-LA", "energy": 1596.21, "intensity": 95.4},
]

json_file = 'isotope_information.json'

with open(json_file, 'r') as f:
    data = json.load(f)

def find_isotope(a_num, element):
    for iso in data:
        if str(iso.get('A', '')) == str(a_num) and iso.get('Element', '').upper() == element.upper():
            return iso
    return None

for g in grafts:
    target_a, target_el = g['target'].split('-')
    donor_a, donor_el = g['donor'].split('-')
    target_iso = find_isotope(target_a, target_el)
    donor_iso = find_isotope(donor_a, donor_el)

    if not target_iso:
        print(f"Target '{g['target']}' not found.")
        continue
    if not donor_iso:
        print(f"Donor '{g['donor']}' not found.")
        continue
    
    rad_found = None
    min_diff = float('inf')
    
    for r in donor_iso.get('Radiations', []):
        energy = float(r.get('Energy', 0))
        diff = abs(energy - g['energy'])
        if diff < 0.2 and diff < min_diff:
            rad_found = r
            min_diff = diff

    if not rad_found:
        print(f"Radiation ~{g['energy']} not found in donor '{g['donor']}'.")
        continue

    new_rad = copy.deepcopy(rad_found)
    new_rad['Intensity'] = g['intensity']

    if 'Radiations' not in target_iso:
        target_iso['Radiations'] = []
    
    # Check if exactly this energy already exists to avoid duplicates
    exists = False
    for r in target_iso['Radiations']:
        if abs(float(r.get('Energy', 0)) - g['energy']) < 0.1:
            exists = True
            break
            
    if not exists:
        target_iso['Radiations'].append(new_rad)
        print(f"Successfully grafted {g['energy']} keV ({g['intensity']}%) from {g['donor']} to {g['target']}.")
    else:
        print(f"Radiation ~{g['energy']} already exists in target '{g['target']}', skipping.")

with open(json_file, 'w') as f:
    json.dump(data, f, indent=4)
