from flask import current_app 
from flask_sqlalchemy import SQLAlchemy
import pymysql


db = SQLAlchemy(current_app)


class User(db.Model):
    __tablename__ = 'usr_info'
    id = db.Column(db.String(40),primary_key=True)
    password = db.Column(db.String(40))
    name = db.Column(db.String(40),unique=False,nullable=False)
    dir_path = db.Column(db.String(200),unique=False,nullable=True)

    def __repr__(self):
        return '<id %r>' % self.id


    def add(id,password,name):
        user_obj = User(id=id,password=password,name=name,dir_path="")
        db.session.add(user_obj)
        db.session.commit()


    def find(id):
        find = User.query.get(id)
        return find

class Example(db.Model):
    __tablename__ = 'example'
    id = db.Column(db.String(40),unique=False)
    name = db.Column(db.String(40),unique=False)
    description = db.Column(db.String(40),unique=False,nullable=False)
    dir_path = db.Column(db.String(200),primary_key=True)

    def __repr__(self):
        return '<id %r>' % self.id


    def add(id,name,description,path):
        example_obj = Example(id=id,name=name,description=description,dir_path=path)
        db.session.add(example_obj)
        db.session.commit()


    def find_by_id(id):
        find = Example.query.filter_by(id=id).all()
        return find

    def find(name,id):
        find = Example.query.filter_by(name=name,id=id).all()
        return find
    


