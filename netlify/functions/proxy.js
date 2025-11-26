// netlify/functions/proxy.js
// Roblox → Netlify → Roblox proxy

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

// Classic Netlify handler (CommonJS) – no imports needed, uses global fetch
exports.handler = async (event) => {
    // Example path:
    // / .netlify / functions / proxy / avatar / v2 / avatar / users / ...
    const url = new URL(event.rawUrl);
    const pathname = url.pathname; // e.g. "/.netlify/functions/proxy/avatar/v2/avatar/users/..."

    const prefix = "/.netlify/functions/proxy/";
    if (!pathname.startsWith(prefix)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad proxy path" })
        };
    }

    // backendPath = "avatar/v2/avatar/users/4205.../outfits"
    const backendPath = pathname.slice(prefix.length);
    const parts = backendPath.split("/").filter(Boolean);

    const subdomain = parts[0];           // "avatar"
    const restPath = parts.slice(1).join("/"); // "v2/avatar/users/..."

    if (!subdomain) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing ROBLOX subdomain." })
        };
    }

    if (!domains.includes(subdomain)) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Specified subdomain is not allowed." })
        };
    }

    // Clone and clean headers
    const headers = { ...event.headers };
    delete headers.host;
    delete headers["roblox-id"];
    delete headers["user-agent"];

    headers["user-agent"] =
        "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

    const init = {
        method: event.httpMethod,
        headers
    };

    if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
        init.body = event.body;
    }

    const targetURL = `https://${subdomain}.roblox.com/${restPath}${url.search}`;

    const res = await fetch(targetURL, init);
    const text = await res.text();

    const outHeaders = {};
    for (const [k, v] of res.headers.entries()) {
        outHeaders[k] = v;
    }

    return {
        statusCode: res.status,
        headers: outHeaders,
        body: text
    };
};
