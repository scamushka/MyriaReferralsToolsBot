import fetch from 'node-fetch';
import UserAgent from 'user-agents';
import { ethers } from 'ethers';
import {
  parseAsJson, checkStatus, parseCookies, handleError, getRandomAlliance, getRandomAccount, addAccountToFile, deleteEmailFromFile,
} from './helpers.js';
import logger from './logger.js';

async function logIn(wallet) {
  try {
    const message = JSON.stringify({ created_on: new Date() });
    const signature = await wallet.signMessage(message);
    const response = await fetch('https://myriaverse-api.myria.com/v1/accounts/login/wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': new UserAgent().toString(),
      },
      body: JSON.stringify({ message, signature, wallet_id: wallet.address }),
    });
    const data = await parseAsJson(response);
    checkStatus(data);
    logger.info(`LOGIN (${data.data.wallet_id})`);

    return parseCookies(response);
  } catch (e) {
    const result = await handleError(e, 'LOGIN', logIn, wallet);

    return result;
  }
}

async function getProfile(cookies) {
  try {
    const response = await fetch('https://myriaverse-api.myria.com/v1/sigil/users/profile', {
      headers: {
        'User-Agent': new UserAgent().toString(),
        Cookie: cookies,
      },
    });
    const data = await parseAsJson(response);
    checkStatus(data);
    logger.info(`GET_PROFILE = ${data.data.credits} credits (${data.data.wallet_id})`);
  } catch (e) {
    const result = handleError(e, 'GET_PROFILE', getProfile, cookies);

    return result;
  }
}

async function joinRandomAlliance(cookies) {
  try {
    const alliance = getRandomAlliance();
    const response = await fetch('https://myriaverse-api.myria.com/v1/sigil/users/alliance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
        'User-Agent': new UserAgent().toString(),
      },
      body: JSON.stringify({ alliance_id: alliance }),
    });
    const data = await parseAsJson(response);
    checkStatus(data);
    logger.info(`JOIN_RANDOM_ALLIANCE = ${alliance}`);
  } catch (e) {
    const result = await handleError(e, 'JOIN_RANDOM_ALLIANCE', joinRandomAlliance, cookies);

    return result;
  }
}

async function createAccount(cookies, email, refCode) {
  try {
    const {
      firstName, lastName, password, username,
    } = getRandomAccount();
    const response = await fetch('https://myriaverse-api.myria.com/v1/accounts/link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
        'User-Agent': new UserAgent().toString(),
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        redirect: 0,
        referral_code: refCode,
        username,
      }),
    });
    const data = await parseAsJson(response);
    checkStatus(data);
    logger.info(`CREATE_ACCOUNT = ${email}`);

    return { username, password };
  } catch (e) {
    const result = await handleError(e, 'CREATE_ACCOUNT', createAccount, cookies, email, refCode);

    return result;
  }
}

async function getAvailableMissions(cookies) {
  try {
    const response = await fetch('https://myriaverse-api.myria.com/v1/sigil/users/missions', {
      headers: {
        Cookie: cookies,
        'User-Agent': new UserAgent().toString(),
      },
    });
    const data = await parseAsJson(response);
    checkStatus(data);
    const requiredMissions = ['FOLLOW_TWITTER', 'SHARE_TWITTER', 'FOLLOW_INSTAGRAM'];
    const availableMissions = Object.keys(data.data).filter(mission => data.data[mission].status === 'available' && requiredMissions.includes(mission));
    logger.info(`GET_AVAILABLE_MISSIONS = ${availableMissions.toString() || 'nothing'}`);

    return availableMissions;
  } catch (e) {
    const result = await handleError(e, 'GET_AVAILABLE_MISSIONS', getAvailableMissions, cookies);

    return result;
  }
}

async function doTask(taskType, cookies) {
  try {
    const response = await fetch('https://myriaverse-api.myria.com/v1/sigil/users/missions/done', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
        'User-Agent': new UserAgent().toString(),
      },
      body: JSON.stringify({ mission_id: taskType }),
    });
    const data = await parseAsJson(response);
    checkStatus(data);
    logger.info(`DO_TASK = ${taskType}`);
  } catch (e) {
    const result = await handleError(e, `DO_TASK ${taskType}`, doTask, taskType, cookies);

    return result;
  }
}

async function getClaimableRewards(cookies) {
  try {
    const response = await fetch('https://myriaverse-api.myria.com/v1/sigil/users/rewards', {
      headers: {
        Cookie: cookies,
        'User-Agent': new UserAgent().toString(),
      },
    });
    const data = await parseAsJson(response);
    checkStatus(data);
    const claimableRewards = data.data.filter(reward => reward.status === 'claimable');
    logger.info(`GET_CLAIMABLE_REWARDS = ${claimableRewards.length}`);

    return claimableRewards;
  } catch (e) {
    const result = await handleError(e, 'GET_CLAIMABLE_REWARDS', getClaimableRewards, cookies);

    return result;
  }
}

async function claimReward(rewardId, cookies) {
  try {
    const response = await fetch('https://myriaverse-api.myria.com/v1/sigil/users/rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
        'User-Agent': new UserAgent().toString(),
      },
      body: JSON.stringify({ reward_id: rewardId }),
    });
    const data = await parseAsJson(response);
    checkStatus(data);
    logger.info(`CLAIM_REWARD = ${rewardId}`);
  } catch (e) {
    const result = await handleError(e, `CLAIM_REWARD ${rewardId}`, claimReward, rewardId, cookies);

    return result;
  }
}

export async function createAccounts(refCode, emails, eIndex = 0) {
  const wallet = ethers.Wallet.createRandom();
  const cookies = await logIn(wallet);
  await getProfile(cookies);
  await joinRandomAlliance(cookies);
  const { username, password } = await createAccount(cookies, emails[eIndex], refCode);
  await addAccountToFile(wallet.privateKey, emails[eIndex], username, password, refCode);
  await deleteEmailFromFile(emails[eIndex]);

  if (eIndex < emails.length - 1) {
    await createAccounts(refCode, emails, eIndex + 1);
  }
}

// ! простите мою душу грешную, но иногда оно почему-то ломается и cookies/availableMissions ставится undefined, я вроде как-то это исправил, но не уверен, что проблема исчезла :/
export async function doTasks(accounts, aIndex = 0) {
  const wallet = new ethers.Wallet(accounts[aIndex].split(':')[0]);
  const cookies = await logIn(wallet);
  const availableMissions = await getAvailableMissions(cookies);

  // eslint-disable-next-line no-restricted-syntax
  for await (const mission of availableMissions) {
    await doTask(mission, cookies);
  }

  await getProfile(cookies);

  if (aIndex < accounts.length - 1) {
    await doTasks(accounts, aIndex + 1);
  }
}

export async function claimRewards(accounts, aIndex = 0) {
  const wallet = new ethers.Wallet(accounts[aIndex].split(':')[0]);
  const cookies = await logIn(wallet);
  const claimableRewards = await getClaimableRewards(cookies);

  // eslint-disable-next-line no-restricted-syntax
  for await (const reward of claimableRewards) {
    await claimReward(reward.reward_id, cookies);
  }

  if (aIndex < accounts.length - 1) {
    await claimRewards(accounts, aIndex + 1);
  }
}
