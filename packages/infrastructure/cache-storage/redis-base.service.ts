import * as Redis from 'ioredis';

export class RedisBaseService {
  constructor(
    private readonly _store: Redis.Cluster | Redis.Redis
  ) {}

  public getClient(): Redis.Cluster | Redis.Redis {
    return this._store;
  }
  public async set(key: string, value: any): Promise<any> {
    const isPrimitive = value !== Object(value);
    if (isPrimitive) {
      return this._store.set(key, value);
    }
    return this._store.set(key, JSON.stringify(value));
  }

  public async setWithExpireTime(
    key: string,
    value: unknown,
    ttl: number
  ): Promise<any> {
    return this._store.set(key, JSON.stringify(value), 'EX', ttl);
  }

  public async setnxWithExpireTime(
    key: string,
    value: unknown,
    ttl: number
  ): Promise<boolean> {
    const isSuccess = await this._store.set(
      key,
      JSON.stringify(value),
      'EX',
      ttl,
      'NX'
    );
    return !!isSuccess;
  }

  public async get<T>(key: string): Promise<T> {
    let result = null;
    try {
      result = await this._store.get(key);
      return JSON.parse(result) as T;
    } catch {
      return result;
    }
  }

  public async mset(data: Map<string, string>) {
    await this._store.mset(data);
  }

  public async mget<T>(keys: string[]): Promise<T[]> {
    if (keys?.length === 0) {
      return [];
    }

    return this._store.mget(keys).then((r) =>
      r.map((r) => {
        if (r) {
          try {
            return JSON.parse(r) as T;
          } catch {
            return r as T;
          }
        } else {
          return null;
        }
      })
    );
  }

  public async sadd(
    key: string,
    ...values: string[] | number[]
  ): Promise<number> {
    return this._store.sadd(key, values);
  }

  public async smembers(key: string): Promise<string[]> {
    return this._store.smembers(key);
  }

  public async smismember(
    key: string,
    ...values: string[] | number[]
  ): Promise<number[]> {
    return this._store.smismember(key, values);
  }

  public async srem(key: string, ...values: string[]): Promise<number> {
    return this._store.srem(key, values);
  }

  public async del(key: string): Promise<number> {
    return this._store.del(key);
  }

  public async unlink(key: string): Promise<number> {
    return this._store.unlink(key);
  }

  public async deleteMany(keys: string[]): Promise<number> {
    return this._store.del(keys);
  }

  public async reset(): Promise<'OK'> {
    return this._store.flushdb();
  }

  public async keys(pattern: string): Promise<string[]> {
    return this._store.keys(pattern);
  }

  public async hset(key: string, value: Record<string, any>) {
    return this._store.hset(key, value);
  }

  public async hsetnx(
    key: string,
    field: string,
    value: string
  ): Promise<boolean> {
    const respReply = await this._store.hsetnx(key, field, value);
    return respReply === 1;
  }

  public async hdel(key: string, fields: string[]) {
    return this._store.hdel(key, ...fields);
  }

  public async hincrby(key: string, field: string, increment: number) {
    return this._store.hincrby(key, field, increment);
  }

  public async hincrbyfloat(
    key: string,
    field: string,
    increment: number
  ): Promise<number> {
    const value = await this._store.hincrbyfloat(key, field, increment);
    return Number(value);
  }

  public async hget(key: string, field: string) {
    return this._store.hget(key, field);
  }

  public async hmget(key: string, ...fields: string[]) {
    return this._store.hmget(key, ...fields);
  }

  public async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    const data = await this._store.hgetall(key) as Record<string, string>;

    if (!data || !Object.keys(data).length) {
      return null;
    }

    const result: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    }
  
    return result as T;
  }

  public async expire(key: string, timeoutInSeconds: number) {
    return this._store.expire(key, timeoutInSeconds);
  }

  public async setex(key: string, timeoutInSeconds: number, value: string) {
    return this._store.set(key, value, 'EX', timeoutInSeconds);
  }

  public async setnx(key: string, value: string): Promise<boolean> {
    const result = await this._store.setnx(key, value);
    return !!result;
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this._store.exists(key);
    return !!result;
  }

  public async incr(key: string): Promise<void> {
    await this._store.incr(key);
  }

  public async ttl(key: string) {
    return this._store.ttl(key);
  }

  public async expiretime(key: string): Promise<number> {
    return this._store.expiretime(key);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async rpush(key, data) {
    this._store.rpush(key, JSON.stringify(data));
  }

  public async zrange(
    key: string,
    min: string | number,
    max: string | number,
    options: {
      withScores?: boolean;
      limit?: { offset: number; count: number };
      rev?: boolean;
      by?: 'score' | 'lex';
    } = {}
  ) {
    const args: (string | number)[] = [key, min, max];

    if (options.rev) {
      args.push('REV');
    }

    if (options.by === 'score') {
      args.push('BYSCORE');
    } else if (options.by === 'lex') {
      args.push('BYLEX');
    }

    if (options.limit) {
      args.push('LIMIT', options.limit.offset, options.limit.count);
    }

    if (options.withScores) {
      args.push('WITHSCORES');
    }

    return this._store.zrange(
      ...(args as [string, string | number, string | number, ...any[]])
    );
  }

  public zrevrank(key: string, member: string) {
    return this._store.zrevrank(key, member);
  }
  public zscore(key: string, member: string) {
    return this._store.zscore(key, member);
  }

  public async zcard(key: string): Promise<number> {
    return this._store.zcard(key);
  }

  public async zadd(
    key: string,
    score: number,
    member: string
  ): Promise<number> {
    return this._store.zadd(key, score, member);
  }
}
