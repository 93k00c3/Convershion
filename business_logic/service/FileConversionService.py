import os
import subprocess
from flask import request
extensions = ['flac', 'alac', 'mp3', 'wav']


def convert_file(folder_path, selected_files, conversion_type):
    if conversion_type not in extensions:
        raise Exception('type \'{}\' is not supported')
    convert_audio_files(folder_path, selected_files, conversion_type)


def convert_audio_files(folder_path, selected_files, conversion_type):
    for file in selected_files:
        input_file = os.path.join(folder_path, file)
        output_file = os.path.splitext(input_file)[0] + '.' + conversion_type
        audio_filter = request.form.get('audio_filter')
        command = "ffmpeg -i"
        if audio_filter == "silencedetect":
            silence_threshold = request.form['silence_threshold']
            silence_duration = request.form['silence_duration']
            command += f" -af silencedetect=n={silence_threshold}dB:d={silence_duration}"
        elif audio_filter == "volume":
            volume_level = request.form['volume_level']
            command += f" -af volume={volume_level}%"
        command += " " + input_file + " " + output_file
        subprocess.call(command, shell=True)
