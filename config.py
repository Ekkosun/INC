from flask import current_app
import secrets
import os
import logging
from gdbsession import SessionManager
manager= SessionManager()
current_app.config["SECRET_KEY"] = secrets.token_hex()
user = ''
password = ''
host = ""
database = ''
current_app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://%s:%s@%s:数据库端口/%s' % (user,password,host,database)
SQLALCHEMY_TRACK_MODIFICATIONS = True
# current_app.config['SQLALCHEMY_ECHO'] = True
current_app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = False

current_app.config['ROOT_PATH'] = os.path.dirname(os.getcwd())
current_app.config['DATA_PATH'] = os.path.join(current_app.config['ROOT_PATH'],'data')
current_app.config['EXAMPLE_PATH'] =  os.path.join(current_app.config['ROOT_PATH'],'list')
current_app.config['TMP_PATH'] = os.path.join(current_app.config['DATA_PATH'],'tmp')
current_app.config['STORE_PATH'] = os.path.join(current_app.config['DATA_PATH'],'store')
current_app.config['LOG_PATH'] = os.path.join(current_app.config['ROOT_PATH'],'log')
current_app.config["manager"] = manager
current_app.config["gdb_command"] ="gdb"

# log = logging.getLogger('werkzeug')
# log.setLevel(logging.ERROR)
# log_path = (os.path.join(current_app.config['LOG_PATH'],"log"))
# logging.basicConfig(filename=log_path, level=logging.DEBUG)

for v in ['DATA_PATH','TMP_PATH','STORE_PATH','LOG_PATH','EXAMPLE_PATH']:
    logging.info(f"Create {v}")
    if os.path.exists(current_app.config[v]):
        continue
    else:
        try:
            os.mkdir(current_app.config[v])
        except OSError:
            logging.error(f"Failed to create dir {v}")