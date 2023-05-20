import os
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import configparser

config = configparser.ConfigParser()
config.read('config/app.ini')
upload_path = config['FILES']['defaultPath']
extensions = ['flac', 'alac', 'mp3', 'wav']


def create_upload_folder_if_doesnt_exist(folder_name: str):
    path = os.path.join(upload_path, folder_name)
    try:
        os.mkdir(path)
    except Exception:
        raise Exception('Folder \'{}\' already exists'.format(folder_name))


def save_files(folder_name: str, files):
    files_saved = 0
    exception_messages = []
    for key in files:
        try:
            save_file(folder_name, files[key][0])
            files_saved += 1
        except Exception as e:
            exception_messages.append(str(e))
    if exception_messages.size > 0:
        raise Exception(join_errors(exception_messages))


def join_errors(exception_messages: list):
    message = ''
    for error in exception_messages:
        message += error + '\n'
    return message


def save_file(folder_name: str, file):
    file_name = secure_filename(file.filename)
    extension = file_name.split('.')[1]
    delete_old_files(folder_name, days_old=7)
    if is_extension_allowed(extension) is False:
        raise Exception("Extension: '{}' not allowed, supported extensions: {}".format(extension, extensions))
    try:
        create_upload_folder_if_doesnt_exist(folder_name)
    except:
        pass
    file.save(os.path.join(upload_path, os.path.join(folder_name, file_name)))


def is_extension_allowed(extension: str):
    return extension in extensions

def delete_old_files(folder_name: str, days_old: int):
    path = os.path.join(upload_path, folder_name)
    cutoff_date = datetime.now() - timedelta(days=days_old)
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            file_modified_time = datetime.fromtimestamp(os.path.getmtime(file_path))
            if file_modified_time < cutoff_date:
                os.remove(file_path)
