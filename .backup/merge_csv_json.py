import json
import csv

json_file = 'isotope_information.json'
csv_file = 'extracted from 2012 smith.csv'
out_file = 'isotope_information.json'

with open(json_file, 'r') as f:
    json_data = json.load(f)

csv_data_map = {}
with open(csv_file, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        nuclide = row['Nuclide'].strip()
        if not nuclide:
            continue
        # Split e.g. Be-7 into 'BE' and 7
        parts = nuclide.split('-')
        if len(parts) == 2:
            element = parts[0].upper()
            try:
                a_num = int(parts[1])
            except ValueError:
                continue
            
            # Additional keys to add
            stats = {
                'C m2 / kg MBq s': float(row['C m2 / kg MBq s']) if row.get('C m2 / kg MBq s') else None,
                'f-factor (cGy/R)': float(row['f-factor (cGy/R)']) if row.get('f-factor (cGy/R)') else None,
                'HVL': float(row['HVL']) if row.get('HVL') else None,
                'QVL': float(row['QVL']) if row.get('QVL') else None,
                'TVL': float(row['TVL']) if row.get('TVL') else None,
                'CVL': float(row['CVL']) if row.get('CVL') else None,
                'MVL': float(row['MVL']) if row.get('MVL') else None,
                'R/s at 1m': float(row['R/s at 1m']) if row.get('R/s at 1m') else None
            }
            csv_data_map[(element, a_num)] = stats

for iso in json_data:
    element = iso['Element'].upper()
    a_num = iso['A']
    
    key = (element, a_num)
    if key in csv_data_map:
        iso.update(csv_data_map[key])

with open(out_file, 'w') as f:
    json.dump(json_data, f, indent=4)

print(f"Successfully generated {out_file}")
