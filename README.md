# Portfolio-Website — Emili Gaßner

Reine HTML/CSS/JS-Website, kein Build-Step, keine Frameworks. Einfach
hochladen und läuft.

---

## Dateien

```
index.html      # Hauptseite (alle Sektionen)
style.css       # Komplettes Stylesheet
script.js       # Navigation, Form-Validierung, Animations
images/         # Alle Bilder (~2,5 MB total)
README.md       # Diese Datei
```

---

## Lokal ansehen

Datei `index.html` einfach im Browser öffnen — fertig. Alternativ einen
kleinen lokalen Server starten, dann funktionieren auch die
`loading="lazy"` Bilder am realistischsten:

```bash
# Python 3 (in dem Ordner ausführen)
python3 -m http.server 8000
# dann http://localhost:8000 im Browser öffnen
```

---

## Online stellen — drei einfache Wege

### Variante A — Netlify Drop (am einfachsten, kostenlos)
1. Auf https://app.netlify.com/drop gehen
2. Den ganzen `website`-Ordner per Drag & Drop ins Browser-Fenster ziehen
3. Fertig — Netlify gibt eine URL wie `https://schoener-name-12345.netlify.app`
4. Optional: eigene Domain (z. B. `emili-gassner.de`) in den Netlify-Einstellungen verknüpfen

### Variante B — GitHub Pages (kostenlos, braucht GitHub-Account)
1. Neues Repository auf GitHub anlegen
2. Alle Dateien hochladen (oder `git push`)
3. Im Repo → Settings → Pages → Branch `main` auswählen
4. Nach 1–2 Minuten ist die Seite unter `https://username.github.io/reponame` live

### Variante C — Klassisches Webhosting (eigene Domain)
1. Per FTP/SFTP alle Dateien in das Root-Verzeichnis des Webspaces hochladen (z. B. `htdocs/` oder `public_html/`)
2. Sicherstellen, dass `index.html` direkt im Root liegt
3. Die Domain ruft die Seite automatisch auf

---

## Kontaktformular anpassen

Das Formular läuft standardmäßig im **mailto-Modus**: beim Absenden
öffnet sich Emilis Mail-Programm mit vorausgefüllter Nachricht. Das
funktioniert sofort, ohne Backend.

Für echte Form-Submissions (Formular sendet die Nachricht im
Hintergrund per E-Mail an Emili) gibt es zwei kostenlose Alternativen.
Die Umstellung ist eine kleine Code-Änderung in `script.js`.

### Option 1 — Formspree (50 Mails/Monat kostenlos)
1. Account auf https://formspree.io anlegen
2. Neues Formular erstellen, Form-ID kopieren (z. B. `xyzabcde`)
3. In `script.js` Zeile mit `FORM_MODE` und `FORMSPREE_ID` anpassen:
   ```javascript
   const FORM_MODE = 'formspree';
   const FORMSPREE_ID = 'xyzabcde';   // hier die echte ID
   ```

### Option 2 — Web3Forms (250 Mails/Monat kostenlos, kein Account nötig)
1. Auf https://web3forms.com → E-Mail eingeben → Access Key per Mail erhalten
2. In `script.js`:
   ```javascript
   const FORM_MODE = 'web3forms';
   const WEB3FORMS_KEY = 'a1b2c3d4-...';   // hier den echten Key
   ```

### Empfänger-Adresse ändern
In `script.js` ganz oben im Form-Abschnitt:
```javascript
const RECIPIENT = 'emiligassner2@gmail.com';
```
Auch in `index.html` im Kontakt-Bereich gibt es zwei `mailto:`-Links
zur E-Mail, die ebenfalls geändert werden müssen.

---

## Wichtig vor dem Live-Gang (Deutschland/EU)

Aktuell sind Impressum und Datenschutzerklärung **nicht hinterlegt** —
sie zeigen beim Klick nur einen Hinweis. Vor der Veröffentlichung
beide Seiten anlegen, sonst drohen Abmahnungen:

- **Impressum** ist nach § 5 TMG Pflicht (Name, Anschrift, Kontakt, ggf. USt-ID)
- **Datenschutzerklärung** ist nach DSGVO Pflicht — wegen des Kontaktformulars besonders wichtig

Empfehlung: kostenlose Generatoren wie
[datenschutz-generator.de](https://datenschutz-generator.de) oder
[e-recht24.de](https://www.e-recht24.de) nutzen. Die generierten Texte
einfach in zwei neue Dateien `impressum.html` und `datenschutz.html`
packen (Vorlage: bestehende `index.html` kopieren, Inhalt ersetzen),
und in `script.js` die beiden `e.preventDefault()`-Handler entfernen,
sodass die Links direkt auf die Dateien zeigen.

---

## Texte / Inhalte anpassen

Alle Texte stehen direkt in `index.html` — einfach in einem
Texteditor öffnen und ändern. Die wichtigsten Stellen:

- **Hero** (Zeile ~20-35): Titel, Untertitel, Berufsbezeichnung
- **Über mich** (Zeile ~45-65): Persönliche Vorstellung, Skills-Liste
- **Projekte**: Jedes Projekt ist eine `<section class="project project--...">`
- **Lebenslauf** (Timeline): Berufsstationen
- **Kontakt**: E-Mail, Telefon, Standort

Farben, Schriften und Abstände lassen sich zentral in `style.css` ganz
oben unter `:root { ... }` anpassen.

---

## Was geht gut, was geht nicht (HTML-only-Limit)

**Geht:**
- Komplettes Design, alle Animationen, responsive Layout
- Form-Validierung im Browser
- mailto-Bridge (öffnet Mail-Programm)
- mit Formspree/Web3Forms: echtes E-Mail-Versenden

**Geht nicht (ohne Server):**
- Datenbank, Login, Admin-Bereich
- Dateien direkt auf dem Server speichern
- Server-seitige Form-Verarbeitung mit eigenem PHP/Node

Falls später mal Bedarf für Login oder ein CMS entsteht: dann auf
einen statischen Site-Generator (Astro, Eleventy) oder ein Headless
CMS (Sanity, Strapi) umstellen — aber bis dahin reicht reines HTML
für ein Portfolio locker.
