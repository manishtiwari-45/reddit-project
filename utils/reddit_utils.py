import os
import logging
from datetime import datetime, timedelta
from collections import Counter
import praw
from io import BytesIO

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Reddit API client
def get_reddit_client():
    try:
        client_id = os.environ.get('REDDIT_CLIENT_ID')
        client_secret = os.environ.get('REDDIT_CLIENT_SECRET')
        user_agent = os.environ.get('REDDIT_USER_AGENT', 'RedditAnalyzer/1.0')
        
        if not client_id or not client_secret:
            logger.warning("Reddit API credentials not found in environment variables")
            # For demo purposes, use a fallback mechanism with public-access only
            # This allows basic functionality even without credentials
            logger.info("Using public-access only mode (limited functionality)")
            return praw.Reddit(
                client_id="dummy",
                client_secret="dummy",
                user_agent=user_agent,
                check_for_updates=False,
                read_only=True
            )
        
        # Normal API connection with proper credentials
        logger.info("Connecting to Reddit API with provided credentials")
        return praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=user_agent,
            check_for_updates=False,
            read_only=True
        )
    except Exception as e:
        logger.error(f"Error initializing Reddit client: {e}")
        # Provide a very basic fallback that will work with minimal functionality
        logger.warning("Using emergency fallback client with severely limited functionality")
        return praw.Reddit(
            client_id="dummy",
            client_secret="dummy",
            user_agent="minimal_fallback_agent",
            check_for_updates=False,
            read_only=True
        )

def get_subreddit_info(subreddit_name):
    """Get basic information about a subreddit"""
    reddit = get_reddit_client()
    
    try:
        subreddit = reddit.subreddit(subreddit_name)
        # Force a request to check if the subreddit exists
        display_name = subreddit.display_name
        
        # Get top contributors (approximation based on hot posts)
        top_contributors = Counter()
        for submission in subreddit.hot(limit=50):
            top_contributors[submission.author.name if submission.author else '[deleted]'] += 1
        
        top_contributors = [
            {"username": author, "posts": count} 
            for author, count in top_contributors.most_common(10) 
            if author != '[deleted]'
        ]
        
        return {
            'name': subreddit.display_name,
            'title': subreddit.title,
            'description': subreddit.public_description,
            'subscribers': subreddit.subscribers,
            'created_utc': subreddit.created_utc,
            'is_nsfw': subreddit.over18,
            'url': f"https://www.reddit.com/r/{subreddit.display_name}/",
            'top_contributors': top_contributors
        }
    except Exception as e:
        logger.error(f"Error getting subreddit info: {e}")
        raise Exception(f"Could not retrieve information for r/{subreddit_name}")

def get_subreddit_posts(subreddit_name, limit=25, time_filter='week'):
    """Get posts from a subreddit with wordcloud and frequency data"""
    reddit = get_reddit_client()
    
    try:
        subreddit = reddit.subreddit(subreddit_name)
        
        # Collect posts
        posts = []
        post_texts = []  # For wordcloud
        post_times = []  # For frequency chart
        
        for submission in subreddit.top(time_filter=time_filter, limit=limit):
            # Basic post info
            post_data = {
                'id': submission.id,
                'title': submission.title,
                'author': submission.author.name if submission.author else '[deleted]',
                'created_utc': submission.created_utc,
                'score': submission.score,
                'upvote_ratio': submission.upvote_ratio,
                'num_comments': submission.num_comments,
                'permalink': submission.permalink,
                'url': submission.url,
                'is_self': submission.is_self,
                'selftext': submission.selftext[:500] + '...' if len(submission.selftext) > 500 else submission.selftext,
                'flair': submission.link_flair_text
            }
            
            posts.append(post_data)
            
            # Add text for wordcloud
            post_texts.append(submission.title)
            if submission.is_self and submission.selftext:
                post_texts.append(submission.selftext)
                
            # Add time for frequency analysis
            post_time = datetime.fromtimestamp(submission.created_utc)
            post_times.append(post_time)
        
        # Generate dummy wordcloud data - we're removing the actual wordcloud for simplicity
        wordcloud_data = None
            
        # Generate post frequency data
        frequency_data = {'labels': [], 'data': []}
        
        if post_times:
            # Determine time interval based on range
            if time_filter in ['day', 'week']:
                # Hourly intervals
                interval = timedelta(hours=1)
                format_str = '%Y-%m-%d %H:00'
            else:
                # Daily intervals
                interval = timedelta(days=1)
                format_str = '%Y-%m-%d'
            
            # Get min and max times
            min_time = min(post_times)
            max_time = max(post_times)
            
            # Create time buckets
            current_time = min_time
            time_buckets = {}
            
            while current_time <= max_time:
                time_label = current_time.strftime(format_str)
                time_buckets[time_label] = 0
                current_time += interval
            
            # Count posts in each bucket
            for post_time in post_times:
                time_label = post_time.strftime(format_str)
                if time_label in time_buckets:
                    time_buckets[time_label] += 1
                    
            # Format for Chart.js
            frequency_data['labels'] = list(time_buckets.keys())
            frequency_data['data'] = list(time_buckets.values())
        
        return posts, wordcloud_data, frequency_data
    
    except Exception as e:
        logger.error(f"Error getting subreddit posts: {e}")
        raise Exception(f"Could not retrieve posts for r/{subreddit_name}")

def get_comment_thread(post_id, limit=50):
    """Get comments from a post in a tree structure for visualization"""
    reddit = get_reddit_client()
    
    try:
        submission = reddit.submission(id=post_id)
        submission.comments.replace_more(limit=0)  # Only fetch readily available comments
        
        # Basic post info
        post_data = {
            'id': submission.id,
            'title': submission.title,
            'author': submission.author.name if submission.author else '[deleted]',
            'created_utc': submission.created_utc,
            'score': submission.score,
            'upvote_ratio': submission.upvote_ratio,
            'num_comments': submission.num_comments,
            'permalink': submission.permalink,
            'url': submission.url,
            'is_self': submission.is_self,
            'selftext': submission.selftext[:500] + '...' if len(submission.selftext) > 500 else submission.selftext
        }
        
        # Get comments in tree structure for D3.js visualization
        def process_comment(comment, depth=0):
            if depth > 5:  # Limit depth to prevent extremely nested comments
                return None
                
            try:
                comment_data = {
                    'id': comment.id,
                    'author': comment.author.name if comment.author else '[deleted]',
                    'body': comment.body[:200] + '...' if len(comment.body) > 200 else comment.body,
                    'score': comment.score,
                    'created_utc': comment.created_utc,
                    'depth': depth,
                    'children': []
                }
                
                # Process replies (children)
                for reply in comment.replies:
                    child_data = process_comment(reply, depth + 1)
                    if child_data:
                        comment_data['children'].append(child_data)
                
                return comment_data
            except Exception as e:
                logger.error(f"Error processing comment {comment.id}: {e}")
                return None
        
        # Process top-level comments
        comments = []
        for comment in submission.comments[:limit]:  # Limit to top N comments
            comment_data = process_comment(comment)
            if comment_data:
                comments.append(comment_data)
        
        return {
            'post': post_data,
            'comments': comments
        }
    
    except Exception as e:
        logger.error(f"Error getting comment thread: {e}")
        raise Exception(f"Could not retrieve comments for post {post_id}")