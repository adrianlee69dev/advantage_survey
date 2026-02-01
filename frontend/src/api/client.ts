import axios from 'axios';
import type { User, Survey, Question, SurveyResponse, AggregateResponse, QuestionType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

// Add user ID header to all requests
export const setCurrentUser = (userId: string | null) => {
  if (userId) {
    api.defaults.headers.common['X-User-ID'] = userId;
  } else {
    delete api.defaults.headers.common['X-User-ID'];
  }
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/api/users');
  return response.data;
};

export const createUser = async (data: { email: string; name: string; role: string }): Promise<User> => {
  const response = await api.post('/api/users', data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/api/users/me');
  return response.data;
};

// Surveys
export const getSurveys = async (): Promise<Survey[]> => {
  const response = await api.get('/api/surveys');
  return response.data;
};

export const getSurvey = async (id: string): Promise<Survey> => {
  const response = await api.get(`/api/surveys/${id}`);
  return response.data;
};

export const createSurvey = async (data: { title: string; description?: string }): Promise<Survey> => {
  const response = await api.post('/api/surveys', data);
  return response.data;
};

export const publishSurvey = async (id: string): Promise<Survey> => {
  const response = await api.patch(`/api/surveys/${id}/publish`);
  return response.data;
};

export const shareSurvey = async (surveyId: string, adminId: string): Promise<void> => {
  await api.post(`/api/surveys/${surveyId}/share`, { admin_id: adminId });
};

// Questions
export const getQuestions = async (surveyId: string): Promise<Question[]> => {
  const response = await api.get(`/api/surveys/${surveyId}/questions`);
  return response.data;
};

export const addQuestion = async (
  surveyId: string,
  data: { text: string; type: QuestionType; rank_max?: number; order_index?: number }
): Promise<Question> => {
  const response = await api.post(`/api/surveys/${surveyId}/questions`, data);
  return response.data;
};

// Responses
export const submitResponse = async (
  surveyId: string,
  answers: { question_id: string; text_value?: string; bool_value?: boolean; rank_value?: number }[]
): Promise<SurveyResponse> => {
  const response = await api.post(`/api/surveys/${surveyId}/responses`, { answers });
  return response.data;
};

export const getResponses = async (surveyId: string): Promise<SurveyResponse[]> => {
  const response = await api.get(`/api/surveys/${surveyId}/responses`);
  return response.data;
};

export const getMyResponses = async (surveyId: string): Promise<SurveyResponse[]> => {
  const response = await api.get(`/api/surveys/${surveyId}/responses/me`);
  return response.data;
};

export const getResponse = async (surveyId: string, responseId: string): Promise<SurveyResponse> => {
  const response = await api.get(`/api/surveys/${surveyId}/responses/${responseId}`);
  return response.data;
};

export const getAggregates = async (surveyId: string): Promise<AggregateResponse> => {
  const response = await api.get(`/api/surveys/${surveyId}/responses/aggregate`);
  return response.data;
};
