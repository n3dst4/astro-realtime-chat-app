import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ url, request, locals: _locals }) => {
  const roomName = url.searchParams.get("roomName");
  if (!roomName) return new Response("Room name is required", { status: 400 });
  // Get the ChatRoom Durable Object namespace
  const RollerNamespace = env.Roller;
  if (!RollerNamespace)
    return new Response("Roller binding not found", { status: 500 });
  // Get a Durable Object ID for this room
  // idFromName ensures the same room ID always maps to the same Durable Object
  const durableObjectId = RollerNamespace.idFromName(roomName);
  // Get a stub (reference) to the Durable Object
  const durableObjectStub = RollerNamespace.get(durableObjectId);
  return durableObjectStub.fetch(request);
};
