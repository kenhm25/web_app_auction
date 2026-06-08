import http from "k6/http";
import { check } from "k6";

export const options = {
    vus: 600,
    duration: '30s',
};

const TOKEN = "";

export default function () {

    const bidAmount =
    Math.floor(Math.random() * 10000) + 100;

    const payload = JSON.stringify({
        bid_amount: bidAmount
    });

    const params = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`,
        },
    };

    const res = http.post(
        "https://ken-auction.duckdns.org/api/products/12/bids/",
        payload,
        params
    );

    if (res.status !== 201 && res.status !== 400) {
        console.log(
            `status=${res.status} body=${res.body}`
        );
    }
    check(res, {
        "201 or 400": (r) =>
            r.status === 201 || r.status === 400,
    });
}