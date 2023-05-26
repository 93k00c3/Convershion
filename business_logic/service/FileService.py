from datetime import datetime, timedelta
import os

import numpy
from werkzeug.utils import secure_filename
import librosa
import librosa.display
import matplotlib.pyplot as plt
import io
import numpy as np

upload_path = 'C:\\Users\\admin\\Documents\\Convershion\\uploads'
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
    if is_extension_allowed(extension) is False:
        raise Exception("Extension: '{}' not allowed, supported extensions: {}".format(extension, extensions))
    try:
        create_upload_folder_if_doesnt_exist(folder_name)
    except:
        pass
    file.save(os.path.join(upload_path, os.path.join(folder_name, file_name)))


def is_extension_allowed(extension: str):
    return extension in extensions


def delete_old_files():
    path = os.path.join(upload_path)
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


def graph_creation(audio_file):
    audio, sr = librosa.load(audio_file, sr=None)
    n_fft = 2048
    hop_length = int(n_fft)
    spectrogram = librosa.stft(audio, n_fft=n_fft, hop_length=hop_length)
    magnitude_spectrogram = np.abs(spectrogram)
    log_magnitude_spectrogram = librosa.amplitude_to_db(magnitude_spectrogram, ref=np.max)
    times = librosa.frames_to_time(np.arange(log_magnitude_spectrogram.shape[1]), sr=sr, hop_length=hop_length)
    plt.figure(figsize=(10, 4))
    librosa.display.specshow(log_magnitude_spectrogram, sr=sr, hop_length=hop_length, x_axis='time', y_axis='log',
                             cmap='inferno', vmin=-80, vmax=-10)
    plt.colorbar(format='%+2.0f dB')
    plt.xlabel('Time (minutes)')
    plt.ylabel('Frequency (Hz)')
    plt.xticks(np.arange(0, max(times), 30))
    plt.yscale('linear')
    plt.ylim(0, (np.max(sr)+1)/2)
    print(np.max(sr))
    plt.yticks(np.arange(0, (np.max(sr)+1)/2, np.max(sr)/8))
    plt.tight_layout()
    plt.title('Spectrogram')
    output = io.BytesIO()
    plt.savefig(output, format='png')
    output.seek(0)

    return output.read()
