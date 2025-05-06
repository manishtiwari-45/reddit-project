import logging
from textblob import TextBlob
from utils.reddit_utils import get_reddit_client

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def analyze_text_sentiment(text):
    """Analyze sentiment of a text using TextBlob with robust error handling"""
    try:
        if not text or len(text.strip()) == 0:
            return {"polarity": 0, "sentiment": "neutral"}
        
        # Handle very long texts by truncating to avoid memory issues
        if len(text) > 10000:
            text = text[:10000]
        
        analysis = TextBlob(text)
        polarity = analysis.sentiment.polarity
        
        # Categorize sentiment
        if polarity > 0.1:
            sentiment = "positive"
        elif polarity < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "polarity": polarity,
            "sentiment": sentiment
        }
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        # Default to neutral on error
        return {
            "polarity": 0,
            "sentiment": "neutral"
        }

def analyze_subreddit_sentiment(subreddit_name, keyword=None, limit=100):
    """Analyze sentiment of posts in a subreddit, optionally filtered by keyword"""
    reddit = get_reddit_client()
    
    try:
        subreddit = reddit.subreddit(subreddit_name)
        
        # Collect posts
        posts_analyzed = 0
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        sentiment_scores = []
        keyword_matches = []
        
        # Get hot posts from the subreddit with error handling
        try:
            submissions = list(subreddit.hot(limit=limit))
        except Exception as e:
            logger.error(f"Error fetching posts from subreddit {subreddit_name}: {e}")
            raise Exception(f"Could not access r/{subreddit_name}. The subreddit may be private, quarantined, or doesn't exist.")
        
        if not submissions:
            logger.warning(f"No posts found in subreddit {subreddit_name}")
            return {
                "subreddit": subreddit_name,
                "keyword": keyword if keyword else None,
                "posts_analyzed": 0,
                "sentiment_counts": {"positive": 0, "neutral": 0, "negative": 0},
                "sentiment_percentages": {"positive": 0, "neutral": 0, "negative": 0},
                "sentiment_data": {
                    "labels": ["Positive", "Neutral", "Negative"],
                    "data": [0, 0, 0],
                    "colors": ["#28a745", "#6c757d", "#dc3545"]
                },
                "detailed_results": [],
                "keyword_matches": []
            }
        
        # Process each submission with robust error handling
        for submission in submissions:
            try:
                title_text = submission.title if hasattr(submission, 'title') else ""
                body_text = ""
                try:
                    if hasattr(submission, 'is_self') and submission.is_self and hasattr(submission, 'selftext'):
                        body_text = submission.selftext
                except:
                    body_text = "" # Default to empty string if there's an error
                    
                combined_text = f"{title_text} {body_text}"
                
                # Check if we need to filter by keyword
                if keyword and keyword.lower() not in combined_text.lower():
                    continue
                
                # Analyze sentiment with error handling
                try:
                    title_sentiment = analyze_text_sentiment(title_text)
                    
                    if body_text:
                        body_sentiment = analyze_text_sentiment(body_text)
                        # Average the sentiment for title and body
                        avg_polarity = (title_sentiment["polarity"] + body_sentiment["polarity"]) / 2
                        
                        if avg_polarity > 0.1:
                            sentiment = "positive"
                        elif avg_polarity < -0.1:
                            sentiment = "negative"
                        else:
                            sentiment = "neutral"
                    else:
                        avg_polarity = title_sentiment["polarity"]
                        sentiment = title_sentiment["sentiment"]
                except Exception as e:
                    logger.error(f"Error analyzing sentiment for post {submission.id}: {e}")
                    # Default to neutral if sentiment analysis fails
                    avg_polarity = 0
                    sentiment = "neutral"
                
                # Increment counter
                sentiment_counts[sentiment] += 1
                
                # Get author name safely
                try:
                    author_name = submission.author.name if hasattr(submission, 'author') and submission.author else "[deleted]"
                except:
                    author_name = "[deleted]"
                
                # Create post result with safe attribute access
                post_result = {
                    "id": getattr(submission, 'id', 'unknown'),
                    "title": getattr(submission, 'title', 'Unknown Title'),
                    "author": author_name,
                    "created_utc": getattr(submission, 'created_utc', 0),
                    "score": getattr(submission, 'score', 0),
                    "num_comments": getattr(submission, 'num_comments', 0),
                    "permalink": getattr(submission, 'permalink', ''),
                    "polarity": avg_polarity,
                    "sentiment": sentiment
                }
                
                sentiment_scores.append(post_result)
                posts_analyzed += 1
                
                # Add to keyword matches if applicable
                if keyword:
                    keyword_matches.append(post_result)
            except Exception as e:
                logger.error(f"Error processing post in subreddit {subreddit_name}: {e}")
                # Continue with next post instead of failing completely
                continue
        
        # No posts were analyzed (all failed or filtered out)
        if posts_analyzed == 0:
            if keyword:
                msg = f"No posts containing '{keyword}' were found in r/{subreddit_name}"
            else:
                msg = f"Could not analyze any posts in r/{subreddit_name}"
            logger.warning(msg)
            raise Exception(msg)
        
        # Calculate percentages for pie chart
        total_posts = sum(sentiment_counts.values())
        if total_posts > 0:
            sentiment_percentages = {
                key: (count / total_posts) * 100 
                for key, count in sentiment_counts.items()
            }
        else:
            sentiment_percentages = {"positive": 0, "neutral": 0, "negative": 0}
        
        return {
            "subreddit": subreddit_name,
            "keyword": keyword if keyword else None,
            "posts_analyzed": posts_analyzed,
            "sentiment_counts": sentiment_counts,
            "sentiment_percentages": sentiment_percentages,
            "sentiment_data": {
                "labels": ["Positive", "Neutral", "Negative"],
                "data": [
                    sentiment_percentages["positive"],
                    sentiment_percentages["neutral"],
                    sentiment_percentages["negative"]
                ],
                "colors": ["#28a745", "#6c757d", "#dc3545"]
            },
            "detailed_results": sentiment_scores[:20],  # Limit detailed results
            "keyword_matches": keyword_matches[:20] if keyword else []
        }
    
    except Exception as e:
        logger.error(f"Error analyzing subreddit sentiment: {e}")
        if isinstance(e, Exception) and str(e):
            # Pass through our own custom error messages
            raise Exception(str(e))
        else:
            # Generic error message
            raise Exception(f"Could not analyze sentiment for r/{subreddit_name}. Please try again.")