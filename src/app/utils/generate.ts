import { slug } from './slug.util';

const generateRandomNumber = (length: number) => {
  let result = '';
  const characters = '0123456789';
  const maxLength = length > 6 ? 6 : length;

  for (let i = 0; i < maxLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};

export const generateUsernameUnique = (username: string) => {
  const number = generateRandomNumber(6);
  const newUsername = `${username}${number}`;
  return slug(newUsername);
};
