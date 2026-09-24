# Tahu — Supabase → PHP + MySQL migration

This folder replaces the browser-side Supabase database calls used by Tahu with a small PHP + MySQL API.

## What changed

- Browser JavaScript no longer needs the Supabase CDN or Supabase project URL/key.
- PHP owns the database connection through PDO.
- MySQL stores `tips`, `posts`, `comments`, and `post_votes`.
- All user-controlled SQL values use PDO prepared statements.
- JSON API responses are consistent and have HTTP status codes.
- Post/comment deletion uses an owner token rather than allowing arbitrary deletion by ID.
- Upvotes are stored in `post_votes`, so a visitor cannot repeatedly vote just by changing the displayed count.
- The existing visual design can remain unchanged.

PHP 8.1+ and MySQL 8+ are recommended. The PHP PDO MySQL driver must be enabled.

## Folder structure

```
php-sql/
├── README.md
├── config.example.php
├── .htaccess
├── database/
│   └── schema.sql
├── api/
│   ├── bootstrap.php
│   ├── tips.php
│   ├── posts.php
│   ├── comments.php
│   └── vote.php
└── frontend/
    └── tahu-db.js
```

## 1. Create the MySQL database

Open phpMyAdmin or MySQL and run `database/schema.sql`.

The schema intentionally matches the fields used by the current Supabase code:

- `tips`: id, subject, title, content, created_at
- `posts`: id, username, category, title, content, upvotes, owner_token_hash, created_at
- `comments`: id, post_id, username, content, owner_token_hash, created_at
- `post_votes`: post_id + visitor_token_hash unique pair

## 2. Configure PHP

Copy:

```
php-sql/config.example.php
```

to:

```
php-sql/config.php
```

Then put your local/hosting MySQL credentials in it.

**Never commit the real config.php.** The supplied .gitignore/hosting rules should keep it private.

## 3. Run it locally

With XAMPP:

1. Put the project inside `htdocs`.
2. Start Apache and MySQL.
3. Import `schema.sql`.
4. Create `php-sql/config.php`.
5. Open the project through Apache, for example:
   `http://localhost/Tahu/`

Do not open the HTML files using `file://`; PHP APIs need an HTTP server.

## 4. Frontend migration

The new frontend helper is:

```
<script src="php-sql/frontend/tahu-db.js"></script>
```

The subject pages can call:

```js
TahuDB.getTips("bm");
TahuDB.getTips("math");
TahuDB.getTips("science");
TahuDB.getTips("english");
```

Community operations are exposed through:

```js
TahuDB.getPosts();
TahuDB.createPost(...);
TahuDB.createComment(...);
TahuDB.deletePost(...);
TahuDB.deleteComment(...);
TahuDB.upvotePost(...);
```

## Why this architecture

The old application exposed a Supabase client in every browser page. That made the browser responsible for talking directly to the database service. The new flow is:

```
Browser
  ↓ fetch()
PHP JSON API
  ↓ PDO prepared statements
MySQL
```

The database password therefore stays on the server and never goes into JavaScript.

## Important limitation

This migration does not copy existing rows out of Supabase automatically. If you need the old production data, export the Supabase tables first and transform/import them into the MySQL schema. The migration code is designed so the application can run on a fresh MySQL database immediately.

## Security notes

This is intentionally stronger than the original anonymous community implementation, but it is still not a complete authentication system.

- Owner tokens are generated with PHP's cryptographically secure random generator and only their hashes are stored.
- Deletion requires the matching owner token.
- Vote records prevent duplicate votes for the same visitor token.
- Input lengths and allowed categories/subjects are validated server-side.
- SQL is parameterized with PDO.
- Error details are logged server-side rather than returned to the browser.

For a public production deployment, add real user authentication, CSRF protection for state-changing requests, rate limiting, moderation, and HTTPS.

## Official PHP references

- PDO prepared statements: https://www.php.net/manual/en/pdo.prepare.php
- PDO MySQL: https://www.php.net/manual/en/ref.pdo-mysql.php
- random_bytes: https://www.php.net/manual/en/function.random-bytes.php
- hash_equals: https://www.php.net/manual/en/function.hash-equals.php

## InfinityFree deployment

For production hosting on InfinityFree, use:

- `database/infinityfree.sql` — imports tables into an already-created InfinityFree database without `CREATE DATABASE` or `USE`.
- `config.infinityfree.example.php` — template for the server-only `config.php`.
- `INFINITYFREE.md` — complete upload, database, API testing, and troubleshooting guide.

The real `php-sql/config.php` is excluded by `.gitignore` and must be created on the hosting server with the credentials shown by InfinityFree.
