import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSurveys } from '../api/client';
import type { Survey } from '../types';

const DashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: getSurveys,
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading surveys...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'My Surveys' : 'Available Surveys'}
        </h1>
        {isAdmin && (
          <Link
            to="/surveys/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Create Survey
          </Link>
        )}
      </div>

      {surveys?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">
            {isAdmin ? 'No surveys yet. Create your first survey!' : 'No surveys available.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys?.map((survey: Survey) => (
            <SurveyCard key={survey.id} survey={survey} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
};

interface SurveyCardProps {
  survey: Survey;
  isAdmin: boolean;
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey, isAdmin }) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          survey.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {survey.is_published ? 'Published' : 'Draft'}
        </span>
      </div>
      
      {survey.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{survey.description}</p>
      )}

      <div className="text-xs text-gray-400 mb-4">
        Created {new Date(survey.created_at).toLocaleDateString()}
      </div>

      <div className="flex space-x-2">
        {isAdmin ? (
          <>
            {!survey.is_published && (
              <Link
                to={`/surveys/${survey.id}/edit`}
                className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Edit
              </Link>
            )}
            <Link
              to={`/surveys/${survey.id}/responses`}
              className="flex-1 text-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
            >
              View Responses
            </Link>
          </>
        ) : (
          <>
            <Link
              to={`/surveys/${survey.id}/respond`}
              className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Take Survey
            </Link>
            <Link
              to={`/surveys/${survey.id}/my-responses`}
              className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              My Responses
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
