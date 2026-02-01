# Survey Application

A backend service for creating and answering surveys with role-based access control.

## Quick Start

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 5000

# Frontend (optional)
cd frontend
npm install
npm run dev
```

- **API**: http://localhost:5000
- **Docs**: http://localhost:5000/docs
- **Frontend**: http://localhost:3000

## Short Written Explanation

### Architecture

I chose **FastAPI + SQLAlchemy (async) + SQLite** for rapid development with strong typing. The frontend uses **React + TypeScript + TailwindCSS**.

### Data Model

- **Users**: id, email, name, role (admin/answerer)
- **Surveys**: id, owner_id, title, description, is_published
- **Questions**: id, survey_id, text, type (text/true_false/rank), rank_max
- **Responses**: id, survey_id, user_id (one response per user per survey)
- **Answers**: id, response_id, question_id, text_value/bool_value/rank_value
- **SurveyAccess**: survey_id, admin_id (for sharing)

### Authorization Strategy

Authorization is enforced at three levels via FastAPI dependencies:

1. **Role-based**: `require_admin()` / `require_answerer()` check user roles
2. **Ownership**: `get_owned_survey()` ensures only owners can modify
3. **Access-based**: `get_survey_with_access()` checks ownership OR shared access

This keeps authorization logic centralized, reusable, and testable.

### Key Trade-offs

| Decision | Trade-off |
|----------|-----------|
| SQLite | Simple setup, no external dependencies. Would use PostgreSQL in production. |
| Polymorphic answers | Single table with nullable columns (text_value, bool_value, rank_value) vs. separate tables. Simpler queries, slight storage overhead. |
| Header-based auth | `X-User-ID` header simulates auth per requirements. Real system would use JWT. |
| In-memory aggregation | Aggregates computed on-demand. Would pre-compute or use DB aggregations at scale. |
| Immutable surveys | Surveys with responses can't be edited. Ensures data integrity. |

### What I'd Add With More Time

- JWT authentication
- Pagination for responses
- Database-level aggregation queries
- Survey templates and question reordering
- Export to CSV/PDF

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users` | Create user | Public |
| GET | `/api/users` | List users | Public |
| POST | `/api/surveys` | Create survey | Admin |
| GET | `/api/surveys` | List surveys | Authenticated |
| GET | `/api/surveys/{id}` | Get survey with questions | Authenticated |
| PATCH | `/api/surveys/{id}/publish` | Publish survey | Owner |
| POST | `/api/surveys/{id}/share` | Share with admin | Owner |
| POST | `/api/surveys/{id}/questions` | Add question | Owner |
| POST | `/api/surveys/{id}/responses` | Submit response | Answerer |
| GET | `/api/surveys/{id}/responses` | List responses | Admin with access |
| GET | `/api/surveys/{id}/responses/me` | My response | Authenticated |
| GET | `/api/surveys/{id}/responses/aggregate` | Aggregated stats | Admin with access |
