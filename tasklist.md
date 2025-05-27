### Important Note: This is a legacy file.

Task-List: Spotify Data Analyzer

# Step 1: Git Repository 
- Initialize GitHub repository and setup branching strategy
- Set up README with project goals and tech stack
- Create shared Notion or Trello board for task tracking
- Create .env template for API keys
- Text file to define variables and secure sensitive information like API keys, database credentials, etc

# Step 2: Set up OAuth
- Research Spotify OAuth flow HERE
- Implement user login with Spotify
- Store access tokens securely (session or database)
- Access token: temporary key that lets app make authenticated API calls on behalf of the user 
    - Anyone with this token can act as that user
- Handle token refresh logic

# Step 3: Backend (Python & Flask/FastAPI)
- Set up basic backend server (Node.js)
- Integrate Spotipy to get user data
- Build endpoints for:
    - /top-tracks
    - /top-artists
    - /genres
    - /listening-stats
- Process and format data for frontend
- Implement rate-limiting/error handling for Spotify API
- Store daily reports (MongoDB, SQLite, etc.)

# Step 4: Data Analysis 
- Identify and calculate:
    - Top 5 tracks
    - Top artists
    - Time spent listening
    - Genre trends
-  Build logic for:
    - Mood shifts (via lyrics or genre tags)
    - New artist discoveries
- Generate JSON or structured report data

# Step 5: Frontend (React and Chart.js/Plotly)
- Set up React app
- Create routing and main page components
- Build components for:
    - Daily report dashboard
    - Top songs & artists
    - Genre distribution chart
    - Mood trends
- Use Chart.js or Plotly for data visualization
    - Responsive data

# Step 6: Storing Data
- Design schema for storing daily user data
- Store processed data in DB (daily snapshot)
- Create endpoint to retrieve history
- Enable comparison (i.e. yesterday vs today)

# Step 7: Test
- Write backend test (e.g. API responses)
- Write frontend test
- Test Spotify login and data fetching
- Test API error states and retry logic
- User testing for UI/UX feedback

# Step 8: SIMULTANEOUSLY Document 
- Create setup guide for developers
- Write API documentation 
- Document how OAuth and Spotipy work
- Add contributor guidelines
- Write user-facing documentation (how to log in, use app)

# Step 9: UI/UX
- Design


# ROLES:
- OAuth – Handles Spotify login & token logic
- Backend API – Manages Spotipy, data processing, and endpoints
- Frontend – Builds UI, integrates API responses, handles visualizations
- Data Analysis – Develops logic for trends and report generation
- Design – Crafts UX/UI, style guide, layout prototypes
- Documentation – Writes guides, contributor docs, and in-app help
- Testing & QA 
