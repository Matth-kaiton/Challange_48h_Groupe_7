import pandas as pd
import requests
import io
import os
from datetime import datetime

# Utilisation du endpoint direct de l'infra data.gouv que tu as identifié
date_du_jour = "2026-03-30" # On peut automatiser avec datetime.now().strftime("%Y-%m-%d")
URL_PATTERN = f"https://object.infra.data.gouv.fr/api/v1/buckets/ineris-prod/objects/download?prefix=lcsqa%2Fconcentrations-de-polluants-atmospheriques-reglementes%2Ftemps-reel%2F2026%2FFR_E2_{date_du_jour}.csv"

# Dossier de sortie pour l'équipe Dev
OUTPUT_DIR = "storage/app"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def fetch_and_filter():
    print(f"🚀 Récupération du fichier : FR_E2_{date_du_jour}.csv")
    
    try:
        response = requests.get(URL_PATTERN, timeout=30)
        
        if response.status_code == 200:
            # Lecture avec le séparateur ';' identifié dans ton export précédent
            df = pd.read_csv(io.StringIO(response.text), sep=';', low_memory=False)
            
            # 1. Sélection des colonnes pertinentes selon le sujet [cite: 19, 21, 24]
            # On gère les caractères spéciaux (BOM) vus dans ton terminal
            mapping = {
                'ï»¿"Date de dÃ©but"': 'date_debut',
                'nom site': 'nom_station',
                'code site': 'code_station',
                'Polluant': 'polluant',
                'valeur': 'valeur',
                'unitÃ© de mesure': 'unite'
            }
            
            # On ne garde que ce qui existe dans le fichier
            cols_to_keep = [c for c in mapping.keys() if c in df.columns]
            df_filtered = df[cols_to_keep].rename(columns=mapping)
            
            # 2. Nettoyage rapide (enlever les valeurs vides)
            df_filtered = df_filtered.dropna(subset=['valeur'])

            # 3. Sauvegarde en JSON pour le backend Laravel [cite: 20]
            output_file = f"{OUTPUT_DIR}/pollution_clean.json"
            df_filtered.to_json(output_file, orient='records', force_ascii=False, indent=4)
            
            print(f"✅ Succès ! {len(df_filtered)} lignes filtrées sauvegardées.")
            print(f"📂 Fichier prêt pour le dev : {output_file}")
            
            return df_filtered
        else:
            print(f"❌ Erreur HTTP {response.status_code}. Vérifie la date du fichier.")
            
    except Exception as e:
        print(f"💥 Erreur technique : {e}")

if __name__ == "__main__":
    fetch_and_filter()