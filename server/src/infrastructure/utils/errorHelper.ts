export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }

    if ('errors' in error && Array.isArray((error as any).errors)) {
      return (error as any).errors.map((e: any) => e.message).join(', ');
    }
  }

  return 'An unknown error occurred.';
};
