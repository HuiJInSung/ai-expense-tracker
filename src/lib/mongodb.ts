import dns from "node:dns";
import mongoose from "mongoose";

// 部分 Windows 環境下 Node 只讀到 127.0.0.1 當 DNS，導致 mongodb+srv:// 的 SRV 查詢失敗
// (querySrv ECONNREFUSED)。偵測到只有 loopback DNS 時改用公共 DNS。
// MongoDB driver 走 dns.promises，在 Next.js 裡它和 callback 版的 dns 設定不同步，兩邊都要設。
const isLoopbackOnly = (servers: string[]) =>
  servers.every((s) => s === "127.0.0.1" || s === "::1");
for (const resolver of [dns, dns.promises]) {
  if (isLoopbackOnly(resolver.getServers())) {
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// 開發模式下 hot reload 會重新執行模組，把連線快取在 global 上避免重複連線
const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("缺少環境變數 MONGODB_URI");
  }
  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(MONGODB_URI, { bufferCommands: false });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
