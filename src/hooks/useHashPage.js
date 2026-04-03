import { useState, useEffect } from "react";

const HASH_MAP = { "#compare": "compare" };
const KEY_MAP = { compare: "#compare" };

function readPage() {
  return HASH_MAP[location.hash] || "explorer";
}

export default function useHashPage() {
  const [page, setPageState] = useState(readPage);

  useEffect(() => {
    const onHash = () => setPageState(readPage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setPage = (key) => {
    location.hash = KEY_MAP[key] || "";
  };

  return { page, setPage };
}
