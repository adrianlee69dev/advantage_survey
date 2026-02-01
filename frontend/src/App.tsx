import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SurveyBuilderPage from './pages/SurveyBuilderPage';
import SurveyFormPage from './pages/SurveyFormPage';
import ResponseViewerPage from './pages/ResponseViewerPage';
import MyResponsesPage from './pages/MyResponsesPage';

function App() {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/surveys/new" element={<SurveyBuilderPage />} />
        <Route path="/surveys/:id/edit" element={<SurveyBuilderPage />} />
        <Route path="/surveys/:id/respond" element={<SurveyFormPage />} />
        <Route path="/surveys/:id/responses" element={<ResponseViewerPage />} />
        <Route path="/surveys/:id/my-responses" element={<MyResponsesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
