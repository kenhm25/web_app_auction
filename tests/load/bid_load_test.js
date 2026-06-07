import http from "k6/http";
import { check } from "k6";

export const options = {
    vus: 1000,
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
        "http://localhost:8000/api/products/1/bids/",
        payload,
        params
    );

    
    check(res, {
        "201 or 400": (r) =>
            r.status === 201 || r.status === 400,
    });
}