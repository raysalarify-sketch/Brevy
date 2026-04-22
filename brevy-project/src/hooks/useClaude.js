import { useCallback } from "react";

const useClaude = () => {
  const callApi = useCallback(async (system, msg) => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("API key missing. Please set VITE_ANTHROPIC_API_KEY in .env");
      throw new Error("API key missing");
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2000,
        system,
        messages: [{ role: "user", content: msg }]
      })
    });

    if (!r.ok) {
      const errorData = await r.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const d = await r.json();
    return d.content?.map(b => b.text || "").filter(Boolean).join("");
  }, []);

  return { callApi };
};

export default useClaude;
