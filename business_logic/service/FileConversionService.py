import os
import subprocess
from flask import request

extensions = ['flac', 'm4a', 'mp3', 'wav']


def convert_file(folder_path, selected_files, conversion_type, audio_filter=None,
                 silence_threshold=None, silence_duration=None, volume_level=None):
    converted_files = []

    for file in selected_files:
        input_file = os.path.join(folder_path, file)
        output_file = os.path.splitext(input_file)[0] + '.' + conversion_type

        command = f"ffmpeg -i {input_file} "

        if conversion_type == 'mp3':
            command += "-vn -ar 44100 -ac 2 -b:a 192k "
        elif conversion_type == 'flac':
            command += "-vn -c:a flac "
        elif conversion_type == 'm4a':
            command += "-vn -acodec alac "  
        elif conversion_type == 'wav':
            command += "-vn -acodec pcm_s16le "

        if audio_filter == "silencedetect" and silence_threshold and silence_duration:
            command += f"-af silencedetect=n={silence_threshold}dB:d={silence_duration} "
        elif audio_filter == "volume" and volume_level:
            command += f"-af volume={volume_level}% "

        command += f"{output_file}"

        try:
            subprocess.run(command, shell=True, check=True)
            converted_files.append(output_file)
        except subprocess.CalledProcessError as e:
            print(f"Conversion error for {input_file}: {e}")

    return converted_files
