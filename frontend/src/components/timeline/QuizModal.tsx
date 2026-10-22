"use client";

import { useState } from "react";
import { ArrowRight, Check, GraduationCap } from "lucide-react";
import { Badge, Button, Heading, Modal } from "./sk-ui";
import type { SubEra } from "./sk-types";

export function QuizModal({ quiz, onClose }: { quiz: SubEra | null; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    onClose();
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <Modal open={!!quiz} onClose={handleClose} title={`Ôn tập: ${quiz?.title || ""}`}>
      <div className="sk-quiz-content">
        <Badge>
          <GraduationCap size={14} /> THỬ THÁCH KIẾN THỨC
        </Badge>
        {quiz?.quizQuestions?.map((q, qi) => (
          <div className="sk-question" key={q.id}>
            <Heading level={3}>
              {qi + 1}. {q.question}
            </Heading>
            {q.options.map((o, oi) => (
              <Button
                key={o}
                disabled={submitted}
                className={`sk-quiz-option ${answers[q.id] === oi ? "sk-chosen" : ""} ${
                  submitted && q.correctIndex === oi ? "sk-correct" : ""
                } ${submitted && answers[q.id] === oi && oi !== q.correctIndex ? "sk-incorrect" : ""}`}
                onClick={() => setAnswers((v) => ({ ...v, [q.id]: oi }))}
              >
                <span>{String.fromCharCode(65 + oi)}</span>
                {o}
                {submitted && q.correctIndex === oi && <Check size={16} />}
              </Button>
            ))}
          </div>
        ))}
        {submitted ? (
          <div className="sk-quiz-result">
            <Heading>
              Bạn trả lời đúng {quiz?.quizQuestions?.filter((q) => answers[q.id] === q.correctIndex).length}/
              {quiz?.quizQuestions?.length} câu
            </Heading>
            <p>Mỗi lần ôn tập là một lần hiểu thêm lịch sử.</p>
            <Button
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Làm lại
            </Button>
          </div>
        ) : (
          <Button
            className="sk-primary sk-quiz-submit"
            disabled={Object.keys(answers).length !== quiz?.quizQuestions?.length}
            onClick={() => setSubmitted(true)}
          >
            Kiểm tra đáp án <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </Modal>
  );
}
