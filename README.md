# Challenge 48h - Groupe 7 🌍

## Vue d'ensemble

Ce projet est une application web développée en **48 heures** par le Groupe 7 d'Ynov pour analyser et visualiser les données de **pollution atmosphérique** et de **météorologie**.

L'application permet de :
- 📍 **Visualiser** les stations de mesure sur une carte interactive
- 📊 **Analyser** les mesures de pollution et de météorologie
- 🔍 **Explorer** les indices d'impact pour chaque locallisation
- 📈 **Consulter** les données historiques

## ⚠️ Important : Pas de Base de Données

**Ce projet n'utilise PAS de base de données traditionnelle.** 

En raison des contraintes du challenge 48h, les données sont stockées sous forme de fichiers JSON statiques :
- `storage/app/pollution_data.json` - Données brutes de pollution
- `storage/app/pollution_clean.json` - Données nettoyées et traitées

Les modèles Laravel et migrations ont été définis pour une évolutivité future, mais les données actuelles sont gérées via des fichiers JSON traités par des scripts Python.

## 🏗️ Architecture

### Structure du projet

```
├── backend/              # API Laravel (PHP)
│   ├── app/
│   │   ├── Http/Controllers/
│   │   └── Models/        # User, Station, PollutionMeasurement, etc.
│   ├── database/
│   │   ├── migrations/    # Schéma des tables (SQLite/MySQL)
│   │   └── seeders/       # Semis de données
│   ├── routes/api.php     # Endpoints API
│   └── storage/           # Stockage des fichiers
│
├── frontend/             # Application React + TypeScript
│   ├── src/
│   │   ├── main.js        # Point d'entrée
│   │   ├── style.css      # Styles
│   │   └── counter.js     # Composant exemple
│   ├── package.json
│   └── vite.config.ts     # Configuration Vite
│
├── scripts/              # Scripts Python
│   ├── process_data.py    # Traitement et nettoyage des données
│   └── requirements.txt   # Dépendances Python
│
├── storage/              # Données persistantes
│   └── app/
│       ├── pollution_data.json
│       └── pollution_clean.json
│
└── infra/               # Configuration infrastructure
```

### Stack Technologique

**Backend :**
- 🐘 **PHP 8.x**
- 🎯 **Laravel 12** (Framework)
- 🗄️ **SQLite/MySQL** (Migrations prêtes, données JSON actuellement)

**Frontend :**
- ⚛️ **React 19** (UI)
- 📘 **TypeScript** (Type safety)
- ⚡ **Vite** (Build tool)
- 🎨 **Tailwind CSS** (Styling)
- 🗺️ **Leaflet** & **React-Leaflet** (Cartes interactives)
- 🌐 **Axios** (HTTP client)

**Scripts :**
- 🐍 **Python 3** (Traitement de données)

## 🚀 Démarrage

### Prérequis

- **Node.js** 18+ et npm
- **PHP** 8.1+
- **Composer**
- **Python** 3.8+ (optionnel, pour traiter les données)

### Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd Challange_48h_Groupe_7
```

2. **Installation automatique (recommandé)**
```bash
npm run setup
```

Cette commande :
- Installe les dépendances npm du projet racine
- Installe les dépendances du frontend
- Installe les packages PHP (Composer)
- Génère la clé d'application Laravel

### Développement

#### Option 1 : Lancer tous les services

```bash
npm run dev
```

Cela va :
- Traiter les données Python
- Démarrer le serveur backend Laravel (http://localhost:8000)
- Démarrer le serveur frontend Vite (http://localhost:5173)

#### Option 2 : Lancer les services séparément

**Terminal 1 - Backend**
```bash
npm run backend
```
Accessible sur : http://localhost:8000

**Terminal 2 - Frontend**
```bash
npm run frontend
```
Accessible sur : http://localhost:5173

**Terminal 3 - Traiter les données (si nécessaire)**
```bash
npm run data
```

## 📊 Structure des Données

### Modèles Laravel

L'application définit les modèles suivants :

- **Station** - Stations de mesure avec localisation GPS
- **PollutionMeasurement** - Mesures de pollution (PM10, PM2.5, NO2, etc.)
- **WeatherMeasurement** - Données météorologiques (température, humidité, vitesse du vent)
- **ImpactIndex** - Indices d'impact calculés
- **User** - Utilisateurs de l'application

### Format des Données JSON

Les données de pollution sont stockées en JSON et traitées par les scripts Python :

```json
{
  "stations": [
    {
      "id": 1,
      "name": "Station Paris",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "measurements": [...]
    }
  ]
}
```

## 🔧 API Endpoints

Les endpoints API principaux (définis en Laravel) :

```
GET    /api/stations              - Récupérer toutes les stations
GET    /api/stations/{id}         - Détails d'une station
GET    /api/measurements          - Toutes les mesures
GET    /api/impact-indices        - Indices d'impact
```

(À adapter selon la configuration réelle du projet)

## 📝 Scripts Python

Le script `scripts/process_data.py` :
- Nettoie les données brutes
- Calcule les agrégations
- Valide l'intégrité des données
- Exporte en JSON pour consommation par l'API

Utilisation :
```bash
python scripts/process_data.py
```

## 🛠️ Développement

### Backend (PHP/Laravel)

```bash
cd backend

# Générer une nouvelle migration
php artisan make:migration create_my_table

# Lancer les migrations
php artisan migrate

# Lancer les seeders
php artisan db:seed

# Tests
./vendor/bin/phpunit
```

### Frontend (React)

```bash
cd frontend

# Linting
npm run lint

# Build pour prodution
npm run build

# Preview build local
npm run preview
```

## 📦 Build et Déploiement

### Production

**Backend :**
```bash
cd backend
composer install --optimize-autoloader --no-dev
php artisan optimize
```

**Frontend :**
```bash
cd frontend
npm run build
```

Les fichiers optimisés seront dans `frontend/dist/`

## 🐛 Tshoot

### Le backend ne démarre pas
```bash
cd backend
php artisan key:generate
php artisan config:cache
```

### Les données ne sont pas chargées
```bash
npm run data
```

### Problèmes de ports
- Backend : 8000 (configurable dans `backend/.env`)
- Frontend : 5173 (configurable dans `frontend/vite.config.ts`)

## 📚 Documentation

- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Leaflet Map Library](https://leafletjs.com)

## 👥 Équipe

Challenge 48h - Groupe 7 d'Ynov

## 📄 Licence

MIT

---

**⏰ Challenge terminé en 48h | 📅 Mars 2026**
