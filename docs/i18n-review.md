# Amharic strings for review

Every string added by the Teret interface work (plan part 2) with the Amharic that was written for it. Each line marked `REVIEW` waits for the owner's reading; the keys are in `apps/web/src/i18n/am.json`.

| Key | English | Amharic | Status |
|---|---|---|---|
| `turn.title` | Turn your phone | ስልክዎን ያዙሩ | REVIEW |
| `turn.body` | Gebeta is played sideways, the way the board lies in front of you. | ገበጣ ሰሌዳው ፊትዎ እንደሚተኛ ሁሉ በጎን ይጫወታል። | REVIEW |
| `loading.line` | Setting out the board… | ገበጣውን እያዘጋጀን ነው… | REVIEW |
| `menu.confirmRestart` | Tap again to start over | ዳግም ለመጀመር እንደገና ይንኩ | REVIEW |
| `menu.confirmQuit` | Tap again to quit | ለመውጣት እንደገና ይንኩ | REVIEW |
| `hud.resetView` | Put the view back | እይታውን ይመልሱ | REVIEW |
| `home.rules` | Rules | ደንቦች | REVIEW |
| `hud.noStones` | {{player}} has no stones to play | {{player}} የሚጫወትበት ጠጠር የለም | REVIEW |
| `rules.title` | Rules of play | የጨዋታ ደንቦች | REVIEW |
| `rules.note` | For the next game you start. A game under way keeps its own rules. | ለሚቀጥለው አዲስ ጨዋታ ነው። የተጀመረ ጨዋታ በራሱ ደንብ ይቀጥላል። | REVIEW |
| `rules.reset` | The usual rules | የተለመዱት ደንቦች | REVIEW |
| `rules.done` | Done | ጨርሻለሁ | REVIEW |
| `rules.direction.label` | Sowing direction | የመዝራት አቅጣጫ | REVIEW |
| `rules.direction.counter-clockwise` | Counter-clockwise | ከሰዓት አቆጣጠር በተቃራኒ | REVIEW |
| `rules.direction.clockwise` | Clockwise | በሰዓት አቆጣጠር | REVIEW |
| `rules.stranded.label` | A player with no stones to play | የሚጫወትበት ጠጠር የሌለው ተጫዋች | REVIEW |
| `rules.stranded.sweep` | The other takes the rest | ሌላው የቀረውን ይወስዳል | REVIEW |
| `rules.stranded.pass` | Misses the turn | ተራው ያልፈዋል | REVIEW |
| `rules.stranded.pass-above-four` | Misses it while over four remain | ከአራት በላይ እስከቀረ ያልፈዋል | REVIEW |
| `rules.passingFour.label` | A cup that reaches four in passing goes to | በመዝራት ላይ አራት የሞላ ጉድጓድ የሚወስደው | REVIEW |
| `rules.passingFour.owner` | Its owner | ባለቤቱ | REVIEW |
| `rules.passingFour.sower` | The sower | የሚዘራው | REVIEW |
| `rules.nextStarter.label` | The next round is started by | ቀጣዩን ዙር የሚጀምረው | REVIEW |
| `rules.nextStarter.winner` | The winner | አሸናፊው | REVIEW |
| `rules.nextStarter.loser` | The loser | ተሸናፊው | REVIEW |
| `picker.level` | How strong? | ምን ያህል ጠንካራ? | REVIEW |
| `about.close` | Close | ዝጋ | REVIEW |
| `hud.quickGame` | Quick game | ፈጣን ጨዋታ | REVIEW |
| `hud.endOfRound` | End of round {{n}} | የዙር {{n}} መጨረሻ | REVIEW |
| `hud.tapHint` | tap a glowing cup | የሚያበራውን ጉድጓድ ይንኩ | REVIEW |
| `guide.hint.*` | key phrase marked <1>…</1> in each hint (glowing holes, pulsing hole, runs out of stones) | the Amharic phrase marked in each hint: ከሚያበሩት ጉድጓዶችዎ, የሚመታውን ጉድጓድ, ጠጠር እስኪያልቅበት, ማንኛውም የሚያበራ ጉድጓድ | REVIEW |

## English changed, Amharic untouched

These keys' English was shortened to the mockup's wording; their Amharic was left as it was and may want the same trimming at the reading.

| Key | English now | Amharic (unchanged) |
|---|---|---|
| `toss.prompt` | Call the coin | as before |
| `toss.promptFriend` | Player 1, call the coin | as before |
| `toss.sideLion` / `toss.sidePerson` | አንበሳ / ሰው (the bare words; the buttons gloss Lion / Person) | as before |
| `toss.landed` | It landed on {{side}} | as before |
| `summary.nextHomes` | {{count}} homes next round | as before |
| `noWebgl.title` | Can’t show the 3D board | ይህ መሣሪያ ባለ 3D ሰሌዳውን ማሳየት አይችልም |

## The prototype's Amharic

Everything else in `am.json` is still outstanding from the first design and belongs in the same reading.
