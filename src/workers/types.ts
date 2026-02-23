import { Messages } from "../db/roller-schema";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

// Structured types for the `rolls` JSON column, matching the shape of
// DiceRoll.toJSON().rolls from @dice-roller/rpg-dice-roller

export type RollResultItem = {
  type: "result";
  value: number;
  initialValue: number;
  calculationValue: number;
  modifierFlags: string; // e.g. "", "d", "!", "r"
  modifiers: string[]; // e.g. [], ["drop"], ["explode"], ["critical-success"]
  useInTotal: boolean;
};

export type RollResultsGroup = {
  type: "roll-results";
  rolls: RollResultItem[];
  value: number;
};

// A single element in the top-level rolls array
// e.g. [RollResultsGroup, "+", RollResultsGroup, "+", 3]
export type RollEntry = RollResultsGroup | string | number;

export type StructuredRolls = RollEntry[];

export const sessionAttachmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string().min(1).max(100),
});

export type SessionAttachment = z.infer<typeof sessionAttachmentSchema>;

export const rollerMessageSchema = createSelectSchema(Messages);

export type RollerMessage = z.infer<typeof rollerMessageSchema>;

export const webSocketServerMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message"),
    payload: z.object({ message: rollerMessageSchema }),
  }),
  z.object({
    type: z.literal("catchup"),
    payload: z.object({ messages: z.array(rollerMessageSchema) }),
  }),
]);

export type WebSocketServerMessage = z.infer<
  typeof webSocketServerMessageSchema
>;

export const webSocketClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chat"),
    payload: z.object({
      formula: z.string().nullable(),
      text: z.string().nullable(),
      username: z.string(),
      userId: z.string(),
    }),
  }),
]);

export type WebSocketClientMessage = z.infer<
  typeof webSocketClientMessageSchema
>;
