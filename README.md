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

Gros Quentin
