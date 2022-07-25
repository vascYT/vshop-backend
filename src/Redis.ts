import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL || "", {
  keyPrefix: "VSHOP_",
});

export async function setRiotId(token: string, riotId: string) {
  await redis.set(`token:${token}`, riotId);
  await redis.expire(`token:${token}`, 3600);
}

export async function getRiotId(token: string) {
  const res = await redis.get(`token:${token}`);
  return res;
}

export async function setUser(user: IRedisUser) {
  await redis.set(`user:${user.riotId}`, JSON.stringify(user));
}

export async function getUser(riotId: string) {
  const res = await redis.get(`user:${riotId}`);
  if (res) {
    return JSON.parse(res) as IRedisUser;
  }
  return null;
}
