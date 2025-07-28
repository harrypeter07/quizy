# Quiz App Setup Guide

## Admin Setup

### 1. Create Environment File
Create a `.env.local` file in your project root with:

```env
ADMIN_TOKEN=your-secret-admin-token-123
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 2. Access Admin Panel
- Go to `http://localhost:3000/admin`
- Enter your admin token: `your-secret-admin-token-123`
- Click "Login"

## Available Quizzes

The app now includes 3 quiz sets:

1. **Default Quiz** - General knowledge questions
2. **Science Quiz** - Science-related questions  
3. **History Quiz** - History-related questions

## Admin Features

### Dashboard Tab
- View overall statistics (total users, answers, active quizzes)
- See all quiz overviews with status and metrics

### Quizzes Tab
- Start/Stop any quiz
- Evaluate quiz results
- View all questions for each quiz
- See real-time statistics
- Auto transition controls
- Round validation and management

### Progress Tab
- Track round progress in real-time
- View question-by-question completion
- Monitor user participation and completion rates
- See answer distribution statistics

### Users Tab
- View user management (coming soon)

## Quiz Management

### Starting a Quiz
1. Select quiz from dropdown
2. Click "Start Quiz"
3. Users in waiting room will see countdown

### Stopping a Quiz
1. Select active quiz
2. Click "Stop Quiz"
3. Quiz becomes inactive

### Evaluating Results
1. Select quiz
2. Click "Evaluate Quiz"
3. Leaderboard is generated automatically

## API Endpoints

- `GET /api/admin/dashboard` - Get dashboard data
- `POST /api/admin/quiz/[quizId]/start` - Start quiz
- `POST /api/admin/quiz/[quizId]/stop` - Stop quiz  
- `POST /api/admin/quiz/[quizId]/evaluate` - Evaluate quiz
- `POST /api/admin/quiz/[quizId]/evaluate-round` - Evaluate specific round
- `GET /api/admin/quiz/[quizId]/round-progress` - Get round progress data
- `POST /api/quiz/[quizId]/auto-transition` - Auto transition between rounds
- `GET /api/admin/users` - Get all users 