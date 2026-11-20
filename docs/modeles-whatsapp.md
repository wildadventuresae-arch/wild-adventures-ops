# Modèles WhatsApp à créer

WhatsApp n'autorise un message libre que dans les **24 h** qui suivent le dernier message reçu du contact. Au-delà, il faut un **modèle approuvé par Meta**. L'appli choisit toute seule entre message libre et modèle.

Crée les modèles dans **WhatsApp Manager > Modèles de messages**, avec **exactement ces noms**, et les variables **dans cet ordre**. Crée chaque modèle en anglais (`en`) et en français (`fr`), puis indique les langues créées dans `WA_TEMPLATE_LANGS` (par exemple `en,fr`). C'est Meta qui fixe la catégorie (*Utility* ou *Marketing*) à l'approbation, ce qui change le prix par message.

## 1. `wa_booking_confirmation` — confirmation au client direct (sans commission)

Variables : {{1}} prénom · {{2}} date · {{3}} heure · {{4}} activité · {{5}} reste à payer sur place

**en**
```
Hello {{1}}, your Wild Adventures booking is confirmed ✅
📅 {{2}} at {{3}}
🏜️ {{4}}
💰 Remaining to pay on site: {{5}}
📍 Wild Adventures, Al Badayer. See you soon!
```

**fr**
```
Bonjour {{1}}, votre réservation Wild Adventures est confirmée ✅
📅 {{2}} à {{3}}
🏜️ {{4}}
💰 Reste à payer sur place : {{5}}
📍 Wild Adventures, Al Badayer. À très vite !
```

## 2. `wa_agent_booking` — récap à l'agent (avec commission)

Variables : {{1}} nom de l'agent · {{2}} n° booking · {{3}} client · {{4}} date · {{5}} heure · {{6}} activité · {{7}} commission · {{8}} solde

**fr**
```
Booking confirmé – Wild Adventures
Bonjour {{1}}, {{2}}
Client : {{3}}
Date : {{4}} à {{5}}
Activité : {{6}}
Votre commission : {{7}}
{{8}}
```

**en**
```
Booking confirmed – Wild Adventures
Hello {{1}}, {{2}}
Client: {{3}}
Date: {{4}} at {{5}}
Activity: {{6}}
Your commission: {{7}}
{{8}}
```

## 3. `wa_feedback_request` — message de 20 h

Variable : {{1}} prénom

**en**
```
Hi {{1}}, thank you for riding with Wild Adventures today! 🏜️ How was your experience? Just reply to this message.
```

**fr**
```
Bonjour {{1}}, merci d'avoir roulé avec Wild Adventures aujourd'hui ! 🏜️ Comment s'est passée votre expérience ? Répondez simplement à ce message.
```

La réponse du client ouvre une nouvelle fenêtre de 24 h. Le remerciement et le lien d'avis Google (envoyé seulement si la réponse est positive) partent donc en message libre, sans modèle.
