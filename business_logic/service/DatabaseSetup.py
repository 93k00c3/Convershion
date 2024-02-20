from app import db

class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True)
    password_hash = db.Column(db.String(100))

class MusicFile(db.Model):
    __tablename__ = 'music_files'

    file_id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(100))
    file_path = db.Column(db.String(255))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))

def create_tables():
    db.create_all()

if __name__ == "__main__":
    create_tables()
