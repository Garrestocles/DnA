DnA (Dungeons & ASCII)
=======

The ultimate goal of this project is to serve as an ASCII tabletop for playing pen & paper-esce RPGs.  The first goal is to essentially make it at least as good as having a laminated sheet of dry erase paper for a map and dice to represent characters.

This application is meant to serve as an ASCII tabletop for playing pen & paper RPGs over a network.  Current features include:
+ Everything is run in JS, so all the players need is a browser.
+ Theoretically just as good as having a laminate mat, dry erase marker, and tokens for things.
+ Map editor so the GM can create maps before hand, save them, and upload them to all the players.

Requirements
------------

The "ASCII Master" part that all the players will connect to requires Node and npm to run.The players just need a browser to connect to the AMs node server.

Installation
------------
The AM running the game is going to need to download this repo.
To start for the first time, run the following commands:
```Bash
  npm install
  node app.js
```
After the first time, you can skip the npm command.

##### Disclaimer

This code is currently pretty hacky, as I was in "just make it work" mode (or should I say "agile developement").  Consequently, I haven't put this thing through an exactly robust security assessment.  I have found a couple places where, given the correct circumstances and an adequate amount of cleverness, a ne'er-do-well could do some sneaky things while playing.  Hence, I feel the need to warn of the dangers of playing this with someone who might be described as a 1337 h@x0r and lacking in the scrupal department.  Regardless of whether you heed my warning or not, I wish you well, but I wash my hands of your misfortune.
**TL;DR:** I'm just pointing out the "I'm not liable for whatever happens" part of the liscense.
