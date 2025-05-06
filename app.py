import os
import logging
import base64
from flask import Flask, jsonify, request, session, send_from_directory
from utils.reddit_utils import get_subreddit_info, get_subreddit_posts, get_comment_thread
from utils.sentiment import analyze_subreddit_sentiment
from utils.meme_fetcher import get_memes

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="static", static_url_path="")
app.secret_key = os.environ.get("SESSION_SECRET", "reddit-analyzer-secret")

# Serve static files
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# API Endpoints
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    # Mock login - store username in session
    session['username'] = username
    return jsonify({'success': True, 'username': username})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'success': True})

@app.route('/api/check_session', methods=['GET'])
def check_session():
    if 'username' in session:
        return jsonify({'loggedIn': True, 'username': session['username']})
    return jsonify({'loggedIn': False})

@app.route('/api/subreddit/info', methods=['GET'])
def subreddit_info():
    subreddit_name = request.args.get('name')
    if not subreddit_name:
        return jsonify({'error': 'Subreddit name is required'}), 400
    
    try:
        info = get_subreddit_info(subreddit_name)
        return jsonify(info)
    except Exception as e:
        logger.error(f"Error getting subreddit info: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/subreddit/posts', methods=['GET'])
def subreddit_posts():
    subreddit_name = request.args.get('name')
    limit = request.args.get('limit', 25, type=int)
    time_filter = request.args.get('time_filter', 'week')
    
    if not subreddit_name:
        return jsonify({'error': 'Subreddit name is required'}), 400
    
    try:
        posts, wordcloud_data, frequency_data = get_subreddit_posts(
            subreddit_name, 
            limit=limit, 
            time_filter=time_filter
        )
        
        # Convert wordcloud image to base64
        if wordcloud_data:
            wordcloud_base64 = base64.b64encode(wordcloud_data).decode('utf-8')
        else:
            wordcloud_base64 = None
            
        return jsonify({
            'posts': posts,
            'wordcloud': wordcloud_base64,
            'frequency': frequency_data
        })
    except Exception as e:
        logger.error(f"Error getting subreddit posts: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/subreddit/sentiment', methods=['GET'])
def subreddit_sentiment():
    subreddit_name = request.args.get('name')
    keyword = request.args.get('keyword', '')
    limit = request.args.get('limit', 100, type=int)
    
    if not subreddit_name:
        return jsonify({'error': 'Subreddit name is required'}), 400
    
    try:
        sentiment_data = analyze_subreddit_sentiment(subreddit_name, keyword, limit)
        return jsonify(sentiment_data)
    except Exception as e:
        logger.error(f"Error analyzing subreddit sentiment: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/comment/thread', methods=['GET'])
def comment_thread():
    post_id = request.args.get('post_id')
    limit = request.args.get('limit', 50, type=int)
    
    if not post_id:
        return jsonify({'error': 'Post ID is required'}), 400
    
    try:
        thread_data = get_comment_thread(post_id, limit)
        return jsonify(thread_data)
    except Exception as e:
        logger.error(f"Error getting comment thread: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/memes', methods=['GET'])
def memes():
    subreddit = request.args.get('subreddit', 'memes')
    limit = request.args.get('limit', 10, type=int)
    
    try:
        meme_data = get_memes(subreddit, limit)
        return jsonify(meme_data)
    except Exception as e:
        logger.error(f"Error fetching memes: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)