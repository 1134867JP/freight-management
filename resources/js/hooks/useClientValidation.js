import { useState } from 'react';

export function useClientValidation(rules) {
  const [clientErrors, setClientErrors] = useState({});

  function validate(data) {
    const newErrors = {};
    for (const [field, rule] of Object.entries(rules)) {
      const message = rule(data[field], data);
      if (message) newErrors[field] = message;
    }
    setClientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function clearClientError(field) {
    setClientErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return { clientErrors, validate, clearClientError };
}
