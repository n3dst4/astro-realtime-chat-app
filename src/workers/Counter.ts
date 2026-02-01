import { DurableObject } from "cloudflare:workers";

function assertNumber(value: any): asserts value is number {
  if (typeof value !== "number") {
    throw new Error(`Expected number, got ${typeof value}`);
  }
}

export class Counter extends DurableObject {
  async getCounterValue() {
    let value = (await this.ctx.storage.get("value")) || 0;
    return value;
  }

  async increment(amount = 1) {
    let value = (await this.ctx.storage.get("value")) || 0;
    assertNumber(value);
    value += amount;
    // You do not have to worry about a concurrent request having modified the value in storage.
    // "input gates" will automatically protect against unwanted concurrency.
    // Read-modify-write is safe.
    await this.ctx.storage.put("value", value);
    return value;
  }

  async decrement(amount = 1) {
    let value = (await this.ctx.storage.get("value")) || 0;
    assertNumber(value);
    value -= amount;
    await this.ctx.storage.put("value", value);
    return value;
  }
}
