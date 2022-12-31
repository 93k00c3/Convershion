from flask import Flask, flash, request, redirect, render_template, url_for
from flask_wtf import FlaskForm
from werkzeug.utils import secure_filename
from wtforms import FileField, SubmitField
import os
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = '.'
SECRET_KEY = os.urandom(32)
ALLOWED_EXTENSIONS = {'flac', 'alac', 'mp3', 'wav'}
app.config['SECRET_KEY'] = SECRET_KEY

class upload(FlaskForm):
    file = FileField("File")
    submit = SubmitField("Upload File")

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods =["GET", "POST"])
def upload_file():
    if request.method == 'POST':
        # check if the post request has the file part
        file = request.files['file']
        if file.filename == '':
            flash('No file selected for uploading')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            flash('File successfully uploaded')
            return redirect(url_for('upload_file', name=filename))
        else:
            flash('Allowed file types are txt, pdf, png, jpg, jpeg, gif')
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
