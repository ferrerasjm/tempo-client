import { useEffect, useState, type DependencyList } from "react";
import { errorMessage } from "../api/http";

export function useApi<T>(
  load: () => Promise<T>,
  dependencies: DependencyList = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    setData(null);
    load()
      .then((result) => {
        if (current) setData(result);
      })
      .catch((reason) => {
        if (current) setError(errorMessage(reason));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [...dependencies, version]);

  return {
    data,
    loading,
    error,
    update: (updater: (current: T | null) => T | null) =>
      setData((current) => updater(current)),
    reload: () => setVersion((value) => value + 1),
  };
}
