# 🚀 Load Testing Guide

This guide will help you test Vercel's capacity by simulating multiple users taking the quiz simultaneously.

## 📋 Prerequisites

1. **Deployed Quiz App**: Your app should be deployed on Vercel
2. **MongoDB Database**: Ensure your database can handle the load
3. **Admin Access**: You'll need admin access to monitor the results

## 🛠️ Testing Methods

### Method 1: Browser-Based Simulator (Recommended)

1. **Open the Simulator**:
   - Navigate to `https://your-app.vercel.app/scripts/user-simulator.html`
   - Or open the `scripts/user-simulator.html` file in your browser

2. **Configure Test Parameters**:
   - **Base URL**: Your Vercel app URL (e.g., `https://your-app.vercel.app`)
   - **Number of Users**: Start with 50, then increase to 100, 500, 1000
   - **Quiz ID**: Choose which quiz to test
   - **Delay**: Time between user creation (100ms recommended)
   - **Thinking Time**: Range for simulated thinking (1000-5000ms)

3. **Run the Test**:
   - Click "🚀 Start Simulation"
   - Monitor real-time progress
   - Watch the statistics and user grid

### Method 2: Node.js Load Test Script

1. **Install Dependencies**:
   ```bash
   npm install axios uuid
   ```

2. **Run the Load Test**:
   ```bash
   # Basic usage
   node scripts/load-test.js https://your-app.vercel.app 100

   # With custom parameters
   node scripts/load-test.js https://your-app.vercel.app 500 120000
   ```

3. **Parameters**:
   - URL: Your Vercel app URL
   - User Count: Number of concurrent users (default: 100)
   - Duration: Test duration in milliseconds (default: 60000)

### Method 3: API Testing

1. **Test Load Test Endpoint**:
   ```bash
   curl -X GET https://your-app.vercel.app/api/test/load-test
   ```

2. **Validate Configuration**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/test/load-test \
     -H "Content-Type: application/json" \
     -d '{"userCount": 100, "quizId": "default", "delay": 100}'
   ```

## 📊 Test Scenarios

### Scenario 1: Light Load (50 users)
- **Purpose**: Baseline performance
- **Expected**: 100% success rate, <500ms response time
- **Duration**: 2-3 minutes

### Scenario 2: Medium Load (100-200 users)
- **Purpose**: Normal usage simulation
- **Expected**: 95%+ success rate, <1000ms response time
- **Duration**: 3-5 minutes

### Scenario 3: Heavy Load (500 users)
- **Purpose**: Stress testing
- **Expected**: 90%+ success rate, <2000ms response time
- **Duration**: 5-8 minutes

### Scenario 4: Extreme Load (1000 users)
- **Purpose**: Breaking point testing
- **Expected**: 80%+ success rate, <5000ms response time
- **Duration**: 8-12 minutes

## 📈 Monitoring Results

### Real-Time Metrics
- **Total Users**: Number of users in the test
- **Active Users**: Currently answering questions
- **Completed Users**: Successfully finished the quiz
- **Failed Users**: Users who encountered errors
- **Success Rate**: Percentage of successful completions
- **Average Response Time**: Mean response time for all requests

### Vercel Dashboard Metrics
1. **Function Executions**: Monitor serverless function calls
2. **Response Times**: Check for performance degradation
3. **Error Rates**: Watch for increased error rates
4. **Cold Starts**: Monitor function cold start times

### Database Monitoring
1. **Connection Pool**: Check MongoDB connection usage
2. **Query Performance**: Monitor slow queries
3. **Storage**: Watch database size growth

## 🔧 Optimization Tips

### Before Testing
1. **Warm Up Functions**: Make a few requests before heavy testing
2. **Check Database**: Ensure MongoDB can handle connections
3. **Monitor Resources**: Watch Vercel dashboard during tests

### During Testing
1. **Start Small**: Begin with 50 users, then scale up
2. **Monitor Real-time**: Watch for performance degradation
3. **Stop if Needed**: Don't overwhelm your database

### After Testing
1. **Analyze Results**: Review success rates and response times
2. **Check Logs**: Look for errors in Vercel function logs
3. **Database Cleanup**: Consider cleaning test data

## 🚨 Important Notes

### Vercel Limits
- **Function Duration**: 10 seconds (Hobby), 60 seconds (Pro)
- **Concurrent Executions**: 1000 (Hobby), 3000 (Pro)
- **Bandwidth**: 100GB (Hobby), 1TB (Pro)

### Database Considerations
- **MongoDB Atlas**: Free tier has connection limits
- **Connection Pool**: Monitor connection usage
- **Query Optimization**: Ensure indexes are set up

### Cost Implications
- **Function Calls**: Each API call counts toward your limit
- **Database Operations**: MongoDB Atlas charges for operations
- **Bandwidth**: Large tests may consume bandwidth

## 📝 Test Results Template

```markdown
## Load Test Results

**Date**: [Date]
**App URL**: [URL]
**Test Method**: [Browser/Node.js/API]

### Configuration
- Users: [Number]
- Quiz: [Quiz ID]
- Duration: [Time]
- Delay: [ms]

### Results
- Total Users: [Number]
- Successful: [Number] ([Percentage]%)
- Failed: [Number] ([Percentage]%)
- Average Response Time: [ms]
- Min Response Time: [ms]
- Max Response Time: [ms]

### Observations
- [Performance notes]
- [Error patterns]
- [Database behavior]
- [Vercel function performance]

### Recommendations
- [Optimization suggestions]
- [Scaling recommendations]
- [Infrastructure improvements]
```

## 🆘 Troubleshooting

### Common Issues

1. **High Failure Rate**:
   - Check MongoDB connection limits
   - Reduce concurrent users
   - Monitor Vercel function logs

2. **Slow Response Times**:
   - Check database query performance
   - Monitor cold start times
   - Consider function optimization

3. **Database Errors**:
   - Check connection pool size
   - Monitor MongoDB Atlas limits
   - Review query patterns

### Getting Help

1. **Vercel Logs**: Check function execution logs
2. **MongoDB Atlas**: Monitor database performance
3. **Browser Console**: Check for client-side errors
4. **Network Tab**: Monitor API request patterns

## 🎯 Success Criteria

A successful load test should achieve:
- **Success Rate**: >90% for normal loads, >80% for heavy loads
- **Response Time**: <2000ms average for most requests
- **Error Rate**: <5% for normal loads, <10% for heavy loads
- **Database Stability**: No connection timeouts or errors
- **Vercel Performance**: Functions complete within limits 