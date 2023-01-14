import {createClient} from 'redis';
import {getTweetsResponse} from '../types/twitter';

const REDIS_OPTS = {
  db: 1,
  port: process.env.RDB_PORT || 6379,
  host: process.env.RDB_HOST || 'redis',
};

export class RedisModule {
  public redisClient;

  constructor() {
    this.redisClient = createClient({
      url: `redis://${REDIS_OPTS.host}:${REDIS_OPTS.port}/${REDIS_OPTS.db}`,
    });

    this.redisClient.on('error', (err: Error) => console.log('Redis Client Error', err));
    this.redisClient.connect().then(() => console.log('Redis client connected'));
  }

  async saveTweet(userId: string, tweet: any): Promise<boolean> {
    const date = Date.now();
    try {
      await this.redisClient.hSet(userId, date, JSON.stringify(tweet));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getTweets(userId: string, offset: number = 0, count: number = 5): Promise<getTweetsResponse> {
    try {
      const {cursor, tuples} = await this.redisClient.hScan(userId, offset, {COUNT: count});
      console.log('Data', cursor);
      const tweets = tuples.map((obj) => {
        return {
          id: obj.field,
          tweet: JSON.parse(obj.value),
        };
      });

      return {
        cursor,
        tweets,
      };
    } catch (e) {
      console.error(e);
      return {
        cursor: 0,
        tweets: [],
      };
    }
  }
}
