# gobot
a simple discord bot for czech go discord

- does:
    - goweb.cz - new articles & comments
    - eurogofed - new articles
    - OMG youtube - new videos

- TODO
    - tournament results (country)
    - tournament results (1 tour)

## How does it work

- `get.js` - fetch & parse source url, no memory
- `diff.js` - run `get.js`, compute diff of last thing vs new, save to mem
- `fmt.js` - run `diff.js`, format the new things as discord msgs
- `gobot.js` - run discord bot, every X min run `fmt.js` && send the messages


curl 'https://www.europeangodatabase.eu/EGD/Find_Tournament.php' -X POST -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: https://www.europeangodatabase.eu/EGD/Find_Tournament.php' -H 'Content-Type: application/x-www-form-urlencoded' -H 'Origin: https://www.europeangodatabase.eu' -H 'DNT: 1' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' --data-raw 'orderBy=orderBy%3DTournament_Date%2CTournament_Code&viewStart=viewStart%3D0&orderDir=&ricerca=1&tournament_code=&date_from=01%2F01%2F2024&date_to=25%2F01%2F2024&tournament_description=&country_code=CZ&city=*&filter=All'

document.querySelectorAll('table[bordercolor="#396B95"] tr')
