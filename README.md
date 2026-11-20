# Wild Adventures Ops

L'application d'exploitation de Wild Adventures (Al Badayer) : bookings, clients, agents et commissions, Storage, flotte, maintenance, staff, finance, App Guide, écran TV.
Elle est reliée à **WhatsApp** et à **Google Agenda**, avec un **agent IA** qui travaille sur WhatsApp.

## Ce que fait l'agent IA WhatsApp

1. **Un agent partenaire écrit** (son numéro est enregistré dans Agents) : l'agent IA comprend le booking (client, date, heure, machines, prix, montant encaissé par l'agent) et crée un **brouillon avec commission**. Il répond à l'agent que l'équipe confirme.
2. **Un client écrit en direct** : même chose, **sans agent ni commission**. Le nom vient du registre clients ou de son profil WhatsApp, et un Wild member est reconnu (−20 %). S'il manque une info (l'heure par exemple), l'agent IA la redemande dans la langue du client.
3. **La réception valide** le brouillon (onglet Booking > À valider, ou depuis la messagerie WhatsApp de l'appli) en un clic :
   - le booking part dans **Google Agenda** ;
   - l'**agent** reçoit le récap avec sa commission et ce qu'il doit à Wild ;
   - le **client direct** reçoit une **simple confirmation**, sans aucune mention de commission.
4. **Tous les soirs à 20 h (Dubaï)**, l'agent IA demande à chaque client dont le tour est terminé s'il a passé un bon moment.
   - **Réponse positive** : il remercie et envoie le **lien pour laisser un avis Google**.
   - **Réponse neutre ou négative** : il s'excuse, **n'envoie pas de lien**, prévient le responsable sur WhatsApp et crée une alerte « Client mécontent » dans l'appli.
5. **Reprise en main** : si quelqu'un de l'équipe répond depuis l'appli, ou depuis le téléphone (mode coexistence), l'agent IA se tait dans cette conversation.

Un booking modifié, reporté, annulé ou supprimé dans l'appli met aussi à jour l'événement Google Agenda.

## Architecture

```
public/          l'application (HTML, CSS, JavaScript), sans étape de compilation
api/             fonctions serveur Vercel
  whatsapp.js        webhook WhatsApp (réception des messages)
  booking-confirm.js validation : agenda + confirmation WhatsApp
  booking-sync.js    modification / annulation : mise à jour de l'agenda
  wa-send.js         réponse manuelle depuis l'appli
  cron-feedback.js   message de suivi de 20 h
  _lib/              agent IA, WhatsApp, Google Agenda, base de données, calculs
supabase/schema.sql  la base de données (à exécuter une fois)
tests/               tests automatiques (npm test)
```

Aucune dépendance npm : tout utilise le JavaScript standard de Node 20. La base est Supabase, l'hébergement Vercel.

---

## Mise en ligne, étape par étape

Compte environ une heure la première fois. Garde un fichier texte ouvert pour noter les clés : elles iront dans Vercel à l'étape 3.

### 1. Supabase (la base de données)

1. Crée un compte sur [supabase.com](https://supabase.com), puis **New project** (région conseillée : la plus proche de Dubaï proposée).
2. Menu **SQL Editor** > **New query** : colle tout le contenu de `supabase/schema.sql`, puis clique **Run**.
3. Menu **Project Settings** > **API**, note :
   - `Project URL` → **SUPABASE_URL**
   - `anon public` → **SUPABASE_ANON_KEY**
   - `service_role` → **SUPABASE_SERVICE_ROLE_KEY** (secrète : jamais dans l'appli ni sur WhatsApp)
4. Menu **Authentication** > **URL Configuration** : mets l'adresse de ton appli Vercel (étape 3) dans *Site URL*.

### 2. Les comptes de l'équipe

Pour chaque personne :

1. **Authentication** > **Users** > **Add user** > *Create new user* : e-mail + mot de passe, coche *Auto Confirm User*.
2. **SQL Editor**, en remplaçant l'e-mail, le nom et le rôle :

```sql
insert into public.staff_users (user_id, name, role)
select id, 'Mourad', 'owner' from auth.users where email = 'ton@email.com';
```

Rôles : `owner` (direction, voit tout), `manager`, `reception`, `guide` (App Guide uniquement), `mechanic`.
Pour un guide, mets **exactement le même nom** que dans l'onglet Staff de l'appli : c'est ainsi qu'il voit ses sorties.

### 3. Vercel (l'hébergement)

1. Sur [vercel.com](https://vercel.com) : **Add New** > **Project** > importe le dépôt GitHub `wild-adventures-ops`.
2. *Framework Preset* : **Other**. Laisse *Build Command* vide. *Output Directory* : `public`.
3. **Environment Variables** : ajoute les variables du fichier `.env.example`. Les trois Supabase suffisent pour démarrer ; tu ajouteras les autres au fil des étapes 4 à 6, puis tu cliqueras **Redeploy**.
4. Ajoute **CRON_SECRET** (une longue phrase au hasard) : elle protège le message de 20 h.
5. **Deploy**, puis ouvre l'adresse et connecte-toi avec ton compte. Au premier démarrage, l'appli enregistre le catalogue de tes flyers, une flotte type et une liste d'agents sans numéros. Vérifie ensuite dans l'appli : prix et agents (Réglages, Agents), machines (Flotte), et ajoute ton équipe dans **Staff**.

> Vercel réserve l'offre gratuite *Hobby* à un usage non commercial. Pour l'entreprise, prends l'offre *Pro*.

### 4. WhatsApp Business (Meta)

1. Dans [business.facebook.com](https://business.facebook.com), vérifie ton entreprise (Paramètres > Centre de sécurité).
2. Sur [developers.facebook.com](https://developers.facebook.com) : **Créer une app** > type *Business* > ajoute le produit **WhatsApp**.
3. **Numéro** : tu peux connecter ton numéro WhatsApp Business actuel en gardant l'appli sur ton téléphone (mode *coexistence*, via l'inscription intégrée de Meta ou un fournisseur agréé), ou utiliser un numéro dédié à l'agent IA.
4. Note le **Phone number ID** → **WA_PHONE_NUMBER_ID**.
5. **Jeton permanent** : Paramètres de l'entreprise > Utilisateurs système > crée un utilisateur système *Admin*, attribue-lui l'app et le compte WhatsApp, génère un jeton avec les autorisations `whatsapp_business_messaging` et `whatsapp_business_management` → **WA_TOKEN**.
6. Dans l'app Meta > Paramètres > Général : **Clé secrète de l'app** → **WA_APP_SECRET**.
7. Choisis un mot de passe au hasard → **WA_VERIFY_TOKEN**.
8. WhatsApp > Configuration > **Webhook** :
   - URL de rappel : `https://TON-APPLI.vercel.app/api/whatsapp`
   - Jeton de vérification : la valeur de WA_VERIFY_TOKEN
   - Abonne-toi aux champs **messages** (et **smb_message_echoes** si tu es en coexistence).
9. **Modèles de messages** : WhatsApp n'autorise un message libre que dans les 24 h qui suivent le dernier message du contact. Pour le message de 20 h et les confirmations envoyées plus tard, crée les 3 modèles décrits dans `docs/modeles-whatsapp.md`, puis renseigne **WA_TPL_CONFIRM**, **WA_TPL_AGENT**, **WA_TPL_FEEDBACK** et **WA_TEMPLATE_LANGS**.
10. Dans l'appli, onglet **Agents** : renseigne le **numéro WhatsApp de chaque agent**. C'est ce qui permet à l'agent IA de distinguer un agent (avec commission) d'un client direct.

Les messages envoyés par l'API sont facturés par Meta selon sa grille en vigueur.

### 5. Google Agenda

1. [console.cloud.google.com](https://console.cloud.google.com) : crée un projet, puis **API et services** > **Bibliothèque** > active **Google Calendar API**.
2. **IAM et administration** > **Comptes de service** > *Créer* > onglet **Clés** > *Ajouter une clé* > JSON. Un fichier se télécharge.
3. Colle **tout le contenu** de ce fichier dans la variable **GOOGLE_SERVICE_ACCOUNT**.
4. Dans Google Agenda > paramètres de ton agenda > **Partager avec des personnes** : ajoute l'e-mail du compte de service (il finit par `iam.gserviceaccount.com`), droit **Apporter des modifications aux événements**.
5. Même page, section *Intégrer l'agenda* : copie l'**ID de l'agenda** → **GOOGLE_CALENDAR_ID**.

### 6. L'agent IA

1. Sur [console.anthropic.com](https://console.anthropic.com) : crée une clé API → **ANTHROPIC_API_KEY**.
2. Optionnel : **ANTHROPIC_MODEL** pour choisir un autre modèle Claude que celui par défaut.

### 7. Réglages dans l'appli

Réglages > **Agent IA WhatsApp** :

- **Lien avis Google** : dans ton profil Google Business, *Demander des avis* > copie le lien.
- **WhatsApp du responsable** : reçoit l'alerte quand un client n'est pas content.
- **Suivi aussi pour les clients des agents** : coché par défaut.
- **L'agent IA répond aux messages** : décoche pour tout gérer à la main.

La carte affiche « Connecté » pour WhatsApp, Google Agenda et l'agent IA quand les variables sont en place.

---

## Au quotidien

- **Booking > À valider** : les bookings préparés par l'agent IA. *Vérifier et valider* ouvre le formulaire pré-rempli avec le message WhatsApp d'origine. Tu corriges si besoin, puis *Valider et confirmer*.
- **WhatsApp** : toutes les conversations, avec qui est agent ou client, ce qui est à valider et ce qui est « À traiter » (question complexe, réclamation, message vocal). *Prendre la main* coupe l'agent IA dans la conversation ; *Rendre la main* le réactive.
- **Centre d'actions** : clients mécontents à rappeler, bookings à valider, conversations à traiter.
- **Booking saisi à la main** (+ BOOKING) : à l'enregistrement, il part aussi dans l'agenda, et la confirmation WhatsApp est envoyée si la case est cochée.

## Sécurité

- Seuls les membres de `staff_users` connectés peuvent lire ou écrire (règles RLS de Supabase).
- La clé `service_role` et les clés WhatsApp, Google et Anthropic restent sur le serveur Vercel.
- Le webhook WhatsApp vérifie la signature de Meta (`WA_APP_SECRET`). Le message de 20 h n'est déclenché que par Vercel (`CRON_SECRET`).

## Limites connues de cette première version

- Si deux personnes modifient **le même booking au même moment**, c'est le dernier enregistrement qui gagne.
- La messagerie charge les 30 derniers jours de messages.
- L'agent IA peut mal comprendre un message : c'est pour cela que chaque booking WhatsApp passe par une validation.
- Les données de l'ancien prototype « Wild Adventures Booking » sont restées dans le navigateur où il a été utilisé. Elles ne sont pas reprises.

## Développement

```bash
npm test          # tests automatiques (agent IA, commissions, agenda, WhatsApp)
npm run dev       # appli sur http://localhost:3000 ; sans .env.local elle démarre en mode démo
```

Pour tester en local avec les vrais services, copie `.env.example` en `.env.local` et remplis-le. Ne publie jamais ce fichier.
