import json

JSONEncodeError = TypeError
JSONDecodeError = json.JSONDecodeError

OPT_APPEND_NEWLINE = 0
OPT_INDENT_2 = 0
OPT_NAIVE_UTC = 0
OPT_NON_STR_KEYS = 0
OPT_OMIT_MICROSECONDS = 0
OPT_PASSTHROUGH_DATACLASS = 0
OPT_PASSTHROUGH_DATETIME = 0
OPT_PASSTHROUGH_SUBCLASS = 0
OPT_SERIALIZE_DATACLASS = 0
OPT_SERIALIZE_NUMPY = 0
OPT_SERIALIZE_UUID = 0
OPT_SORT_KEYS = 0
OPT_STRICT_INTEGER = 0
OPT_UTC_Z = 0


def dumps(obj, default=None, option=None):
  return json.dumps(obj, ensure_ascii=False, default=default).encode('utf-8')


def loads(data):
  if isinstance(data, (bytes, bytearray)):
    data = data.decode('utf-8')
  return json.loads(data)
