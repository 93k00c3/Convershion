import configparser
import os
import base64
import uuid

from flask import Flask, flash, request, redirect, render_template, url_for, jsonify, session, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS, cross_origin
from werkzeug.security import generate_password_hash, check_password_hash

from business_logic.service.DatabaseSetup import User, db, create_tables
from business_logic.service.FileConversionService import convert_file
from business_logic.service.FileService import save_file, delete_old_files, graph_creation
from business_logic.service.AuthService import login, register
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required
from sqlalchemy.exc import SQLAlchemyError, IntegrityError


app = Flask(__name__, static_folder='front/build')
config = configparser.ConfigParser()
config.read('config/app.ini')
app.config['UPLOAD_FOLDER'] = config['FILES']['upload_folder']
app.config['SQLALCHEMY_DATABASE_URI'] = config['DATABASE']['link']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_POOL_PRE_PING'] = True
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app)
db.init_app(app)
app.app_context()

with app.app_context():
    db.create_all()

login_manager = LoginManager(app)
login_manager.login_view = 'login'

parent_path = app.config['UPLOAD_FOLDER']
SECRET_KEY = os.urandom(32)
ALLOWED_EXTENSIONS = {'flac', 'alac', 'mp3', 'wav'}
app.config['SECRET_KEY'] = SECRET_KEY
FFMPEG = ('ffmpeg -hide_banner -loglevel {loglevel}'
          ' -i "{source}" -f mp3 -ab {bitrate} -vcodec copy "{target}"')


def get_current_user():
    if 'user_id' in session:  
        return User.query.get(session['user_id'])
    return None


@login_manager.user_loader
def load_user(user_id):
    return User(user_id)


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder + '/static', path)


@app.route('/', methods=["GET", "POST"])
def upload_files():
    user = get_current_user()
    if request.method == "GET":
        return send_from_directory(app.static_folder, 'index.html')
    if not request.files:
        flash('No files selected for uploading')
        return redirect(request.url)
    
    if not user:
        return "Please log in to upload files", 401

    if request.method == "POST":
        if not request.files:
            return jsonify({'error': 'No files selected for uploading'}), 400

        files = request.files.getlist('file')

        if not files: 
            return jsonify({'error': 'No files selected for uploading'}), 400
        
        folder_name = user.folders[0].folder_name

        if not os.path.exists(folder_name):
            os.mkdir(folder_name)

        for file in request.files.getlist('file'):
            save_file(folder_name, file)

        return jsonify({'success': True, 'message': 'Files successfully uploaded'}), 200


@app.route('/login', methods=['GET', 'POST'])
@cross_origin()
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'success': False, 'error': 'Incorrect username'}), 401

        if not user.check_password(password):
            return jsonify({'success': False, 'error': 'Incorrect password'}), 401

    return render_template('login.html')


@app.route('/register', methods=['POST'])
@cross_origin()
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        if not username or not password or not email:
            return jsonify({'success': False, 'error': 'Please provide username and password'}), 400

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'success': False, 'error': 'Username already exists'}), 409

        try:
            hashed_password = generate_password_hash(password)
            new_user = User(username=username, email=email, password_hash=hashed_password)
            db.session.add(new_user)
            db.session.commit()
            return jsonify({'success': True}), 201
        except IntegrityError as e:
            db.session.rollback()
            print(e)
            return jsonify({'success': False, 'error': 'Username or email already exists'}), 409
        except SQLAlchemyError as e:
            db.session.rollback()
            print(e)
            return jsonify({'success': False, 'error': 'Database error, please try again'}), 500


@app.route('/')
def index():
    logged_in = False
    username = None
    if 'username' in session:
        logged_in = True
        username = session['username']
    return send_from_directory(app.static_folder, 'index.html', logged_in=logged_in, username=username)


@app.route('/conversion', methods=["GET", "POST"])
@login_required
def conversion():
    user = get_current_user()  
    if not user:
        return "Please log in", 401  
    folder_name = user.folders[0].folder_name
    folder_path = os.path.join(os.path.normpath(app.config['UPLOAD_FOLDER']), os.path.normpath(folder_name))
    files = os.listdir(os.path.normpath(folder_path))
    files_str = ", ".join(files)
    print(files_str + "  " + folder_path)
    if not os.path.exists(folder_path):
        flash('The folder does not exist')
        return redirect(request.url)
    if request.method == 'POST':
        selected_files = request.form.getlist('files')
        conversion_type = request.form['conversion_type']
        audio_filter = request.form.get('audio_filter')
        silence_threshold = request.form.get('silence_threshold')
        converted_files = convert_file(folder_path, selected_files, conversion_type,
                                       audio_filter=audio_filter,
                                       silence_threshold=silence_threshold)

        flash('Files have been successfully converted')
        return jsonify({'files': files, 'folder_path': folder_path})
    return jsonify({'files': files, 'folder_path': folder_path})


@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect('/')


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
    print('start')
    app.run(debug=True)
    print("test")