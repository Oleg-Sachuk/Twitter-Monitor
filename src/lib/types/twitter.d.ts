'use strict';

export interface CurrentRules {
  id: string;
  value: string;
  tag?: string;
}

export interface MatchingRule {
  id: string;
  tag: string;
}

export interface TweetData {
  edit_history_tweet_ids: Array<string>;
  id: string;
  text: string;
}

export interface Tweet {
  data: TweetData;
  matching_rules: Array<MatchingRule>;
}

export interface TweetResponse {
  id: string;
  tweet: TweetData;
}

export interface getTweetsResponse {
  cursor: number;
  tweets: TweetResponse[];
}
