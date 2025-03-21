from flask import Flask 
import os 

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello World"

if __name__ == '__main__':
    port=int(os.environ.get("FLASK_RUN_PORT",5000))
    app.run(debug=True, port=port)