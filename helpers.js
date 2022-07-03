import Chance from 'chance';
import { setTimeout } from 'timers/promises';
import fs from 'fs/promises';
import HttpRateLimitOrOtherError from './errors/HttpRateLimitOrOtherError.js';
import HttpServerStatusError from './errors/HttpServerStatusError.js';
import logger from './logger.js';

const chance = Chance();

export async function parseAsJson(res) {
  try {
    return await res.json();
  } catch (e) {
    throw new HttpRateLimitOrOtherError(`${res.status} (${res.statusText})`);
  }
}

export function checkStatus(data) {
  if (data.status !== 'success') {
    throw new HttpServerStatusError(JSON.stringify(data));
  }
}

export function parseCookies(res) {
  const raw = res.headers.raw()['set-cookie'];

  return raw.map(entry => {
    const parts = entry.split(';');
    const cookiePart = parts[0];

    return cookiePart;
  }).join(';');
}

export async function handleError(e, fName, f, ...args) {
  if (e instanceof HttpRateLimitOrOtherError) {
    logger.error(`Try again ${fName} in 60s = ${e.message}`);
    await setTimeout(60000);
    const result = await f(...args);

    return result;
  }

  if (e instanceof HttpServerStatusError) {
    logger.error(`Try again ${fName} = ${e.message}`);
    const result = await f(...args);

    return result;
  }

  throw e;
}

export function getRandomAlliance() {
  return chance.pickone(['federation', 'vector_prime', 'equinox']);
}

function getRandomPassword() {
  return `${chance.string({ length: 5, alpha: true, casing: 'lower' })}${chance.character({ numeric: true })}${chance.character({ symbols: true })}${chance.character({ alpha: 'true', casing: 'upper' })}`;
}

export function getRandomAccount() {
  return {
    firstName: chance.first({ nationality: 'en' }),
    lastName: chance.last({ nationality: 'en' }),
    password: getRandomPassword(),
    username: chance.string({ length: 10 }),
  };
}

export async function addAccountToFile(wallet, email, username, password, refCode) {
  await fs.appendFile('accounts.txt', `${wallet}:${email}:${username}:${password}:${refCode}\n`);
}

export async function deleteEmailFromFile(email) {
  const emailsFile = await fs.readFile('emails.txt', 'utf8');
  const emails = emailsFile.trim().split(/[\r\n]+/);
  emails.splice(emails.indexOf(email), 1);
  const result = emails.join('\n');
  await fs.writeFile('emails.txt', result, 'utf-8');
}
