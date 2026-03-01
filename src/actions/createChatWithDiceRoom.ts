import { Rooms } from "../schemas/chatDB-schema";
import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";

const MIN_ROOM_NAME_LENGTH = 6;
const MAX_ROOM_NAME_LENGTH = 7;

export const createChatWithDiceRoom = defineAction({
  input: z.object({
    name: z.string().min(MIN_ROOM_NAME_LENGTH).max(MAX_ROOM_NAME_LENGTH),
    description: z.string().optional(),
    userId: z.string(),
  }),
  handler: async (input) => {
    // Get the ChatRoom Durable Object namespace
    const RollerNamespace = env.DiceRollerRoom;
    if (!RollerNamespace)
      return new Response("Roller binding not found", { status: 500 });
    const roomId = nanoid();
    const durableObjectId = RollerNamespace.idFromName(roomId);
    console.log("durableObjectId", durableObjectId);
    console.log("A random room id", RollerNamespace.newUniqueId());
    const db = drizzle(env.chatDB);
    await db.insert(Rooms).values({
      created_by_user_id: input.userId,
      created_time: Date.now(),
      name: input.name,
      description: input.description,
      id: roomId,
    });
    return { id: roomId };
  },
});
