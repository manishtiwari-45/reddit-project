// Global state
const state = {
  darkMode: false,
  loggedIn: false,
  username: null,
  trackedSubreddits: [],
  trackedKeywords: [],
  sentimentChart: null,
  frequencyChart: null
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap components
  initializeBootstrap();
  
  // Check for saved theme preference
  initThemePreference();
  
  // Check session
  checkSession();
  
  // Initialize event listeners
  initEventListeners();
  
  // Load tracked data from localStorage
  loadLocalStorageData();
});

// Initialize Bootstrap components
function initializeBootstrap() {
  // Initialize all tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Initialize theme preference
function initThemePreference() {
  const savedTheme = localStorage.getItem('redditAnalyzerTheme');
  if (savedTheme === 'dark') {
    enableDarkMode();
  } else if (savedTheme === 'light') {
    enableLightMode();
  } else {
    // Default to dark mode
    enableDarkMode();
  }
}

// Enable dark mode with smooth transition
function enableDarkMode() {
  document.documentElement.setAttribute('data-bs-theme', 'dark');
  state.darkMode = true;
  localStorage.setItem('redditAnalyzerTheme', 'dark');
  
  // We don't need to change the inner HTML as the theme switch uses CSS for visuals
  document.body.classList.add('theme-transition');
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 500);
  
  // Dispatch event for components that need to react to theme change
  document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'dark' } }));
}

// Enable light mode with smooth transition
function enableLightMode() {
  document.documentElement.setAttribute('data-bs-theme', 'light');
  state.darkMode = false;
  localStorage.setItem('redditAnalyzerTheme', 'light');
  
  // Apply transition class for smooth color changes
  document.body.classList.add('theme-transition');
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 500);
  
  // Dispatch event for components that need to react to theme change
  document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'light' } }));
}

// Check session
function checkSession() {
  fetch('/api/check_session')
    .then(response => response.json())
    .then(data => {
      if (data.loggedIn) {
        state.loggedIn = true;
        state.username = data.username;
        updateLoginState();
      }
    })
    .catch(error => console.error('Error checking session:', error));
}

// Update login state in UI
function updateLoginState() {
  const loggedOutState = document.getElementById('logged-out-state');
  const loggedInState = document.getElementById('logged-in-state');
  const usernameDisplay = document.getElementById('username-display');
  const initialsElement = document.querySelector('.initials');
  
  if (state.loggedIn) {
    loggedOutState.classList.add('d-none');
    loggedInState.classList.remove('d-none');
    usernameDisplay.textContent = state.username;
    
    // Generate initials for avatar
    if (initialsElement) {
      const initials = generateInitials(state.username);
      initialsElement.textContent = initials;
      
      // Generate a consistent color based on username
      const avatarElement = document.querySelector('.avatar-circle');
      if (avatarElement) {
        const colorHue = getStringHashCode(state.username) % 360;
        avatarElement.style.backgroundColor = `hsl(${colorHue}, 70%, 50%)`;
      }
    }
  } else {
    loggedOutState.classList.remove('d-none');
    loggedInState.classList.add('d-none');
    usernameDisplay.textContent = '';
    if (initialsElement) {
      initialsElement.textContent = '';
    }
  }
}

// Generate initials from name
function generateInitials(name) {
  if (!name) return '';
  
  // Split by spaces and get first characters
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // Single word name, take first character
    return parts[0].charAt(0).toUpperCase();
  } else {
    // Multiple word name, take first char of first and last word
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}

// Generate consistent hash code from string
function getStringHashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Initialize event listeners
function initEventListeners() {
  // Theme toggle
  document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    if (state.darkMode) {
      enableLightMode();
    } else {
      enableDarkMode();
    }
  });
  
  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Dashboard buttons
  document.getElementById('add-subreddit-btn').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('addSubredditModal'));
    modal.show();
  });
  
  document.getElementById('add-keyword-btn').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('addKeywordModal'));
    modal.show();
  });
  
  // Add subreddit form
  document.getElementById('add-subreddit-form').addEventListener('submit', handleAddSubreddit);
  
  // Add keyword form
  document.getElementById('add-keyword-form').addEventListener('submit', handleAddKeyword);
  
  // Subreddit analyzer
  document.getElementById('analyze-subreddit-btn').addEventListener('click', handleSubredditAnalysis);
  document.getElementById('subreddit-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSubredditAnalysis();
  });
  
  // Sentiment tracker
  document.getElementById('analyze-sentiment-btn').addEventListener('click', handleSentimentAnalysis);
  
  // Thread visualizer
  document.getElementById('visualize-thread-btn').addEventListener('click', handleThreadVisualization);
  document.getElementById('post-url-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleThreadVisualization();
  });
  
  // Meme fetcher
  document.getElementById('fetch-memes-btn').addEventListener('click', handleMemeFetch);
}

// Load data from localStorage
function loadLocalStorageData() {
  // Load tracked subreddits
  const savedSubreddits = localStorage.getItem('trackedSubreddits');
  if (savedSubreddits) {
    state.trackedSubreddits = JSON.parse(savedSubreddits);
    updateTrackedSubreddits();
  }
  
  // Load tracked keywords
  const savedKeywords = localStorage.getItem('trackedKeywords');
  if (savedKeywords) {
    state.trackedKeywords = JSON.parse(savedKeywords);
    updateTrackedKeywords();
  }
}

// Handle login
function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username-input').value.trim();
  
  if (!username) return;
  
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        state.loggedIn = true;
        state.username = data.username;
        updateLoginState();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        modal.hide();
      }
    })
    .catch(error => console.error('Error logging in:', error));
}

// Handle logout
function handleLogout() {
  fetch('/api/logout', {
    method: 'POST'
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        state.loggedIn = false;
        state.username = null;
        updateLoginState();
      }
    })
    .catch(error => console.error('Error logging out:', error));
}

// Handle add subreddit
function handleAddSubreddit(e) {
  e.preventDefault();
  
  const subredditName = document.getElementById('new-subreddit-input').value.trim();
  
  if (!subredditName) return;
  
  // Check if already tracked
  if (state.trackedSubreddits.some(sr => sr.toLowerCase() === subredditName.toLowerCase())) {
    alert('This subreddit is already being tracked');
    return;
  }
  
  // Add to tracked list
  state.trackedSubreddits.push(subredditName);
  localStorage.setItem('trackedSubreddits', JSON.stringify(state.trackedSubreddits));
  updateTrackedSubreddits();
  
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('addSubredditModal'));
  modal.hide();
  
  // Clear form
  document.getElementById('new-subreddit-input').value = '';
}

// Handle add keyword
function handleAddKeyword(e) {
  e.preventDefault();
  
  const keyword = document.getElementById('new-keyword-input').value.trim();
  const subreddit = document.getElementById('keyword-subreddit-input').value.trim();
  
  if (!keyword) return;
  
  // Create keyword object
  const keywordObj = {
    text: keyword,
    subreddit: subreddit || 'all'
  };
  
  // Check if already tracked
  if (state.trackedKeywords.some(k => 
    k.text.toLowerCase() === keyword.toLowerCase() && 
    k.subreddit.toLowerCase() === (subreddit || 'all').toLowerCase()
  )) {
    alert('This keyword is already being tracked');
    return;
  }
  
  // Add to tracked list
  state.trackedKeywords.push(keywordObj);
  localStorage.setItem('trackedKeywords', JSON.stringify(state.trackedKeywords));
  updateTrackedKeywords();
  
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('addKeywordModal'));
  modal.hide();
  
  // Clear form
  document.getElementById('new-keyword-input').value = '';
  document.getElementById('keyword-subreddit-input').value = '';
}

// Update tracked subreddits in UI
function updateTrackedSubreddits() {
  const container = document.getElementById('tracked-subreddits');
  const noSubredditsMessage = document.getElementById('no-subreddits-message');
  
  // Clear container
  container.innerHTML = '';
  
  if (state.trackedSubreddits.length === 0) {
    noSubredditsMessage.classList.remove('d-none');
    return;
  }
  
  noSubredditsMessage.classList.add('d-none');
  
  // Add each subreddit
  state.trackedSubreddits.forEach(subreddit => {
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    const nameLink = document.createElement('a');
    nameLink.href = '#';
    nameLink.className = 'fw-medium';
    nameLink.textContent = `r/${subreddit}`;
    nameLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('subreddit-input').value = subreddit;
      document.getElementById('subreddit-tab').click();
      handleSubredditAnalysis();
    });
    
    const actions = document.createElement('div');
    
    const analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'btn btn-sm btn-outline-primary me-2';
    analyzeBtn.innerHTML = '<i class="fas fa-chart-bar"></i>';
    analyzeBtn.title = 'Analyze';
    analyzeBtn.addEventListener('click', () => {
      document.getElementById('subreddit-input').value = subreddit;
      document.getElementById('subreddit-tab').click();
      handleSubredditAnalysis();
    });
    
    const sentimentBtn = document.createElement('button');
    sentimentBtn.className = 'btn btn-sm btn-outline-success me-2';
    sentimentBtn.innerHTML = '<i class="fas fa-smile"></i>';
    sentimentBtn.title = 'Sentiment Analysis';
    sentimentBtn.addEventListener('click', () => {
      document.getElementById('sentiment-subreddit-input').value = subreddit;
      document.getElementById('sentiment-tab').click();
      handleSentimentAnalysis();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Remove';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to remove r/${subreddit} from tracking?`)) {
        state.trackedSubreddits = state.trackedSubreddits.filter(sr => sr !== subreddit);
        localStorage.setItem('trackedSubreddits', JSON.stringify(state.trackedSubreddits));
        updateTrackedSubreddits();
      }
    });
    
    actions.appendChild(analyzeBtn);
    actions.appendChild(sentimentBtn);
    actions.appendChild(deleteBtn);
    
    item.appendChild(nameLink);
    item.appendChild(actions);
    
    container.appendChild(item);
  });
}

// Update tracked keywords in UI
function updateTrackedKeywords() {
  const container = document.getElementById('tracked-keywords');
  const noKeywordsMessage = document.getElementById('no-keywords-message');
  
  // Clear container
  container.innerHTML = '';
  
  if (state.trackedKeywords.length === 0) {
    noKeywordsMessage.classList.remove('d-none');
    return;
  }
  
  noKeywordsMessage.classList.add('d-none');
  
  // Add each keyword
  state.trackedKeywords.forEach(keyword => {
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    const nameLink = document.createElement('a');
    nameLink.href = '#';
    nameLink.className = 'fw-medium';
    nameLink.textContent = `"${keyword.text}" in r/${keyword.subreddit}`;
    nameLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('sentiment-subreddit-input').value = keyword.subreddit === 'all' ? '' : keyword.subreddit;
      document.getElementById('sentiment-keyword-input').value = keyword.text;
      document.getElementById('sentiment-tab').click();
      handleSentimentAnalysis();
    });
    
    const actions = document.createElement('div');
    
    const analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'btn btn-sm btn-outline-primary me-2';
    analyzeBtn.innerHTML = '<i class="fas fa-search"></i>';
    analyzeBtn.title = 'Analyze Sentiment';
    analyzeBtn.addEventListener('click', () => {
      document.getElementById('sentiment-subreddit-input').value = keyword.subreddit === 'all' ? '' : keyword.subreddit;
      document.getElementById('sentiment-keyword-input').value = keyword.text;
      document.getElementById('sentiment-tab').click();
      handleSentimentAnalysis();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Remove';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to remove "${keyword.text}" from tracking?`)) {
        state.trackedKeywords = state.trackedKeywords.filter(k => 
          !(k.text === keyword.text && k.subreddit === keyword.subreddit)
        );
        localStorage.setItem('trackedKeywords', JSON.stringify(state.trackedKeywords));
        updateTrackedKeywords();
      }
    });
    
    actions.appendChild(analyzeBtn);
    actions.appendChild(deleteBtn);
    
    item.appendChild(nameLink);
    item.appendChild(actions);
    
    container.appendChild(item);
  });
}

// Update saved titles in UI
function updateSavedTitles() {
  const container = document.getElementById('saved-titles');
  const noTitlesMessage = document.getElementById('no-titles-message');
  
  // Clear container
  container.innerHTML = '';
  
  if (state.savedTitles.length === 0) {
    noTitlesMessage.classList.remove('d-none');
    return;
  }
  
  noTitlesMessage.classList.add('d-none');
  
  // Add each saved title
  state.savedTitles.forEach((title, index) => {
    const item = document.createElement('div');
    item.className = 'list-group-item';
    
    const titleRow = document.createElement('div');
    titleRow.className = 'd-flex justify-content-between align-items-start';
    
    const titleText = document.createElement('div');
    titleText.className = 'me-3';
    titleText.textContent = title.text;
    
    const titleMeta = document.createElement('small');
    titleMeta.className = 'text-muted d-block mt-1';
    titleMeta.textContent = `Generated from r/${title.subreddit} on ${new Date(title.timestamp).toLocaleDateString()}`;
    titleText.appendChild(titleMeta);
    
    const actions = document.createElement('div');
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Remove';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to remove this saved title?')) {
        state.savedTitles.splice(index, 1);
        localStorage.setItem('savedTitles', JSON.stringify(state.savedTitles));
        updateSavedTitles();
      }
    });
    
    actions.appendChild(deleteBtn);
    
    titleRow.appendChild(titleText);
    titleRow.appendChild(actions);
    
    item.appendChild(titleRow);
    container.appendChild(item);
  });
}

// Handle subreddit analysis
function handleSubredditAnalysis() {
  const subredditName = document.getElementById('subreddit-input').value.trim();
  const timeFilter = document.getElementById('time-filter').value;
  
  if (!subredditName) return;
  
  // Show loading state
  document.getElementById('subreddit-results').classList.add('d-none');
  document.getElementById('subreddit-error').classList.add('d-none');
  document.getElementById('subreddit-loading').classList.remove('d-none');
  
  // Clean up any previous charts
  if (state.frequencyChart) {
    state.frequencyChart.destroy();
    state.frequencyChart = null;
  }
  
  // Fetch subreddit data
  fetch(`/api/subreddit/info?name=${encodeURIComponent(subredditName)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Subreddit not found or API error');
      }
      return response.json();
    })
    .then(info => {
      // Display subreddit info
      document.getElementById('subreddit-name').textContent = info.name;
      
      const infoHtml = `
        <p>${info.description}</p>
        <div class="row mt-3">
          <div class="col-6">
            <p><strong>Subscribers:</strong> ${info.subscribers.toLocaleString()}</p>
          </div>
          <div class="col-6">
            <p><strong>Created:</strong> ${new Date(info.created_utc * 1000).toLocaleDateString()}</p>
          </div>
        </div>
      `;
      document.getElementById('subreddit-info').innerHTML = infoHtml;
      
      // Display top contributors
      const contributorsEl = document.getElementById('top-contributors');
      contributorsEl.innerHTML = '';
      
      info.top_contributors.forEach(contributor => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
          <span>${contributor.username}</span>
          <span class="badge bg-primary rounded-pill">${contributor.posts} posts</span>
        `;
        contributorsEl.appendChild(li);
      });
      
      // Track button functionality
      const trackBtn = document.getElementById('track-subreddit-btn');
      if (state.trackedSubreddits.includes(info.name)) {
        trackBtn.innerHTML = '<i class="fas fa-check me-1"></i>Tracked';
        trackBtn.disabled = true;
      } else {
        trackBtn.innerHTML = '<i class="fas fa-bookmark me-1"></i>Track';
        trackBtn.disabled = false;
        trackBtn.addEventListener('click', () => {
          state.trackedSubreddits.push(info.name);
          localStorage.setItem('trackedSubreddits', JSON.stringify(state.trackedSubreddits));
          updateTrackedSubreddits();
          trackBtn.innerHTML = '<i class="fas fa-check me-1"></i>Tracked';
          trackBtn.disabled = true;
        });
      }
      
      // Fetch posts data
      return fetch(`/api/subreddit/posts?name=${encodeURIComponent(subredditName)}&time_filter=${timeFilter}`);
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch subreddit posts');
      }
      return response.json();
    })
    .then(data => {
      // Display wordcloud
      if (data.wordcloud) {
        const wordcloudImg = document.getElementById('wordcloud-image');
        wordcloudImg.src = `data:image/png;base64,${data.wordcloud}`;
      }
      
      // Display post frequency chart
      if (data.frequency && data.frequency.labels.length > 0) {
        const ctx = document.getElementById('frequency-chart').getContext('2d');
        state.frequencyChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.frequency.labels,
            datasets: [{
              label: 'Posts',
              data: data.frequency.data,
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            }
          }
        });
      }
      
      // Display posts table
      const tableBody = document.getElementById('posts-table-body');
      tableBody.innerHTML = '';
      
      data.posts.forEach(post => {
        const row = document.createElement('tr');
        
        // Format date
        const postDate = new Date(post.created_utc * 1000);
        const dateString = postDate.toLocaleDateString() + ' ' + postDate.toLocaleTimeString();
        
        row.innerHTML = `
          <td>
            <a href="https://www.reddit.com${post.permalink}" target="_blank" class="text-truncate d-inline-block" style="max-width: 300px;" title="${post.title}">
              ${post.title}
            </a>
          </td>
          <td>${post.author}</td>
          <td>${post.score}</td>
          <td>${post.num_comments}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary view-thread-btn" data-post-id="${post.id}">
              <i class="fas fa-comments"></i>
            </button>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Add event listeners to view thread buttons
      document.querySelectorAll('.view-thread-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const postId = btn.getAttribute('data-post-id');
          document.getElementById('post-url-input').value = postId;
          document.getElementById('thread-tab').click();
          handleThreadVisualization();
        });
      });
      
      // Hide loading, show results
      document.getElementById('subreddit-loading').classList.add('d-none');
      document.getElementById('subreddit-results').classList.remove('d-none');
    })
    .catch(error => {
      console.error('Error fetching subreddit data:', error);
      document.getElementById('subreddit-loading').classList.add('d-none');
      document.getElementById('subreddit-error').classList.remove('d-none');
      document.getElementById('subreddit-error-message').textContent = error.message;
    });
}

// Handle sentiment analysis with improved error handling and feedback
function handleSentimentAnalysis() {
  const subredditName = document.getElementById('sentiment-subreddit-input').value.trim();
  const keyword = document.getElementById('sentiment-keyword-input').value.trim();
  
  if (!subredditName) {
    showErrorToast('Please enter a subreddit name');
    return;
  }
  
  // Show loading state with animation
  document.getElementById('sentiment-results').classList.add('d-none');
  document.getElementById('sentiment-error').classList.add('d-none');
  
  const loadingEl = document.getElementById('sentiment-loading');
  loadingEl.classList.remove('d-none');
  loadingEl.classList.add('animate__animated', 'animate__fadeIn');
  
  // Update the heading to show what we're analyzing
  document.getElementById('sentiment-analyzing-text').textContent = 
    `Analyzing sentiment for r/${subredditName}${keyword ? ` with keyword "${keyword}"` : ''}`;
  
  // Clean up any previous chart
  if (state.sentimentChart) {
    state.sentimentChart.destroy();
    state.sentimentChart = null;
  }
  
  // Build URL
  let url = `/api/subreddit/sentiment?name=${encodeURIComponent(subredditName)}`;
  if (keyword) {
    url += `&keyword=${encodeURIComponent(keyword)}`;
  }
  
  // Set a timeout to detect long-running requests
  const timeoutId = setTimeout(() => {
    // If it's taking too long, show a message
    document.getElementById('sentiment-loading-message').textContent = 
      'This is taking longer than expected. Analyzing large subreddits may take some time...';
  }, 5000);
  
  // Fetch sentiment data with improved error handling
  fetch(url)
    .then(response => {
      clearTimeout(timeoutId); // Clear the timeout
      
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || 'Failed to analyze sentiment. Please try a different subreddit.');
        });
      }
      return response.json();
    })
    .then(data => {
      // Update info section with nice animations
      document.getElementById('sentiment-subreddit-name').textContent = data.subreddit;
      document.getElementById('sentiment-keyword').textContent = data.keyword || 'None (analyzing all posts)';
      document.getElementById('sentiment-posts-count').textContent = data.posts_analyzed;
      
      // Update count displays with animations
      const positiveEl = document.getElementById('positive-count');
      const neutralEl = document.getElementById('neutral-count');
      const negativeEl = document.getElementById('negative-count');
      
      positiveEl.textContent = data.sentiment_counts.positive;
      neutralEl.textContent = data.sentiment_counts.neutral;
      negativeEl.textContent = data.sentiment_counts.negative;
      
      // Apply highlight colors based on which sentiment is most common
      const countsArr = [
        {el: positiveEl, count: data.sentiment_counts.positive, type: 'positive'},
        {el: neutralEl, count: data.sentiment_counts.neutral, type: 'neutral'},
        {el: negativeEl, count: data.sentiment_counts.negative, type: 'negative'}
      ];
      
      // Find the max count
      const maxCount = Math.max(...countsArr.map(item => item.count));
      
      // Highlight the highest count(s)
      countsArr.forEach(item => {
        if (item.count === maxCount && maxCount > 0) {
          item.el.classList.add('fw-bold', 'fs-4', `sentiment-${item.type}`);
        } else {
          item.el.classList.remove('fw-bold', 'fs-4', 'sentiment-positive', 'sentiment-neutral', 'sentiment-negative');
        }
      });
      
      // Create chart with animation
      const ctx = document.getElementById('sentiment-chart').getContext('2d');
      state.sentimentChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: data.sentiment_data.labels,
          datasets: [{
            data: data.sentiment_data.data,
            backgroundColor: data.sentiment_data.colors,
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              position: 'right',
              labels: {
                font: {
                  family: 'Inter, sans-serif',
                  size: 12
                },
                padding: 20,
                usePointStyle: true,
                boxWidth: 10
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw.toFixed(1) + '%';
                  const count = data.sentiment_counts[context.label.toLowerCase()];
                  return [`${label}: ${value}`, `Posts: ${count}`];
                }
              }
            }
          }
        }
      });
      
      // Populate table with improved formatting
      const tableBody = document.getElementById('sentiment-table-body');
      tableBody.innerHTML = '';
      
      // Show a message if there are no results to display
      if (data.detailed_results.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="text-center py-4">No posts found matching your criteria.</td>`;
        tableBody.appendChild(row);
      } else {
        // Add each post to the table with fade-in animation
        data.detailed_results.forEach((post, index) => {
          const row = document.createElement('tr');
          row.classList.add('animate__animated', 'animate__fadeIn');
          row.style.animationDelay = `${index * 50}ms`;
          
          // Determine sentiment class
          let sentimentClass = 'sentiment-neutral';
          let sentimentIcon = 'fa-meh';
          
          if (post.sentiment === 'positive') {
            sentimentClass = 'sentiment-positive';
            sentimentIcon = 'fa-smile';
          } else if (post.sentiment === 'negative') {
            sentimentClass = 'sentiment-negative';
            sentimentIcon = 'fa-frown';
          }
          
          // Format the date
          const postDate = new Date(post.created_utc * 1000);
          const dateString = postDate.toLocaleDateString();
          
          row.innerHTML = `
            <td>
              <a href="https://www.reddit.com${post.permalink}" target="_blank" class="text-truncate d-inline-block" style="max-width: 300px;" title="${post.title}">
                ${post.title}
              </a>
              <div class="small text-muted mt-1">${dateString}</div>
            </td>
            <td>
              <span class="d-inline-block text-truncate" style="max-width: 150px;">${post.author}</span>
            </td>
            <td>${post.score}</td>
            <td class="${sentimentClass}">
              <i class="fas ${sentimentIcon} me-1"></i>${post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
            </td>
            <td>${post.polarity.toFixed(2)}</td>
          `;
          
          tableBody.appendChild(row);
        });
      }
      
      // Track button functionality with improved UI
      const trackBtn = document.getElementById('track-sentiment-btn');
      
      // Create key for tracking
      const keywordObj = {
        text: keyword || '*',
        subreddit: subredditName
      };
      
      const isTracked = state.trackedKeywords.some(k => 
        k.text.toLowerCase() === (keyword || '*').toLowerCase() && 
        k.subreddit.toLowerCase() === subredditName.toLowerCase()
      );
      
      // Remove any existing event listeners (to prevent duplicates)
      const trackBtnClone = trackBtn.cloneNode(true);
      trackBtn.parentNode.replaceChild(trackBtnClone, trackBtn);
      
      if (isTracked) {
        trackBtnClone.innerHTML = '<i class="fas fa-check me-1"></i>Tracked';
        trackBtnClone.disabled = true;
        trackBtnClone.classList.remove('btn-primary');
        trackBtnClone.classList.add('btn-success');
      } else {
        trackBtnClone.innerHTML = '<i class="fas fa-bookmark me-1"></i>Track';
        trackBtnClone.disabled = false;
        trackBtnClone.classList.add('btn-primary');
        trackBtnClone.classList.remove('btn-success');
        
        trackBtnClone.addEventListener('click', () => {
          // Add to tracked keywords
          state.trackedKeywords.push(keywordObj);
          localStorage.setItem('trackedKeywords', JSON.stringify(state.trackedKeywords));
          updateTrackedKeywords();
          
          // Update button appearance
          trackBtnClone.innerHTML = '<i class="fas fa-check me-1"></i>Tracked';
          trackBtnClone.disabled = true;
          trackBtnClone.classList.remove('btn-primary');
          trackBtnClone.classList.add('btn-success');
          
          // Show a success message
          showSuccessToast(`Added r/${subredditName} with keyword "${keyword || '*'}" to tracking`);
        });
      }
      
      // Hide loading, show results with animation
      loadingEl.classList.add('animate__animated', 'animate__fadeOut');
      setTimeout(() => {
        loadingEl.classList.add('d-none');
        loadingEl.classList.remove('animate__animated', 'animate__fadeIn', 'animate__fadeOut');
        
        const resultsEl = document.getElementById('sentiment-results');
        resultsEl.classList.remove('d-none');
        resultsEl.classList.add('animate__animated', 'animate__fadeIn');
        setTimeout(() => {
          resultsEl.classList.remove('animate__animated', 'animate__fadeIn');
        }, 500);
      }, 300);
    })
    .catch(error => {
      console.error('Error fetching sentiment data:', error);
      clearTimeout(timeoutId);
      
      // Hide loading
      loadingEl.classList.add('animate__animated', 'animate__fadeOut');
      setTimeout(() => {
        loadingEl.classList.add('d-none');
        loadingEl.classList.remove('animate__animated', 'animate__fadeIn', 'animate__fadeOut');
        
        // Show error with animation
        const errorEl = document.getElementById('sentiment-error');
        const errorMessageEl = document.getElementById('sentiment-error-message');
        
        errorMessageEl.textContent = error.message || 'An error occurred while analyzing sentiment';
        errorEl.classList.remove('d-none');
        errorEl.classList.add('animate__animated', 'animate__shakeX');
        setTimeout(() => {
          errorEl.classList.remove('animate__animated', 'animate__shakeX');
        }, 500);
      }, 300);
    });
}

// Extract post ID from URL or input
function extractPostId(input) {
  input = input.trim();
  
  // If it's already an ID (6 chars alphanumeric)
  if (/^[a-z0-9]{6,8}$/i.test(input)) {
    return input;
  }
  
  // Extract from URL
  const match = input.match(/comments\/([a-z0-9]{6,8})/i);
  if (match && match[1]) {
    return match[1];
  }
  
  throw new Error('Invalid post URL or ID');
}

// Handle thread visualization
function handleThreadVisualization() {
  const input = document.getElementById('post-url-input').value.trim();
  
  if (!input) {
    alert('Please enter a post URL or ID');
    return;
  }
  
  try {
    const postId = extractPostId(input);
    
    // Show loading state
    document.getElementById('thread-results').classList.add('d-none');
    document.getElementById('thread-error').classList.add('d-none');
    document.getElementById('thread-loading').classList.remove('d-none');
    
    // Fetch thread data
    fetch(`/api/comment/thread?post_id=${encodeURIComponent(postId)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch comment thread');
        }
        return response.json();
      })
      .then(data => {
        // Update post details
        document.getElementById('thread-post-title').textContent = data.post.title;
        document.getElementById('thread-post-author').textContent = data.post.author;
        document.getElementById('thread-post-score').textContent = data.post.score;
        document.getElementById('thread-post-comments').textContent = data.post.num_comments;
        document.getElementById('thread-post-content').textContent = data.post.selftext || '(No content)';
        
        // Visualize the comment thread using D3.js
        createThreadVisualization(data);
        
        // Hide loading, show results
        document.getElementById('thread-loading').classList.add('d-none');
        document.getElementById('thread-results').classList.remove('d-none');
      })
      .catch(error => {
        console.error('Error fetching thread data:', error);
        document.getElementById('thread-loading').classList.add('d-none');
        document.getElementById('thread-error').classList.remove('d-none');
        document.getElementById('thread-error-message').textContent = error.message;
      });
  } catch (error) {
    document.getElementById('thread-error').classList.remove('d-none');
    document.getElementById('thread-error-message').textContent = error.message;
  }
}

// Create thread visualization with D3.js
// Create thread visualization with improved readability
function createThreadVisualization(data) {
  const container = document.getElementById('thread-visualization');
  container.innerHTML = '';
  
  // Create root node with post data
  const root = {
    id: data.post.id,
    author: data.post.author,
    body: data.post.title,
    score: data.post.score,
    created_utc: data.post.created_utc,
    depth: 0,
    children: data.comments
  };
  
  // Set up SVG with responsive dimensions
  const margin = { top: 60, right: 90, bottom: 50, left: 90 };
  const width = Math.min(1200, container.clientWidth) - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;
  
  // Create SVG container with responsive attributes
  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -30)
    .attr('text-anchor', 'middle')
    .attr('class', 'visualization-title')
    .style('font-size', '16px')
    .style('font-weight', '500')
    .text('Comment Thread Visualization');
  
  // Add description
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('opacity', 0.7)
    .text('Hover over nodes to see comments. Use mouse wheel to zoom, drag to pan.');
    
  // Prepare the hierarchy data
  const hierarchy = d3.hierarchy(root);
  
  // Define tree layout
  const tree = d3.tree().size([width, height]);
  
  // Compute the tree layout
  const treeData = tree(hierarchy);
  
  // Add tooltip div with glassmorphism effect
  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'node-info')
    .style('opacity', 0);
  
  // Create a group for links
  const linkGroup = svg.append('g').attr('class', 'links');
  
  // Add links between nodes with curved paths
  linkGroup.selectAll('.link')
    .data(treeData.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y))
    .style('stroke-width', d => Math.max(1, Math.min(3, Math.log10((d.target.data.score || 1) + 1))));
  
  // Create a group for nodes
  const nodeGroup = svg.append('g').attr('class', 'nodes');
  
  // Add each node as a group
  const node = nodeGroup.selectAll('.node')
    .data(treeData.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('id', d => `node-${d.data.id}`)
    .attr('transform', d => `translate(${d.x}, ${d.y})`);
  
  // Calculate sentiment color based on score
  function getSentimentColor(score) {
    if (score >= 10) return 'var(--bs-success)'; // High score
    if (score <= 0) return 'var(--bs-danger)';  // Negative score
    return 'var(--bs-primary)';                  // Normal score
  }
  
  // Add circles for the nodes with improved visual appearance
  node.append('circle')
    .attr('r', d => {
      // Scale circle size based on score logarithmically with min and max
      const baseSize = 5;
      const scoreFactor = d.data.score > 0 ? Math.log10(d.data.score + 1) : 0;
      return Math.max(baseSize, Math.min(baseSize + scoreFactor, 15));
    })
    .attr('fill', d => getSentimentColor(d.data.score))
    .on('mouseover', function(event, d) {
      // Highlight the node and its connections
      d3.select(this).classed('node-active', true);
      
      // Find all connected links and highlight them
      linkGroup.selectAll('.link').each(function(link) {
        if (link.source.data.id === d.data.id || link.target.data.id === d.data.id) {
          d3.select(this).classed('link-active', true);
        }
      });
      
      // Show tooltip with animation
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.95);
        
      // Format date
      const date = new Date(d.data.created_utc * 1000);
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      // Truncate long comment text
      let commentText = d.data.body || "";
      if (commentText.length > 300) {
        commentText = commentText.substring(0, 300) + '...';
      }
      
      // Show comment info in tooltip with improved formatting
      tooltip.html(`
        <div style="margin-bottom: 8px;">
          <strong>${d.data.author}</strong> 
          <span class="float-end">${d.data.score} point${d.data.score !== 1 ? 's' : ''}</span>
        </div>
        <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 10px;">${dateStr}</div>
        <hr style="margin: 8px 0;">
        <div style="max-height: 200px; overflow-y: auto;">${commentText}</div>
      `)
      .style('left', (event.pageX - container.getBoundingClientRect().left + 10) + 'px')
      .style('top', (event.pageY - container.getBoundingClientRect().top - 10) + 'px');
    })
    .on('mouseout', function() {
      // Remove highlighting
      d3.select(this).classed('node-active', false);
      linkGroup.selectAll('.link').classed('link-active', false);
      
      // Hide tooltip
      tooltip.transition()
        .duration(300)
        .style('opacity', 0);
    });
  
  // Add labels for the nodes with better positioning
  node.append('text')
    .attr('dy', '.35em')
    .attr('x', d => d.children ? -13 : 13)
    .attr('text-anchor', d => d.children ? 'end' : 'start')
    .text(d => {
      // Truncate long usernames
      const author = d.data.author || 'Anonymous';
      return author.length > 15 ? author.substring(0, 12) + '...' : author;
    })
    .style('font-size', '11px')
    .style('font-weight', d => d.depth === 0 ? 'bold' : 'normal')
    .append('title')
    .text(d => d.data.author); // Show full author name on hover
  
  // Add interaction hint
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('opacity', 0.6)
    .text('Tip: Higher scoring comments have larger circles. Color indicates sentiment.');
  
  // Add enhanced zoom capability with buttons
  const zoomBehavior = d3.zoom()
    .scaleExtent([0.3, 5])
    .on('zoom', function(event) {
      svg.attr('transform', event.transform);
    });
  
  d3.select(container).select('svg')
    .call(zoomBehavior);
  
  // Add zoom controls
  const zoomControls = d3.select(container)
    .append('div')
    .attr('class', 'zoom-controls')
    .style('position', 'absolute')
    .style('bottom', '10px')
    .style('right', '10px')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('gap', '5px');
  
  // Zoom in button
  zoomControls.append('button')
    .attr('class', 'btn btn-sm btn-primary')
    .style('border-radius', '50%')
    .style('width', '36px')
    .style('height', '36px')
    .style('padding', '0')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .html('<i class="fas fa-plus"></i>')
    .on('click', function() {
      d3.select(container).select('svg')
        .transition()
        .duration(300)
        .call(zoomBehavior.scaleBy, 1.2);
    });
  
  // Zoom out button
  zoomControls.append('button')
    .attr('class', 'btn btn-sm btn-primary')
    .style('border-radius', '50%')
    .style('width', '36px')
    .style('height', '36px')
    .style('padding', '0')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .html('<i class="fas fa-minus"></i>')
    .on('click', function() {
      d3.select(container).select('svg')
        .transition()
        .duration(300)
        .call(zoomBehavior.scaleBy, 0.8);
    });
  
  // Reset zoom button
  zoomControls.append('button')
    .attr('class', 'btn btn-sm btn-primary')
    .style('border-radius', '50%')
    .style('width', '36px')
    .style('height', '36px')
    .style('padding', '0')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .html('<i class="fas fa-home"></i>')
    .on('click', function() {
      d3.select(container).select('svg')
        .transition()
        .duration(500)
        .call(zoomBehavior.transform, d3.zoomIdentity.translate(margin.left, margin.top));
    });
  
  // Add a legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 100}, 20)`);
  
  // Legend title
  legend.append('text')
    .attr('x', 0)
    .attr('y', -10)
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text('Score Legend');
  
  // Legend items
  const legendData = [
    { color: 'var(--bs-success)', label: 'High Score (>10)' },
    { color: 'var(--bs-primary)', label: 'Normal Score (1-10)' },
    { color: 'var(--bs-danger)', label: 'Low/Negative Score (≤0)' }
  ];
  
  legendData.forEach((item, i) => {
    const g = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`);
    
    g.append('circle')
      .attr('r', 6)
      .attr('fill', item.color);
    
    g.append('text')
      .attr('x', 12)
      .attr('y', 4)
      .style('font-size', '10px')
      .text(item.label);
  });
}

// Handle meme fetching
function handleMemeFetch() {
  const subredditName = document.getElementById('meme-subreddit-input').value.trim();
  const count = document.getElementById('meme-count-input').value;
  
  if (!subredditName) {
    alert('Please enter a subreddit name');
    return;
  }
  
  // Show loading state
  document.getElementById('meme-results').classList.add('d-none');
  document.getElementById('meme-error').classList.add('d-none');
  document.getElementById('meme-loading').classList.remove('d-none');
  
  // Fetch memes
  fetch(`/api/memes?subreddit=${encodeURIComponent(subredditName)}&limit=${count}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch memes');
      }
      return response.json();
    })
    .then(data => {
      // Update subreddit name
      document.getElementById('meme-subreddit-name').textContent = data.subreddit;
      
      // Check if we have an error message
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Check if we have memes
      if (!data.memes || data.memes.length === 0) {
        throw new Error('No memes found in this subreddit');
      }
      
      // Create meme grid
      const grid = document.getElementById('meme-grid');
      grid.innerHTML = '';
      
      data.memes.forEach(meme => {
        const col = document.createElement('div');
        col.className = 'col';
        
        const card = document.createElement('div');
        card.className = 'card meme-card h-100';
        
        // Format date
        const memeDate = new Date(meme.created_utc * 1000);
        const dateString = memeDate.toLocaleDateString();
        
        card.innerHTML = `
          <img src="${meme.image_url}" class="card-img-top" alt="Meme">
          <div class="card-body">
            <h5 class="card-title fs-6">${meme.title}</h5>
          </div>
          <div class="card-footer">
            <small class="text-muted">Posted by u/${meme.author} on ${dateString}</small>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span><i class="fas fa-arrow-up"></i> ${meme.score}</span>
              <a href="https://www.reddit.com${meme.permalink}" target="_blank" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-external-link-alt"></i> View
              </a>
            </div>
          </div>
        `;
        
        col.appendChild(card);
        grid.appendChild(col);
      });
      
      // Hide loading, show results
      document.getElementById('meme-loading').classList.add('d-none');
      document.getElementById('meme-results').classList.remove('d-none');
    })
    .catch(error => {
      console.error('Error fetching memes:', error);
      document.getElementById('meme-loading').classList.add('d-none');
      document.getElementById('meme-error').classList.remove('d-none');
      document.getElementById('meme-error-message').textContent = error.message;
    });
}

// Show toast notification
function showToast(message, type = 'error') {
  // Create toast container if not exists
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = `custom-toast toast-${type}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  
  // Add icon based on type
  let icon = 'exclamation-circle';
  switch (type) {
    case 'success': icon = 'check-circle'; break;
    case 'info': icon = 'info-circle'; break;
    case 'warning': icon = 'exclamation-triangle'; break;
  }
  
  // Create toast content
  toastEl.innerHTML = `
    <div class="p-3 d-flex align-items-center">
      <i class="fas fa-${icon} me-2"></i>
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close ms-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  // Add to container
  toastContainer.appendChild(toastEl);
  
  // Show with animation
  setTimeout(() => {
    toastEl.classList.add('show');
  }, 10);
  
  // Auto close after 5 seconds
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => {
      toastContainer.removeChild(toastEl);
    }, 300);
  }, 5000);
  
  // Close on button click
  const closeBtn = toastEl.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => {
    toastEl.classList.remove('show');
    setTimeout(() => {
      toastContainer.removeChild(toastEl);
    }, 300);
  });
}

// Error notification helper (backward compatibility)
function showErrorToast(message) {
  showToast(message, 'error');
}


