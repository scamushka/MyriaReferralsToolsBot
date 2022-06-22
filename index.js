// ! опять не ts ;/
import readlineSync from 'readline-sync';
import { validate as uuidValidate } from 'uuid';
import fs from 'fs/promises';
import { ethers } from 'ethers';
import InvalidEmailError from './errors/InvalidEmailError.js';
import logger from './logger.cjs';
import { createAccounts, doTasks, claimRewards } from './methods.js';
import InvalidPrivateKeyError from './errors/InvalidPrivateKeyError.js';

function selectAction() {
  return readlineSync.keyInSelect(['Add Referrals', 'Do Social Tasks w/o Discord (+15 points)', 'Claim All Rewards'], 'Hey! What action are you interested in?');
}

function enterRefCode() {
  return readlineSync.question('Enter the referral code (user_id): ', {
    limit: input => uuidValidate(input),
    limitMessage: 'Invalid referral code (user_id) :/',
  });
}

async function addReferrals() {
  try {
    const refCode = enterRefCode();
    const emailsFile = await fs.readFile('emails.txt', 'utf8');
    const emails = emailsFile.trim().split(/[\r\n]+/);

    if (!emails.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      throw new InvalidEmailError('One or more emails in the emails.txt file are invalid (or the file is empty) :/');
    }

    logger.info(`Total emails: ${emails.length}. Starting for ${refCode}...`);
    await createAccounts(refCode, emails);
  } catch (e) {
    if (e instanceof InvalidEmailError) {
      logger.fatal(e.message);
    } else if (e.code === 'ENOENT') {
      logger.fatal('Ugh, emails.txt file not found :/');
    } else {
      throw e;
    }
  }
}

async function doSocialTasks() {
  try {
    const accountsFile = await fs.readFile('accounts.txt', 'utf8');
    const accounts = accountsFile.trim().split(/[\r\n]+/);

    try {
      accounts.every(account => new ethers.Wallet(account.split(':')[0]));
    } catch (e) {
      throw new InvalidPrivateKeyError('One or more private keys in the accounts.txt file are invalid (or the file is empty) :/');
    }

    logger.info(`Total accounts: ${accounts.length}. Starting...`);
    await doTasks(accounts);
  } catch (e) {
    if (e instanceof InvalidPrivateKeyError) {
      logger.fatal(e.message);
    } else if (e.code === 'ENOENT') {
      logger.fatal('Ugh, accounts.txt file not found :/');
    } else {
      throw e;
    }
  }
}

async function claimAllRewards() {
  try {
    const accountsFile = await fs.readFile('accounts.txt', 'utf8');
    const accounts = accountsFile.trim().split(/[\r\n]+/);

    try {
      accounts.every(account => new ethers.Wallet(account.split(':')[0]));
    } catch (e) {
      throw new InvalidPrivateKeyError('One or more private keys in the accounts.txt file are invalid (or the file is empty) :/');
    }

    logger.info(`Total accounts: ${accounts.length}. Starting...`);
    await claimRewards(accounts);
  } catch (e) {
    if (e instanceof InvalidPrivateKeyError) {
      logger.fatal(e.message);
    } else if (e.code === 'ENOENT') {
      logger.fatal('Ugh, accounts.txt file not found :/');
    } else {
      throw e;
    }
  }
}

async function init() {
  try {
    console.log('Author: https://t.me/scamushka');
    const index = selectAction();

    if (index === 0) {
      await addReferrals();
    } else if (index === 1) {
      await doSocialTasks();
    } else if (index === 2) {
      await claimAllRewards();
    } else {
      console.log('Bye-Bye!');
    }
  } catch (e) {
    logger.fatal(e.message);
  }
}

init();
