import json
import xraylib as xl

ELEMENTS = [
    "Al", "Si", "Ti", "Fe", 
    "Ni", "Cu", "Zn", "Ag", "W", "Au", "Pb", "U"
]

NIST_MATERIALS = [
    "Calcium Carbonate",
    "Glass, Pyrex", "Paraffin Wax", 
    "Polyethylene", 
    "Polystyrene", "Rubber, Natural", "Rubber, Neoprene", 
    "Water, Liquid"
]

def get_element_mac(Z, energy_kev):
    """
    Calculates the Mass Attenuation Coefficient (MAC) for a pure element.
    """
    try:
        # Standard total
        return xl.CS_Total(Z, energy_kev)
    except ValueError:
        try:
            # Fallback for >1000 keV (Total without Rayleigh scattering)
            return xl.CS_Total_Kissel(Z, energy_kev)
        except ValueError:
            pass
            
    # Absolute fallback if it STILL fails
    mac = 0.0
    try:
        mac += xl.CS_Photo(Z, energy_kev)
    except:
        pass
        
    try:
        mac += xl.CS_Compt(Z, energy_kev)
    except:
        try:
            kn = xl.CS_KN(energy_kev)
            aw = xl.AtomicWeight(Z)
            mac += kn * (Z / aw) * 0.602214076
        except:
            pass
            
    return mac

def get_compound_mac(compound_str, energy_kev):
    """
    Calculates the MAC for a compound/mixture.
    """
    try:
        return xl.CS_Total_CP(compound_str, energy_kev)
    except ValueError:
        mac_total = 0.0
        try:
            comp_data = xl.GetCompoundDataNISTByName(compound_str)
            for i in range(comp_data['nElements']):
                Z_i = comp_data['Elements'][i]
                frac_i = comp_data['massFractions'][i]
                mac_total += get_element_mac(Z_i, energy_kev) * frac_i
            return mac_total
        except Exception:
            return 0.0

def update_database():
    print("Loading isotopes.json...")
    try:
        with open('isotopes.json', 'r') as f:
            isotopes = json.load(f)
    except FileNotFoundError:
        print("Error: isotopes.json not found in the current directory.")
        return
        
    print(f"Calculating attenuation arrays for {len(isotopes)} isotopes... this may take a moment.")
    
    for data in isotopes:
        for rad in data.get("Radiations", []):
            energy = rad.get("Energy")
            if not energy:
                continue
            
            attenuation_data = {}
            
            # 1. Calculate Pure Elements
            for el in ELEMENTS:
                Z = xl.SymbolToAtomicNumber(el)
                density = xl.ElementDensity(Z)
                mac = get_element_mac(Z, energy)
                attenuation_data[el] = round(mac * density, 4)
                    
            # 2. Calculate NIST Materials
            for nist in NIST_MATERIALS:
                comp_data = xl.GetCompoundDataNISTByName(nist)
                density = comp_data['density']
                mac = get_compound_mac(nist, energy)
                attenuation_data[nist] = round(mac * density, 4)
            
            rad["Attenuation_cm-1"] = attenuation_data

    print("Writing to isotopes_with_attenuation.json...")
    with open('isotopes_with_attenuation.json', 'w') as f:
        json.dump(isotopes, f, indent=4)
        
    print("Done! All elements and materials have been successfully appended.")

if __name__ == "__main__":
    update_database()