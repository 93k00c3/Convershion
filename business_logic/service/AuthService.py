from flask import request, render_template, redirect, session


def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if validate_credentials(username, password):
            return redirect('/')
        else:
            return render_template('login.html', error_message='Invalid username or password')
    else:
        return render_template('login.html')


def register(username, password):
    return True


def validate_credentials(username, password):
    valid_username = 'admin'
    valid_password = 'password'
    return username == valid_username and password == valid_password
