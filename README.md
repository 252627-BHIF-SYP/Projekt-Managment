# Projektantrag

## Docker Start

```bash
docker compose up --build
```

Details stehen in [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md).

**Projektteam:**  
Milan Nuzdic, Semih Yüzüak, Danis Mezildzic

---

## 1. Ausgangslage

### 1.1 Ist-Situation

Derzeit werden Schulprojekte oft sehr unterschiedlich organisiert.  
Manche Lehrer nutzen E-Mails, andere Tabellen (z. B. Excel), manche handschriftliche Listen oder einzelne Online-Tools.  
Ein einheitliches System existiert meist nicht.

Dadurch entstehen mehrere Probleme:

- Fehlende Übersicht über laufende und kommende Projekte  
- Schüler wissen oft nicht genau, welchem Projekt sie zugeteilt sind  
- Betreuern fehlt ein zentraler Ort zur Verwaltung von Projektdaten  
- CSV-Listen mit Projekten müssen händisch sortiert oder übertragen werden  
- Keine Möglichkeit, Projekte zentral zu filtern oder gezielt zu suchen  

Insgesamt führt diese Situation zu unnötigem Zeitaufwand und unklaren Zuständigkeiten für Lehrer und Schüler.

---

### 2 Zielsetzung

Ziel des Projekts ist die Entwicklung einer zentralen, webbasierten Plattform zur Verwaltung von Schulprojekten.  
Die Plattform soll die derzeit uneinheitliche Organisation ersetzen und eine klare, strukturierte Lösung für Professoren und Schüler bieten.

Konkret soll die Plattform ermöglichen:

- Projekte zentral anzulegen, zu bearbeiten und zu löschen  
- Schüler und Betreuer eindeutig Projekten zuzuordnen  
- Projektdaten wie Titel, Beschreibung, GitHub-Link und Logo übersichtlich darzustellen  
- CSV-Dateien einzulesen, um mehrere Projekte automatisch zu erstellen  
- Projekte gezielt nach verschiedenen Kriterien zu filtern  

Im Vordergrund stehen dabei folgende Ziele:

- **Übersichtlichkeit:**  
  Alle Projekte, Klassen, Schüler und Betreuer sind zentral und strukturiert abrufbar.

- **Einfache Bedienung:**  
  Die Plattform soll intuitiv bedienbar sein und ohne lange Einschulung nutzbar sein.

- **Klare Rollenverteilung:**  
  Unterschiedliche Benutzerrollen (z. B. Professor, Betreuer, Schüler) haben klar definierte Rechte.

- **Zeitersparnis:**  
  Verwaltungsaufgaben wie Projektzuordnung, Suche und CSV-Import sollen deutlich vereinfacht werden.

Damit entsteht ein einheitliches System, das die Projektorganisation an der Schule nachhaltig verbessert.


## 3. Zielgruppen

### 3.1 Professorinnen und Professoren

Professoren nutzen die Plattform hauptsächlich zur Verwaltung von Projekten.  
Sie können Projekte anlegen, bearbeiten, löschen, Schüler zuordnen und Betreuer verwalten.

### 3.2 Schülerinnen und Schüler

Schüler können Projekte einsehen und Projekte anlegen.  
Sie dürfen ihr eigenes Projekt bearbeiten; ein Approval-System ist aktuell nicht vorgesehen.

---

## 4. Funktionsumfang (Features)

### 4.1 Allgemeine Funktionen

- **Projekt anlegen, bearbeiten und löschen**  
  Professoren können neue Projekte erstellen und verwalten.  
  Ein Projekt besteht aus:
  - Projekttitel  
  - Projektbeschreibung  
  - Projektlogo  
  - GitHub-Repository-Link  

- **Schüler und Betreuer zuordnen**  
  - Professoren, AV und Admins dürfen Schüler zu Projekten hinzufügen oder entfernen  
  - Ein Projekt kann mehrere Betreuer haben  

- **CSV-Import**  
  - Projekte einer ganzen Klasse können per CSV-Datei importiert werden  
  - Mehrere Projekte werden automatisch erstellt  
  - Fehlerhafte Einträge werden erkannt  

- **Filter- und Suchfunktion**  
  - Projekte können nach Klasse, Betreuer oder Projektname gefiltert werden  
  - Schnelles Auffinden bestimmter Projekte ist möglich  

---

### 4.2 Schülerfunktionen

- Schüler sehen die Projektübersicht und dürfen Projekte anlegen  
- Schüler dürfen folgende Daten bearbeiten:
  - Projektname  
  - Projektbeschreibung  
  - GitHub-Repository-Link  
  - Projektlogo  
- Änderungen am eigenen Projekt werden direkt gespeichert  


---

## 5. Erwarteter Nutzen

Durch die Einführung der Projektverwaltungsplattform ergeben sich folgende Vorteile:

- Einheitliche Projektverwaltung für die gesamte Schule  
- Deutliche Zeitersparnis für Professoren  
- Klare Zuordnung von Projekten, Schülern und Betreuern  
- Bessere Übersicht über alle laufenden Projekte  
- Reduzierung von Fehlern bei CSV-Listen und Projektzuweisungen  
