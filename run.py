from __init__ import app
import os
import base64
import configparser
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

app.run(host='localhost', port=5000, debug=True)

