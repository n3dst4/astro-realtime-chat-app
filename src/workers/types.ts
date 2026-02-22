import { Messages } from "../db/roller-schema";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

export const sessionAttachmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string().min(1).max(100),
});

export type SessionAttachment = z.infer<typeof sessionAttachmentSchema>;

export const rollerMessageSchema = createSelectSchema(Messages);

export type RollerMessage = z.infer<typeof rollerMessageSchema>;

export const webSocketMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message"),
    payload: z.object({ message: rollerMessageSchema }),
  }),
  z.object({
    type: z.literal("catchup"),
    payload: z.object({ messages: z.array(rollerMessageSchema) }),
  }),
]);

export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>;
