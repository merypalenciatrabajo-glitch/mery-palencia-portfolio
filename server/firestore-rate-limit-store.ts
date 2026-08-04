import { createHash } from "node:crypto";
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { Store } from "express-rate-limit";
import { getFirebaseAdminFirestore } from "./firebase-admin.js";

interface RateLimitDocument {
  totalHits: number;
  resetAt: Timestamp;
}

export class FirestoreRateLimitStore implements Store {
  readonly localKeys = false;

  constructor(
    private readonly windowMs: number,
    readonly prefix: string,
    private readonly firestore: Firestore = getFirebaseAdminFirestore()
  ) {}

  private document(key: string) {
    const id = createHash("sha256")
      .update(`${this.prefix}:${key}`)
      .digest("hex");
    return this.firestore.collection("_serverRateLimits").doc(id);
  }

  async increment(key: string) {
    const reference = this.document(key);
    return this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const now = Date.now();
      const current = snapshot.data() as RateLimitDocument | undefined;
      const currentReset = current?.resetAt?.toMillis() ?? 0;
      const resetTime = new Date(
        currentReset > now ? currentReset : now + this.windowMs
      );
      const totalHits = currentReset > now ? current!.totalHits + 1 : 1;

      transaction.set(reference, {
        totalHits,
        resetAt: Timestamp.fromDate(resetTime),
        expiresAt: Timestamp.fromMillis(resetTime.getTime() + this.windowMs),
      });
      return { totalHits, resetTime };
    });
  }

  async get(key: string) {
    const reference = this.document(key);
    const snapshot = await reference.get();
    const current = snapshot.data() as RateLimitDocument | undefined;
    if (!current) return undefined;

    const resetTime = current.resetAt.toDate();
    if (resetTime.getTime() <= Date.now()) {
      await reference.delete();
      return undefined;
    }

    return { totalHits: current.totalHits, resetTime };
  }

  async decrement(key: string) {
    const reference = this.document(key);
    await this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const current = snapshot.data() as RateLimitDocument | undefined;
      if (!current) return;

      transaction.update(reference, {
        totalHits: Math.max(0, current.totalHits - 1),
      });
    });
  }

  async resetKey(key: string) {
    await this.document(key).delete();
  }
}
