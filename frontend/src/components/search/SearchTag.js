import React, { useState, useEffect } from "react";
import { Tag } from "antd";

function SearchTag({ input, onClose }) {
  return (
    <Tag closable onClose={() => onClose(input)}>
      {input}
    </Tag>
  );
}

export default SearchTag;
