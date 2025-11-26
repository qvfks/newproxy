// netlify/functions/proxy.js
// Final Roblox Outfit Proxy – Browser-Fingerprint Version

exports.handler = async (event) => {
    const url = new URL(event.rawUrl);

    const prefix = "/.netlify/functions/proxy/";
    if (!url.pathname.startsWith(prefix)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad path" })
        };
    }

    // Path after the proxy prefix:
    // Example: avatar/v2/avatar/users/123/outfits
    const backendPath = url.pathname.slice(prefix.length);
    const parts = backendPath.split("/").filter(Boolean);

    const subdomain = parts[0];           // avatar, users, games, etc.
    const restPath = parts.slice(1).join("/");

    const allowed = new Set([
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
    ]);

    if (!allowed.has(subdomain)) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: "Forbidden Roblox domain" })
        };
    }

    // TRUE browser headers → required for Roblox to return outfits
    const headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",

        // Browser client hints
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",

        // Fetch metadata headers (Roblox requires them)
        "sec-fetch-site": "none",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",

        // Normal browser request headers
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "referer": "https://www.roblox.com/",
        "origin": "https://www.roblox.com"
    };

    const init = {
        method: event.httpMethod,
        headers,
        redirect: "follow"
    };

    if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
        init.body = event.body;
    }

    // Construct Roblox API URL
    const rbxURL = `https://${subdomain}.roblox.com/${restPath}${url.search}`;

    const r = await fetch(rbxURL, init);

    const text = await r.text();

    const outHeaders = {};
    for (const [k, v] of r.headers.entries()) {
        outHeaders[k] = v;
    }

    return {
        statusCode: r.status,
        headers: outHeaders,
        body: text
    };
};

