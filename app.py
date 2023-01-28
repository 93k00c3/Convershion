import configparser
import os

from flask import Flask, flash, request, redirect, render_template, url_for

from business_logic.service.FileConversionService import convert_file
from business_logic.service.FileService import save_files

app = Flask(__name__)
config = configparser.ConfigParser()
config.read('config/app.ini')
app.config['UPLOAD_FOLDER'] = config['FILES']['defaultPath']

parent_path = app.config['UPLOAD_FOLDER']
SECRET_KEY = os.urandom(32)
ALLOWED_EXTENSIONS = {'flac', 'alac', 'mp3', 'wav'}
app.config['SECRET_KEY'] = SECRET_KEY
FFMPEG = ('ffmpeg -hide_banner -loglevel {loglevel}'
          ' -i "{source}" -f mp3 -ab {bitrate} -vcodec copy "{target}"')


@app.route('/', methods=["GET", "POST"])
def upload():
    if request.method == "GET":
        return render_template('index.html')
    if not request.files:
        flash('No files selected for uploading')
        return redirect(request.url)

    files = request.files.to_dict(flat=False)

    if len(files) == 0:
        return render_template('index.html')

    folder_name = config['FILES']['user']

    try:
        save_files(folder_name, files)
        flash('Files successfully uploaded')
    except Exception as e:
        flash(str(e))
    return redirect(url_for('conversion', folder_path='uploads/' + folder_name))


@app.route('/conversion', methods=["GET", "POST"])
def conversion():
    folder_path = request.args.get('folder_path')
    files = os.listdir(folder_path)
    if not os.path.exists(folder_path):
        flash('The folder does not exist')
        return redirect(request.url)
    if request.method == 'POST':
        selected_files = request.form.getlist('files')
        conversion_type = request.form['conversion_type']
        convert_file(folder_path, selected_files, conversion_type)
        flash('Files have been successfully converted')
        return redirect(url_for('conversion', folder_path=folder_path))
    return render_template('conversion.html', files=files, folder_path=folder_path)


if __name__ == '__main__':
    app.run(debug=True)
