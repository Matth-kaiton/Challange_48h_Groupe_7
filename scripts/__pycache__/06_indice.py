import pandas as pd
from sklearn.preprocessing import MinMaxScaler

df = pd.read_csv("output/final_dataset.csv")

scaler = MinMaxScaler()

colonnes_a_normaliser = ['NO2', 'O3', 'PM10', 'PM25', 'temperature', 'humidity']
df[colonnes_a_normaliser] = scaler.fit_transform(df[colonnes_a_normaliser])

df['indice_pollution'] = (
    df['NO2']  * 0.30 +
    df['O3']   * 0.30 +
    df['PM10'] * 0.25 +
    df['PM25'] * 0.15
).clip(0, 1)

df['indice_meteo_pollution'] = (
    df['indice_pollution'] * 0.60 +
    df['temperature']      * 0.20 +
    df['humidity']         * 0.20
).clip(0, 1)

def niveau_risque(indice):
    if indice < 0.25:   return 'Faible'
    elif indice < 0.50: return 'Modéré'
    elif indice < 0.75: return 'Élevé'
    else:               return 'Très élevé'

df['niveau_pollution']       = df['indice_pollution'].apply(niveau_risque)
df['niveau_meteo_pollution'] = df['indice_meteo_pollution'].apply(niveau_risque)

print(df[['indice_pollution', 'niveau_pollution', 'indice_meteo_pollution', 'niveau_meteo_pollution']].head(10))

