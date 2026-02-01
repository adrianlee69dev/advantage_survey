import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getSurvey, submitResponse } from '../api/client';
import type { Question } from '../types';

interface AnswerState {
  [questionId: string]: {
    text_value?: string;
    bool_value?: boolean;
    rank_value?: number;
  };
}

const SurveyFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<AnswerState>({});

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => getSurvey(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const formattedAnswers = survey!.questions!.map((q) => ({
        question_id: q.id,
        ...answers[q.id],
      }));
      return submitResponse(id!, formattedAnswers);
    },
    onSuccess: () => {
      alert('Response submitted successfully!');
      navigate(`/surveys/${id}/my-responses`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to submit response');
    },
  });

  const handleAnswerChange = (questionId: string, value: any, type: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: type === 'text'
        ? { text_value: value }
        : type === 'true_false'
          ? { bool_value: value }
          : { rank_value: value },
    }));
  };

  const isComplete = () => {
    if (!survey?.questions) return false;
    return survey.questions.every((q) => answers[q.id] !== undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete()) {
      alert('Please answer all questions');
      return;
    }
    submitMutation.mutate();
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading survey...</div>;
  }

  if (!survey) {
    return <div className="text-center py-12 text-gray-500">Survey not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
        {survey.description && (
          <p className="text-gray-500 mt-2">{survey.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {survey.questions?.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value, question.type)}
          />
        ))}

        <button
          type="submit"
          disabled={submitMutation.isPending || !isComplete()}
          className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Response'}
        </button>
      </form>
    </div>
  );
};

interface QuestionCardProps {
  question: Question;
  index: number;
  value: any;
  onChange: (value: any) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, value, onChange }) => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start mb-4">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mr-4">
          {index + 1}
        </span>
        <p className="text-gray-900 font-medium pt-1">{question.text}</p>
      </div>

      {question.type === 'text' && (
        <textarea
          value={value?.text_value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows={3}
          placeholder="Enter your answer"
        />
      )}

      {question.type === 'true_false' && (
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
              value?.bool_value === true
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            True
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
              value?.bool_value === false
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            False
          </button>
        </div>
      )}

      {question.type === 'rank' && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: question.rank_max! }, (_, i) => i + 1).map((rank) => (
            <button
              key={rank}
              type="button"
              onClick={() => onChange(rank)}
              className={`w-12 h-12 rounded-lg border-2 font-medium transition-colors ${
                value?.rank_value === rank
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {rank}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SurveyFormPage;
