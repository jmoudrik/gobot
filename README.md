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
