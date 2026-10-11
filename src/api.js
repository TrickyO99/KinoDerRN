export async function fetchTopScores(limit = 10) {
  const res = await fetch(`/api/scores?limit=${limit}`);
  if (!res.ok) throw new Error("fetch failed");
  const data = await res.json();
  return data.scores;
}

export async function submitScore(initials, score, wave) {
  const res = await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initials, score, wave }),
  });
  if (!res.ok) throw new Error("submit failed");
  return res.json();
}
