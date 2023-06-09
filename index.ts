import axios, { AxiosError } from 'axios';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

async function fetchHTML(url: string): Promise<string | undefined> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: unknown) {
    console.error((error as Error).message);
    console.error((error as AxiosError).toJSON());
    return undefined;
  }
}

async function fetchFromWebOrCache(url: string, ignoreCache = false) {
  if (!existsSync(resolve(__dirname, '.cache'))) {
    mkdirSync('.cache');
  }
  console.log(`Getting data for ${url}...`);
  if (
    !ignoreCache &&
    existsSync(
      resolve(__dirname, `.cache/${Buffer.from(url).toString('base64')}.html`)
    )
  ) {
    console.log(`Reading ${url} from cache`);
    const HTMLData = await readFile(
      resolve(
        __dirname,
        `.cache/${Buffer.from(url).toString('base64')}.html`
      ),
      { encoding: 'utf8' }
    );
    const dom = new JSDOM(HTMLData, { includeNodeLocations: true, runScripts: 'dangerously' });
    return dom.window.document;
  } else {
    console.log(`Fetching ${url} fresh`);
    const HTMLData = await fetchHTML(url);
    if (!ignoreCache && HTMLData) {
      writeFile(
        resolve(
          __dirname,
          `.cache/${Buffer.from(url).toString('base64')}.html`
        ),
        HTMLData,
        { encoding: 'utf8' }
      );
    }
    const dom = new JSDOM(HTMLData, { includeNodeLocations: true, runScripts: 'dangerously' });
    return dom.window.document;
  }
}

function extractData(document: Document) {
  const summonerNames: string[] = Array.from(
    document.querySelectorAll('.summoner-name')
  )
    .map((element: Element) => element.textContent?.trim() || '')
    .filter(Boolean)
    .slice(0, 10);
  return summonerNames;
}

async function getData() {
  const document = await fetchFromWebOrCache(
    'https://www.op.gg/leaderboards/tier?hl=en_US&region=euw'
  );
  const data = extractData(document);
  console.log(data);
}

getData();
