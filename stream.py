from escapes import advance_past_string_with_gdb_escapes


class StringStream:


    def __init__(self, raw_text):
        self.raw_text = raw_text
        self.index = 0
        self.len = len(raw_text)

    def read(self, count):
        new_index = self.index + count
        if new_index > self.len:
            buf = self.raw_text[self.index :]  # return to the end, don't fail
        else:
            buf = self.raw_text[self.index : new_index]
        self.index = new_index

        return buf

    def seek(self, offset):
        self.index = self.index + offset

    def advance_past_chars(self, chars):
        start_index = self.index
        while True:
            current_char = self.raw_text[self.index]
            self.index += 1
            if current_char in chars:
                break

            elif self.index == self.len:
                break

        return self.raw_text[start_index : self.index - 1]

    def advance_past_string_with_gdb_escapes(self) :
        assert self.index > 0 and self.raw_text[self.index - 1] == '"', (
            "advance_past_string_with_gdb_escapes called not at the start of a string "
            f"(at index {self.index} of text {self.raw_text!r}, "
            f"remaining string {self.raw_text[self.index:]!r})"
        )

        unescaped_str, self.index = advance_past_string_with_gdb_escapes(
            self.raw_text, start=self.index
        )
        return unescaped_str
