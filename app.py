import os
import sys
import time
import datetime
import uuid
import subprocess

from flask import Flask, flash, request, redirect, render_template, url_for
from flask_wtf import FlaskForm
from werkzeug.utils import secure_filename
from wtforms import FileField, SubmitField

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
parent_path = app.config['UPLOAD_FOLDER']
SECRET_KEY = os.urandom(32)
ALLOWED_EXTENSIONS = {'flac', 'alac', 'mp3', 'wav'}
app.config['SECRET_KEY'] = SECRET_KEY

FFMPEG = ('ffmpeg -hide_banner -loglevel {loglevel}'
          ' -i "{source}" -f mp3 -ab {bitrate} -vcodec copy "{target}"')


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/', methods=["GET", "POST"])
def upload_file():
    if request.method == 'POST':
        # check if the post request has the file part
        if not request.files:
            flash('No files selected for uploading')
            return redirect(request.url)

        # Get the name of the first file in the list
        first_file = request.files.getlist('file')[0]
        folder_name = secure_filename(first_file.filename).split('.')[0]

        # Create the folder path with the first file name
        folder_path = os.path.join(parent_path, folder_name)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

        # check if the file extension is allowed
        if not any([allowed_file(f.filename) for f in request.files.getlist('file')]):
            flash('Allowed file types are flac, alac, mp3, wav')
            return redirect(request.url)

        for file in request.files.getlist('file'):
            if file.filename == '':
                continue
            filename = secure_filename(file.filename)
            file.save(os.path.join(folder_path, filename))
        flash('Files successfully uploaded')
        return redirect(url_for('conversion', folder_path=folder_path))
    else:
        return render_template('index.html')


@app.route('/conversion/', methods=["GET", "POST"])
def conversion():
    folder_path = request.args.get('folder_path')
    files = os.listdir(folder_path)
    if not os.path.exists(folder_path):
        flash('The folder does not exist')
        return redirect(request.url)
    if request.method == 'POST':
        selected_files = request.form.getlist('files')
        conversion_type = request.form['conversion_type']
        convert_audio_files(folder_path, selected_files, conversion_type)
        flash('Files have been successfully converted')
        return redirect(url_for('conversion', folder_path=folder_path))
    return render_template('conversion.html', files=files)


def convert_audio_files(folder_path, selected_files, conversion_type):
    for file in selected_files:
        input_file = os.path.join(folder_path, file)
        output_file = os.path.splitext(input_file)[0] + '.' + conversion_type
        command = "ffmpeg -i" + input_file + " " + output_file
        subprocess.call(command, shell=True)


if __name__ == '__main__':
    app.run(debug=True)
