import { apiBaseUrl } from "./constants";

export type Product = {
  id: number;
  seller: number;
  title: string;
  description: string;
  starting_bid: string;
  current_highest_bid: string;
  image_url: string;
  location: string;
};

export type TokenResponse = {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
};

export type RegisterResponse = {
  id: number;
  username: string;
  email: string;
};

export type CreateProductPayload = {
  title: string;
  description: string;
  starting_bid: string;
  image_url: string;
  location: string;
};

type RequestLog = {
  method: string;
  url: string;
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<{ data: T; log: RequestLog; status: number }> {
  const url = path.startsWith("http") ? path : `${apiBaseUrl}${path}`;
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);

  if (!response.ok) {
    throw {
      status: response.status,
      data,
      log: {
        method: options.method ?? "GET",
        url,
        body: options.body ? JSON.parse(String(options.body)) : undefined,
      },
    };
  }

  return {
    data,
    status: response.status,
    log: {
      method: options.method ?? "GET",
      url,
      body: options.body ? JSON.parse(String(options.body)) : undefined,
    },
  };
}

export async function fetchProducts() {
  return apiRequest<Product[]>("/api/products/");
}

export async function login(username: string, password: string) {
  return apiRequest<TokenResponse>("/api/token/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username: string, email: string, password: string) {
  return apiRequest<RegisterResponse>("/api/register/", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function createProduct(payload: CreateProductPayload, token: string) {
  return apiRequest<Product>(
    "/api/products/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function placeBid(productId: number, bidAmount: string, token: string) {
  return apiRequest<{ id: number; bid_amount: string }>(
    `/api/products/${productId}/bids/`,
    {
      method: "POST",
      body: JSON.stringify({ bid_amount: bidAmount }),
    },
    token,
  );
}
