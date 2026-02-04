import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals: _locals }) => {
  const { counterId } = params;
  if (!counterId) return new Response("Room ID is required", { status: 400 });
  // Get the ChatRoom Durable Object namespace
  const CounterNamespace = env.Counter;
  if (!CounterNamespace)
    return new Response("Chat room binding not found", { status: 500 });
  // Get a Durable Object ID for this room
  // idFromName ensures the same room ID always maps to the same Durable Object
  const durableObjectId = CounterNamespace.idFromName(counterId);
  // Get a stub (reference) to the Durable Object
  const durableObjectStub = CounterNamespace.get(durableObjectId);
  const newValue = await durableObjectStub.increment();
  return new Response(`${newValue}`);
};
