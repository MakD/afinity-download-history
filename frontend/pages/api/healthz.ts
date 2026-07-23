import type { NextApiRequest, NextApiResponse } from "next";
import { getAllCacheStats } from "../../server/cache";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: "OK",
    commit: process.env.GIT_COMMIT || "unknown",
    cache: getAllCacheStats(),
  });
}
