<<<<<<< HEAD
# Challenge 48h - Groupe 7 🌍

## Vue d'ensemble

Ce projet est une application web développée en **48 heures** par le Groupe 7 d'Ynov pour analyser et visualiser les données de **pollution atmosphérique** et de **météorologie**.

L'application permet de :
- 📍 **Visualiser** les stations de mesure sur une carte interactive
- 📊 **Analyser** les mesures de pollution et de météorologie
- 🔍 **Explorer** les indices d'impact pour chaque locallisation
- 📈 **Consulter** les données historiques

## ⚠️ Important : Pas de Base de Donnée

**Ce projet n'utilise PAS de base de données.** 

En raison des contraintes du challenge 48h et l'abcence des gens de la partie DATA, les données sont stockées sous forme de fichiers JSON statiques :
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

## � Démarrage avec Docker

### Prérequis Docker

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)

### Installation avec Docker

1. **Cloner le repository**
```bash
git clone <repository-url>
cd Challange_48h_Groupe_7
```

2. **Créer le fichier .env** (si nécessaire)
```bash
cp .env.example .env
# Éditer .env avec vos configurations (base de données, etc.)
```

3. **Lancer les services**
```bash
docker-compose up --build
```

Cela va :
- Construire les images Docker pour le backend et frontend
- Démarrer PostgreSQL (master et slave)
- Lancer l'API Laravel sur http://localhost:8000
- Lancer le frontend sur http://localhost:5173

### Commandes Docker utiles

```bash
# Démarrer les services en arrière-plan
docker-compose up -d

# Arrêter les services
docker-compose down

# Reconstruire les images
docker-compose build

# Voir les logs
docker-compose logs

# Accéder à un conteneur (ex: backend)
docker-compose exec backend bash

# Redémarrer un service
docker-compose restart backend
```

**Note :** Avec Docker, l'application utilise PostgreSQL comme base de données au lieu des fichiers JSON statiques.

## 🖼️ Captures d'écran - Filtres de carte

Pour mettre en valeur le fonctionnement des filtres sur la carte, ajoutez vos captures d'écran au dossier `docs/screenshots` (à créer si nécessaire). Ensuite, insérez-les ici :

- `docs/screenshots/filtres-1.png` : filtre par gamme de valeurs
- `docs/screenshots/filtres-2.png` : filtre par type de polluant
- `docs/screenshots/filtres-3.png` : agrégation des données par zone

```markdown
### 🔎 Exemple : Filtrage des données

![Filtre valeurs min/max](docs/screenshots/filtres-1.png)
*Filtre par valeurs min/max sur la carte.*

![Filtre polluant](docs/screenshots/filtres-2.png)
*Sélection d’un polluant spécifique (NO, NO2, O3...).*

![Carte agrégée](docs/screenshots/filtres-3.png)
*Affichage des clusters de stations après filtrage.*
```

> Astuce : Copiez les images fournies en pièce jointe dans `docs/screenshots` avec ces noms de fichiers pour que les liens fonctionnent.

## 🚀 Démarrage

### Prérequis

**Option 1 : Installation manuelle**
- **Node.js** 18+ et npm
- **PHP** 8.1+
- **Composer**
- **Python** 3.8+ (optionnel, pour traiter les données)

**Option 2 : Avec Docker**
- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)

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

#### Option 3 : Avec Docker

```bash
# Démarrer tous les services
docker-compose up

# Ou en arrière-plan
docker-compose up -d

# Arrêter
docker-compose down
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
=======
#  Projet Dockerisé – Plateforme Météo & Pollution

##  Description

Ce projet met en place une plateforme complète permettant de visualiser des données météorologiques et de pollution à travers une carte interactive.

L’application est composée de :

*  Frontend : React (Vite)
*  Backend : Laravel (API)
*  Base de données : PostgreSQL (architecture Master/Slave)
*  Orchestration : Docker & Docker Compose

---

##  Architecture

* **Frontend** → accessible publiquement
* **Backend** → accessible publiquement + accès interne
* **Base de données** → accessible uniquement via réseau privé

### Réseaux Docker

* `public` : frontend + backend
* `private` : backend + bases de données

---

##  Base de données

Architecture mise en place :

* **db-master** : gestion des écritures
* **db-slave** : réplication (lecture / secours)

Le backend est connecté au **master**.

---

##  Gestion des secrets

Les variables sensibles sont centralisées dans un fichier `.env` à la racine du projet.

---

##  Monitoring

Le monitoring des conteneurs est réalisé avec les commandes Docker :

```bash
docker ps
docker stats
```

---

##  Prérequis

* Docker
* Docker Compose

---

##  Installation

### 1. Cloner le projet

```bash
git clone <repo_url>
cd Challange_48h_Groupe_7
```

---

### 2. Créer le fichier `.env` (racine)

```bash
nano .env
```

Ajouter :

```env
POSTGRES_DB=app_db
POSTGRES_USER=dev
POSTGRES_PASSWORD=devpass
```

---

### 3. Vérifier le `.env` Laravel

Dans `backend/.env` il doit contenir:

```env
DB_CONNECTION=pgsql
DB_HOST=db-master
DB_PORT=5432
DB_DATABASE=app_db
DB_USERNAME=dev
DB_PASSWORD=devpass
```

---

## Lancer le projet

```bash
docker compose up --build
```

---

## Initialisation de la base

Dans un autre terminal :

```bash
docker compose exec backend php artisan migrate
```

---

## Accès aux services

* Frontend : http://localhost:5173
* Backend : http://localhost:8000

---

##  Points importants

* La base de données **n’est pas exposée à internet**
* Le backend communique avec la DB via le réseau privé
* Le frontend communique uniquement avec le backend

---


##  Fonctionnalités réalisées

*  Dockerisation complète
*  Architecture réseau sécurisée
*  Cluster DB Master/Slave
*  Monitoring des conteneurs
*  Centralisation des secrets

---

##  Auteur


