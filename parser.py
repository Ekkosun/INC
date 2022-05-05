import re
from pprint import pprint

from pygdbmi.StringStream import StringStream
from escapes import unescape





def parse_response(gdb_mi_text) :
    
    stream = StringStream(gdb_mi_text)

    if _GDB_MI_NOTIFY_RE.match(gdb_mi_text):
        token, message, payload = _get_notify_msg_and_payload(gdb_mi_text, stream)
        return {
            "type": "notify",
            "message": message,
            "payload": payload,
            "token": token,
        }

    elif _GDB_MI_RESULT_RE.match(gdb_mi_text):
        token, message, payload = _get_result_msg_and_payload(gdb_mi_text, stream)
        return {
            "type": "result",
            "message": message,
            "payload": payload,
            "token": token,
        }

    elif _GDB_MI_CONSOLE_RE.match(gdb_mi_text):
        match = _GDB_MI_CONSOLE_RE.match(gdb_mi_text)
        if match:
            payload = unescape(match.groups()[0])
        else:
            payload = None
        return {
            "type": "console",
            "message": None,
            "payload": payload,
        }

    elif _GDB_MI_LOG_RE.match(gdb_mi_text):
        match = _GDB_MI_LOG_RE.match(gdb_mi_text)
        if match:
            payload = unescape(match.groups()[0])
        else:
            payload = None
        return {"type": "log", "message": None, "payload": payload}

    elif _GDB_MI_TARGET_OUTPUT_RE.match(gdb_mi_text):
        match = _GDB_MI_TARGET_OUTPUT_RE.match(gdb_mi_text)
        if match:
            payload = unescape(match.groups()[0])
        else:
            payload = None
        return {"type": "target", "message": None, "payload": payload}

    elif response_is_finished(gdb_mi_text):
        return {"type": "done", "message": None, "payload": None}

    else:
        return {"type": "output", "message": None, "payload": gdb_mi_text}


def response_is_finished(gdb_mi_text) :
    if _GDB_MI_RESPONSE_FINISHED_RE.match(gdb_mi_text):
        return True

    else:
        return False


def assert_match(actual_char_or_str, expected_char_or_str):
  
    if expected_char_or_str != actual_char_or_str:
        print("Expected")
        pprint(expected_char_or_str)
        print("")
        print("Got")
        pprint(actual_char_or_str)
        raise ValueError()



_GDB_MI_RESULT_RE = re.compile(r"^(\d*)\^(\S+?)(,(.*))?$")

_GDB_MI_NOTIFY_RE = re.compile(r"^(\d*)[*=](\S+?),(.*)$")

_GDB_MI_CONSOLE_RE = re.compile(r'~"(.*)"', re.DOTALL)

_GDB_MI_LOG_RE = re.compile(r'&"(.*)"', re.DOTALL)

_GDB_MI_TARGET_OUTPUT_RE = re.compile(r'@"(.*)"', re.DOTALL)

_GDB_MI_RESPONSE_FINISHED_RE = re.compile(r"^\(gdb\)\s*$")

_WHITESPACE = [" ", "\t", "\r", "\n"]

_GDB_MI_CHAR_DICT_START = "{"
_GDB_MI_CHAR_ARRAY_START = "["
_GDB_MI_CHAR_STRING_START = '"'
_GDB_MI_VALUE_START_CHARS = [
    _GDB_MI_CHAR_DICT_START,
    _GDB_MI_CHAR_ARRAY_START,
    _GDB_MI_CHAR_STRING_START,
]


def _get_notify_msg_and_payload(result, stream):
    """Get notify message and payload dict"""
    token = stream.advance_past_chars(["=", "*"])
    token = int(token) if token != "" else None
    message = stream.advance_past_chars([","])

    payload = _parse_dict(stream)
    return token, message.strip(), payload


def _get_result_msg_and_payload(result, stream):

    match = _GDB_MI_RESULT_RE.match(result)
    groups = match.groups() if match else [""]
    token = int(groups[0]) if groups[0] != "" else None
    message = groups[1]

    if groups[2] is None:
        payload = None
    else:
        stream.advance_past_chars([","])
        payload = _parse_dict(stream)

    return token, message, payload


def _parse_dict(stream):
 
    obj = {}


    while True:
        c = stream.read(1)
        if c in _WHITESPACE:
            pass
        elif c in ["{", ","]:
            pass
        elif c in ["}", ""]:
            break

        else:
            stream.seek(-1)
            key, val = _parse_key_val(stream)
            if key in obj:
                if isinstance(obj[key], list):
                    obj[key].append(val)  
                else:
                    obj[key] = [obj[key], val]
            else:
                obj[key] = val

            look_ahead_for_garbage = True
            c = stream.read(1)
            while look_ahead_for_garbage:
                if c in ["}", ",", ""]:
                    look_ahead_for_garbage = False
                else:
                   
                    c = stream.read(1)
            stream.seek(-1)

   
    return obj


def _parse_key_val(stream: StringStream):
   

    key = _parse_key(stream)
    val = _parse_val(stream)

    return key, val


def _parse_key(stream: StringStream):
    

    key = stream.advance_past_chars(["="])

    return key


def _parse_val(stream: StringStream):
   

    while True:
        c = stream.read(1)

        if c == "{":
            val = _parse_dict(stream)
            break

        elif c == "[":
            val = _parse_array(stream)
            break

        elif c == '"':
            val = stream.advance_past_string_with_gdb_escapes()
            break

        else:
            val = ""  


    return val


def _parse_array(stream: StringStream):
   

    arr = []
    while True:
        c = stream.read(1)

        if c in _GDB_MI_VALUE_START_CHARS:
            stream.seek(-1)
            val = _parse_val(stream)
            arr.append(val)
        elif c in _WHITESPACE:
            pass
        elif c == ",":
            pass
        elif c == "]":
            break

    return arr
