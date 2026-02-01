import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSurvey, getMyResponses } from '../api/client';
import type { Question } from '../types';

const MyResponsesPage: React.FC = () => {
  const { id } = useParams();

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => getSurvey(id!),
    enabled: !!id,
  });

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['myResponses', id],
    queryFn: () => getMyResponses(id!),
    enabled: !!id,
  });

  if (surveyLoading || responsesLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const questions = survey?.questions || [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{survey?.title}</h1>
          <p className="text-gray-500 mt-1">Your Responses</p>
        </div>
        <Link
          to={`/surveys/${id}/respond`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Take Survey Again
        </Link>
      </div>

      {responses?.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't submitted any responses yet.</p>
          <Link
            to={`/surveys/${id}/respond`}
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Take Survey
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {responses?.map((response, responseIndex) => (
            <div key={response.id} className="bg-white rounded-lg border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-medium text-gray-900">
                  Response #{responseIndex + 1}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(response.submitted_at).toLocaleString()}
                </span>
              </div>
              <div className="p-4 space-y-4">
                {questions.map((question: Question, qIndex) => {
                  const answer = response.answers.find(
                    (a) => a.question_id === question.id
                  );
                  return (
                    <div key={question.id} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium mr-3">
                        {qIndex + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">{question.text}</p>
                        <p className="font-medium text-gray-900">
                          {answer?.text_value ||
                            (answer?.bool_value !== null
                              ? answer?.bool_value
                                ? 'True'
                                : 'False'
                              : `Rank: ${answer?.rank_value}`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyResponsesPage;
