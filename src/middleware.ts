import { defineMiddleware, sequence } from "astro:middleware";

const addPTerryHeader = defineMiddleware(async (context, next) => {
  const response = await next();
  if (response.status === 101) {
    console.log("websocket - stepping back");
  } else {
    response.headers.set("X-Clacks-Overhead", "GNU Terry Pratchett");
    console.log("set header");
  }
  return response;
});

export const onRequest = sequence(addPTerryHeader);
