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


class upload(FlaskForm):
    file = FileField("File")
    submit = SubmitField("Upload File")


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


FFMPEG = ('ffmpeg -hide_banner -loglevel {loglevel}'
          ' -i "{source}" -f mp3 -ab {bitrate} -vcodec copy "{target}"')


# def parse_args():
#     parser = argparse.ArgumentParser()
#     parser.add_argument(
#         '-r', '--recursive', default=False, action='store_true',
#         help='search subdirectories')
#     parser.add_argument(
#         '-b', '--bitrate', default='320k', metavar='BITRATE',
#         choices=('256k', '320k'),
#         help='desired bitrate of the target files (default 320k)')
#     parser.add_argument(
#         '--ffmpeg-loglevel', default='error', metavar='LEVEL',
#         choices=('debug', 'verbose', 'info', 'warning',
#                  'error', 'fatal', 'panic', 'quiet'),
#         help='desired level of ffmpeg output (default error)')
#     parser.add_argument(
#         'sources', nargs='+', metavar='SOURCE',
#         help='file or directory to convert')
#     parser.add_argument(
#         'target', nargs=1, metavar='TARGET',
#         help='target directory for the converted files and/or directories')
#     args = parser.parse_args()
#     args.sources = [Path(src) for src in args.sources]
#     args.target = Path(args.target[0])
#     return args
#
# def call_ffmpeg(source, target, bitrate='320k', loglevel='error'):
#     ffmpeg = FFMPEG.format(loglevel=loglevel, source=source,
#                            bitrate=bitrate, target=target)
#     return subprocess.check_output(
#         ffmpeg, shell=True, stderr=subprocess.STDOUT, universal_newlines=True)


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
        return redirect(url_for('upload_file', name=filename))
    return render_template('index.html')



def get_all_files_in_dir(parent_path):
    all_files = []
    for path in os.listdir(parent_path):
        path = os.path.join(parent_path, path)
        if os.path.isfile(path):
            all_files.append(path)
        elif os.path.isdir(path):
            all_files += (get_all_files_in_dir(path))
    return all_files


def convert_to_mp3(task):
    parent_path = task[0]
    filename = task[1]
    path = os.path.join(parent_path, filename)
    new_filename = os.path.splitext(filename)[0] + '.mp3'
    new_path = os.path.join(parent_path, os.path.basename(parent_path) + "-")


if __name__ == '__main__':
    app.run(debug=True)
