import { defineMiddleware, sequence } from "astro:middleware";

const HTTP_SWITCHING_PROTOCOLS = 101;

const log = console.log.bind(console, "[middleware]");

const answers = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes - definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

export function addPotatoHeader(request: Request, response: Response) {
  if (response.status === HTTP_SWITCHING_PROTOCOLS) {
    log("websocket - stepping back");
    return response;
  } else {
    log("setting header for", request.url);
    // clone the response to avoid "TypeError: Can't modify immutable headers"
    const response2 = new Response(response.body, response);
    response2.headers.set(
      "X-Are-The-Potato-People-Watching",
      answers[Math.floor(Math.random() * answers.length)],
    );
    return response2;
  }
}

// as of writing, we also do this in the worker (so it covers static assets
// covered by `assets.run_worker_first`) but I'm leaving this here as an example
// of middleware.
const addPTerryHeaderMiddleware = defineMiddleware(async (_context, next) => {
  return addPotatoHeader(_context.request, await next());
});

export const onRequest = sequence(addPTerryHeaderMiddleware);
