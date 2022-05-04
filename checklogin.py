import functools
from db import User 
from flask import  Blueprint, redirect, render_template , request ,session, g , url_for

login = Blueprint("login_route",__name__)

@login.route("/")
def init():
    return render_template("index.html")

@login.route("/login",methods=['GET','POST'])
def checklogin():
    if request.method == 'POST':
        form = request.form
        id = form["id"]
        password = form["password"]
        user = User.find(id)
        if user :
            if password == user.password :
                session.clear()
                session["id"]=id
                return redirect(url_for("main_route.render_main"))
            else :
                return render_template("index.html")
        else:
            return "<h1>no user please register</h1>"
    else :
        return render_template("index.html")


def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(render_template("index.html"))
        return view(**kwargs)
    return wrapped_view