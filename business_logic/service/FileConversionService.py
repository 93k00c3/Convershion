import os
import subprocess

extensions = ['flac', 'alac', 'mp3', 'wav']


def convert_file(folder_path, selected_files, conversion_type):
    if conversion_type not in extensions:
        raise Exception('type \'{}\' is not supported')
    convert_audio_files(folder_path, selected_files, conversion_type)


def convert_audio_files(folder_path, selected_files, conversion_type):
    for file in selected_files:
        input_file = os.path.join(folder_path, file)
        output_file = os.path.splitext(input_file)[0] + '.' + conversion_type
        command = "ffmpeg -i" + " " + input_file + " " + output_file
        subprocess.call(command, shell=True)
