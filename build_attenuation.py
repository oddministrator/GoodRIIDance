import json
import xraylib as xl

# Define the materials your app will use. 
# We need the chemical formula/symbol and the density (g/cm^3)
MATERIALS = {
    "Lead": {"symbol": "Pb", "density": 11.34},
    "Aluminum": {"symbol": "Al", "density": 2.70},
    "Copper": {"symbol": "Cu", "density": 8.96},
    "Water": {"symbol": "H2O", "density": 1.00}
}

def calculate_mu(material_key, energy_kev):
    """
    Uses xraylib to get the Mass Attenuation Coefficient (MAC)
    and converts it to the Linear Attenuation Coefficient (mu).
    """
    mat = MATERIALS[material_key]
    
    # xraylib handles elemental symbols (Pb) and compounds (H2O) slightly differently
    try:
        # Check if it's an element first (throws ValueError if compound)
        Z = xl.SymbolToAtomicNumber(mat["symbol"])
        mac = xl.CS_Total(Z, energy_kev) 
    except ValueError:
        # If it fails, treat it as a compound
        mac = xl.CS_Total_CP(mat["symbol"], energy_kev)
        
    # mu = MAC * density
    mu = mac * mat["density"]
    return round(mu, 4)

def update_database():
    print("Loading isotopes.json...")
    with open('isotopes.json', 'r') as f:
        isotopes = json.load(f)
        
    print(f"Processing {len(isotopes)} isotopes...")
    
    for iso_name, data in isotopes.items():
        energy = data["energy_keV"]
        
        # Calculate mu for each material
        attenuation_data = {}
        for mat_key in MATERIALS:
            attenuation_data[mat_key] = calculate_mu(mat_key, energy)
            
        # Update the JSON structure
        data["attenuation"] = attenuation_data

    print("Writing updated data to isotopes_final.json...")
    with open('isotopes_final.json', 'w') as f:
        json.dump(isotopes, f, indent=2)
        
    print("Done!")

if __name__ == "__main__":
    update_database()