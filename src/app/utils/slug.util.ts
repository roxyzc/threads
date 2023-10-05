export const slug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/ /g, '_')
    .replace(/[^\w_.]+/g, '');
};

export const reverseSlug = (text: string) => {
  return text.replace(/_/g, ' ');
};
