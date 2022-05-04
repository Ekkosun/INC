import fcntl
import select
import time
from pygdbmi import gdbmiparser
import os

DEFAULT_GDB_TIMEOUT_SEC = 1
DEFAULT_TIME_TO_CHECK_FOR_ADDITIONAL_OUTPUT_SEC = 1


class GdbTimeoutError(ValueError):
    pass


class IoManager:
    def __init__(
        self,
        stdin,
        stdout,
        stderr,
        time_to_check_for_additional_output_sec=DEFAULT_TIME_TO_CHECK_FOR_ADDITIONAL_OUTPUT_SEC,
    ):

        self.stdin = stdin
        self.stdout = stdout
        self.stderr = stderr

        self.stdin_fileno = self.stdin.fileno()
        self.stdout_fileno = self.stdout.fileno()
        self.stderr_fileno = self.stderr.fileno() if self.stderr else -1

        self.read_list = []
        if self.stdout:
            self.read_list.append(self.stdout_fileno)
        self.write_list = [self.stdin_fileno]

        self._incomplete_output = {"stdout": None, "stderr": None}
        self.time_to_check_for_additional_output_sec = (
            time_to_check_for_additional_output_sec
        )
        self._allow_overwrite_timeout_times = (
            self.time_to_check_for_additional_output_sec > 0
        )
        make_non_blocking(self.stdout)
        if self.stderr:
            make_non_blocking(self.stderr)

    def get_gdb_response(
        self, timeout_sec=DEFAULT_GDB_TIMEOUT_SEC, raise_error_on_timeout=True
    ):

        if timeout_sec < 0:
            timeout_sec = 0

        retval = self._get_responses(timeout_sec)

        if not retval and raise_error_on_timeout:
            raise GdbTimeoutError(
                "Did not get response from gdb after %s seconds" % timeout_sec
            )

        else:
            return retval

    def _get_responses(self, timeout_sec):
        timeout_time_sec = time.time() + timeout_sec
        responses = []
        while True:
            select_timeout = timeout_time_sec - time.time()
            if select_timeout <= 0:
                select_timeout = 0
            events, _, _ = select.select(
                self.read_list, [], [], select_timeout)
            responses_list = None  # to avoid infinite loop if using Python 2
            for fileno in events:
                # new data is ready to read
                if fileno == self.stdout_fileno:
                    self.stdout.flush()
                    raw_output = self.stdout.read()
                    stream = "stdout"

                elif fileno == self.stderr_fileno:
                    self.stderr.flush()
                    raw_output = self.stderr.read()
                    stream = "stderr"

                else:
                    raise ValueError(
                        "Developer error. Got unexpected file number %d" % fileno
                    )
                responses_list = self._get_responses_list(raw_output, stream)
                responses += responses_list

            if timeout_sec == 0:  # just exit immediately
                break

            elif responses_list and self._allow_overwrite_timeout_times:
                # update timeout time to potentially be closer to now to avoid lengthy wait times when nothing is being output by gdb
                timeout_time_sec = min(
                    time.time() + self.time_to_check_for_additional_output_sec,
                    timeout_time_sec,
                )

            elif time.time() > timeout_time_sec:
                break

        return responses

    def _get_responses_list(
        self, raw_output, stream
    ):
        responses = []

        (_new_output, self._incomplete_output[stream],) = _buffer_incomplete_responses(
            raw_output, self._incomplete_output.get(stream)
        )

        if not _new_output:
            return responses

        response_list = list(
            filter(lambda x: x, _new_output.decode(
                errors="replace").split("\n"))
        )

        for response in response_list:
            if gdbmiparser.response_is_finished(response):
                pass
            else:
                parsed_response = gdbmiparser.parse_response(response)
                parsed_response["stream"] = stream

                responses.append(parsed_response)

        return responses

    def write(
        self,
        mi_cmd_to_write,
        timeout_sec=DEFAULT_GDB_TIMEOUT_SEC,
        raise_error_on_timeout=True,
        read_response=True,
    ):

        if timeout_sec < 0:
            timeout_sec = 0

        if isinstance(mi_cmd_to_write, str):
            mi_cmd_to_write_str = mi_cmd_to_write
        elif isinstance(mi_cmd_to_write, list):
            mi_cmd_to_write_str = "\n".join(mi_cmd_to_write)
        else:
            raise TypeError(
                "The gdb mi command must a be str or list. Got "
                + str(type(mi_cmd_to_write))
            )

        if not mi_cmd_to_write_str.endswith("\n"):
            mi_cmd_to_write_nl = mi_cmd_to_write_str + "\n"
        else:
            mi_cmd_to_write_nl = mi_cmd_to_write_str

        _, outputready, _ = select.select([], self.write_list, [], timeout_sec)
        for fileno in outputready:
            if fileno == self.stdin_fileno:
                # ready to write
                self.stdin.write(mi_cmd_to_write_nl.encode())  # type: ignore
                # must flush, otherwise gdb won't realize there is data
                # to evaluate, and we won't get a response
                self.stdin.flush()  # type: ignore

        if read_response is True:
            return self.get_gdb_response(
                timeout_sec=timeout_sec, raise_error_on_timeout=raise_error_on_timeout
            )

        else:
            return []


def _buffer_incomplete_responses(
    raw_output, buf
):
    if raw_output:
        if buf:
            raw_output = b"".join([buf, raw_output])
            buf = None

        if b"\n" not in raw_output:
            buf = raw_output
            raw_output = None

        elif not raw_output.endswith(b"\n"):
            remainder_offset = raw_output.rindex(b"\n") + 1
            buf = raw_output[remainder_offset:]
            raw_output = raw_output[:remainder_offset]

    return (raw_output, buf)


def make_non_blocking(file_obj):
    fcntl.fcntl(file_obj, fcntl.F_SETFL, os.O_NONBLOCK)
