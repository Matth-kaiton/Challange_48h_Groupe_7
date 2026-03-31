import pandas as pd
import requests
import io
import os
from datetime import datetime

# Configuration
date_du_jour = datetime.now().strftime("%Y-%m-%d")
URL_MESURES = f"https://object.infra.data.gouv.fr/api/v1/buckets/ineris-prod/objects/download?prefix=lcsqa%2Fconcentrations-de-polluants-atmospheriques-reglementes%2Ftemps-reel%2F2026%2FFR_E2_{date_du_jour}.csv"
URL_STATIONS_XLS = "https://static.data.gouv.fr/resources/donnees-temps-reel-de-mesure-des-concentrations-de-polluants-atmospheriques-reglementes-1/20251210-084445/fr-2025-d-lcsqa-ineris-20251209.xls"

# # Configuration
# date_du_jour = "2026-03-30" 
# URL_MESURES = f"https://object.infra.data.gouv.fr/api/v1/buckets/ineris-prod/objects/download?prefix=lcsqa%2Fconcentrations-de-polluants-atmospheriques-reglementes%2Ftemps-reel%2F2026%2FFR_E2_{date_du_jour}.csv"
# URL_STATIONS_XLS = "https://static.data.gouv.fr/resources/donnees-temps-reel-de-mesure-des-concentrations-de-polluants-atmospheriques-reglementes-1/20251210-084445/fr-2025-d-lcsqa-ineris-20251209.xls"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

OUTPUT_DIR = "backend/storage/app"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def run_pipeline():
    print("🚀 Pipeline Data : Fusion avec récupération des dates...")

    try:
        # 1. Lecture des mesures (CSV)
        res_m = requests.get(URL_MESURES)
        df_m = pd.read_csv(io.StringIO(res_m.text), sep=';')
        
        # Nettoyage des colonnes : on vire le BOM et on met en minuscules
        df_m.columns = df_m.columns.str.replace('ï»¿', '').str.replace('"', '').str.strip().str.lower().str.replace(' ', '_')

        # --- ASTUCE POUR LA DATE ---
        # On cherche la colonne qui contient "date" et "début" (ou "d" si l'accent saute)
        col_date_originale = [c for c in df_m.columns if 'date' in c and ('d' in c)][0]
        print(f"📅 Colonne date détectée : {col_date_originale}")

        # 2. Lecture des stations (XLS)
        res_s = requests.get(URL_STATIONS_XLS)
        df_s = pd.read_excel(io.BytesIO(res_s.content), engine='xlrd')
        df_s.columns = df_s.columns.str.strip().str.lower()

        # 3. La Jointure
        df_final = pd.merge(df_m, df_s, left_on='code_site', right_on='localid', how='inner')

        if df_final.empty:
            print("⚠️ Échec jointure ID, tentative sur le nom...")
            df_final = pd.merge(df_m, df_s, left_on='nom_site', right_on='name', how='inner')

        # 4. Préparation des colonnes finales
        # On gère le cas où latitude/longitude s'appellent y/x
        if 'latitude' not in df_final.columns and 'y' in df_final.columns:
            df_final = df_final.rename(columns={'y': 'latitude', 'x': 'longitude'})

        # On crée le DataFrame de sortie avec la date bien formatée
        df_export = pd.DataFrame()
        df_export['date'] = pd.to_datetime(df_final[col_date_originale], errors='coerce').dt.strftime('%Y-%m-%d %H:%M:%S')
        df_export['station'] = df_final['nom_site']
        df_export['polluant'] = df_final['polluant']
        df_export['valeur'] = df_final['valeur']
        df_export['lat'] = df_final['latitude']
        df_export['lon'] = df_final['longitude']

        # 5. Export JSON
        output_path = f"{OUTPUT_DIR}/pollution_gps.json"
        df_export.to_json(output_path, orient='records', force_ascii=False, indent=4)
        
        if not df_export.empty:
            print(f"✅ SUCCÈS ! {len(df_export)} lignes exportées avec dates et coordonnées.")
        else:
            print("❌ La fusion a encore échoué (0 ligne).")

    except Exception as e:
        print(f"💥 Erreur : {e}")
        if 'df_m' in locals(): print(f"Colonnes dispos dans mesures : {df_m.columns.tolist()}")

if __name__ == "__main__":
    run_pipeline()