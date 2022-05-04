from pathlib import Path
import os
import logging
import shutil

def get_file(path, file_tree={},file_path=[]):
    children = []
    path = Path(path if isinstance(path, str) else str(path))
    file_tree["text"] = path.name
    file_tree["type"] = "dir"
    file_tree["children"] = children
    file_tree["id"] = path.name
    dirs = [x for x in path.iterdir() if x.is_dir()]
    fs = [x for x in path.iterdir() if x.is_file()]
    for f in fs:
        if f.suffix==".o" or f.suffix==".out" or f.name=='out'  or f.name=='description' or f.name=='author'or f.suffix==".asset" :
            continue
        file_tree["children"].append({"text": f.name, "type": ".c" , "id":f.name})
        file_path.append(f.as_posix())
    for dir in dirs:
        sub_dir = {}
        get_file(dir.as_posix(), sub_dir,file_path)
        file_tree["children"].append(sub_dir)

def make_dir(path):
    if os.path.exists(path):
        pass
    else:
        try:
            os.mkdir(os.path.join(path))
        except OSError:
            logging.error(f"Failed to create dir:{path}")
            exit

def readfile(path):
    f = open(path,"r")
    data = f.read(204800)
    f.close()
    return data

def mk_write_file(path,data):
    f = open(path,"w")
    f.write(data)
    f.close()

def copy_search_file(srcDir, desDir):
    ls = os.listdir(srcDir)
    for line in ls:
        filePath = os.path.join(srcDir, line)
        if os.path.isfile(filePath):
            shutil.copy(filePath, desDir)

def clear_dir(path):
    path = Path(path if isinstance(path, str) else str(path))
    dirs = [x for x in path.iterdir() if x.is_dir()]
    fs = [x for x in path.iterdir() if x.is_file()]
    for f in fs:
        os.remove(f.as_posix())
    for dir in dirs:
        shutil.rmtree(dir.as_posix())