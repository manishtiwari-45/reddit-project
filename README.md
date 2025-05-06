# Reddit Analyzer

A Flask-based Reddit Analysis Web Application that provides comprehensive insights into subreddit dynamics through sentiment tracking, thread visualization, and interactive data exploration.

## Features

- Subreddit information and analytics
- Post sentiment analysis with visualization
- Comment thread visualization
- Meme fetching from subreddits
- Dark/light theme support

## Structure

```
.
├── app.py              # Main Flask application
├── main.py             # Entry point
├── Procfile            # For deployment
├── requirements.txt    # Dependencies
├── static/             # Frontend assets
│   ├── index.html      # Main HTML page
│   ├── script.js       # Frontend JavaScript
│   └── style.css       # CSS styles
└── utils/              # Utility modules
    ├── __init__.py     
    ├── meme_fetcher.py # Meme fetching utilities
    ├── reddit_utils.py # Reddit API utilities
    └── sentiment.py    # Sentiment analysis utilities
```

## Environment Variables

Required environment variables:

```
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=web:reddit-analyzer:v1.0 (by /u/your_username)
```

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

## Deployment

This application is ready for deployment on services like Render, Heroku, or PythonAnywhere.

1. Create new app on your preferred platform
2. Set the required environment variables
3. Deploy the code

## Technologies

- Flask backend with API endpoints
- Vanilla JavaScript frontend
- Bootstrap for responsive design
- Chart.js for data visualization
- TextBlob for sentiment analysis
- PRAW for Reddit API integration