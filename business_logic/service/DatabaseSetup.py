from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    user_uuid = db.Column(db.String(36), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(100), nullable=False)
    folder_name = db.Column(db.String(36), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Folder(db.Model):
    __tablename__ = 'folders'

    folder_id = db.Column(db.Integer, primary_key=True)
    folder_name = db.Column(db.String(100), nullable=False)  # Allow longer folder names
    parent_folder_id = db.Column(db.Integer, db.ForeignKey('folders.folder_id'))  # For subfolders
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    user = db.relationship('User', backref=db.backref('folders', lazy=True))
    subfolders = db.relationship('Folder', back_populates='parent_folder', cascade='all, delete-orphan')
    parent_folder = db.relationship('Folder', back_populates='subfolders', remote_side=[folder_id])


def create_tables():
    db.create_all()
