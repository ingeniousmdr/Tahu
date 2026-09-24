# Tahu — InfinityFree deployment

This guide deploys the PHP + MySQL version of Tahu to InfinityFree.

## Production folder

Upload the website files into the hosting account's web root (normally htdocs):

htdocs/
├── index.html
├── community.html
├── bm.html
├── math.html
├── english.html
├── science.html
├── learn.html
├── quiz.html
├── tips.html
├── style.css
├── script.js
├── subject.js
├── tips.js
├── your-image-and-video-assets...
└── php-sql/
    ├── .htaccess
    ├── config.php                 # create on the server; never commit
    ├── api/
    │   ├── bootstrap.php
    │   ├── tips.php
    │   ├── posts.php
    │   ├── comments.php
    │   └── vote.php
    └── frontend/
        ├── tahu-db.js
        ├── subject-tips.js
        └── community.js

Do not upload node_modules/, .git/, or development-only files.

## 1. Create the InfinityFree hosting account

Create an InfinityFree hosting account and a domain/subdomain. Wait until the hosting account is active.

## 2. Create the MySQL database

In the InfinityFree control panel:

1. Open MySQL Databases.
2. Create a database.
3. Record the exact MySQL hostname, database name, username, and password.
4. Open the database in phpMyAdmin.

Do not assume the hostname is localhost. Use the exact hostname displayed by InfinityFree.

## 3. Create the production tables

Open phpMyAdmin and select the newly-created InfinityFree database.

Import:
php-sql/database/infinityfree.sql

This file intentionally has NO CREATE DATABASE and NO USE statement because InfinityFree already created the database.

After importing, verify that these four tables exist:
tips
posts
comments
post_votes

## 4. Create config.php

Start with:
php-sql/config.infinityfree.example.php

Copy it to:
php-sql/config.php

Put the real InfinityFree MySQL values into config.php.

Example shape only:
'host' => 'sql123.infinityfree.com',
'port' => 3306,
'name' => 'if0_12345678_tahu',
'user' => 'if0_12345678',
'pass' => 'YOUR_REAL_PASSWORD',

Those values are examples. Use the exact values from your own InfinityFree account.

Never commit the real config.php to GitHub.

The .htaccess in php-sql/ also blocks direct web access to configuration files when Apache is serving the site.

## 5. Upload the site

Upload the site files to the directory assigned to your domain, normally htdocs.

The homepage must be directly in the web root:
htdocs/index.html

not:
htdocs/Tahu/index.html

unless you intentionally want the site under /Tahu/.

Keep php-sql/ beside the HTML files because the frontend currently uses relative API paths such as:
php-sql/api/posts.php

## 6. Test the API before testing the UI

Open:
https://YOUR-DOMAIN/php-sql/api/tips.php?subject=math

A working installation should return JSON.

Then open:
https://YOUR-DOMAIN/php-sql/api/posts.php

It should return a JSON response containing the current posts.

If either endpoint returns HTTP 500, check php-sql/config.php first and then inspect the server/PHP error logs available through the hosting panel.

## 7. Test the website

Open your domain and test:
1. Homepage
2. BM
3. Math
4. English
5. Science
6. Community

On Community, test:
1. Create a post
2. Refresh the page
3. Add a comment
4. Upvote a post
5. Delete your own post/comment

## 8. Test from the browser console

Press F12 -> Network.

For Community, you should see requests similar to:
GET  php-sql/api/posts.php
POST php-sql/api/posts.php
POST php-sql/api/comments.php
POST php-sql/api/vote.php
DELETE php-sql/api/posts.php?id=...

A 404 usually means a path/file placement problem.
A 500 usually means a PHP/database/configuration problem.

## 9. Existing Supabase data

This deployment does NOT automatically copy existing Supabase rows.

If you need the old data, export the Supabase tables and transform the data into the MySQL schema before importing it.

The application can also start with an empty MySQL database.

## 10. HTTPS

After the domain is active, enable/check HTTPS in InfinityFree and use the HTTPS URL for the site.

## 11. Important hosting note

InfinityFree has a browser security system on free hosting. It is intended to distinguish normal browser visitors from automated traffic and can affect non-browser testing of POST requests. Test your API through the actual website/browser before concluding that a POST endpoint is broken.

## Production checklist

- [ ] InfinityFree hosting account active
- [ ] Domain/subdomain active
- [ ] MySQL database created
- [ ] infinityfree.sql imported
- [ ] Four tables visible in phpMyAdmin
- [ ] config.php created with real credentials
- [ ] config.php NOT committed to GitHub
- [ ] Files uploaded into the correct web root
- [ ] index.html is in the web root
- [ ] php-sql/api/tips.php returns JSON
- [ ] php-sql/api/posts.php returns JSON
- [ ] Community create/comment/vote/delete tested
- [ ] HTTPS enabled
