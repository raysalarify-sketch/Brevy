import { useCallback } from "react";

const useClaude = () => {
  const callApi = useCallback(async (system, msg) => {
    const r = await fetch("/api/chat", {
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
      const errorMsg = errorData.error || errorData.details || errorData.message || "서버 응답 오류";
      const hint = errorData.hint ? `\n\n💡 힌트: ${errorData.hint}` : "";
      throw new Error(`${errorMsg}${hint}`);
    }

    const d = await r.json();
    return d.content?.map(b => b.text || "").filter(Boolean).join("");
  }, []);

  return { callApi };
};

export default useClaude;
