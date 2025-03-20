const {By, Builder, Browser, until} = require('selenium-webdriver');
const fs = require('fs');
let matchups = []; // [tier, p1, p2, [replays]]
let teams = {};
let playertoteam = {};

const browser = 2;//0 = CHROME, 1 = EDGE, 2 = FIREFOX, 3 = SAFARI
//only firefox has been tested

const replayStatsWaitTime = 8;
const pokepasteWaitTime = 2;
const smogonWaitTime = 2;
const smogonNewPageWaitTime = 3;
// seconds to wait on each page before scraping, if your computer is slow and causing errors you may want to increase the time

const teamtoabbrev = {
  //"team name without spaces": "team abbreviation",
  //this can be left blank, in which case they will be abbreviated to the first letter of each word
  "MoomooFarmMysteriousSisters": "MFM",
  "IkiTownIdols": "IT",
  "SinjohRuinStrikers": "SS",
  "CeruleanCityCrushKin": "CK",
  "FriendSafariPokemonTrainers": "FS",
  "MikanIslandMonsters": "MM",
  "CamphrierTownLadies": "CL",
  "CelestialTowerTycoons": "CT",
}

function getlink() {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return  new Promise(resolve => readline.question("input link\n", ans => {
  readline.close();
  resolve(ans);
}))
}

async function createPaste(text) {
  await driver.get("https://pokepast.es");
  if (browser == 1) await driver.navigate().refresh();
  await driver.manage().setTimeouts({implicit: pokepasteWaitTime * 1000});
  let inputArea = await driver.findElement(By.name("paste"));
  await inputArea.sendKeys(text);
  //driver.executeScript(`document.getElementsByName(\"paste\")[0].value = ${text}`);
  let submitButton = await driver.findElement(By.css('input[type="Submit"][value="Submit Paste!"]'));
  await submitButton.click();
  await driver.manage().setTimeouts({implicit: 1000});
  let url = await driver.getCurrentUrl();
  console.log(url);
  return url;
}

main();

function abbrev(a) {
  if (teamtoabbrev[a.replace(/[^a-zA-Z]/g, "")]) {
    return teamtoabbrev[a.replace(/[^a-zA-Z]/g, "")];
  }
  let ab = a.replace(/[^A-Z]/g, "");
  if (ab.length == 1) {
    ab = ab + "1";
  }
  return ab;
}

async function ripfromop(text) {
  let splitted = text.split('vs');
  let newl = splitted[0].split('\n');
  let newl2 = splitted[splitted.length - 1].split('\n');
  splitted[0] = newl[newl.length - 1];
  splitted[splitted.length - 1] = newl2[0];
  let newtext = splitted.join('vs');
  let lines = newtext.split("\n");
  let team1 = "";
  let team2 = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("(")) {
      team1 = lines[i].split("vs")[0];
      team2 = lines[i].split("vs")[1];
      team1 = abbrev(team1);
      team2 = abbrev(team2);
      //team2 = abbrev(lines[i].split("vs")[1]);
      teams[team1] = [];
      teams[team2] = [];
    } else if (lines[i].includes(": ")){
      let tier = lines[i].split(": ")[0];
      let p1 = lines[i].split(": ")[1].split(" vs ")[0];
      let p2 = lines[i].split(": ")[1].split(" vs ")[1];
      teams[team1].push(p1);
      teams[team2].push(p2);
      playertoteam[p1] = team1;
      playertoteam[p2] = team2;
      matchups.push([tier, p1, p2, []]);
    }
  }
}

async function ripfrompost(author, linktags) {
  if (!playertoteam[author]) {
    return;
  }
  console.log(author);
  let games = [];
  for (let atag of linktags) {
    let link = await atag.getAttribute("href");
    console.log(link);
    //fs.writeFile("logs", link, (data) => {});
    if (typeof link == "string" && link.startsWith("https://replay.pokemonshowdown.com")) {
      games.push(link);
    }
  }
  if (games.length > 0) {
    console.log(games);
    for (let i = 0; i < matchups.length; i++) {
      if (matchups[i][1] == author || matchups[i][2] == author) {
        matchups[i][3] = games;
        return;
      }
    }
  }
}

async function main() {  
  let link = await getlink();
  switch (browser) {
    case 0:
      driver = await new Builder().forBrowser(Browser.CHROME).build();
      break;
    case 1:
      driver = await new Builder().forBrowser(Browser.EDGE).build();
      break;
    case 2:
      driver = await new Builder().forBrowser(Browser.FIREFOX).build();
      break;
    case 3:
      driver = await new Builder().forBrowser(Browser.SAFARI).build();
      break;
  }
  await driver.manage().window().maximize();
  while (link != "q" && link != "quit") {
    let output = "";
    let justreplays = "";
    let usagestats = "";
    await driver.get(link);
    await driver.manage().setTimeouts({implicit: smogonWaitTime * 1000});
    let posts = await driver.findElements(By.className("message"));
    post1 = posts[0];
    let post1text = await post1.getText();
    console.log(post1text);
    ripfromop(post1text);
    let firstpage = 1;
    let nextButton = await driver.findElement(By.className("pageNav-jump--next"));
    while (nextButton) {
      if (!firstpage) {
        try {
          await nextButton.click();
        } catch (e) {
          throw new Error("Error: Next page button was blocked by ad.\nRun this code again, it will likely work.");
        }
        await driver.manage().setTimeouts({implicit: smogonNewPageWaitTime * 1000});
        posts = await driver.findElements(By.className("message"));
        try {
          nextButton = await driver.findElement(By.className("pageNav-jump--next"));
        } catch {
          nextButton = null;
        }
      }
      for (let i = firstpage; i < posts.length; i++) {
        let cpost = posts[i];
        let replays = await cpost.findElements(By.tagName('a'));
        let text = await cpost.getText();
        let author = text.split("\n")[0];
        await ripfrompost(author, replays);
      }
      firstpage = 0;
    }
    console.log(matchups);
    let tiercheck = {};
    for (let i = 0; i < matchups.length; i++) {
      if (tiercheck[matchups[i][0]] == 2) {
        continue;
      }
      if (!tiercheck[matchups[i][0]]) {
        tiercheck[matchups[i][0]] = 1;
        output += `\n[SIZE=6][B]${matchups[i][0]}[/B][/SIZE]\n`;
        usagestats += `\n[SIZE=6][B]${matchups[i][0]}[/B][/SIZE]\n`;
      }
      let tierreplays = "";
      for (let j = 0; j < matchups.length; j++) {
        if (tiercheck[matchups[j][0]] == 1) {
          console.log(matchups[j]);
          console.log(tiercheck);
          let p1 = matchups[j][1];
          let p2 = matchups[j][2];
          if (matchups[j][3].length == 1) {
            justreplays += matchups[j][3][0] + '\n';
            tierreplays += matchups[j][3][0] + '\n';
            output += `[URL=\'${matchups[j][3][0]}\'][${playertoteam[p1]}] ${p1} vs [${playertoteam[p2]}] ${p2} [/URL]`;
          } else {
            output += `[${playertoteam[p1]}] ${p1} vs [${playertoteam[p2]}] ${p2} `;
            for (let k = 1; k <= matchups[j][3].length; k++) {
              justreplays += matchups[j][3][k-1] + '\n';
              tierreplays += matchups[j][3][k-1] + '\n';
              output += `[URL=\'${matchups[j][3][k-1]}\']G${k}[/URL] `;
            }
          }
          output += "\n";
        }
      }
      tiercheck[matchups[i][0]] = 2;
      await driver.get("https://replaystats-eo.herokuapp.com/");
      await driver.manage().setTimeouts({implicit: 2000});
      let textArea;
      try {
        textArea = await driver.findElement(By.name("replay_urls"));
      } catch {
        textArea = null;
      }
      if (textArea == null) {
        break;
      }
      await textArea.sendKeys(tierreplays);
      await driver.manage().setTimeouts({implicit: replayStatsWaitTime * 1000});
      let enterButton = await driver.findElement(By.name("link_submit"));
      await enterButton.click();
      await driver.manage().setTimeouts({implicit: 3000});
      console.log("getting text");
      let rawtexts = await driver.findElements(By.css("textarea"));
      let usage = await rawtexts[2].getText();
      let mnt = await rawtexts[3].getText();
      let combos = await rawtexts[4].getText();
      let leads = await rawtexts[5].getText();
      usage = usage.replace("???", matchups[i][0]);
      console.log("got text");
      let mntlink = await createPaste(mnt);
      let comboslink = await createPaste(combos);
      leads = leads.split("\[CODE\]")[1].split("\[")[0];
      let leadslink = await createPaste(leads);
      usagestats += usage.split("[CODE]")[0] + `[URL=${mntlink}]Moves and Teammates[/URL] | [URL=${comboslink}]Combos[/URL] | [URL=${leadslink}]Leads[/URL]\n[CODE]` + usage.split("[CODE]")[1];
      usagestats += "\n";
    }

    fs.writeFile("output", output, (data) => { console.log(data)});
    fs.writeFile("replays", justreplays, (data) => { console.log(data)});
    fs.writeFile("usagestats", usagestats, (data) => {console.log(data)});
    driver.close();
    driver.quit();
    link = await getlink();
  }

}