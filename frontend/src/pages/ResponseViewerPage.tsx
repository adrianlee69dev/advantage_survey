import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSurvey, getResponses, getAggregates, getResponse } from '../api/client';
import type { SurveyResponse, AggregateResponse, Question } from '../types';

const ResponseViewerPage: React.FC = () => {
  const { id } = useParams();
  const [viewMode, setViewMode] = useState<'aggregate' | 'individual'>('aggregate');
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);

  const { data: survey } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => getSurvey(id!),
    enabled: !!id,
  });

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['responses', id],
    queryFn: () => getResponses(id!),
    enabled: !!id,
  });

  const { data: aggregates, isLoading: aggregatesLoading } = useQuery({
    queryKey: ['aggregates', id],
    queryFn: () => getAggregates(id!),
    enabled: !!id,
  });

  const { data: selectedResponse } = useQuery({
    queryKey: ['response', id, selectedResponseId],
    queryFn: () => getResponse(id!, selectedResponseId!),
    enabled: !!id && !!selectedResponseId,
  });

  if (responsesLoading || aggregatesLoading) {
    return <div className="text-center py-12 text-gray-500">Loading responses...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{survey?.title} - Responses</h1>
          <p className="text-gray-500 mt-1">Total responses: {aggregates?.total_responses || 0}</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('aggregate')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'aggregate'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aggregated
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'individual'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Individual
          </button>
        </div>
      </div>

      {viewMode === 'aggregate' ? (
        <AggregateView aggregates={aggregates} />
      ) : (
        <IndividualView
          responses={responses || []}
          selectedResponse={selectedResponse}
          selectedResponseId={selectedResponseId}
          onSelectResponse={setSelectedResponseId}
          questions={survey?.questions || []}
        />
      )}
    </div>
  );
};

const AggregateView: React.FC<{ aggregates?: AggregateResponse }> = ({ aggregates }) => {
  if (!aggregates || aggregates.total_responses === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">No responses yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {aggregates.questions.map((q, index) => (
        <div key={q.question_id} className="bg-white rounded-lg border p-6">
          <div className="flex items-start mb-4">
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mr-4">
              {index + 1}
            </span>
            <div>
              <p className="text-gray-900 font-medium">{q.question_text}</p>
              <p className="text-sm text-gray-500">{q.total_responses} responses</p>
            </div>
          </div>

          {q.question_type === 'true_false' && (
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-24 text-sm text-gray-600">True</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{ width: `${q.true_percentage || 0}%` }}
                  />
                </div>
                <div className="w-20 text-sm text-gray-600 text-right">
                  {q.true_count} ({q.true_percentage?.toFixed(1)}%)
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-24 text-sm text-gray-600">False</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                  <div
                    className="bg-red-500 h-4 rounded-full"
                    style={{ width: `${100 - (q.true_percentage || 0)}%` }}
                  />
                </div>
                <div className="w-20 text-sm text-gray-600 text-right">
                  {q.false_count} ({(100 - (q.true_percentage || 0)).toFixed(1)}%)
                </div>
              </div>
            </div>
          )}

          {q.question_type === 'rank' && (
            <div>
              <p className="text-lg font-semibold text-indigo-600 mb-3">
                Average: {q.average_rank?.toFixed(2)}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(q.rank_distribution || {})
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([rank, count]) => (
                    <div
                      key={rank}
                      className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
                    >
                      <span className="font-medium">{rank}:</span> {count} votes
                    </div>
                  ))}
              </div>
            </div>
          )}

          {q.question_type === 'text' && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {q.text_responses?.map((response, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  "{response}"
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface IndividualViewProps {
  responses: SurveyResponse[];
  selectedResponse?: SurveyResponse;
  selectedResponseId: string | null;
  onSelectResponse: (id: string | null) => void;
  questions: Question[];
}

const IndividualView: React.FC<IndividualViewProps> = ({
  responses,
  selectedResponse,
  selectedResponseId,
  onSelectResponse,
  questions,
}) => {
  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">No responses yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1">
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-medium text-gray-900">Responses</h3>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {responses.map((response) => (
              <button
                key={response.id}
                onClick={() => onSelectResponse(response.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedResponseId === response.id ? 'bg-indigo-50' : ''
                }`}
              >
                <p className="text-sm font-medium text-gray-900">
                  {new Date(response.submitted_at).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 truncate">ID: {response.id.slice(0, 8)}...</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-2">
        {selectedResponse ? (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-medium text-gray-900 mb-4">
              Response from {new Date(selectedResponse.submitted_at).toLocaleString()}
            </h3>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const answer = selectedResponse.answers.find(
                  (a) => a.question_id === question.id
                );
                return (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Question {index + 1}</p>
                    <p className="font-medium text-gray-900 mb-2">{question.text}</p>
                    <p className="text-indigo-600">
                      {answer?.text_value ||
                        (answer?.bool_value !== null
                          ? answer?.bool_value
                            ? 'True'
                            : 'False'
                          : answer?.rank_value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-500">Select a response to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewerPage;
