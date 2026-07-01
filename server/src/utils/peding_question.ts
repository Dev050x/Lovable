type PendingAnswer = {
  resolve: (answer: string) => void;
  reject: (err: Error) => void;
};

const pending = new Map<string, PendingAnswer>();

export function waitForAnswer(questionId: string, timeoutMs = 5 * 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(questionId);
      reject(new Error("User did not respond in time"));
    }, timeoutMs);

    pending.set(questionId, {
      resolve: (answer) => { clearTimeout(timer); resolve(answer); },
      reject: (err) => { clearTimeout(timer); reject(err); },
    });
  });
}

export function submitAnswer(questionId: string, answer: string) {
  const p = pending.get(questionId);
  if (!p) return false;
  pending.delete(questionId);
  p.resolve(answer);
  return true;
}