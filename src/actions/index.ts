import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { env } from "cloudflare:workers";
import { nanoid } from "nanoid";

const MIN_ROOM_NAME_LENGTH = 6;
const MAX_ROOM_NAME_LENGTH = 7;

export const server = {
  createChatWithDiceRoom: defineAction({
    input: z.object({
      name: z.string().min(MIN_ROOM_NAME_LENGTH).max(MAX_ROOM_NAME_LENGTH),
    }),
    handler: async (input) => {
      // Get the ChatRoom Durable Object namespace
      const RollerNamespace = env.DiceRollerRoom;
      if (!RollerNamespace)
        return new Response("Roller binding not found", { status: 500 });
      const roomId = nanoid();
      const durableObjectId = RollerNamespace.idFromName(roomId);

      return `Hello, ${input.name}!`;
    },
  }),
};
