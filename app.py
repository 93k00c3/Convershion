import configparser
import os
import base64

from flask import Flask, flash, request, redirect, render_template, url_for, jsonify, session, send_from_directory
from werkzeug.utils import secure_filename

from business_logic.service.FileConversionService import convert_file
from business_logic.service.FileService import save_file, delete_old_files, graph_creation
from business_logic.service.AuthService import login, register
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__, static_folder='front/build')
config = configparser.ConfigParser()
config.read('config/app.ini')
app.config['UPLOAD_FOLDER'] = config['FILES']['defaultPath']
app.config['SQLALCHEMY_DATABASE_URI'] = config['DATABASE']['link']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

login_manager = LoginManager(app)
login_manager.login_view = 'login'

parent_path = app.config['UPLOAD_FOLDER']
SECRET_KEY = os.urandom(32)
ALLOWED_EXTENSIONS = {'flac', 'alac', 'mp3', 'wav'}
app.config['SECRET_KEY'] = SECRET_KEY
FFMPEG = ('ffmpeg -hide_banner -loglevel {loglevel}'
          ' -i "{source}" -f mp3 -ab {bitrate} -vcodec copy "{target}"')


class User(UserMixin):
    def __init__(self, id):
        self.id = id


@login_manager.user_loader
def load_user(user_id):
    return User(user_id)


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder + '/static', path)


@app.route('/', methods=["GET", "POST"])
def upload_files():
    if request.method == "GET":
        return send_from_directory(app.static_folder, 'index.html')
    if not request.files:
        flash('No files selected for uploading')
        return redirect(request.url)

    files = request.files.getlist('file')

    if len(files) == 0:
        flash('No file selected for uploading')
        return send_from_directory(app.static_folder, 'index.html')

    if len(files) == 1:
        file = files[0]
        folder_name = f"user"
        folder_path = f"uploads/{folder_name}"
        save_file(folder_name, file)
        return redirect(url_for('conversion', folder_path=folder_path))

    folder_name = f"user"
    if not os.path.exists(folder_name):
        os.mkdir(folder_name)
    save_file(folder_name, files)

    try:

        flash('Files successfully uploaded')
    except Exception as e:
        flash(str(e))
    return redirect(url_for('conversion', folder_path='uploads/' + folder_name))


# @app.route('/', methods=["GET", "POST"])
# def upload_file():
#


@app.route('/')
def index():
    logged_in = False
    username = None
    if 'username' in session:
        logged_in = True
        username = session['username']
    return send_from_directory(app.static_folder, 'index.html', logged_in=logged_in, username=username)


@app.route('/conversion', methods=["GET", "POST"])
def conversion():
    folder_name = "user"
    folder_path = os.path.join(os.path.normpath("uploads"), folder_name)
    files = os.listdir(os.path.normpath(folder_path))
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


@app.route('/login', methods=['GET', 'POST'])
def login_route():
    if request.method == 'POST':
        return login()
    else:
        return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('username', None)  # Remove the username from the session
    return redirect('/')


@app.route('/register', methods=['GET', 'POST'])
def register_route():
    if request.method == 'POST':
        # Registration logic
        username = request.form['username']
        password = request.form['password']

        if register(username, password):
            session['username'] = username  # Store the username in the session
            return redirect('/')
        else:
            return redirect('/register')  # Redirect to register page with error message
    return render_template('register.html')


@app.route('/graph', methods=['POST'])
def generate_graph():
    files = request.files.getlist('file')
    print(files)
    image_urls = []
    for file in files:
        if file.filename:
            filename = secure_filename(file.filename)
            audio_file = file.stream
            graph_data = graph_creation(audio_file)
            graph_base64 = base64.b64encode(graph_data).decode('utf-8')
            image_url = 'data:image/png;base64,' + graph_base64
            image_urls.append({'filename': filename, 'image_url': image_url})

    return jsonify({'image_urls': image_urls})


if __name__ == '__main__':
    app.run(debug=True)
