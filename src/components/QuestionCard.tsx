"use client";

import { useExamSessionStore } from "@/stores/exam-session-store";

interface QuestionContent {
  stem: string;
  choices: { label: string; text: string }[];
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
      <p className="text-sm text-gray-400">Loading next question...</p>
    </div>
  );
}

export default function QuestionCard() {
  const currentQuestion = useExamSessionStore((s) => s.currentQuestion);
  const selectedAnswer = useExamSessionStore((s) => s.selectedAnswer);
  const showExplanation = useExamSessionStore((s) => s.showExplanation);
  const isLoading = useExamSessionStore((s) => s.isLoading);
  const selectAnswer = useExamSessionStore((s) => s.selectAnswer);
  const submitAnswer = useExamSessionStore((s) => s.submitAnswer);
  const nextQuestion = useExamSessionStore((s) => s.nextQuestion);
  const attempts = useExamSessionStore((s) => s.attempts);
  const sections = useExamSessionStore((s) => s.sections);
  const currentSectionIndex = useExamSessionStore((s) => s.currentSectionIndex);

  if (isLoading && !currentQuestion) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-8 shadow-xl backdrop-blur">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  let parsed: QuestionContent;
  try {
    parsed = JSON.parse(currentQuestion.content);
  } catch {
    parsed = { stem: currentQuestion.content, choices: [] };
  }

  const currentSection = sections[currentSectionIndex];
  const sectionAttempts = attempts.filter(
    (a) => a.section === currentQuestion.section,
  );
  const questionNumber = sectionAttempts.length + (showExplanation ? 0 : 1);
  const totalQuestions = currentSection?.questionsCount ?? 0;

  const isCorrect = showExplanation
    ? selectedAnswer === currentQuestion.correctAnswer
    : null;

  const handleSubmit = () => {
    submitAnswer(currentQuestion.correctAnswer, {
      a: currentQuestion.discrimination,
      b: currentQuestion.difficulty,
      c: currentQuestion.guessing,
    });
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl backdrop-blur sm:p-8">
      {/* Question header */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400">
          {currentQuestion.questionType.replace(/_/g, " ")}
        </span>
      </div>

      {/* Stem */}
      <div className="mb-8">
        <p className="text-lg leading-relaxed text-gray-100">{parsed.stem}</p>
      </div>

      {/* Choices */}
      <div className="mb-8 space-y-3">
        {parsed.choices.map((choice) => {
          const isSelected = selectedAnswer === choice.label;
          const isCorrectChoice =
            showExplanation && choice.label === currentQuestion.correctAnswer;
          const isWrongSelection =
            showExplanation && isSelected && !isCorrectChoice;

          let choiceClasses =
            "group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200";

          if (isCorrectChoice && showExplanation) {
            choiceClasses +=
              " border-emerald-500/60 bg-emerald-950/40 text-emerald-100";
          } else if (isWrongSelection) {
            choiceClasses +=
              " border-red-500/60 bg-red-950/40 text-red-100";
          } else if (isSelected && !showExplanation) {
            choiceClasses +=
              " border-indigo-500 bg-indigo-950/50 text-indigo-100 ring-1 ring-indigo-500/30";
          } else {
            choiceClasses +=
              " border-gray-700/60 bg-gray-800/40 text-gray-300 hover:border-gray-600 hover:bg-gray-800/70";
          }

          if (showExplanation) {
            choiceClasses += " cursor-default";
          } else {
            choiceClasses += " cursor-pointer";
          }

          let labelClasses =
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors";

          if (isCorrectChoice && showExplanation) {
            labelClasses += " bg-emerald-500/20 text-emerald-400";
          } else if (isWrongSelection) {
            labelClasses += " bg-red-500/20 text-red-400";
          } else if (isSelected && !showExplanation) {
            labelClasses += " bg-indigo-500/30 text-indigo-300";
          } else {
            labelClasses +=
              " bg-gray-700/50 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-300";
          }

          return (
            <button
              key={choice.label}
              onClick={() => !showExplanation && selectAnswer(choice.label)}
              disabled={showExplanation}
              className={choiceClasses}
            >
              <span className={labelClasses}>{choice.label}</span>
              <span className="pt-1 text-sm leading-relaxed">
                {choice.text}
              </span>
              {isCorrectChoice && showExplanation && (
                <span className="ml-auto shrink-0 self-center text-emerald-400">
                  &#10003;
                </span>
              )}
              {isWrongSelection && (
                <span className="ml-auto shrink-0 self-center text-red-400">
                  &#10007;
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback & Explanation */}
      {showExplanation && (
        <div className="mb-6 space-y-4">
          <div
            className={`rounded-xl border p-4 ${
              isCorrect
                ? "border-emerald-500/30 bg-emerald-950/30"
                : "border-red-500/30 bg-red-950/30"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                isCorrect ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isCorrect ? "Correct!" : "Incorrect"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Explanation
            </p>
            <p className="text-sm leading-relaxed text-gray-300">
              {currentQuestion.explanation}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        {!showExplanation ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30"
          >
            Next Question &#8594;
          </button>
        )}
      </div>
    </div>
  );
}
