//import { By, Builder, Browser } from 'selenium-webdriver';
const {By, Builder, Browser, until} = require('selenium-webdriver');
const fs = require('fs');

let teamtoabbrev = {
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
let tierreplays = "https://replay.pokemonshowdown.com/smogtours-gen9uu-823358\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-824121\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-824283\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-824171\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-823971\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-823853\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-823964\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-824130\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-823819\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-824029\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-824021\nhttps://replay.pokemonshowdown.com/smogtours-gen9uu-823768";
main();



function abbrev(a) {
  console.log(a.replace(/[^a-zA-Z]/g, ""));
  if (teamtoabbrev[a.replace(/[^a-zA-Z]/g, "")]) {
    return teamtoabbrev[a.replace(/[^a-zA-Z]/g, "")];
  }
  console.log("failed replace");
  let ab = a.replace(/[^A-Z]/g, "");
  if (ab.length == 1) {
    ab = ab + "1";
  }
  return ab;
}

async function createPaste(text) {
  await driver.get("https://pokepast.es");
  await driver.manage().setTimeouts({pageLoad: 5000});
  console.log("loaded");
  await driver.wait(until.elementLocated(By.name("paste")), 3000);
  //let inputArea = await driver.findElement(By.name("paste"));
  //await inputArea.sendKeys(text);
  await driver.executeScript(`document.getElementsByName("paste")[0].value = ${text}`);
  await driver.manage().setTimeouts({implicit: 2000});
  let submitButton = await driver.findElement(By.css('input[type="Submit"][value="Submit Paste!"]'));
  await submitButton.click();
  await driver.manage().setTimeouts({implicit: 1000});
  let url = await driver.getCurrentUrl();
  console.log(url);
  return url;
}

async function main() {  
  driver = await new Builder().forBrowser(Browser.FIREFOX).build();
  let output = "";
  let justreplays = "";
  let usagestats = "";
  await driver.get("https://replaystats-eo.herokuapp.com/");
  await driver.manage().setTimeouts({implicit: 2000});
  let textArea;
  try {
    textArea = await driver.findElement(By.name("replay_urls"));
  } catch {
    textArea = null;
  }
  if (textArea == null) {
    return;
  }
  await textArea.sendKeys(tierreplays);
  await driver.manage().setTimeouts({implicit: 8000});
  let enterButton = await driver.findElement(By.name("link_submit"));
  await enterButton.click();
  await driver.manage().setTimeouts({implicit: 3000});
  console.log("getting text");
  let rawtexts = await driver.findElements(By.css("textarea"));
  let usage = await rawtexts[2].getText();//driver.findElements(By.className("rawtext"))[2].getText();
  let mnt = await rawtexts[3].getText();//driver.findElements(By.className("rawtext"))[3].getText();
  let combos = await rawtexts[4].getText();//driver.findElements(By.className("rawtext"))[4].getText();
  let leads = await rawtexts[5].getText();//driver.findElements(By.className("rawtext"))[5].getText();
  console.log("got text");
  let mntlink = await createPaste(mnt);
  let comboslink = await createPaste(combos);
  leads = leads.split("\[CODE\]")[1].split("\[")[0];
  let leadslink = await createPaste(leads);
  usagestats = usage.split("[CODE]")[0] + `[URL=${mntlink}]Moves and Teammates[/URL] | [URL=${comboslink}]Combos[/URL] | [URL=${leadslink}]Leads[/URL]\n[CODE]` + usage.split("[CODE]")[1];
  usagestats += "\n";
  fs.writeFile("usagestats", usagestats, (data) => {console.log(data)});
  //await driver.close();

}