import json

with open('isotopes.json', 'r') as f:
    isotopes = json.load(f)

# Use a set to avoid asking XCOM to calculate duplicate energies
energies_mev = set()

for data in isotopes:
    for rad in data.get("Radiations", []):
        energy_kev = rad.get("Energy")
        if energy_kev:
            energies_mev.add(energy_kev / 1000.0) # Convert keV to MeV

# Sort and save to a text file
with open('energies.txt', 'w') as f:
    # First line must be the count of energies for XCOM
    f.write(f"{len(energies_mev)}\n")
    for e in sorted(energies_mev):
        f.write(f"{e:.6f}\n")

print(f"Extracted {len(energies_mev)} unique energies to energies.txt")