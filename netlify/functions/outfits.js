// netlify/functions/outfits.js
// Full Roblox Outfit Proxy built using RoZod + Browser Spoofing

const { RoZod } = require("@alrovi/rozod");

exports.handler = async (event) => {
    const userId = event.queryStringParameters.userId;

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing userId" })
        };
    }

    const client = new RoZod();

    // Browser fingerprint headers (CRITICAL – makes Roblox return outfits)
    const browserHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-site": "none",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "referer": "https://www.roblox.com/",
        "origin": "https://www.roblox.com"
    };

    // This is the core API call:
    const endpoint = `/v2/avatar/users/${userId}/outfits`;

    try {
        // Automatic pagination
        let results = [];
        let pageToken = "";
        let page = 1;

        while (true) {
            const res = await client.request("avatar", endpoint, {
                searchParams: {
                    itemsPerPage: 100,
                    page,
                    paginationToken: pageToken
                },
                headers: browserHeaders
            });

            results.push(...res.data);

            if (!res.paginationToken) break;
            pageToken = res.paginationToken;
            page++;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                userId,
                outfits: results,
                count: results.length
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Roblox API Error",
                details: err.message
            })
        };
    }
};
