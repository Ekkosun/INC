## 安装依赖库

本系统使用`Flask`框架进行开发，使用如下命令安装依赖：
` pip install -r requirement.txt`

## 数据库设置

安装 mysql,建立相应的数据库,本项目建立的数据库名为 bishe.
根据创建的数据库在 config.py 填入数据库信息.

```python
user = 'mysql用户名'
password = '数据库密码'
host = '数据库域名'
database = '数据库名'
current_app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://%s:%s@%s:数据库监听端口/%s' % (user,password,host,database)
```

## 项目的运行
将该项目保存到src文件夹下,进入到src目录,使用如下命令运行：
`python server.py` 或 `python3 server.py`
