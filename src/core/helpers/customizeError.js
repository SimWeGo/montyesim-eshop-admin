export const customizeError = (error) => {
  if (!error) return null;

  const customMessages = {
    23514:
      "Some of the information you entered doesn’t meet the required conditions.",
    "22P02": "Kindly ensure the data is sent correctly",
  };

  return customMessages[error.code] || error.message || null;
};
