import {Request, Response} from 'express';
import {RedisModule} from '../lib/clients/redis';

/**
 * @swagger
 * /api/all/{username}:
 *   post:
 *    tags: [Tweets]
 *    description: Get all tweets of particular user
 *    summary: Get all tweets of user
 *    parameters:
 *        - in: path
 *          name: username
 *          type: string
 *          required: true
 *          description: User screen name
 *        - in: query
 *          name: params
 *          schema:
 *              $ref: '#/definitions/Paging'
 *          example:
 *              offset: 1
 *              limit: 5
 *          style: form
 *          explode: true
 *          description: Fields required for paging
 *
 *    responses:
 *      '200':
 *          schema:
 *              $ref: '#/definitions/GetTweets'
 *          description: OK
 *      '400':
 *          schema:
 *              $ref: '#/definitions/ErrorBadRequest'
 *          description: Error bad request
 *      '500':
 *          schema:
 *              $ref: '#/definitions/ErrorInternal'
 *          description: Error retrieving tweets
 */

const get = async (req: Request, res: Response<any>) => {
  const {username} = req.params;
  if (!username)
    res.status(400).json({
      message: 'Bad request: username is not specified',
    });

  let {limit, offset} = req.query as {limit?: number; offset?: number};

  limit = Number(limit) ?? null;
  offset = Number(offset) ?? null;

  const redisClient = new RedisModule();
  const {cursor, tweets} = await redisClient.getTweets(username, offset, limit);

  try {
    res.status(200).json({
      tweets,
      cursor,
    });
  } catch (e: any) {
    res.status(500).send(e.message);
  }
};

/**
 * @swagger
 * definitions:
 *  Paging:
 *      type: object
 *      properties:
 *          offset:
 *              type: number
 *              description: Next cursor value
 *              example: 0
 *          limit:
 *              type: number
 *              description: Amount of tweets per page
 *              example: 5
 *  BodyTx:
 *      type: object
 *      properties:
 *          account:
 *              type: string
 *              description: Buyer's public key
 *              example: HJkUYR9pJ2sfaUQwVJM32v4xro61VAuEw8ND2afYnts
 *          items:
 *              type: array
 *              items:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: Id of the chosen item
 *                          example: item-id
 *                      price:
 *                          type: number
 *                          example: 5
 *  GetTweets:
 *      type: object
 *      properties:
 *          tweets:
 *              type: array
 *              items:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: id of the filter rule
 *                          example: 1673655091977
 *                      tweet:
 *                          type: object
 *                          properties:
 *                            edit_history_tweet_ids:
 *                              type: array
 *                              items:
 *                                  type: string
 *                                  description: Id of the related tweet item
 *                                  example: 1614052533218983937
 *                            id:
 *                              type: string
 *                              description: id of this tweet
 *                              example: 1614052533218983937
 *                            text:
 *                              type: string
 *                              description: Text of this tweet
 *                              example: Hello Twitter!
 *          cursor:
 *              type: number
 *              description: Number of next cursor
 *              example: 2
 */

export default {
  get,
};
