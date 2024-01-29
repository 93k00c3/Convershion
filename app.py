import configparser
import os
import base64

from flask import Flask, flash, request, redirect, render_template, url_for, jsonify, session
from business_logic.service.FileConversionService import convert_file, convert_audio_files
from business_logic.service.FileService import save_files, delete_old_files, graph_creation, save_file
from business_logic.service.AuthService import login, register
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required

app = Flask(__name__)
config = configparser.ConfigParser()
config.read('config/app.ini')
app.config['UPLOAD_FOLDER'] = config['FILES']['defaultPath']

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


@app.route('/', methods=["GET", "POST"])
def upload():
    if request.method == "GET":
        return render_template('index.html')
    if 'file' not in request.files:
        flash('No files selected for uploading')
        return redirect(request.url)

    files = request.files.to_dict(flat=False)

    if len(files) == 0:
        return render_template('index.html')

    folder_name = config['FILES']['user']

    save_files(folder_name, files)
    flash('Files successfully uploaded')
    # except Exception as e:
    #     flash(str(e))
    return redirect(url_for('conversion', folder_path='uploads/' + folder_name))


@app.route('/')
def index():
    logged_in = False
    username = None
    if 'username' in session:
        logged_in = True
        username = session['username']
    return render_template('index.html', logged_in=logged_in, username=username)


# @app.route('/conversion', methods=["GET", "POST"])
# def conversion():
#     folder_path = request.args.get('folder_path')
#     files = os.listdir(folder_path)
#     if not os.path.exists(folder_path):
#         flash('The folder does not exist')
#         return redirect(request.url)
#     if request.method == 'POST':
#         selected_files = request.form.getlist('files')
#         conversion_type = request.form['conversion_type']
#         convert_file(folder_path, selected_files, conversion_type)
#         flash('Files have been successfully converted')
#         return redirect(url_for('conversion', folder_path=folder_path))
#     return render_template('conversion.html', files=files, folder_path=folder_path)

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
        audio_filter = request.form.get('audio_filter')
        silence_threshold = request.form.get('silence_threshold')
        silence_duration = request.form.get('silence_duration')
        volume_level = request.form.get('volume_level')

        if audio_filter:
            converted_files = convert_audio_files(folder_path, selected_files, conversion_type,
                                                  audio_filter, silence_threshold, silence_duration,
                                                  volume_level)
        else:
            converted_files = convert_file(folder_path, selected_files, conversion_type)

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
    file = request.files['file']
    audio_file = file.stream
    graph_data = graph_creation(audio_file)
    graph_base64 = base64.b64encode(graph_data).decode('utf-8')
    image_url = 'data:image/png;base64,' + graph_base64

    return jsonify({'image_url': image_url})


if __name__ == '__main__':
    app.run(debug=True)
