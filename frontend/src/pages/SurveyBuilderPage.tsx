import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSurvey, createSurvey, addQuestion, publishSurvey, shareSurvey, getUsers } from '../api/client';
import type { QuestionType, User } from '../types';

const SurveyBuilderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newQuestion, setNewQuestion] = useState({ text: '', type: 'text' as QuestionType, rank_max: 5 });
  const [shareAdminId, setShareAdminId] = useState('');

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => getSurvey(id!),
    enabled: isEditing,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const adminUsers = users?.filter((u: User) => u.role === 'admin') || [];

  const createSurveyMutation = useMutation({
    mutationFn: createSurvey,
    onSuccess: (survey) => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      navigate(`/surveys/${survey.id}/edit`);
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: ({ surveyId, data }: { surveyId: string; data: typeof newQuestion }) =>
      addQuestion(surveyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      setNewQuestion({ text: '', type: 'text', rank_max: 5 });
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ surveyId, adminId }: { surveyId: string; adminId: string }) =>
      shareSurvey(surveyId, adminId),
    onSuccess: () => {
      setShareAdminId('');
      alert('Survey shared successfully!');
    },
  });

  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    createSurveyMutation.mutate({ title, description });
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    addQuestionMutation.mutate({
      surveyId: id,
      data: {
        ...newQuestion,
        rank_max: newQuestion.type === 'rank' ? newQuestion.rank_max : undefined,
        order_index: (survey?.questions?.length || 0),
      },
    });
  };

  const handlePublish = () => {
    if (!id) return;
    if (confirm('Once published, this survey cannot be edited. Continue?')) {
      publishMutation.mutate(id);
    }
  };

  const handleShare = () => {
    if (!id || !shareAdminId) return;
    shareMutation.mutate({ surveyId: id, adminId: shareAdminId });
  };

  if (isEditing && surveyLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  // Create new survey form
  if (!isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Survey</h1>
        <form onSubmit={handleCreateSurvey} className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter survey title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              placeholder="Enter survey description (optional)"
            />
          </div>
          <button
            type="submit"
            disabled={createSurveyMutation.isPending}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {createSurveyMutation.isPending ? 'Creating...' : 'Create Survey'}
          </button>
        </form>
      </div>
    );
  }

  // Edit existing survey
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{survey?.title}</h1>
          {survey?.description && (
            <p className="text-gray-500 mt-1">{survey.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          {!survey?.is_published && (
            <button
              onClick={handlePublish}
              disabled={publishMutation.isPending || !survey?.questions?.length}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {survey?.is_published ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">This survey is published and cannot be edited.</p>
        </div>
      ) : (
        <>
          {/* Add Question Form */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <input
                  type="text"
                  required
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your question"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as QuestionType })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="text">Text</option>
                    <option value="true_false">True/False</option>
                    <option value="rank">Rank (1-N)</option>
                  </select>
                </div>
                {newQuestion.type === 'rank' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Rank</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={newQuestion.rank_max}
                      onChange={(e) => setNewQuestion({ ...newQuestion, rank_max: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={addQuestionMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                {addQuestionMutation.isPending ? 'Adding...' : 'Add Question'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Questions ({survey?.questions?.length || 0})
        </h2>
        {survey?.questions?.length === 0 ? (
          <p className="text-gray-500">No questions yet. Add your first question above.</p>
        ) : (
          <div className="space-y-3">
            {survey?.questions?.map((q, index) => (
              <div key={q.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mr-4">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{q.text}</p>
                  <p className="text-sm text-gray-500">
                    Type: {q.type === 'true_false' ? 'True/False' : q.type === 'rank' ? `Rank 1-${q.rank_max}` : 'Text'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Survey */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Survey</h2>
        <div className="flex space-x-2">
          <select
            value={shareAdminId}
            onChange={(e) => setShareAdminId(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select an admin...</option>
            {adminUsers.map((user: User) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button
            onClick={handleShare}
            disabled={!shareAdminId || shareMutation.isPending}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
          >
            {shareMutation.isPending ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyBuilderPage;
