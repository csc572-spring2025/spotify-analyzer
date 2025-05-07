# https://medium.com/@michaelmiller0998/extracting-song-data-from-spotify-using-spotipy-167728d0a924

import pandas as pd
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

client_id = ''

client_secret = ''
client_credentials_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager) 

name = "ariana grande" 
result = sp.search(name) 
result['tracks']['items'][0]['artists'] 