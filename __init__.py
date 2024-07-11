import configparser
import os
import base64
import uuid

from flask import Flask, flash, abort, request, make_response, redirect, render_template, url_for, \
    jsonify, session, send_from_directory
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
from flask_migrate import Migrate
from sqlalchemy.exc import SQLAlchemyError, IntegrityError


app = Flask(__name__, static_folder='front/build')
login_manager = LoginManager()
login_manager.init_app(app)
app.app_context()
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})
config = configparser.ConfigParser()
config.read('config/app.ini')
app.config['SQLALCHEMY_DATABASE_URI'] = config['DATABASE']['link']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_POOL_PRE_PING'] = True
app.config['SESSION_TYPE'] = 'filesystem'
app.config['UPLOAD_FOLDER'] = config['FILES']['upload_folder']
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_PERMANENT'] = False
SECRET_KEY = os.urandom(32)
ALLOWED_EXTENSIONS = {'flac', 'alac', 'mp3', 'wav'}
app.config['SECRET_KEY'] = SECRET_KEY
FFMPEG = ('ffmpeg -hide_banner -loglevel {loglevel}'
          ' -i "{source}" -f mp3 -ab {bitrate} -vcodec copy "{target}"')
Session(app)
db.init_app(app)
migrate = Migrate(app, db)


if not os.path.exists(app.config['UPLOAD_FOLDER']):
    print('UPLOAD_FOLDER does not exist - trying to create.')
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'])
    except:
        print('UPLOAD_FOLDER could not be created. To ensure the files are parsed please create and add the UPLOAD_FOLDER to the config.')


with app.app_context():
    migrate.init_app(app)

with app.app_context():
    db.create_all()

def get_current_user():
    if 'user_id' in session:
        user_id = session['user_id']
        return User.query.get(user_id)
    else:
        return None


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder + '/static', path)


@app.route('/', methods=["GET", "POST"])
def upload_files():
    if request.method == "POST":
        print('post method')
        if not request.files:
            return jsonify({'error': 'No files selected for uploading'}), 400
            print('no files')

        files = request.files.getlist('file')

        if not files:
            return jsonify({'error': 'No files selected for uploading'}), 400
            print('no files')

        generate_graph()
        current_user = get_current_user()
        if current_user:
            folder_name = current_user.folder_name
        else:
            folder_name = request.cookies.get('guest_folder')
            print(folder_name, 'upload cookie get')
        if not folder_name:
            return jsonify({'error': 'Your folder was not found. Please try refreshing the page or uploading the file again'}), 404
        print(folder_name, 'before of path exists')
        if os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], folder_name)):
            files_check = os.listdir(os.path.join(app.config['UPLOAD_FOLDER'], folder_name))
            if len(files_check) >= 12:
                return jsonify({'error': 'Maximum number of files exceeded. Please try deleting some.'}), 400
        print(folder_name, 'before save')

        for file in request.files.getlist('file'):
            print(folder_name, file,  'in save')
            save_file(folder_name, file)

        return jsonify({'success': True, 'message': 'Files successfully uploaded'}, {'Access-Control-Allow-Credentials': True}), 200


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
            response = make_response("Logged in successfully")
            response.set_cookie('guest_folder', '', expires=0)
            session['user_id'] = user.user_id
            print(f"Session after login:", session, session['user_id'] )
            return jsonify({'success': True, 'username': user.username})
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'})


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
            guest_folder = request.cookies.get('guest_folder')
            folder_name = guest_folder if guest_folder else str(uuid.uuid4())
            new_user = User(username=username, email=email, password_hash=hashed_password, folder_name=folder_name)
            db.session.add(new_user)
            db.session.commit()

            login_user(new_user)
            session['user_id'] = new_user.user_id

            response = make_response(jsonify({'success': True}), 201)
            response.set_cookie('guest_folder', '', expires=0)
            return response
        except IntegrityError as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': 'Username or email already exists'}), 409
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': 'Database error, please try again'}), 500


@app.route('/profile', methods=['GET'])
def view_profile():
        user = get_current_user()
        if not user:
            abort(401)
            return "Please log in", 401

        user_info = {
            'username': user.username,
            'email': user.email,
            'firstname': user.firstname,
            'surname': user.surname
        }
        return jsonify(user_info), 200


@app.route('/profile', methods=['PUT'])
def edit_profile():
    user = get_current_user()
    print(user)
    if not user:
        abort(401)
        return "Please log in", 401

    data = request.get_json()
    print(data)
    new_username = data.get('username')
    new_firstname = data.get('firstname')
    print(new_firstname)
    new_surname = data.get('surname')
    new_email = data.get('email')

    if new_username is not None and new_username.strip() != '':
        user.username = new_username
    if new_email is not None and new_email.strip() != '':
        user.email = new_email
    if new_firstname is not None and new_firstname.strip() != '':
        user.firstname = new_firstname
    if new_surname is not None and new_surname.strip() != '':
        user.surname = new_surname

    try:
        db.session.commit()
        print("User after update:", user)
        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500


@app.route('/profile/change-password', methods=['PUT'])
def change_password():
    current_user = get_current_user()

    if not current_user:
        return jsonify({'error': 'User not logged in'}), 401

    data = request.get_json()
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')

    if not old_password or not new_password:
        return jsonify({'error': 'Missing old or new password'}), 400

    if not check_password_hash(current_user.password_hash, old_password):
        return jsonify({'error': 'Incorrect current password'}), 400

    new_password_hash = generate_password_hash(new_password)

    current_user.password_hash = new_password_hash
    db.session.commit()

    return jsonify({'message': 'Password changed successfully!'})


@app.route('/conversion', methods=["GET", "POST"])
def conversion():
    if request.method == 'GET':
        user_authenticated = False
        current_user = get_current_user()
        if current_user:
            user_authenticated = True
            response = make_response(jsonify({'success': True, 'user_authenticated': user_authenticated}), 201)
            folder_name = current_user.folder_name
        else:
            folder_name = request.cookies.get('guest_folder')
        if folder_name:
            response = make_response(jsonify({'success': True}), 201)
            response.set_cookie('guest_folder', '', expires = 0)
        if not folder_name:
            folder_name = request.cookies.get('guest_folder')
        print(folder_name, '3rd')
        if not folder_name:
            print(folder_name)
            return jsonify({'error': 'Error: Cannot determine user folder'}), 400

        folder_path = os.path.join(app.config['UPLOAD_FOLDER'], folder_name)
        if not os.path.exists(folder_path):
            return jsonify({'error': 'The folder does not exist'}), 404

        files = os.listdir(folder_path)
        return jsonify({'files': files, 'folder_path': folder_path})
    if request.method == 'POST':
        current_user = get_current_user()
        if current_user:
            folder_name = current_user.folder_name
        else:
            folder_name = request.cookies.get('guest_folder')
        print(folder_name, 'in POST method /conversion')
        folder_path = os.path.join(app.config['UPLOAD_FOLDER'], folder_name)
        files = os.listdir(folder_path)
        if len(files) >= 12:
            return jsonify({'error': 'Maximum number of files exceeded. Please try deleting some.'}), 400
            print('too many files')
        try:
            selected_files = request.form.getlist('files')
            conversion_type = request.form.get('conversion_type')
            audio_filter = request.form.get('audio_filter')
            silence_threshold = request.form.get('silence_threshold')
            silence_duration = request.form.get('silence_duration')
            volume_level = request.form.get('volume_level')
            mp3_bitrate = request.form.get('mp3_bitrate')

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


@app.route('/files/download/<path:filename>', methods=['GET'])
def download_file(filename):
    user = get_current_user()
    if not user:
        abort(401)
        return "Please log in", 401

    folder_name = user.folder_name
    folder_path = os.path.join(
        os.path.normpath(app.config['UPLOAD_FOLDER']),
        os.path.normpath(folder_name)
    )

    file_path = os.path.join(folder_path, filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        return send_from_directory(folder_path, filename, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/files/rename', methods=['POST'])
def rename_item():
    user = get_current_user()
    if not user:
        abort(401)
        return "Please log in", 401

    folder_name = user.folder_name
    folder_path = os.path.join(
        os.path.normpath(app.config['UPLOAD_FOLDER']),
        os.path.normpath(folder_name)
    )

    data = request.get_json()
    item_name = secure_filename(data.get('itemName'))
    new_item_name = secure_filename(data.get('newItemName'))
    if not item_name or not new_item_name:
        return jsonify({'error': 'No filename provided'}), 400

    file_path = os.path.join(folder_path, item_name)
    new_file_path = os.path.join(folder_path, new_item_name)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        os.rename(file_path, new_file_path)
        return jsonify({'message': 'File renamed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/files/delete', methods=['POST'])
def delete_item():
    user = get_current_user()
    if not user:
        abort(401)
        return "Please log in", 401

    folder_name = user.folder_name
    folder_path = os.path.join(
        os.path.normpath(app.config['UPLOAD_FOLDER']),
        os.path.normpath(folder_name)
    )

    data = request.get_json()
    item_name = secure_filename(data.get('deleteItem'))
    if not item_name:
        return jsonify({'error': 'No filename provided'}), 400
    print(item_name)

    file_path = os.path.join(folder_path, item_name)
    print(file_path)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    try:
        os.remove(file_path)
        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/files/graph', methods=['POST'])
def generate_graph_for_file():
    user = get_current_user()
    if user:
        folder_name = user.folder_name
    if not user:
        folder_name = request.cookies.get('guest_folder')
    if not folder_name:
        print('errrrorrr in generate graph')
        abort(401)

    folder_path = os.path.join(
        os.path.normpath(app.config['UPLOAD_FOLDER']),
        os.path.normpath(folder_name)
    )

    data = request.get_json()
    item_name = data.get('itemName')
    if not item_name:
        return jsonify({'error': 'No filename provided'}), 400

    file_path = os.path.join(folder_path, item_name)
    print(file_path)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        with open(file_path, 'rb') as audio_file:
            filename = secure_filename(item_name)
            graph_data = graph_creation(audio_file, filename)
            graph_base64 = base64.b64encode(graph_data).decode('utf-8')
            image_url = 'data:image/png;base64,' + graph_base64
            return jsonify({'filename': filename, 'image_url': image_url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/compare', methods=['POST'])
def compare():
    user = get_current_user()
    if user:
        folder_name = user.folder_name
    else:
        folder_name = request.cookies.get('guest_folder')

    if not folder_name:
        print('Error in comparison')
        abort(401)

    upload_folder = app.config['UPLOAD_FOLDER']
    folder_path = os.path.join(upload_folder, folder_name)

    os.makedirs(folder_path, exist_ok=True)

    file1 = request.files.get('file1')
    file2 = request.files.get('file2')

    if file1 and file2:
        file1_path = os.path.join(folder_path, secure_filename(file1.filename))
        file2_path = os.path.join(folder_path, secure_filename(file2.filename))

        file1.save(file1_path)
        file2.save(file2_path)

        filename1 = secure_filename(file1.filename)
        try:
            audio = MutagenFile(file1_path)
            metadata = {
                "length": audio.info.length,
                "bitrate": audio.info.bitrate,
                "sample_rate": audio.info.sample_rate,
                "channels": audio.info.channels,
                "artist": audio.get("artist", ["Unknown Artist"])[0],
                "title": audio.get("title", ["Unknown Title"])[0]
            }
            file1_metadata = metadata
            with open(file1_path, 'rb') as audio_file:
                graph_data1 = graph_creation(audio_file, filename1)
                graph_base64_1 = base64.b64encode(graph_data1).decode('utf-8')
                image_url1 = 'data:image/png;base64,' + graph_base64_1
                file1_result = {'filename': filename1, 'image_url': image_url1, 'metadata': file1_metadata}
        except Exception as e:
            file1_result = {'filename': filename1, 'error': str(e)}

        filename2 = secure_filename(file2.filename)
        try:
            audio = MutagenFile(file2_path)
            metadata = {
                "length": audio.info.length,
                "bitrate": audio.info.bitrate,
                "sample_rate": audio.info.sample_rate,
                "channels": audio.info.channels,
                "artist": audio.get("artist", ["Unknown Artist"])[0],
                "title": audio.get("title", ["Unknown Title"])[0]
            }
            file2_metadata = metadata
            with open(file2_path, 'rb') as audio_file:
                graph_data2 = graph_creation(audio_file, filename2)
                graph_base64_2 = base64.b64encode(graph_data2).decode('utf-8')
                image_url2 = 'data:image/png;base64,' + graph_base64_2
                file2_result = {'filename': filename2, 'image_url': image_url2, 'metadata': file2_metadata}
        except Exception as e:
            file2_result = {'filename': filename2, 'error': str(e)}

        os.remove(file1_path)
        os.remove(file2_path)

    else:
        data = request.get_json()
        file1_name = data.get('file1')
        file2_name = data.get('file2')

        if not file1_name or not file2_name:
            return jsonify({'error': 'Missing file names'}), 400

        file1_path = os.path.join(folder_path, file1_name)
        file2_path = os.path.join(folder_path, file2_name)

        if not os.path.exists(file1_path) or not os.path.exists(file2_path):
            return jsonify({'error': 'One or more files not found'}), 404

        filename1 = secure_filename(file1_name)
        try:
            audio = MutagenFile(file1_path)
            metadata = {
                "length": audio.info.length,
                "bitrate": audio.info.bitrate,
                "sample_rate": audio.info.sample_rate,
                "channels": audio.info.channels,
                "artist": audio.get("artist", ["Unknown Artist"])[0],
                "title": audio.get("title", ["Unknown Title"])[0]
            }
            file1_metadata = metadata
            with open(file1_path, 'rb') as audio_file:
                graph_data1 = graph_creation(audio_file, filename1)
                graph_base64_1 = base64.b64encode(graph_data1).decode('utf-8')
                image_url1 = 'data:image/png;base64,' + graph_base64_1
                file1_result = {'filename': filename1, 'image_url': image_url1, 'metadata': file1_metadata}
        except Exception as e:
            file1_result = {'filename': filename1, 'error': str(e)}

        filename2 = secure_filename(file2_name)
        try:
            audio = MutagenFile(file2_path)
            metadata = {
                "length": audio.info.length,
                "bitrate": audio.info.bitrate,
                "sample_rate": audio.info.sample_rate,
                "channels": audio.info.channels,
                "artist": audio.get("artist", ["Unknown Artist"])[0],
                "title": audio.get("title", ["Unknown Title"])[0]
            }
            file2_metadata = metadata
            with open(file2_path, 'rb') as audio_file:
                graph_data2 = graph_creation(audio_file, filename2)
                graph_base64_2 = base64.b64encode(graph_data2).decode('utf-8')
                image_url2 = 'data:image/png;base64,' + graph_base64_2
                file2_result = {'filename': filename2, 'image_url': image_url2, 'metadata': file2_metadata}
        except Exception as e:
            file2_result = {'filename': filename2, 'error': str(e)}

    return jsonify({'file1_result': file1_result, 'file2_result': file2_result}), 200


@app.route('/check_cookies', methods=["GET"])
def check_cookies():
    cookies = request.cookies
    if cookies:
        return jsonify({'cookies_exist': True, 'cookies': cookies})
        print(cookies)
    else:
        return jsonify({'cookies_exist': False, 'message': 'No cookies found'})
        print(nope)


@app.route('/logout', methods=['POST'])
def logout():
    response = make_response("Logged out successfully")
    response.set_cookie('guest_folder', '', expires=0)
    session.pop('user_id', None)
    return jsonify({'success': True})


@app.route('/graph', methods=['POST'])
def generate_graph():
    files = request.files.getlist('file')
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


@app.route('/compare', methods=['GET', 'POST'])
def compare_files():
    if request.method == 'GET':
        user = get_current_user()
        if user:
            folder_name = user.folder_name
        if not user:
            folder_name = request.cookies.get('guest_folder')
        if not folder_name:
            print('errorrr compare')
            abort(401)

        folder_path = os.path.join(
            os.path.normpath(app.config['UPLOAD_FOLDER']),
            os.path.normpath(folder_name)
        )

        files = os.listdir(folder_path)
        return jsonify({'files': files, 'folder_path': folder_path})

    elif request.method == 'POST':
        user = get_current_user()
        if not user:
            abort(401)
            return "Please log in", 401

        folder_name = user.folder_name
        folder_path = os.path.join(
            os.path.normpath(app.config['UPLOAD_FOLDER']),
            os.path.normpath(folder_name)
        )

        data = request.get_json()
        selected_files = data.get('selected_files', [])
        uploaded_files = request.files.getlist('files')

        if len(selected_files) != 2 and len(uploaded_files) != 2:
            return jsonify({'error': 'Please select or upload exactly two files for comparison'}), 400

        try:
            file_paths = []
            file_metadata = []
            for filename in selected_files:
                file_path = os.path.join(folder_path, filename)
                if not os.path.exists(file_path):
                    return jsonify({'error': f'File {filename} not found in user folder'}), 404
                file_paths.append(file_path)
                file_metadata.append(get_file_metadata(file_path))

            for file in uploaded_files:
                file_path = save_file(folder_name, file)
                file_paths.append(file_path)
                file_metadata.append(get_file_metadata(file_path))

            # Generate graph and metadata for each file
            graph_data = []
            for path in file_paths:
                with open(path, 'rb') as audio_file:
                    graph_data.append(base64_encode_graph(graph_creation(audio_file, os.path.basename(path))))

            files_metadata = [{'filename': os.path.basename(path), 'metadata': metadata} for path, metadata in
                              zip(file_paths, file_metadata)]

            return jsonify({'success': True, 'graph_data': graph_data, 'files_metadata': files_metadata})
        except Exception as e:
            return jsonify({'error': f'An error occurred: {str(e)}'}), 500


def get_file_metadata(file_path):
    try:
        audio = MutagenFile(file_path)
        metadata = {
            "length": audio.info.length,
            "bitrate": audio.info.bitrate,
            "sample_rate": audio.info.sample_rate,
            "channels": audio.info.channels,
            "artist": audio.get("artist", ["Unknown Artist"])[0],
            "title": audio.get("title", ["Unknown Title"])[0]
        }
        return metadata
    except Exception as e:
        print(f"Error getting metadata for {file_path}: {e}")
        return {}


def base64_encode_graph(graph_data):
    graph_base64 = base64.b64encode(graph_data).decode('utf-8')
    return 'data:image/png;base64,' + graph_base64


if __name__ == '__main__':
    print('start')
    app.run(debug=True)
    print("test")
