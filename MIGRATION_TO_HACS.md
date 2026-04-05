# Mediarr Card: Migration auf HACS (dein Setup)

Diese Schritte sind auf deine aktuelle Konfiguration unter `/home/daniel/ha-config` zugeschnitten.

## 1) Eigenes GitHub-Repo anlegen

1. Neues Repo erstellen, z. B. `yourname/mediarr-card`.
2. Inhalt von `/home/daniel/ha-config/www/mediarr-card` in dieses Repo pushen.
3. Prüfen, dass `hacs.json` im Repo-Root liegt.

Hinweis: In deinem Stand ist das bereits vorbereitet (`content_in_root: true`, `filename: mediarr-card.js`).

## 2) HACS Custom Repository hinzufügen

1. Home Assistant -> `HACS` -> `Frontend`.
2. Oben rechts `⋮` -> `Custom repositories`.
3. Repo-URL eintragen (dein neues GitHub-Repo).
4. Kategorie: `Dashboard`.
5. Speichern.

## 3) Card über HACS installieren

1. In HACS nach deiner Card suchen.
2. Installieren.
3. Home Assistant neu starten.

## 4) Alte manuelle Resource entfernen (wichtig)

Aktuell nutzt du manuell:

- `/local/mediarr-card/mediarr-card.20260403-20.js`

Nach der HACS-Installation muss diese alte Resource raus, damit es keine Doppel-Registrierung gibt.

Vorgehen:

1. Einstellungen -> Dashboards -> Ressourcen.
2. Alte `/local/mediarr-card/...` Resource löschen.
3. Prüfen, dass stattdessen HACS-Resource vorhanden ist:
   - `/hacsfiles/<dein-repo-name>/mediarr-card.js?hacstag=...`

## 5) Browser-Cache sauber neu laden

1. Home Assistant Frontend neu laden.
2. Browser Hard-Reload (`Strg+F5`).

## 6) Nach der Migration aufräumen (optional)

Wenn alles läuft, kannst du im lokalen Ordner die alten Version-Dateien aufräumen:

- `mediarr-card.20260403-13.js` bis `mediarr-card.20260403-20.js`

und nur `mediarr-card.js` behalten.

## 7) Updates künftig sauber machen

1. Änderungen in dein GitHub-Repo committen.
2. Release/Tag erstellen.
3. HACS Update ausführen.

Wenn du weiterhin interne Modul-Cache-Probleme siehst, erhöhe die Query-Version in den Importen (z. B. `?v=20260403-21`), dann wird auch bei Submodulen sicher neu geladen.

