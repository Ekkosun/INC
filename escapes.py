import re
from typing import Iterator, Tuple


def unescape(escaped_str) :
    unescaped_str, after_string_index = _unescape_internal(
        escaped_str, expect_closing_quote=False
    )
    assert after_string_index == -1, (
        f"after_string_index is {after_string_index} but it was "
        "expected to be -1 as expect_closing_quote is set to False"
    )
    return unescaped_str


def advance_past_string_with_gdb_escapes(
    escaped_str, *, start = 0
) :
    return _unescape_internal(escaped_str, expect_closing_quote=True, start=start)


_ESCAPES_RE = re.compile(
    r"""
    (?P<before>
        .*?
    )
        (
            \\
            (
                (?P<escaped_octal>
                    [0-7]{3}
                    (
                        \\
                        [0-7]{3}
                    )*
                )
                |
                (?P<escaped_char>.)
            )
        )
        |
        (?P<unescaped_quote>")
    )
    """,
    flags=re.VERBOSE,
)

_NON_OCTAL_ESCAPES = {
    "'": "'",
    "\\": "\\",
    "a": "\a",
    "b": "\b",
    "e": "\033",
    "f": "\f",
    "n": "\n",
    "r": "\r",
    "t": "\t",
    '"': '"',
}


def _unescape_internal(
    escaped_str, *, expect_closing_quote, start = 0
) :
    
    unmatched_start_index = start

    found_closing_quote = False

    unescaped_parts = []
    for match in _ESCAPES_RE.finditer(escaped_str, pos=start):
        unescaped_parts.append(match["before"])

        escaped_octal = match["escaped_octal"]
        escaped_char = match["escaped_char"]
        unescaped_quote = match["unescaped_quote"]

        _, unmatched_start_index = match.span()

        if escaped_octal is not None:
            octal_sequence_bytes = bytearray()
            for octal_number in _split_n_chars(escaped_octal.replace("\\", ""), 3):
                try:
                    octal_sequence_bytes.append(int(octal_number, base=8))
                except ValueError as exc:
                    raise ValueError(
                        f"Invalid octal number {octal_number!r} in {escaped_str!r}"
                    ) from exc
            replaced = octal_sequence_bytes.decode("utf-8")

        elif escaped_char is not None:
            try:
                replaced = _NON_OCTAL_ESCAPES[escaped_char]
            except KeyError as exc:
                raise ValueError(
                    f"Invalid escape character {escaped_char!r} in {escaped_str!r}"
                ) from exc

        elif unescaped_quote:
            if not expect_closing_quote:
                raise ValueError(f"Unescaped quote found in {escaped_str!r}")

            found_closing_quote = True
            break

        else:
            raise AssertionError(
                f"This code should not be reached for string {escaped_str!r}"
            )

        unescaped_parts.append(replaced)

    if not found_closing_quote:
        if expect_closing_quote:
            raise ValueError(f"Missing closing quote in {escaped_str!r}")

        unescaped_parts.append(escaped_str[unmatched_start_index:])
        unmatched_start_index = -1

    return "".join(unescaped_parts), unmatched_start_index


def _split_n_chars(s, n) :
    """Iterates over string s `n` characters at a time"""
    for i in range(0, len(s), n):
        yield s[i : i + n]
