import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from datetime import datetime
from collections import Counter
import matplotlib.dates as mdates
from matplotlib.ticker import FuncFormatter

plt.style.use('fivethirtyeight')
sns.set_palette("deep")


def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# load all music history files and combine them (because spotify splits streaming history into multiple files at 10k entries)
def load_all_music_history():
    all_music_data = []
    file_index = 0
    
    while True:
        try:
            file_path = f'sampledata/StreamingHistory_music_{file_index}.json'
            music_data = load_json(file_path)
            all_music_data.extend(music_data)
            print(f"Loaded {file_path} with {len(music_data)} entries")
            file_index += 1
        except FileNotFoundError:
            # No more files to load
            break
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            break
    
    return all_music_data

try:
    music_history = load_all_music_history()
    podcast_history = load_json('sampledata/StreamingHistory_podcast_0.json')
    library = load_json('sampledata/YourLibrary.json')
    wrapped = load_json('sampledata/Wrapped2024.json')
    print(f"All data files loaded successfully! Total music entries: {len(music_history)}")
except Exception as e:
    print(f"Error loading data: {e}")

# convert streaming history to DataFrame
def history_to_df(history_data):
    df = pd.DataFrame(history_data)
    df['endTime'] = pd.to_datetime(df['endTime'])
    df['date'] = df['endTime'].dt.date
    # convert milliseconds to minutes (why is this in milliseconds in the first place?)
    df['minutesPlayed'] = df['msPlayed'] / 60000
    return df

music_df = history_to_df(music_history)
podcast_df = history_to_df(podcast_history)

# some descriptive statistics about the listener!!
def plot_overall_stats():
    fig, axes = plt.subplots(2, 2, figsize=(18, 14))
    fig.suptitle('Spotify Listening Overview', fontsize=24)
    
    # 1. total listening time by content type
    total_music_minutes = music_df['minutesPlayed'].sum()
    total_podcast_minutes = podcast_df['minutesPlayed'].sum()
    
    content_types = ['Music', 'Podcasts']
    listening_times = [total_music_minutes, total_podcast_minutes]
    
    axes[0, 0].bar(content_types, listening_times, color=['#1DB954', '#191414'])
    axes[0, 0].set_title('Total Listening Time (minutes)', fontsize=16)
    axes[0, 0].set_ylabel('Minutes')
    for i, v in enumerate(listening_times):
        axes[0, 0].text(i, v + 50, f'{int(v)}', ha='center', fontsize=12)
    
    # 2. top 10 artists by listening time
    top_artists = music_df.groupby('artistName')['minutesPlayed'].sum().sort_values(ascending=False).head(10)
    
    top_artists.plot(kind='barh', ax=axes[0, 1], color=sns.color_palette("viridis", len(top_artists)))
    axes[0, 1].set_title('Top 10 Artists by Listening Time', fontsize=16)
    axes[0, 1].set_xlabel('Minutes')
    
    # 3. listening activity over time
    daily_listening = music_df.groupby('date')['minutesPlayed'].sum().reset_index()
    daily_listening['date'] = pd.to_datetime(daily_listening['date'])
    
    axes[1, 0].plot(daily_listening['date'], daily_listening['minutesPlayed'], color='#1DB954', linewidth=2)
    axes[1, 0].set_title('Daily Music Listening Activity', fontsize=16)
    axes[1, 0].set_ylabel('Minutes')
    axes[1, 0].set_xlabel('Date')
    axes[1, 0].xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    axes[1, 0].xaxis.set_major_locator(mdates.MonthLocator())
    plt.setp(axes[1, 0].xaxis.get_majorticklabels(), rotation=45)
    
    # 4. top tracks by play count
    track_counts = music_df.groupby('trackName')['minutesPlayed'].count().sort_values(ascending=False).head(10)
    
    track_counts.plot(kind='barh', ax=axes[1, 1], color=sns.color_palette("magma", len(track_counts)))
    axes[1, 1].set_title('Top 10 Tracks by Play Count', fontsize=16)
    axes[1, 1].set_xlabel('Play Count')
    
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.savefig('descriptivestats.png', dpi=300, bbox_inches='tight')
    plt.close()

# listening patterns by time
def plot_listening_patterns():
    fig, axes = plt.subplots(2, 2, figsize=(18, 14))
    fig.suptitle('Spotify Listening Patterns', fontsize=24)
    
    # hour of day
    music_df['hour'] = music_df['endTime'].dt.hour
    hourly_listening = music_df.groupby('hour')['minutesPlayed'].sum()
    
    axes[0, 0].bar(hourly_listening.index, hourly_listening.values, color=sns.color_palette("viridis", 24))
    axes[0, 0].set_title('Listening by Hour of Day', fontsize=16)
    axes[0, 0].set_xlabel('Hour')
    axes[0, 0].set_ylabel('Minutes')
    axes[0, 0].set_xticks(range(0, 24))
    
    # day of week
    music_df['day_of_week'] = music_df['endTime'].dt.day_name()
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    weekly_listening = music_df.groupby('day_of_week')['minutesPlayed'].sum().reindex(day_order)
    
    axes[0, 1].bar(weekly_listening.index, weekly_listening.values, color=sns.color_palette("mako", 7))
    axes[0, 1].set_title('Listening by Day of Week', fontsize=16)
    axes[0, 1].set_ylabel('Minutes')
    plt.setp(axes[0, 1].xaxis.get_majorticklabels(), rotation=45)
    
    # monthly listening trends
    music_df['month'] = music_df['endTime'].dt.strftime('%Y-%m')
    monthly_listening = music_df.groupby('month')['minutesPlayed'].sum().reset_index()
    
    axes[1, 0].plot(monthly_listening['month'], monthly_listening['minutesPlayed'], 
                   color='#1DB954', linewidth=2, marker='o')
    axes[1, 0].set_title('Monthly Listening Trends', fontsize=16)
    axes[1, 0].set_ylabel('Total Minutes')
    axes[1, 0].set_xlabel('Month')
    plt.setp(axes[1, 0].xaxis.get_majorticklabels(), rotation=45)
    
    # track play durations
    # exclude the very short plays which are skips?
    valid_plays = music_df[music_df['minutesPlayed'] > 0.1]
    
    sns.histplot(valid_plays['minutesPlayed'], bins=30, kde=True, ax=axes[1, 1], color='#1DB954')
    axes[1, 1].set_title('Distribution of Track Play Durations', fontsize=16)
    axes[1, 1].set_xlabel('Minutes')
    axes[1, 1].set_ylabel('Frequency')
    
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.savefig('patterns.png', dpi=300, bbox_inches='tight')
    plt.close()


plot_overall_stats()
plot_listening_patterns()