import flask
from flask import Flask, render_template, Response,jsonify, request, render_template, redirect, url_for

app = flask.Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/test')
def test():
    return render_template('Videos.html')

@app.route('/VideoStream')
def VideoStream():
    return render_template('VideoStream.html')
                               
if __name__ == '__main__':
    app.run(debug=True)