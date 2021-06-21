import json
import sys
import pandas as pd
import numpy as np
import pandas as pd
import numpy as np
from nltk.corpus import stopwords
from sklearn.metrics.pairwise import linear_kernel
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.tokenize import RegexpTokenizer
import re
import string
import random
from PIL import Image
import requests
from io import BytesIO
import matplotlib.pyplot as plt


df = pd.read_csv("book.csv")

## Get a cleaned description of the books by removing non Ascii characters,making characters lowercase
## removing stop_words,punctuations and all as this won't be accountable for book reccomendation

# Function for removing NonAscii characters
def remove_non_ascii(s):
    return "".join(i for i in s if  ord(i)<128)

# Function for converting into lower case
def make_lower_case(text):
    return text.lower()

# Function for removing stop words
def remove_stop_words(text):
    text = text.split()
    stops = set(stopwords.words("english"))
    text = [w for w in text if not w in stops]
    text = " ".join(text)
    return text

# Function for removing punctuation
def remove_punctuation(text):
    tokenizer = RegexpTokenizer(r'\w+')
    text = tokenizer.tokenize(text)
    text = " ".join(text)
    return text

# Function for removing the html tags
def remove_html(text):
    html_pattern = re.compile('<.*?>')
    return html_pattern.sub(r'', text)
    
# Applying all the functions in description and storing as a cleaned_desc
df['cleaned_desc'] = df['description'].apply(remove_non_ascii)
df['cleaned_desc'] = df.cleaned_desc.apply(func = make_lower_case)
df['cleaned_desc'] = df.cleaned_desc.apply(func = remove_stop_words)
df['cleaned_desc'] = df.cleaned_desc.apply(func=remove_punctuation)
df['cleaned_desc'] = df.cleaned_desc.apply(func=remove_html)

# Function for recommending books based on Book title
def recommend_by_title(title, genre):
    data = df2.loc[df2['genre'] == genre]  #Get the sub-dataframe having the same genre
    data.reset_index(level = 0, inplace = True)  #Reset the indices starting from zero
    # Convert the index into series
    #Get the series of books from our sub-datafram having same genre and give their title as their index\
    #as supplied in index parameter of Series
    indices = pd.Series(data.index, index = data['title']) 
    #Converting the book title into vectors by using bigram
    tf = TfidfVectorizer(analyzer='word', ngram_range=(2, 2), min_df = 1, stop_words='english')
    tfidf_matrix = tf.fit_transform(data['title'])
    # Calculating the similarity measures based on Cosine Similarity
    sg = cosine_similarity(tfidf_matrix, tfidf_matrix)
    # Get the index corresponding to original_title
    idx = indices[title]
    # Get the pairwsie similarity scores 
    sig = list(enumerate(sg[idx]))
    # Sort the books
    #We sort in reverse order as cosine of small angles is larger thus the difference will be small
    sig = sorted(sig, key=lambda x: x[1], reverse=True) 
    # Scores of the 5 most similar books 
    sig = sig[1:6] #Sublist from 1 to 5 as index 0 will be the same book
    # Get the respective book indicies
    movie_indices = [i[0] for i in sig]
   # Top 5 books having the same genre
   # Here we pass the indices of the matching books in iloc method as parameter(integer or list of integers)
    print(movie_indices)
   
    
def recommend_by_desc(title, genre):
    global rec
    data = df.loc[df['genre'] == genre]  
    data.reset_index(level = 0, inplace = True)
    # Convert the index into series
    indices = pd.Series(data.index, index = data['name'])
    #Converting the book description into vectors and used bigram
    tf = TfidfVectorizer(analyzer='word', ngram_range=(2, 2), min_df = 1, stop_words='english')
    tfidf_matrix = tf.fit_transform(data['cleaned_desc'])
    # Calculating the similarity measures based on Cosine Similarity
    
    sg = cosine_similarity(tfidf_matrix, tfidf_matrix)
    # Get the index corresponding to original_title
    idx = indices[title]# Get the pairwsie similarity scores 
    sig = list(enumerate(sg[idx]))# Sort the books
    sig = sorted(sig, key=lambda x: x[1], reverse=True)# Scores of the 5 most similar books 
    sig = sig[1:6]# Book indicies
    movie_indices = [i[0] for i in sig]
    # Top 5 book recommendation
    rec = data[['book_id']].iloc[movie_indices];
    return rec;
    


n = len(sys.argv[1])
a = sys.argv[1].split(' ')
ids=[]
for i in a:
    search=df[['name', 'genre']].iloc[int(i)];
    rec = recommend_by_desc(search['name'],search['genre'])
    index = rec.index
    for i in index:
        ids.append(rec.at[i,'book_id'])
print(ids)
