import configparser
import os
import base64
import uuid

from flask import Flask, flash, request, redirect, render_template, url_for, jsonify, session, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS, cross_origin
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
import audioread
from mutagen import File as MutagenFile
from business_logic.service.DatabaseSetup import User, db, create_tables
from business_logic.service.FileConversionService import convert_file
from business_logic.service.FileService import save_file, delete_old_files, graph_creation
from flask_login import LoginManager, current_user, UserMixin, login_user, logout_user, login_required
from sqlalchemy.exc import SQLAlchemyError, IntegrityError


app = Flask(__name__, static_folder='front/build')
login_manager = LoginManager()
login_manager.init_app(app)
app.config['SESSION_PERMANENT'] = False
Session(app)
config = configparser.ConfigParser()
config.read('config/app.ini')
app.config['UPLOAD_FOLDER'] = config['FILES']['upload_folder']
app.config['SQLALCHEMY_DATABASE_URI'] = config['DATABASE']['link']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_POOL_PRE_PING'] = True
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False

CORS(app, supports_credentials=True)
db.init_app(app)
app.app_context()

Session(app)

with app.app_context():
    db.create_all()

parent_path = app.config['UPLOAD_FOLDER']
SECRET_KEY = os.urandom(32)
ALLOWED_EXTENSIONS = {'flac', 'alac', 'mp3', 'wav'}
app.config['SECRET_KEY'] = SECRET_KEY
FFMPEG = ('ffmpeg -hide_banner -loglevel {loglevel}'
          ' -i "{source}" -f mp3 -ab {bitrate} -vcodec copy "{target}"')


def get_current_user():
    if 'user_id' in session:
        user_id = session['user_id']
        return User.query.get(user_id)
    return None


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


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

    if request.method == "POST":
        if not request.files:
            return jsonify({'error': 'No files selected for uploading'}), 400
        files = request.files.getlist('file')
        if not files:
            return jsonify({'error': 'No files selected for uploading'}), 400
        folder_name = get_folder_name()
        files_check = os.listdir(os.path.join(parent_path, folder_name))
        if len(files_check) >= 12:
            return jsonify({'error': 'Maximum number of files exceeded. Please try deleting some.'}), 400
            print('too many files')
        for file in request.files.getlist('file'):
            save_file(folder_name, file)

        return jsonify({'success': True, 'message': 'Files successfully uploaded'}, {'Access-Control-Allow-Credentials': True}), 200
        graph_response = generate_graph()
        return jsonify({'success': True, 'message': 'Files successfully uploaded', 'graph_response': graph_response}), 200


@app.route('/login', methods=['GET', 'POST'])
@cross_origin()
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'success': False, 'error': 'Incorrect username'}), 401

        if not user.check_password(password):
            return jsonify({'success': False, 'error': 'Incorrect password'}), 401

        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.user_id
            print(f"Session after login:", session, session['user_id'] )
            return jsonify({'success': True, 'username': user.username})
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'})


@app.route('/')
def index():
    CORS(app, resource={
        r"/*": {
            "origins": "*"
        }
    })
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        return jsonify({'loggedIn': True, 'username': user.username})
    else:
        return jsonify({'loggedIn': False})


@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


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
            user_uuid = str(uuid.uuid4())
            new_user = User(username=username, email=email, password_hash=hashed_password, folder_name=user_uuid)
            db.session.add(new_user)
            db.session.commit()
            return jsonify({'success': True}, ), 201
        except IntegrityError as e:
            db.session.rollback()
            print(e)
            return jsonify({'success': False, 'error': 'Username or email already exists'}), 409
        except SQLAlchemyError as e:
            db.session.rollback()
            print(e)
            return jsonify({'success': False, 'error': 'Database error, please try again'}), 500


@app.route('/conversion', methods=["GET", "POST"])
def conversion():
    folder_name = get_folder_name()
    if not folder_name:
        return jsonify({'error': 'Cannot determine user folder'}), 400

    folder_path = os.path.join(app.config['UPLOAD_FOLDER'], folder_name)
    if not os.path.exists(folder_path):
        return jsonify({'error': 'The folder does not exist'}), 404

    if request.method == 'GET':
        files = os.listdir(folder_path)
        return jsonify({'files': files, 'folder_path': folder_path})
    if request.method == 'POST':
        files = os.listdir(folder_path)
        if len(files) >= 12:
            return jsonify({'error':'Maximum number of files exceeded. Please try deleting some.'}), 400
            print('too many files')
        try:
            selected_files = request.form.getlist('files')
            conversion_type = request.form.get('conversion_type')
            audio_filter = request.form.get('audio_filter')
            silence_threshold = request.form.get('silence_threshold')
            silence_duration = request.form.get('silence_duration')
            volume_level = request.form.get('volume_level')
            mp3_bitrate = request.form.get('mp3_bitrate')
            folder_name = get_folder_name()

            folder_path = os.path.join(app.config['UPLOAD_FOLDER'], folder_name)
            converted_files = convert_file(
                folder_path,
                selected_files,
                conversion_type,
                audio_filter,
                silence_threshold,
                silence_duration,
                volume_level,
                mp3_bitrate
            )
            return jsonify({'success': True, 'message': 'Conversion successful', 'converted_files': converted_files})
            print(converted_files)
        except ValueError as e:
            return jsonify({'error': f'Invalid conversion parameters: {e}'}), 400
        except FileNotFoundError as e:
            return jsonify({'error': f'File not found: {e}'}), 404


def get_folder_name():
    user = get_current_user()
    if user:
        folder_name = user.folder_name
        return folder_name
    elif request.cookies.get('guest_folder'):
        return request.cookies.get('guest_folder')
    return None


@app.route('/logout', methods=['POST'])
@login_required
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True})


@app.route('/graph', methods=['POST'])
def generate_graph():
    files = request.files.getlist('file')
    print(files)
    image_urls = []
    for file in files:
        if file.filename:
            filename = secure_filename(file.filename)
            audio_file = file.stream
            graph_data = graph_creation(audio_file, filename)
            graph_base64 = base64.b64encode(graph_data).decode('utf-8')
            image_url = 'data:image/png;base64,' + graph_base64
            image_urls.append({'filename': filename, 'image_url': image_url})
    return jsonify({'image_urls': image_urls})


@app.route('/files', methods=['GET'])
def get_folder_files_info_route():
    user = get_current_user()
    if not user:
        return "Please log in", 401

    folder_name = user.folder_name
    folder_path = os.path.join(
        os.path.normpath(app.config['UPLOAD_FOLDER']),
        os.path.normpath(folder_name)
    )

    folder_info = get_folder_files_info(folder_path)
    return jsonify(folder_info)


def get_folder_files_info(folder_path):
    folder_name = os.path.basename(folder_path)
    folder_info = {
        "name": folder_name,
        "type": "folder",
        "items": []
    }

    if os.path.isdir(folder_path):
        for item in os.listdir(folder_path):
            item_path = os.path.join(folder_path, item)
            if os.path.isfile(item_path):
                file_info = {
                    "name": item,
                    "type": "file",
                    "metadata": {}
                }
                try:
                    audio = MutagenFile(item_path)
                    metadata = {
                        "length": audio.info.length,
                        "bitrate": audio.info.bitrate,
                        "sample_rate": audio.info.sample_rate,
                        "channels": audio.info.channels,
                        "artist": audio.get("artist", ["Unknown Artist"])[0],
                        "title": audio.get("title", ["Unknown Title"])[0]
                    }
                    file_info["metadata"] = metadata
                except Exception as e:
                    print(f"Error getting metadata for {item}: {e}")
                folder_info["items"].append(file_info)
            elif os.path.isdir(item_path):
                subfolder_info = get_folder_files_info(item_path)
                folder_info["items"].append(subfolder_info)
        print('DEBUG:  ', folder_info)
        all_files = [folder_info]
        return all_files


if __name__ == '__main__':
    print('start')
    app.run(debug=True)
    print("test")