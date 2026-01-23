import { useCallback, useState } from "react";

export function useSubjects() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch subjects";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { listSubjects, loading, error };
}

export function useLessons() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listBySubject = useCallback(async (subjectId: number) => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch lessons";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { listBySubject, loading, error };
}

export function useQuizzes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listBySubject = useCallback(async (subjectId: number) => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch quizzes";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { listBySubject, loading, error };
}

export function useDiscounts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch discounts";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { list, loading, error };
}

export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserNotifications = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch notifications";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getUserNotifications, loading, error };
}
