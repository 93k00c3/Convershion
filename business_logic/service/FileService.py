from datetime import datetime, timedelta
from PIL import Image

import os
import time
import configparser

from werkzeug.utils import secure_filename
import librosa
import librosa.display
import matplotlib.pyplot as plt
import io
import numpy as np

config = configparser.ConfigParser()
config.read('config/app.ini')
upload_folder = config['FILES']['upload_folder']
extensions = ['flac', 'm4a', 'mp3', 'wav']


def create_upload_folder_if_doesnt_exist(folder_name: str):
    print("DEBUG: upload_folder: ", upload_folder)
    print("DEBUG: folder_name:", folder_name)
    path = os.path.join(upload_folder, folder_name)
    if not os.path.exists(path):
        try:
            os.makedirs(path)
        except Exception as e:
            raise Exception(f"Failed to create folder '{folder_name}': {str(e)}")


def save_files(folder_name: str, files):
    files_saved = 0
    exception_messages = []
    for key in files:
        try:
            save_file(folder_name, files[key][0])
            files_saved += 1
        except Exception as e:
            exception_messages.append(str(e))
    if len(exception_messages) > 0:
        raise Exception(join_errors(exception_messages))


def join_errors(exception_messages: list):
    message = ''
    for error in exception_messages:
        message += error + '\n'
    return message


class UnsupportedFileExtensionError(Exception):
    """Raised when an uploaded file has an unsupported extension."""
    pass 


def save_file(folder_name, file):
    try:
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > 50000000:
            raise ValueError(f'File size of "{file.filename}" is too large (max 50MB).')

        file_name = secure_filename(file.filename)
        extension = file_name.split('.')[-1]

        if not is_extension_allowed(extension):
            raise UnsupportedFileExtensionError(
                f"Extension '{extension}' of file '{file.filename}' is not allowed. Supported extensions: {', '.join(extensions)}")

        create_upload_folder_if_doesnt_exist(folder_name)

        file_path = os.path.join(upload_folder, folder_name, file_name)
        if os.path.exists(file_path):
            timestamp = int(time.time())
            file_name = f"{os.path.splitext(file_name)[0]}_{timestamp}.{extension}"
            file_path = os.path.join(upload_folder, folder_name, file_name)

        file.save(file_path)

    except ValueError as e:
        raise ValueError(f"Error while processing file '{file.filename}': {e}")
    except UnsupportedFileExtensionError as e:
        raise UnsupportedFileExtensionError(f"Error while processing file '{file.filename}': {e}")
    except Exception as e:
        raise Exception(f"Error while processing file '{file.filename}': {str(e)}")


def is_extension_allowed(extension: str):
    return extension in extensions


def delete_old_files():
    path = os.path(upload_folder)
    cutoff_date = datetime.now() - timedelta(days=5)
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            file_modified_time = datetime.fromtimestamp(os.path.getmtime(file_path))
            if file_modified_time < cutoff_date:
                os.remove(file_path)

        for dir in dirs:
            dir_path = os.path.join(root, dir)
            dir_modified_time = datetime.fromtimestamp(os.path.getmtime(dir_path))
            if dir_modified_time < cutoff_date:
                os.rmdir(dir_path)


def graph_creation(audio_file, filename):
    audio, sr = librosa.load(audio_file, sr=None)
    n_fft = 2048
    hop_length = int(n_fft)
    spectrogram = librosa.stft(audio, n_fft=n_fft, hop_length=hop_length)
    magnitude_spectrogram = np.abs(spectrogram)
    log_magnitude_spectrogram = librosa.amplitude_to_db(magnitude_spectrogram, ref=np.max)
    times = librosa.frames_to_time(np.arange(log_magnitude_spectrogram.shape[1]), sr=sr, hop_length=hop_length)
    plt.rcParams['font.family'] = 'Helvetica'
    plt.figure(figsize=(10, 4), facecolor='#1b2431')
    librosa.display.specshow(log_magnitude_spectrogram, sr=sr, hop_length=hop_length, x_axis='time', y_axis='log',
                             cmap='inferno', vmin=-80, vmax=-10)
    plt.colorbar(format='%+2.0f dB').ax.tick_params(colors='white')
    plt.text(0.02, 0.95, 'made in Convershion', color='white', fontsize=12, alpha=0.5,
             ha='left', va='top', transform=plt.gca().transAxes)
    plt.xlabel('Time (minutes)', color='white')
    plt.ylabel('Frequency (Hz)', color='white')
    plt.tick_params(axis='both', colors='white')
    plt.xticks(np.arange(0, max(times), 30))
    plt.yscale('linear')
    plt.ylim(0, (np.max(sr)+1)/2)
    plt.yticks(np.arange(0, (np.max(sr)+1)/2, np.max(sr)/8))
    plt.tight_layout()
    plt.title(filename, color='white')
    output = io.BytesIO()
    plt.savefig(output, format='png', dpi=70)
    output.seek(0)

    return output.read()
