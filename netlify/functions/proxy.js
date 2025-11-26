// netlify/functions/proxy.js — Roblox Proxy for Netlify

import fetch from "node-fetch";

const domains = [
    "apis",
    "assetdelivery",
    "avatar",
    "badges",
    "catalog",
    "chat",
    "contacts",
    "contentstore",
    "develop",
    "economy",
    "economycreatorstats",
    "followings",
    "friends",
    "games",
    "groups",
    "groupsmoderation",
    "inventory",
    "itemconfiguration",
    "locale",
    "notifications",
    "points",
    "presence",
    "privatemessages",
    "publish",
    "search",
    "thumbnails",
    "trades",
    "translations",
    "users"
];

export async function handler(event) {
    const path = event.rawUrl
        ? new URL(event.rawUrl).pathname.split("/")
        : event.path.split("/");

    if (!path[1]?.trim()) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing ROBLOX subdomain." })
        };
    }

    if (!domains.includes(path[1])) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Specified subdomain is not allowed." })
        };
    }

    const headers = { ...event.headers };
    delete headers.host;
    delete headers["roblox-id"];
    delete headers["user-agent"];

    headers["user-agent"] =
        "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

    const method = event.httpMethod;

    const init = {
        method,
        headers
    };

    if (method !== "GET" && method !== "HEAD") {
        init.body = event.body;
    }

    const targetURL = `https://${path[1]}.roblox.com/${
        path.slice(2).join("/")
    }${event.rawQuery ? `?${event.rawQuery}` : ""}`;

    const res = await fetch(targetURL, init);
    const body = await res.text();

    return {
        statusCode: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body
    };
}
