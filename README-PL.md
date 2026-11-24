# Świąteczne losowanie — Cloudflare Pages + D1

Ta wersja używa Cloudflare Pages Functions i bazy D1. Nie wymaga Netlify ani JSONBlob.

## 1. Wgraj pliki do GitHuba

W katalogu głównym repozytorium powinny znajdować się:
- `index.html`
- `functions/api/room.js`
- `schema.sql`

Nie umieszczaj plików w dodatkowym, zagnieżdżonym katalogu. Jeśli w repozytorium są stare pliki `netlify.toml` lub `netlify/`, usuń je — ta wersja ich nie używa.

## 2. Utwórz bazę D1

1. Zaloguj się do Cloudflare: https://dash.cloudflare.com/
2. Otwórz **Workers & Pages → D1 SQL Database** (lub **Storage & databases → D1**).
3. Wybierz **Create database**, nazwij ją np. `secret-santa-db` i utwórz.
4. Otwórz bazę, wybierz **Console** i wykonaj SQL z pliku `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS rooms (
  room_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## 3. Połącz GitHuba z Cloudflare Pages

1. Wejdź w **Workers & Pages → Create application → Pages → Connect to Git**.
2. Wybierz GitHub i repozytorium z projektem.
3. Ustaw branch produkcyjny na `main` (lub ten, którego używasz).
4. Framework preset: **None**.
5. Build command: `exit 0`.
6. Build output directory: `.`
7. Root directory pozostaw pusty (jeśli pliki są w katalogu głównym repozytorium).
8. Kliknij **Save and Deploy**.

## 4. Dodaj powiązanie D1 (konieczne)

Po pierwszym wdrożeniu:
1. Otwórz projekt Pages w Cloudflare.
2. Wejdź w **Settings → Bindings**.
3. Wybierz **Add → D1 database**.
4. Jako Variable name wpisz dokładnie `DB`.
5. Wybierz bazę `secret-santa-db`.
6. Zapisz i wykonaj ponowne wdrożenie (Redeploy), aby binding zaczął działać.

## 5. Test

Otwórz `https://TWOJ-PROJEKT.pages.dev/api/room?room=testroom`.
Odpowiedź `404 Room not found` oznacza, że funkcja działa i baza jest osiągalna, ale pokój testroom jeszcze nie istnieje. Odpowiedź `500 D1 binding DB is missing` oznacza, że binding `DB` nie został dodany lub projekt nie został ponownie wdrożony.

Następnie otwórz główny adres strony na dwóch urządzeniach. Oba muszą używać tego samego linku pokoju (ten sam fragment po `#`). Losowanie i PIN powinny być widoczne po synchronizacji; strona odświeża dane co około 3 sekundy.

## Ważne

- Nie używaj równocześnie starego adresu Netlify i nowego Cloudflare — korzystaj z jednego wspólnego adresu Pages.
- PIN jest przechowywany w bazie jako zwykły tekst. To prosta ochrona w aplikacji, nie silne uwierzytelnianie.
- Aplikacja zapisuje cały stan pokoju przy każdej zmianie. Przy niemal równoczesnych zapisach z wielu urządzeń ostatni zapis może nadpisać wcześniejszy. Dla małej grupy używaj po kolei przy ustawianiu PIN-ów i losowaniu.
