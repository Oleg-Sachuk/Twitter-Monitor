import {RedisModule} from './redis';
import {CurrentRules, Tweet} from '../types/twitter';
import needle from 'needle';

const config = {
  rulesURL: process.env.RULES_URL || 'https://api.Tweetter.com/2/tweets/search/stream/rules',
  streamURL: process.env.STREAM_URL || 'https://api.Tweetter.com/2/tweets/search/stream',
  token: process.env.BEARER_TOKEN || '...',
};

export class Twitter {
  public rules: Array<{[key: string]: string}> = [];
  public redisClient: RedisModule;

  constructor(accounts: string[]) {
    this.redisClient = new RedisModule();
    this.rules = this.createRules(accounts);

    this.init().then(() => console.log('Init'));
  }

  createRules(accounts: string[]): Array<{[key: string]: string}> {
    return accounts.map((screenName: string) => {
      const filter = screenName.replace('@', '').trim().toLowerCase();
      return {value: `from:${filter}`, tag: screenName};
    });
  }

  async init() {
    let currentRules: CurrentRules[] = [];

    try {
      currentRules = (await this.getAllRules()) || [];

      if (currentRules.length === 0) {
        await this.deleteAllRules(currentRules);
        await this.setRules();
      }
    } catch (e) {
      console.error(e);
      process.exit(1);
    }

    // Listen to the stream.
    this.streamConnect(0);
  }

  async setRules() {
    const data = {
      add: this.rules,
    };

    const response = await needle('post', config.rulesURL, data, {
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.token}`,
      },
    });

    if (response.statusCode !== 201) {
      throw new Error(response.body);
    }

    return response.body;
  }

  async getAllRules(): Promise<CurrentRules[]> {
    const response = await needle('get', config.rulesURL, {
      headers: {
        authorization: `Bearer ${config.token}`,
      },
    });

    if (response.statusCode !== 200) {
      console.log('Error:', response.statusMessage, response.statusCode);
      throw new Error(response.body);
    }

    return response.body?.data as CurrentRules[];
  }

  async deleteAllRules(rules: CurrentRules[]) {
    if (!Array.isArray(rules)) {
      return null;
    }

    const ids = rules.map((rule) => rule.id);

    const data = {
      delete: {
        ids: ids,
      },
    };

    const response = await needle('post', config.rulesURL, data, {
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.token}`,
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(response.body);
    }

    return response.body;
  }

  streamConnect(retryAttempt: number) {
    const stream = needle.get(config.streamURL, {
      headers: {
        'User-Agent': 'v2FilterStreamJS',
        Authorization: `Bearer ${config.token}`,
      },
      timeout: 20000,
    });

    stream
      .on('data', async (data) => {
        try {
          const json: Tweet = JSON.parse(data);

          await this.redisClient.saveTweet(json.matching_rules[0].tag, json.data);
          retryAttempt = 0;
        } catch (e) {
          if (data.detail === 'This stream is currently at the maximum allowed connection limit.') {
            console.log(data.detail);
            process.exit(1);
          } else {
            // Keep alive signal received. Do nothing.
          }
        }
      })
      .on('err', (error) => {
        if (error.code !== 'ECONNRESET') {
          console.log(error.code);
          process.exit(1);
        } else {
          setTimeout(() => {
            console.warn('A connection error occurred. Reconnecting...');
            this.streamConnect(++retryAttempt);
          }, 2 ** retryAttempt);
        }
      });

    return stream;
  }
}
