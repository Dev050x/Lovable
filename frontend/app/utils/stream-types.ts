export type UrlEvent = {
  type: "url";
  url: string;
};

export type QuestionOption = {
  value: string;
  description?: string | undefined;
};

export type QuestionEvent = {
  type: "question";
  questionId: string;
  question: string;
  questionType?: "single" | "multiple" | "text" | undefined;
  options?: (string | QuestionOption)[] | null | undefined; 
  allowOther?: boolean | undefined;      
  otherLabel?: string | undefined;
  score?: number | undefined;
};

export type DoneEvent = {
  type: "done";
};

export type ErrorEvent = {
  type: "error";
  message: string;
};

export type SseEvent = UrlEvent | QuestionEvent | DoneEvent | ErrorEvent;