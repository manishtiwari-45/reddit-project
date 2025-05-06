import logging
from utils.reddit_utils import get_reddit_client

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def is_image_url(url):
    """Check if URL is likely an image"""
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    return any(url.lower().endswith(ext) for ext in image_extensions)

def get_memes(subreddit_name="memes", limit=10):
    """Fetch memes from specified subreddit with robust error handling"""
    # Default to memes subreddit if none provided
    if not subreddit_name or subreddit_name.strip() == "":
        subreddit_name = "memes"
    
    # Enforce reasonable limits
    limit = min(max(1, limit), 25)  # Between 1 and 25
    
    try:
        reddit = get_reddit_client()
        
        # Check if we can connect to Reddit
        try:
            # Quick validation - try to access the subreddit
            subreddit = reddit.subreddit(subreddit_name)
            # Force a small request to check if the subreddit exists and is accessible
            display_name = subreddit.display_name
            logger.info(f"Successfully connected to r/{subreddit_name}")
        except Exception as e:
            logger.error(f"Cannot access subreddit r/{subreddit_name}: {e}")
            return {
                'subreddit': subreddit_name,
                'memes': [],
                'error': f"Could not access r/{subreddit_name}. The subreddit may be private, quarantined, banned, or doesn't exist."
            }
        
        # Collect meme posts
        memes = []
        count = 0
        posts_checked = 0
        max_posts_to_check = limit * 5  # Check up to 5x the requested limit
        
        try:
            # Try to get hot posts with extra error handling
            submissions = subreddit.hot(limit=max_posts_to_check)
            
            # Process each submission with error handling
            for submission in submissions:
                posts_checked += 1
                
                try:
                    # Skip non-image posts or NSFW content (with error handling)
                    if hasattr(submission, 'over_18') and submission.over_18:
                        continue
                    
                    # Get URL safely
                    if not hasattr(submission, 'url') or not submission.url:
                        continue
                    
                    url = submission.url
                    
                    # Check if it's an image URL or from an image hosting site
                    if (is_image_url(url) or 
                        'imgur.com' in url or 
                        'i.redd.it' in url):
                        
                        # Create meme data dictionary with safe attribute access
                        try:
                            author_name = submission.author.name if hasattr(submission, 'author') and submission.author else '[deleted]'
                        except:
                            author_name = '[deleted]'
                        
                        meme_data = {
                            'id': getattr(submission, 'id', 'unknown'),
                            'title': getattr(submission, 'title', 'Unknown Title'),
                            'author': author_name,
                            'created_utc': getattr(submission, 'created_utc', 0),
                            'score': getattr(submission, 'score', 0),
                            'num_comments': getattr(submission, 'num_comments', 0),
                            'permalink': getattr(submission, 'permalink', ''),
                            'image_url': url,
                            'subreddit': subreddit_name
                        }
                        
                        memes.append(meme_data)
                        count += 1
                        
                        if count >= limit:
                            break
                except Exception as e:
                    logger.warning(f"Error processing post in meme fetch: {e}")
                    continue  # Skip this post but continue processing others
            
            logger.info(f"Checked {posts_checked} posts, found {count} suitable memes")
            
            # No memes found after checking all available posts
            if not memes:
                return {
                    'subreddit': subreddit_name,
                    'memes': [],
                    'error': f"No suitable memes found in r/{subreddit_name}"
                }
            
            return {
                'subreddit': subreddit_name,
                'memes': memes
            }
            
        except Exception as e:
            logger.error(f"Error fetching posts from subreddit: {e}")
            return {
                'subreddit': subreddit_name,
                'memes': [],
                'error': f"Error accessing posts in r/{subreddit_name}: {str(e)}"
            }
    
    except Exception as e:
        logger.error(f"Error in meme fetcher: {e}")
        return {
            'subreddit': subreddit_name,
            'memes': [],
            'error': f"Could not fetch memes: {str(e)}"
        }
