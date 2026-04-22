import { useCallback } from "react";

const useClaude = () => {
  const callApi = useCallback(async (system, msg) => {
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system,
        messages: [{ role: "user", content: msg }]
      })
    });

    if (!r.ok) {
      const errorData = await r.json();
      throw new Error(errorData.error?.message || "AI 요청 처리 중 서버 오류가 발생했습니다.");
    }

    const d = await r.json();
    return d.content?.map(b => b.text || "").filter(Boolean).join("");
  }, []);

  return { callApi };
};

export default useClaude;
