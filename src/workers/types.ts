import { Messages } from "../db/roller-schema";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

// Structured types for the `rolls` JSON column, matching the shape of
// DiceRoll.toJSON().rolls from @dice-roller/rpg-dice-roller

export type RollResult = {
  type: "result";
  value: number;
  initialValue: number;
  calculationValue: number;
  modifierFlags: string; // e.g. "", "d", "!", "r", "*", "_"
  modifiers: string[]; // e.g. [], ["drop"], ["explode"], ["critical-success"], ["target-success"], ["target-failure"]
  useInTotal: boolean;
};

export type RollResults = {
  type: "roll-results";
  rolls: RollResult[];
  value: number;
};

// A result-group, produced by roll group notation like {3d8, 3d8}k1.
// The outer group has isRollGroup: true and contains inner result-groups as children.
// Inner groups (isRollGroup: false) each represent one sub-expression and carry
// their own useInTotal / modifierFlags for drop/keep at the group level.
export type ResultGroup = {
  type: "result-group";
  isRollGroup: boolean;
  modifierFlags: string;
  modifiers: string[];
  useInTotal: boolean;
  calculationValue: number;
  value: number;
  results: Array<RollResults | ResultGroup | string | number>;
};

// A single element in the top-level rolls array.
// Regular roll:  [RollResultsGroup, "+", RollResultsGroup, "+", 3]
// Roll group:    [ResultGroupItem(isRollGroup=true)]
export type RollEntry = RollResults | ResultGroup | string | number;

export type StructuredRolls = RollEntry[];

export const sessionAttachmentSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
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
