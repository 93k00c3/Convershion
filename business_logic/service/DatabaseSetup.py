from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    firstname = db.Column(db.String(30), nullable=True)
    surname = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(250), nullable=False)
    folder_name = db.Column(db.String(36), nullable=False)
    is_active = True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.user_id)  # Assuming user_id is an integer

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Folder(db.Model):
    __tablename__ = 'folders'

    folder_id = db.Column(db.Integer, primary_key=True)
    folder_name = db.Column(db.String(100), nullable=False)
    parent_folder_id = db.Column(db.Integer, db.ForeignKey('folders.folder_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    user = db.relationship('User', backref=db.backref('folders', lazy=True))
    subfolders = db.relationship('Folder', back_populates='parent_folder', cascade='all, delete-orphan')
    parent_folder = db.relationship('Folder', back_populates='subfolders', remote_side=[folder_id])


def create_tables():
    db.create_all()
