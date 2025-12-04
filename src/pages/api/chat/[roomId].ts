import type { APIRoute } from 'astro'

/**
 * GET /api/chat/:roomId
 *
 * Handles WebSocket upgrade requests and connects clients to the chat room
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
    const { roomId } = params
    if (!roomId)
        return new Response('Room ID is required', { status: 400 })
    // Get the ChatRoom Durable Object namespace
    const ChatRoomNamespace = locals.runtime.env.ChatRoom
    if (!ChatRoomNamespace)
        return new Response('Chat room binding not found', { status: 500 })
    // Get a Durable Object ID for this room
    // idFromName ensures the same room ID always maps to the same Durable Object
    const durableObjectId = ChatRoomNamespace.idFromName(roomId)
    // Get a stub (reference) to the Durable Object
    const durableObjectStub = ChatRoomNamespace.get(durableObjectId)
    // Forward the request to the Durable Object
    // The Durable Object's fetch method will handle the WebSocket upgrade
    return durableObjectStub.fetch(request)
}